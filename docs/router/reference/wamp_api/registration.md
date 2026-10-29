---
outline: [2,3]
related:
    - text: Registry Routing (RIB)
      type: Concept
      link: /router/concepts/registry_routing
      description: How Bondy routes calls across a cluster without replicating every registration to every node.
    - text: Subscription
      type: WAMP API Reference
      link: /router/reference/wamp_api/subscription
      description: The subscription-side introspection procedures — the same two families, the same shapes.
    - text: RPC Programming Guide
      type: Guide
      link: /router/guides/programming/wamp/rpc
      description: Registering procedures, shared registrations, and invocation policies from a client's perspective.
---

# Registration
A registration is a callee's offer to handle calls to a procedure URI. Bondy creates one when a client sends a WAMP `REGISTER`, and removes it on `UNREGISTER` or when the owning session closes.

Bondy exposes registration introspection as two procedure families. Both read the same underlying data.

- **`bondy.registration.*`** takes the realm URI as its first positional argument. A session in the master realm (`com.leapsight.bondy`) uses this family to read another realm. The enumerations are cluster-wide and keyset-**paginated**.
- **`wamp.registration.*`** is the WAMP Meta API. Each procedure takes exactly the arguments the WAMP specification gives and acts on the caller's realm. Results take the shapes the WAMP specification gives. No procedure in this family takes a realm argument: a call with extra positional arguments fails with `wamp.error.invalid_argument` ("Invalid number of positional arguments."). The cluster-wide set of registrations has no fixed bound, so each `wamp.registration.*` enumeration is capped. Past the ceiling it raises `bondy.error.too_many_results` and points the caller to the paginated family. Bondy does not truncate the result.

Only the node that owns a registration holds its full record. Other nodes know it only through the RIB's compact summary (see [Registry Routing (RIB)](/router/concepts/registry_routing)). Both families run a cluster-wide query to answer a call.

## Types

### registration{.datatype}

The external form of a registration entry, common to every procedure below.

<DataTreeView :data="registration" :maxDepth="10" />

### callee{.datatype}

The entry of a `bondy.registration.callee.list` page: one callee, identified by the node it is connected to and its session.

<DataTreeView :data="callee" :maxDepth="10" />

### page(registration), page(callee){.datatype}

The result shape of every paginated `bondy.registration.*` procedure.

<DataTreeView :data="page" :maxDepth="10" />

## Procedures

