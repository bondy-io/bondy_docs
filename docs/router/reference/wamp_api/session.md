---
outline: [2,3]
---
# Session
A session is an authenticated two-way link between a client and the Router, established when a client attaches to a [Realm](/router/reference/wamp_api/realm) and torn down when it detaches. All WAMP interaction — calls, registrations, publications, subscriptions — happens in the context of a session.

Key characteristics:

* A session is attached to exactly one realm for its entire lifetime.
* A session is authenticated on that realm, unless the realm allows the `anonymous` authmethod.
* A session is **stateful**: Bondy holds the session's identity, transport, and routing state for as long as it is open, rather than treating each request as an independent, unauthenticated interaction.
* Sessions are not replicated across the cluster — a session lives on the node the client is connected to. `wamp.session.get` (below) is routed cluster-wide to the node that owns the requested session; the caller does not need to know which node that is.

## Types
### session{.datatype}

<DataTreeView :data="session" :maxDepth="10" />

[`bondy.session.self`](#retrieve-the-caller-s-own-session) returns this type extended with two additional fields, not present when a session is retrieved by [`wamp.session.get`](#retrieve-a-session):

<DataTreeView :data="sessionSelfExtra" :maxDepth="10" />

## Procedures

|Name|URI|
|:---|:---|
|[Retrieve the caller's own session](#retrieve-the-caller-s-own-session)|`bondy.session.self`|
|[Retrieve a session](#retrieve-a-session)|`wamp.session.get`|

### Retrieve the caller's own session
##### bondy.session.self() -> session() {.wamp-procedure}
Retrieves the calling session's own details — the same information returned in the WAMP `WELCOME` message, plus two extra fields not present in [`wamp.session.get`](#retrieve-a-session)'s result.

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
            'type': 'session',
            'description' : 'The calling session, extended with x_authroles and x_meta (see below).'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
Raises `bondy.error.not_found` if the call somehow has no associated session — a defensive case, since a `CALL` always originates from an active session in practice.

### Retrieve a session
##### wamp.session.get(realm_uri, session_id) -> session() {.wamp-procedure}
Retrieves the details of a specific session. Bondy routes the call to whichever node owns the session, so the caller does not need to track session-to-node placement itself.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'The URI of the realm the session is attached to.'
        },
        '1':{
            'type': 'id',
            'description' : 'The session identifier, as returned in the session object\'s `session` field or the `session_guid` field of `authextra`.'
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
            'type': 'session',
            'description' : 'The requested session (see the `session` type above).'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
Raises `wamp.error.no_such_session` if no session with the given identifier exists on the realm, whether because it never existed, has since closed, or lived on a node that is currently unreachable.

## Topics

Bondy publishes these two events in the session's realm, on the topics `wamp.session.on_join` and `wamp.session.on_leave`.

##### wamp.session.on_join{.wamp-topic}
Published when a session opens.

##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'session',
            'description' : 'The session that just joined (see the `session` type above).'
        }
    })"
/>

##### Keyword Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        'session_guid':{
            'type': 'string',
            'description' : 'The internal, node-hash-qualified session identifier Bondy uses for cluster-wide routing.'
        }
    })"
/>

### wamp.session.on_leave{.wamp-topic}
Published when a session closes, whether by client disconnect, explicit `GOODBYE`, or the router terminating it.

##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'id',
            'description' : 'The external (client-facing) session identifier.'
        },
        '1':{
            'type': 'string',
            'description' : 'The session\'s authid, or `null` if it authenticated anonymously.'
        },
        '2':{
            'type': 'string',
            'description' : 'The session\'s authrole.'
        }
    })"
/>

##### Keyword Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        'session_guid':{
            'type': 'string',
            'description' : 'The internal, node-hash-qualified session identifier Bondy uses for cluster-wide routing.'
        }
    })"
/>

## See also

- [Registry Routing (RIB)](/router/concepts/registry_routing) — how session lifecycle events feed cluster-wide routing.
- [Realm](/router/reference/wamp_api/realm) — the administrative domain every session attaches to.

<script>
export default {
    data() {
        return {
            session: `{
                "session" : {
                    "description": "The session's external (client-facing) identifier, as sent in the WAMP WELCOME message.",
                    "type": "id",
                    "required": true,
                    "mutable": false
                },
                "authid" : {
                    "description": "The identity the session authenticated as.",
                    "type": "string",
                    "required": true,
                    "mutable": false
                },
                "authmethod" : {
                    "description": "The authentication method used to establish the session, e.g. \`cryptosign\`, \`wampcra\`, \`ticket\`, \`anonymous\`.",
                    "type": "string",
                    "required": true,
                    "mutable": false
                },
                "authprovider" : {
                    "description": "The identity provider that authenticated the session. Always \`com.leapsight.bondy\` for Bondy's built-in security store.",
                    "type": "string",
                    "required": true,
                    "mutable": false
                },
                "authrole" : {
                    "description": "The single active authorization role for this session, derived from the authenticated user's group memberships.",
                    "type": "string",
                    "required": true,
                    "mutable": false
                },
                "authextra" : {
                    "description": "Extra authentication context: \`session_guid\` (the internal, node-hash-qualified session identifier used for cluster-wide routing) and \`node\` (the node the session is attached to).",
                    "type": "dict",
                    "required": true,
                    "mutable": false
                },
                "transport" : {
                    "description": "Transport-level information, currently the peer's \`peername\` (address and port).",
                    "type": "dict",
                    "required": true,
                    "mutable": false
                }
            }`,
            sessionSelfExtra: `{
                "x_authroles" : {
                    "description": "Every authorization role assigned to the authenticated user, not just the single active \`authrole\`.",
                    "type": "array",
                    "required": true,
                    "mutable": false
                },
                "x_meta" : {
                    "description": "The user's metadata, taken from \`authextra.meta\`.",
                    "type": "dict",
                    "required": true,
                    "mutable": false
                }
            }`
        }
    }
}
</script>