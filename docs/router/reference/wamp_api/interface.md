---
outline: [2,4]
related:
    - text: MCP Gateway
      type: Concept
      link: /router/concepts/mcp_gateway
      description: The main consumer of interface metadata — tools and resources derive from it.
    - text: Exposing an MCP Endpoint
      type: How-to Guide
      link: /router/guides/administration/exposing_an_mcp_endpoint
      description: Loading a document and verifying it through reflection, in context.
    - text: Registration Meta API
      type: API Reference
      link: /router/reference/wamp_api/registration
      description: The registry meta procedures — liveness, where reflection is surface.
---

# Interface Metadata & Reflection

The **interface metadata store** holds descriptions and JSON Schemas for
WAMP procedures, topics and errors, published to Bondy as **documents** —
versioned artifacts a developer or CI pipeline uploads at deploy time — and
read through **WAMP Interface Reflection**. Metadata describes a *URI*,
never a registration or a session: it changes at release cadence, is valid
whether or not any callee is currently registered to serve its URI, and
outlives every connection.

Documents replicate cluster-wide like other realm state. The
[MCP Gateway](/router/concepts/mcp_gateway) draws its tools' descriptions
and schemas from this store (what it *exposes* is the
[overlay's](/router/reference/wamp_api/mcp) decision, under the default
curated manifest mode); reflection is the general read path any WAMP
client can use.

## Documents

A document carries an `id`, an optional `version`, and `entries`, each
entry describing one `(realm, kind, match_policy, uri)`:

```json
{
  "id": "com.example.vehicle_api",
  "version": "1.4.0",
  "entries": [
    {
      "realm": "com.example.fleet",
      "kind": "procedure",
      "uri": "com.example.vehicle.locate",
      "description": "Returns the last known position of a vehicle.",
      "kwargs_schema": { "...": "JSON Schema" },
      "result_kwargs_schema": { "...": "JSON Schema" },
      "errors": ["com.example.error.unknown_vehicle"]
    }
  ]
}
```

Entry fields:

| Field | Required | Meaning |
|---|---|---|
| `realm` | yes | The realm the entry belongs to. It must exist at load time. |
| `kind` | yes | `procedure`, `topic` or `error`. |
| `uri` | yes | The WAMP URI described, valid under the entry's match policy. |
| `match_policy` | no | Defaults to `exact`. |
| `description` | no | Prose description. |
| `format` | no | The format every schema-valued field is in. `json_schema_2020_12` is the default and the only member of the set today. |
| `args_schema` | no | Schema for positional call/publish arguments. |
| `kwargs_schema` | no | Schema for keyword arguments. |
| `result_args_schema` | no | Schema for positional result arguments. |
| `result_kwargs_schema` | no | Schema for keyword result arguments. |
| `errors` | no | Error URIs this procedure may answer with. |
| `version` | no | The entry's own version string. |

Three rules give the store its integrity:

- **Replace-on-load.** Loading a document whose `id` was loaded before
  replaces it: entries the new version no longer declares are removed.
- **Exclusive ownership.** One entry belongs to exactly one document. A
  document claiming a `(realm, kind, match_policy, uri)` another document
  currently owns is rejected whole.
- **Atomic validation.** A document is validated as a whole before
  anything is written — one invalid entry rejects the entire document.

## Management procedures

All four procedures require admin authority: they are callable from the
master realm (or by a caller whose own realm is the one named in argument
0, per the standard admin argument convention).

#### bondy.interface.load(document) -> [] {.wamp-procedure}

Loads (or replaces) a document. Errors name the first violation — an
invalid entry, an unknown realm, a duplicate key inside the document, or an
ownership conflict with another document.

#### bondy.interface.get(id) -> [document] {.wamp-procedure}

Returns the document as originally loaded — the source, not a parsed form.

#### bondy.interface.list() -> [documents] {.wamp-procedure}

Returns the sources of every loaded document.

#### bondy.interface.delete(id) -> [] {.wamp-procedure}

Removes the document and every entry it declared.

## WAMP Interface Reflection

The six reflection procedures are the read side, callable by any client on
its realm. Bondy announces the `reflection` feature in its dealer and
broker roles.

Results are **authorization-projected**: they answer with what the calling
principal is authorized to access or provide — for a procedure, a caller
that may `wamp.call` or `wamp.register` it; for a topic, one that may
`wamp.subscribe` or `wamp.publish` it. Error URIs are not filtered. A
`describe` of an entry the caller may not see answers exactly as an absent
one, so the reply is not an existence oracle. Callers on the master realm,
and callers on a realm with security disabled, see everything.

#### wamp.reflection.procedure.list(realm_uri) -> [uris] {.wamp-procedure}

#### wamp.reflection.topic.list(realm_uri) -> [uris] {.wamp-procedure}

#### wamp.reflection.error.list(realm_uri) -> [uris] {.wamp-procedure}

The URIs of the realm's described procedures, topics or errors, filtered as
above.

#### wamp.reflection.procedure.describe(realm_uri, uri) -> [entry] {.wamp-procedure}

#### wamp.reflection.topic.describe(realm_uri, uri) -> [entry] {.wamp-procedure}

#### wamp.reflection.error.describe(realm_uri, uri) -> [entry] {.wamp-procedure}

The full metadata entry for one URI — description, schemas, declared
errors, version and the `source` document id that declared it.

::: info Reflection reads metadata, not the registry
An entry answers whether or not a callee is currently registered for its
URI. Liveness is the registry's business — see the
[Registration Meta API](/router/reference/wamp_api/registration).
:::