|Name|URI|
|:---|:---|
|[List registrations (paginated)](#list-registrations-paginated)|`bondy.registration.list`|
|[Match a procedure URI (paginated)](#match-a-procedure-uri-paginated)|`bondy.registration.match`|
|[List callees](#list-callees)|`bondy.registration.callee.list`|
|[Get a registration in a realm](#get-a-registration-in-a-realm)|`bondy.registration.get`|
|[List a registration's callees in a realm](#list-a-registration-s-callees-in-a-realm)|`bondy.registration.list_callees`|
|[Count a registration's callees in a realm](#count-a-registration-s-callees-in-a-realm)|`bondy.registration.count_callees`|
|[List registrations](#list-registrations)|`wamp.registration.list`|
|[Look up a registration](#look-up-a-registration)|`wamp.registration.lookup`|
|[Match a procedure URI](#match-a-procedure-uri)|`wamp.registration.match`|
|[Get a registration](#get-a-registration)|`wamp.registration.get`|
|[List a registration's callees](#list-a-registration-s-callees)|`wamp.registration.list_callees`|
|[Count a registration's callees](#count-a-registration-s-callees)|`wamp.registration.count_callees`|

### List registrations (paginated)
##### bondy.registration.list(realm_uri) -> page(registration) {.wamp-procedure}
Returns a cluster-wide page of every registration in the realm, in node-then-entry order.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'The URI of the realm to list.'
        }
    })"
/>

##### Keyword Args
The two keyword arguments below drive pagination.

<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        'limit':{
            'type': 'integer',
            'description' : 'Maximum number of entries to return. A non-integer or out-of-range value is silently replaced with the default rather than raising an error: a page size has a sane default, so bounding the call is a better answer than refusing it. Defaults to 100; the ceiling is 1000.'
        },
        'cursor':{
            'type': 'string',
            'description' : 'The opaque `cursor` from a previous page\'s result, to resume from. Omit for the first page.'
        }
    })"
/>

#### Result
##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'page(registration)',
            'description' : 'The requested page (see the `page(registration)` type above).'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
Raises `bondy.error.stale` if `cursor` was minted by an incompatible cursor schema or node-walk shape (the caller should restart from the first page), or `bondy.error.malformed` if `cursor` isn't a decodable cursor at all. Unlike `limit`, a cursor has no tolerant fallback: a resume position cannot be guessed.

### Match a procedure URI (paginated)
##### bondy.registration.match(realm_uri, uri) -> page(registration) {.wamp-procedure}
As [`bondy.registration.list`](#list-registrations-paginated), restricted to the registrations whose procedure URI matches `uri` under that registration's own match policy (`exact`, `prefix`, or `wildcard`).

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'The URI of the realm to search.'
        },
        '1':{
            'type': 'uri',
            'description' : 'The procedure URI to match against every registration\'s match policy.'
        }
    })"
/>

##### Keyword Args
Same `limit` / `cursor` keyword arguments as [`bondy.registration.list`](#list-registrations-paginated).

#### Result
##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'page(registration)',
            'description' : 'The requested page (see the `page(registration)` type above).'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
Same as [`bondy.registration.list`](#list-registrations-paginated).

### List callees
##### bondy.registration.callee.list(realm_uri[, procedure_uri]) -> page(callee) {.wamp-procedure}
Returns a cluster-wide page of the realm's callees, one `callee` entry per distinct `(node, session_id)` pair. Without `procedure_uri`, the page covers every registration in the realm. With `procedure_uri`, it covers only the registration stored under exactly `(procedure_uri, exact)`. A prefix or wildcard registration that would route a call to `procedure_uri` is not included.

The realm URI is required. Bondy does not default it, because the procedure also takes an optional trailing argument.

::: tip Not the same shape as wamp.registration.list_callees
This procedure and [`wamp.registration.list_callees`](#list-a-registration-s-callees) both answer "who is serving this?", but for different questions and with different results. This one pages through distinct callees (by node and session) across a realm or one exact procedure URI. `wamp.registration.list_callees` instead takes one registration id, acts on the caller's realm, and returns the plain list of its callees' session ids.
:::

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'Required. The URI of the realm to search.'
        },
        '1':{
            'type': 'uri',
            'description' : 'Optional. Restricts the result to the callees of the registration stored under exactly `(procedure_uri, exact)`.'
        }
    })"
/>

##### Keyword Args
Same `limit` / `cursor` keyword arguments as [`bondy.registration.list`](#list-registrations-paginated).

#### Result
##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'page(callee)',
            'description' : 'The requested page. Each entry in `values` is a `callee` object (see the types above).'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
Same as [`bondy.registration.list`](#list-registrations-paginated).

### Get a registration in a realm
##### bondy.registration.get([realm_uri, ]registration_id) -> registration {.wamp-procedure}
As [`wamp.registration.get`](#get-a-registration), for the named realm. The realm URI may be omitted, because the procedure takes no optional argument; Bondy then uses the caller's realm.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'Optional. The URI of the realm the registration belongs to. When the call carries one positional argument, that argument is the registration id and Bondy uses the caller\'s realm.'
        },
        '1':{
            'type': 'id',
            'description' : 'The registration id.'
        }
    })"
/>

##### Keyword Args
None.

#### Result
##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'registration',
            'description' : 'The requested registration (see the `registration` type above).'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
Same as [`wamp.registration.get`](#get-a-registration). Naming a realm other than the caller's requires a session in the master realm (`com.leapsight.bondy`). Any other session receives `wamp.error.not_authorized`.

### List a registration's callees in a realm
##### bondy.registration.list_callees([realm_uri, ]registration_id) -> id[] {.wamp-procedure}
As [`wamp.registration.list_callees`](#list-a-registration-s-callees), for the named realm. The realm URI may be omitted; Bondy then uses the caller's realm.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'Optional. The URI of the realm the registration belongs to. When the call carries one positional argument, that argument is the registration id and Bondy uses the caller\'s realm.'
        },
        '1':{
            'type': 'id',
            'description' : 'The registration id.'
        }
    })"
/>

##### Keyword Args
None.

#### Result
##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'array',
            'description' : 'The session ids of the registration\'s current callees.'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
Same as [`wamp.registration.list_callees`](#list-a-registration-s-callees). Naming a realm other than the caller's requires a session in the master realm (`com.leapsight.bondy`). Any other session receives `wamp.error.not_authorized`.

### Count a registration's callees in a realm
##### bondy.registration.count_callees([realm_uri, ]registration_id) -> integer {.wamp-procedure}
As [`wamp.registration.count_callees`](#count-a-registration-s-callees), for the named realm. The realm URI may be omitted; Bondy then uses the caller's realm.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'Optional. The URI of the realm the registration belongs to. When the call carries one positional argument, that argument is the registration id and Bondy uses the caller\'s realm.'
        },
        '1':{
            'type': 'id',
            'description' : 'The registration id.'
        }
    })"
/>

##### Keyword Args
None.

#### Result
##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'integer',
            'description' : 'The number of current callees.'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
Same as [`wamp.registration.count_callees`](#count-a-registration-s-callees). Naming a realm other than the caller's requires a session in the master realm (`com.leapsight.bondy`). Any other session receives `wamp.error.not_authorized`.

### List registrations
##### wamp.registration.list() -> dict {.wamp-procedure}
Returns every registration id in the caller's realm, grouped by match policy. Bounded: raises `bondy.error.too_many_results` if the realm has more registrations than the configured ceiling (1000 by default). Use [`bondy.registration.list`](#list-registrations-paginated) instead when that happens.

#### Call
##### Positional Args
None.

##### Keyword Args
None.

#### Result
##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'dict',
            'description' : 'A `{exact, prefix, wildcard}` object, each key holding the list of registration ids using that match policy.'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
Raises `bondy.error.too_many_results` past the enumeration ceiling.

### Look up a registration
##### wamp.registration.lookup(procedure_uri[, options]) -> id | null {.wamp-procedure}
Returns the registration stored under exactly `(procedure_uri, options.match)` in the caller's realm. Every callee holds its own registration in Bondy, so when several callees share that key, the result is the oldest registration under it.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'The procedure URI to look up.'
        },
        '1':{
            'type': 'dict',
            'description' : 'Optional. Its `match` key selects the match policy: `exact` (the default), `prefix`, or `wildcard`.'
        }
    })"
/>

##### Keyword Args
None.

#### Result
##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'id',
            'description' : 'The registration id. When no registration is stored under the key, the result is null: the RESULT carries no positional arguments.'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
Raises `wamp.error.invalid_argument` when `options.match` is not `exact`, `prefix`, or `wildcard`.

### Match a procedure URI
##### wamp.registration.match(procedure_uri) -> id | null {.wamp-procedure}
Returns the one registration a `CALL` to `procedure_uri` would reach in the caller's realm. Bondy takes the best-ranked group of matching registrations across the cluster, then that group's oldest registration. The procedure takes no options argument.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'The procedure URI to match.'
        }
    })"
