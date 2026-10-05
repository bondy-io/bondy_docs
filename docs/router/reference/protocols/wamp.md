# WAMP Compliance

Which parts of the [WAMP specification](https://wamp-proto.org/wamp_latest_ietf.html) Bondy Connect implements, and where it departs from it.

Each table has two status columns. **Announced** is what Bondy states in the `roles` of its `WELCOME` message, which is what a client library reads to decide which features to use. **Implemented** is what the router actually does. The two disagree in a few places; the notes say which.

## Basic Profile

### Transports and serialization

|Feature|Implemented|Notes|
|---|---|---|
|WebSocket transport|Yes||
|RawSocket transport (TCP and TLS)|Yes|Also over a Unix domain socket listener.|
|HTTP long-poll transport|Yes|JSON only. See [WAMP HTTP Transports](/router/concepts/http_transports).|
|HTTP Server-Sent Events transport|Yes|JSON only. Bondy-specific; not part of the specification.|
|Batched WebSocket transport|No|Bondy accepts the batched subprotocols (`wamp.2.json.batched` and others) during the WebSocket handshake, but cannot decode their messages, so the session fails on the first message. Do not use them.|
|JSON serialization|Yes|WebSocket subprotocol `wamp.2.json`; RawSocket serializer 1.|
|MessagePack serialization|Yes|WebSocket subprotocol `wamp.2.msgpack`; RawSocket serializer 2.|
|CBOR serialization|Yes|WebSocket subprotocol `wamp.2.cbor`; RawSocket serializer 3.|
|Erlang term serialization|Yes|Bondy-specific. WebSocket subprotocol `wamp.2.erl`; RawSocket serializer set by [`wamp.serializers.erl`](/router/reference/configuration/wamp#wamp.serializers.erl).|
|BERT serialization|No|Refused on every transport, because its decoder can create atoms before the session authenticates.|

See [Serialization](/router/reference/serialization) for how each serializer maps WAMP types.

### Sessions and messages

|Feature|Implemented|Notes|
|---|---|---|
|One session per transport connection|Yes|`wamp.connection_lifetime` accepts only `session`.|
|Closing the session and connection on a protocol error|Yes||
|Validation of URIs and custom attribute keys|Yes||
|Agent identification|Yes||

### Publish/Subscribe

|Feature|Implemented|Notes|
|---|---|---|
|Event ordering between a publisher and a subscriber|Partial|See [NC1](#nc1).|
|One subscription, and one subscription ID, shared by every subscriber to a topic|No|See [NC2](#nc2).|

### Routed RPC

|Feature|Implemented|Notes|
|---|---|---|
|One registration, and one registration ID, shared by every callee of a procedure|No|See [NC3](#nc3).|

## Advanced Profile

### Authentication

|Authentication method|Implemented|Notes|
|---|---|---|
|`anonymous`|Yes|Controlled by [`security.allow_anonymous_user`](/router/reference/configuration/security#security.allow_anonymous_user).|
|`ticket`|Yes|A ticket issued by Bondy. Supports [Single Sign-on](/router/concepts/single_sign_on) across realms.|
|`wampcra`|Yes||
|`wamp-scram`|Yes||
|`cryptosign`|Yes||
|`cookie`|Yes|Transport-level, for the HTTP transports.|
|`trust`|Yes|Bondy-specific. Accepts an existing `authid` without credentials; restrict it with sources.|
|`password`|Yes|Bondy-specific. Sends the password in clear text; use it only over TLS.|
|`oauth2`|Yes|Bondy-specific.|
|`tls`|No|Listed by Bondy, but has no implementation; a session that requests it is refused.|

### Publish/Subscribe

|Feature|Announced|Implemented|Notes|
|---|---|---|---|
|Subscriber black- and whitelisting|Yes|Partial|Bondy filters on `exclude` and `eligible` (session IDs) only. `exclude_authid`, `exclude_authrole`, `eligible_authid` and `eligible_authrole` are accepted and ignored.|
|Publisher exclusion|Yes|Yes|`exclude_me` defaults to `true`.|
|Publisher identification|Yes|Yes|`disclose_me` defaults to `true`, so the publisher's session ID is disclosed unless it opts out.|
|Pattern-based subscription|Yes|Yes||
|Event retention|Yes|Yes|See [message retention](/router/reference/configuration/wamp).|
|Payload passthru mode|Yes|Yes||
|Session meta API|Yes|Partial|See [Session meta API](#session-meta-api).|
|Subscription meta API|No|Yes|Bondy implements the `wamp.subscription.*` procedures and events but does not announce the feature, so a client library that checks `WELCOME` will not use them.|
|Topic reflection|Yes|Yes|The `wamp.reflection.topic.*` procedures.|
|Publication trust levels|No|No||
|Sharded subscription|No|No||
|Event history|No|No||
|Subscription revocation|No|No||

### Routed RPC

|Feature|Announced|Implemented|Notes|
|---|---|---|---|
|Call timeout|Yes|Yes||
|Call canceling|Yes|Yes||
|Caller identification|Yes|Yes|The caller's session ID is disclosed unless both the callee's `disclose_caller` and the caller's `disclose_me` are `false`.|
|Pattern-based registration|Yes|Yes||
|Shared registration|Yes|Yes|Invocation policies `single`, `roundrobin`, `random`, `first` and `last`.|
|Progressive call results|Yes|Yes|Granted only to a session that announces it. See [Dealer](/router/reference/configuration/wamp#dealer).|
|Progressive calls|Yes|Yes|Granted only to a session that announces it together with `call_canceling`.|
|Payload passthru mode|Yes|Yes||
|Registration meta API|Yes|Yes||
|Session meta API|Yes|Partial|See [Session meta API](#session-meta-api).|
|Procedure reflection|Yes|Yes|The `wamp.reflection.procedure.*` and `wamp.reflection.error.*` procedures.|
|Call trust levels|No|No||
|Call reroute|No|No||
|Sharded registration|No|No||
|Registration revocation|No|No||
|Testament meta API|No|No||

### Session meta API

Bondy announces the session meta API on both the broker and dealer roles, and implements part of it:

- `wamp.session.get` is implemented.
- The `wamp.session.on_join` and `wamp.session.on_leave` events are published.
- `wamp.session.count`, `wamp.session.list`, `wamp.session.kill`, `wamp.session.kill_all`, `wamp.session.kill_by_authid` and `wamp.session.kill_by_authrole` are not implemented, and fail with `wamp.error.no_such_procedure`.

## Non-compliance cases

Bondy Connect is a distributed router built for continuous availability. Its nodes do not coordinate through consensus. The cases below are where the specification assumes a single router, or coordination between routers, that Bondy does not provide.

### NC1

**Requirement — ordering of events.** If a subscriber is subscribed to two topics and a publisher publishes one event to each, the subscriber receives them in publication order. A `SUBSCRIBED` reply reaches the subscriber before any `EVENT` for that subscription.

**Behaviour.** When the publisher and the subscriber are connected to the same node, Bondy delivers events in order. When they are connected to different nodes, Bondy does not guarantee the order.

### NC2

**Requirement — shared subscriptions.** A subscription is created when the first client subscribes to a topic, and every later subscriber to the same topic receives the **same** subscription ID.

**Behaviour.** Each subscriber gets its own subscription, with its own ID, even for the same topic. Sharing one subscription between subscribers on different nodes would require the nodes to agree on it, which needs coordination Bondy does not use.

### NC3

**Requirement — shared registrations.** A registration is created when the first callee registers a procedure, and every later callee of the same procedure receives the **same** registration ID.

**Behaviour.** Each callee gets its own registration, with its own ID, even for the same procedure. The reason is the same as for NC2.
