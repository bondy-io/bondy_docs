---
related:
    - text: Naming Best Practices
      type: Concept
      link: /router/concepts/wamp/naming
      description: How to design good procedure and topic URIs, beyond the bare syntax rules below.
    - text: Session
      type: WAMP API Reference
      link: /router/reference/wamp_api/session
      description: The full session meta-procedure and meta-event contract.
---
# General

Cross-cutting programming concerns that apply to both RPC and Pub/Sub: the URI syntax Bondy accepts, and the session lifecycle events every client can observe. For RPC- and PubSub-specific practical patterns, see [Remote Procedure Calls](/router/guides/programming/wamp/rpc) and [Publish and Subscribe](/router/guides/programming/wamp/pub_sub); for how to *design* good URIs rather than just valid ones, see [Naming Best Practices](/router/concepts/wamp/naming).

## URI Format

A procedure or topic URI is a sequence of dot-separated components, e.g. `com.example.orders.create`. Bondy validates every URI against one of two rule sets, set node-wide with [`wamp.uri.strictness`](/router/reference/configuration/wamp#wamp-uris):

- **`loose`** (the default) — a component may contain any character except whitespace, `.`, `#`, and control characters.
- **`strict`** — a component is restricted to lowercase letters, digits, and underscore (`[0-9a-z_]`).

Registering or subscribing with a `prefix` or `wildcard` match policy relaxes this further: a wildcard subscription's empty components (`com..created`, matching `com.orders.created` and `com.users.created` alike) are only valid because the match policy explicitly allows empty segments — an exact-match URI never has one.

## Session Meta Events and Procedures

Every session's lifecycle is observable by any other session on the same realm, and a session can retrieve its own or another session's details on demand — see the [Session WAMP API Reference](/router/reference/wamp_api/session) for the full contract. In practice:

::: code-group
```Python
# Observe sessions joining and leaving the realm
await self._session.subscribe(self.on_session_join, "wamp.session.on_join")
await self._session.subscribe(self.on_session_leave, "wamp.session.on_leave")

def on_session_join(session):
    print("Session joined:", session["session"])

def on_session_leave(session_id, authid, authrole):
    print("Session left:", session_id, authid, authrole)

# Retrieve this session's own details
own_session = await self._session.call("bondy.session.self")

# Retrieve a specific session by id (routed cluster-wide)
other_session = await self._session.call(
    "wamp.session.get", realm_uri, session_id
)
```
:::

`bondy.session.self` is the cheaper call when you only need your own session — it never leaves the node, unlike `wamp.session.get`, which Bondy routes to whichever node the target session actually lives on.