/>

##### Keyword Args
None.

#### Result
##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'id',
            'description' : 'The registration id. When no registration matches, the result is null: the RESULT carries no positional arguments.'
        }
    })"
/>

##### Keyword Results
None.

### Get a registration
##### wamp.registration.get(registration_id) -> registration {.wamp-procedure}
Returns the full external form of one registration in the caller's realm, resolved cluster-wide. The id does not have to belong to a registration owned by the node handling the call.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'id',
            'description' : 'The registration id.'
        }
    })"
/>

##### Keyword Args
None.

#### Result
##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'registration',
            'description' : 'The requested registration (see the `registration` type above).'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
Raises `wamp.error.no_such_registration` when no node holds a registration with this id. Raises `bondy.error.unavailable`, rather than a false "no such registration", when a node that may hold it could not be reached to confirm its absence.

### List a registration's callees
##### wamp.registration.list_callees(registration_id) -> id[] {.wamp-procedure}
Returns the WAMP session ids of the callees of the registration stored under the same `(uri, match)` key as `registration_id`, gathered cluster-wide.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'id',
            'description' : 'The registration id.'
        }
    })"
/>

##### Keyword Args
None.

#### Result
##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'array',
            'description' : 'The session ids of the registration\'s current callees.'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
Raises `wamp.error.no_such_registration` or `bondy.error.unavailable`, with the same distinction as [`wamp.registration.get`](#get-a-registration).

### Count a registration's callees
##### wamp.registration.count_callees(registration_id) -> integer {.wamp-procedure}
Returns the number of callees of the registration stored under the same `(uri, match)` key as `registration_id`, counted cluster-wide.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'id',
            'description' : 'The registration id.'
        }
    })"
/>

##### Keyword Args
None.

