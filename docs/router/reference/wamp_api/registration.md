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
      link: /wamp/guides/programming/rpc
      description: Registering procedures, shared registrations, and invocation policies from a client's perspective.
---

# Registration
A registration is a callee's offer to handle calls to a procedure URI. Bondy creates one when a client sends a WAMP `REGISTER`, and removes it on `UNREGISTER` or when the owning session closes.

Bondy exposes registration introspection as two independent procedure families, both reading the same underlying data:

- **`bondy.registration.*`** — cluster-wide, keyset-**paginated**, unbounded. Built for realms with more registrations than fit comfortably in one message.
- **`wamp.registration.*`** — the WAMP Meta API, kept in the shape a single-node router historically returned (grouped-by-policy `list`, flat-id `match`). Since a distributed router's realm-wide set has no fixed bound, each `wamp.*` enumeration is capped: past the ceiling it raises `bondy.error.too_many_results` and steers the caller to the paginated family instead of silently truncating.

Only the node that owns a registration holds its full record; other nodes know it only through the RIB's compact summary (see [Registry Routing (RIB)](/router/concepts/registry_routing)). Both families above run a cluster-wide query behind the scenes to answer "list/match the realm's registrations" from a single call.

## Types

### registration{.datatype}

The external form of a registration entry, common to every procedure below.

<DataTreeView :data="registration" :maxDepth="10" />

### page(registration){.datatype}

The result shape of every paginated `bondy.registration.*` procedure.

<DataTreeView :data="page" :maxDepth="10" />

## Procedures

|Name|URI|
|:---|:---|
|[List registrations (paginated)](#list-registrations-paginated)|`bondy.registration.list`|
|[Match a procedure URI (paginated)](#match-a-procedure-uri-paginated)|`bondy.registration.match`|
|[List callees](#list-callees)|`bondy.registration.callee.list`|
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
Pagination is driven by the two keyword arguments below. They were
`CALL.Options` extension keys (`_limit` / `_cursor`) until 2026-09-01; the
option form is no longer read.

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
##### bondy.registration.callee.list(realm_uri[, procedure_uri]) -> callee[] {.wamp-procedure}
Returns the realm's callees — one entry per distinct `(node, session_id)` pair — either across every registration, or restricted to one procedure URI's exact-match registrations.

::: tip Not the same shape as wamp.registration.list_callees
This procedure and [`wamp.registration.list_callees`](#list-a-registration-s-callees) both answer "who is serving this?", but for different questions and with different results. This one lists distinct callees (by node and session) across a realm or one procedure URI, unpaginated. `wamp.registration.list_callees` instead takes one specific registration id and returns the plain list of its callees' session ids.
:::

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
            'description' : 'Optional. Restricts the result to the callees of this exact procedure URI.'
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
            'description' : 'A list of `{node, session_id}` objects, one per distinct callee. Empty when there are none.'
        }
    })"
/>

##### Keyword Results
None.

### List registrations
##### wamp.registration.list(realm_uri) -> dict {.wamp-procedure}
Returns every registration id in the realm, grouped by match policy. Bounded: raises `bondy.error.too_many_results` if the realm has more registrations than the configured ceiling (1000 by default) — use [`bondy.registration.list`](#list-registrations-paginated) instead when that happens.

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
##### wamp.registration.lookup(realm_uri, procedure_uri[, options]) -> id {.wamp-procedure}
Returns the single registration id that owns `procedure_uri` under an exact match, if one exists.

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
            'description' : 'The procedure URI to look up.'
        },
        '2':{
            'type': 'dict',
            'description' : 'Optional. Accepted for spec compatibility; Bondy does not currently interpret any keys in it.'
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
            'description' : 'The registration id, present only when a match was found. When there is no match, the result carries no positional arguments at all rather than a null or zero value.'
        }
    })"
/>

##### Keyword Results
None.