#### Result
##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'integer',
            'description' : 'The number of current callees.'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
Raises `wamp.error.no_such_registration` or `bondy.error.unavailable`, with the same distinction as [`wamp.registration.get`](#get-a-registration).

## Topics
Bondy publishes these meta events on a registration's lifecycle, subject to the `wamp.meta_events` setting (`demand` by default: an event is only produced when a matching subscriber exists). Because delivery isn't guaranteed, a consumer should snapshot current state via [`wamp.registration.list`](#list-registrations) (or the paginated family) after subscribing, which also covers the gap between subscribing and the next emitted event.

Bondy does not publish `wamp.registration.on_create` or `wamp.registration.on_delete`. The WAMP specification has the router publish them when a procedure URI gains its first registration and loses its last. A cluster cannot decide which registration is the first or the last without coordinating its nodes. Each node would announce its own, and a subscriber would see a URI deleted while other nodes still serve it. To learn whether a procedure URI has registrations, call [`wamp.registration.lookup`](#look-up-a-registration) or [`wamp.registration.list`](#list-registrations).

### wamp.registration.on_register{.wamp-topic}
Published for every new registration, whether or not the procedure URI already has other registrations.

##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'id',
            'description' : 'The session id of the registering callee.'
        },
        '1':{
            'type': 'id',
            'description' : 'The new registration\'s id.'
        }
    })"
/>

##### Keyword Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        'procedure':{
            'type': 'uri',
            'description' : 'The registered procedure URI.'
        }
    })"
/>

### wamp.registration.on_unregister{.wamp-topic}
Published for every removed registration: the callee unregisters, or its session ends. Bondy publishes it whether or not other registrations of the procedure URI remain.

##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'id',
            'description' : 'The session id of the unregistering callee.'
        },
        '1':{
            'type': 'id',
            'description' : 'The removed registration\'s id.'
        }
    })"
/>

##### Keyword Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        'procedure':{
            'type': 'uri',
            'description' : 'The procedure URI that was unregistered from.'
        }
    })"
/>

## See also
- [Subscription](/router/reference/wamp_api/subscription) — the same two families of introspection, for subscriptions instead of registrations.
- [Registry Routing (RIB)](/router/concepts/registry_routing) — why registration introspection is a cluster-wide query rather than a local one.
- [RPC Programming Guide](/router/guides/programming/wamp/rpc) — registering procedures, shared registrations, and invocation policies.

<script>
export default {
    data() {
        return {
            registration: `{
                "id" : {
                    "description": "The registration's identifier.",
                    "type": "id",
                    "required": true,
                    "mutable": false
                },
                "created" : {
                    "description": "The date and time the registration was created, as an ISO 8601 string.",
                    "type": "string",
                    "required": true,
                    "mutable": false
                },
                "uri" : {
                    "description": "The registered procedure URI.",
                    "type": "uri",
                    "required": true,
                    "mutable": false
                },
                "match" : {
                    "description": "The match policy: \`exact\`, \`prefix\`, or \`wildcard\`.",
                    "type": "string",
                    "required": true,
                    "mutable": false
                },
                "invoke" : {
                    "description": "The invocation policy applied when more than one callee shares this registration: \`single\`, \`roundrobin\`, \`random\`, \`first\`, or \`last\`. See [Shared Registrations](/router/concepts/wamp/advanced/rpc#shared-registrations).",
                    "type": "string",
                    "required": true,
                    "mutable": false
                }
            }`,
            callee: `{
                "node" : {
                    "description": "The name of the node the callee's session is connected to.",
                    "type": "string",
                    "required": true,
                    "mutable": false
                },
                "session_id" : {
                    "description": "The callee's WAMP session id.",
                    "type": "id",
                    "required": true,
                    "mutable": false
                }
            }`,
            page: `{
                "values" : {
                    "description": "The page's entries: \`registration\` objects, or \`callee\` objects for \`bondy.registration.callee.list\`.",
                    "type": "array",
                    "required": true,
                    "mutable": false
                },
                "has_more" : {
                    "description": "Whether further pages remain.",
                    "type": "boolean",
                    "required": true,
                    "mutable": false
                },
                "cursor" : {
                    "description": "An opaque token to pass as \`cursor\` for the next page. Present only when \`has_more\` is \`true\`.",
                    "type": "string",
                    "required": false,
                    "mutable": false
                }
            }`
        }
    }
}
</script>