### Match a procedure URI
##### wamp.registration.match(realm_uri, procedure_uri[, options]) -> id[] {.wamp-procedure}
Returns every registration id whose procedure URI matches `procedure_uri` under that registration's own match policy. Bounded like [`wamp.registration.list`](#list-registrations) — raises `bondy.error.too_many_results` past the ceiling.

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
            'description' : 'The procedure URI to match.'
        },
        '2':{
            'type': 'dict',
            'description' : 'Optional. Accepted for spec compatibility; Bondy does not currently interpret any keys in it.'
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
            'description' : 'The matching registration ids. Empty when there are none.'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
Raises `bondy.error.too_many_results` past the enumeration ceiling.

### Get a registration
##### wamp.registration.get(realm_uri, registration_id[, details]) -> registration {.wamp-procedure}
Returns the full external form of one registration, resolved cluster-wide — the id doesn't have to belong to a registration owned by the node handling the call.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'The URI of the realm the registration belongs to.'
        },
        '1':{
            'type': 'id',
            'description' : 'The registration id.'
        },
        '2':{
            'type': 'dict',
            'description' : 'Optional. Accepted for spec compatibility; Bondy does not currently interpret any keys in it.'
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
Raises `wamp.error.no_such_registration` when no node holds a registration with this id. Raises `bondy.error.unavailable`, rather than a false "no such registration", when a node that might hold it could not be reached in time to confirm its absence.

### List a registration's callees
##### wamp.registration.list_callees(realm_uri, registration_id) -> id[] {.wamp-procedure}
Returns the WAMP session ids of the callees currently serving `registration_id`, gathered cluster-wide.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'The URI of the realm the registration belongs to.'
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
Raises `wamp.error.no_such_registration` or `bondy.error.unavailable` — same distinction as [`wamp.registration.get`](#get-a-registration), since resolving the id to its procedure URI is itself a cluster-wide lookup.

### Count a registration's callees
##### wamp.registration.count_callees(realm_uri, registration_id) -> integer {.wamp-procedure}
Returns the number of callees currently serving `registration_id`, cluster-wide.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'The URI of the realm the registration belongs to.'
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
Raises `wamp.error.no_such_registration` or `bondy.error.unavailable` — same distinction as [`wamp.registration.get`](#get-a-registration).

## Topics
Bondy publishes these meta events on a registration's lifecycle, subject to the `wamp.meta_events` setting (`demand` by default: an event is only produced when a matching subscriber exists). Because delivery isn't guaranteed, a consumer should snapshot current state via [`wamp.registration.list`](#list-registrations) (or the paginated family) after subscribing, which also covers the gap between subscribing and the next emitted event.

##### wamp.registration.on_create{.wamp-topic}
Published when a procedure URI receives its first registration.

##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'id',
            'description' : 'The session id of the registering callee.'
        },
        '1':{
            'type': 'registration',
            'description' : 'The new registration (see the `registration` type above).'
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

### wamp.registration.on_register{.wamp-topic}
Published when a callee registers a procedure URI that already has at least one registration (a shared registration joining an existing group).

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
Published when a callee unregisters from a procedure URI that still has other registrations remaining.

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

### wamp.registration.on_delete{.wamp-topic}
Published when a procedure URI's last registration is removed.

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
            'description' : 'The procedure URI whose last registration was just removed.'
        }
    })"
/>

## See also
- [Subscription](/router/reference/wamp_api/subscription) — the same two families of introspection, for subscriptions instead of registrations.
- [Registry Routing (RIB)](/router/concepts/registry_routing) — why registration introspection is a cluster-wide query rather than a local one.
- [RPC Programming Guide](/wamp/guides/programming/rpc) — registering procedures, shared registrations, and invocation policies.

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
                    "description": "The date and time the registration was created.",
                    "type": "datetime",
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
                    "description": "The invocation policy applied when more than one callee shares this registration: \`single\`, \`roundrobin\`, \`random\`, \`first\`, or \`last\`. See [Shared Registrations](/wamp/concepts/advanced/rpc#shared-registrations).",
                    "type": "string",
                    "required": true,
                    "mutable": false
                }
            }`,
            page: `{
                "values" : {
                    "description": "The page's entries — \`registration\` objects for this family.",
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
