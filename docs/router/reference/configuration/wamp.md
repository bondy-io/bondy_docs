# WAMP Features Configuration Reference

## WAMP URIs

@[config](wamp.uri.strictness,loose|strict,loose,v0.9.0)

The validation applied to every WAMP URI Bondy accepts, in realm names, procedure and topic registrations, and calls. `loose` allows any non-empty dot-separated component; `strict` additionally restricts each component to the WAMP specification's stricter character set. Set to `strict` to catch malformed URIs from a client early, at the router, rather than downstream in application code.

## Call Timeout

@[config](wamp.call_timeout,duration_time_units,30s,v0.1.0)

The default timeout for WAMP (RPC) Calls when the `CALL.Options.timeout`
property is not used. This value will be restricted by the
[`wamp.max_call_timeout`](#wamp.max_call_timeout) property.



@[config](wamp.max_call_timeout,duration_time_units,10m,v0.1.0)

The maximum timeout value for WAMP (RPC) Calls for the `CALL.Options.
timeout` or the [`wamp.call_timeout`](#wamp.call_timeout) default.

::: tip No infinite timeout support
The WAMP specification treats an unspecified timeout, or a value of `0`, as disabling the timeout entirely. Bondy does not support an infinite call timeout — set a long bound instead, e.g. 24 hours, a week, or a year, if the call genuinely needs that much room.
:::


## Message Retention

WAMP's message retention feature lets a publisher mark an event to be retained, so a subscriber that joins later can still receive the last (or last few) events on a topic instead of only ones published after it subscribed.

@[config](wamp.message_retention.enabled,on|off,on,v0.9.0)

Has no effect. Bondy accepts the key, but retention is controlled per publication: an event is retained when its publisher sets `retain: true`, whatever this key says.

@[config](wamp.message_retention.storage_type,ram|disk|ram_disk,ram,v0.9.0)

Has no effect. Bondy always stores retained events in a durable table, so they survive a node restart, whatever this key says.

@[config](wamp.message_retention.max_messages,integer,1000000,v0.9.0)

Maximum number of retained messages held on a single node. Once reached, no further events are retained until space frees up (e.g. via TTL expiry). `0` means no limit.

@[config](wamp.message_retention.max_memory,byte_size_units,1GB,v0.9.0)

Maximum memory a node spends on retained messages. Once reached, no further events are retained. `0` means no limit.

@[config](wamp.message_retention.max_message_size,byte_size_units,64KB,v0.9.0)

Per-event size ceiling. An event larger than this is not retained, regardless of the limits above — it is still delivered live to current subscribers, only excluded from retention.

@[config](wamp.message_retention.default_ttl,time_duration_units,0,v0.9.0)

Default time-to-live applied to a retained event when the publisher doesn't specify one. `0` means a retained event never expires on its own (it can still be evicted by the `max_messages`/`max_memory` limits above).

## Meta Events

@[config](wamp.meta_events,demand|on|off,demand,v1.0.0)

Controls whether Bondy publishes the [registration](/router/reference/wamp_api/registration#topics) and [subscription](/router/reference/wamp_api/subscription#topics) meta events (`wamp.registration.on_create`, `wamp.subscription.on_subscribe`, and similar). `demand` — the default — only produces an event when a matching subscriber currently exists, checked with one fast registry probe per registration/subscription change; `on` always produces them regardless of demand; `off` disables them entirely. Since delivery of these events isn't guaranteed, a consumer should snapshot current state via the corresponding `wamp.*.list` meta procedure right after subscribing.

## Dealer

[Progressive Call Results](/router/concepts/wamp/advanced/rpc#progressive-call-results) and [Progressive Calls](/router/concepts/wamp/advanced/rpc#progressive-calls) have no configuration settings. Bondy always offers both in its `WELCOME`, and a session can use each one only if its own `HELLO` announces it for the role (caller or callee) that uses it. A session that announces `progressive_calls` must also announce `call_canceling`, or Bondy rejects the `HELLO` with `bondy.error.invalid_feature_request`.

In a cluster, the node a callee is connected to checks the callee's own session. A progressive call to a callee that did not announce `progressive_calls` fails with `wamp.error.option_not_allowed`.

## HTTP Transports (Long-poll and SSE)

These settings apply only to WAMP sessions carried over the [long-poll and SSE transports](/router/concepts/http_transports). WebSocket and RawSocket sessions never use them.

A long-poll client is not connected between `/receive` requests, and an SSE stream can drop and reconnect while its session survives. So Bondy keeps a server-side session process for each HTTP transport, and parks every outbound message for that session in a queue until the client reads it. This lets a WAMP session outlive the HTTP request that carries it. The queue is bounded by message count, byte size and age, because a client may never come back.

The settings are node-wide. One set of queue tables and one eviction sweep serve every HTTP transport on the node, whichever listener the request arrived on.

@[config](wamp.http_transport.idle_timeout,duration_time_units,1h,v1.0.0)

How long an HTTP transport session survives with no HTTP request touching it. Each long-poll request resets the timer. While an SSE stream is attached, the session does not time out. When the timer fires, Bondy closes the transport session and its WAMP session, and discards every message still in its queue.

This is the session's deadline. It is not the listener's connection idle timeout, [`listeners.$name.longpoll.idle_timeout`](/router/reference/configuration/listeners#listeners.$name.longpoll.idle_timeout).

@[config](wamp.http_transport.queue.max_messages,integer,1000,v1.0.0)

The maximum number of messages held for one transport session. Must be a positive integer. When a new message arrives and the queue already holds this many, Bondy drops the oldest messages for that session (up to 100 at a time) and then stores the new one. Neither the client nor the publisher is told that messages were dropped.

The bound applies to all output for the session, including replies Bondy produces directly, such as an inline `ERROR`.

@[config](wamp.http_transport.queue.max_bytes,byte_size_units,10MB,v1.0.0)

The maximum total size of the messages held for one transport session. It is enforced together with `max_messages`: whichever bound is reached first triggers eviction. Eviction works as for `max_messages`: Bondy drops the oldest messages for that session (up to 100 at a time) and then stores the new one. The new message is always stored, even when it alone is larger than this bound.

A reply Bondy has already encoded counts as its encoded byte size. Any other message counts as the size of its Erlang external term encoding.

@[config](wamp.http_transport.queue.message_ttl,duration_time_units,5m,v1.0.0)

How long a queued message stays deliverable. A message older than this is never delivered: a client read skips it, and the next eviction sweep removes it. The client is not told. The setting assumes that a client absent this long no longer wants the message.

@[config](wamp.http_transport.queue.eviction_interval,duration_time_units,5s,v1.0.0)

How often the sweep that removes expired messages (see `message_ttl`) runs across every partition. A shorter interval frees memory sooner. It has no effect on delivery, because a client read already skips expired messages.

@[config](wamp.http_transport.queue.partitions,integer,schedulers,v1.0.0)

The number of ETS partitions the queue is sharded across. Must be a positive integer. All messages for one transport session live in a single partition. More partitions reduce table contention between sessions, and make each sweep visit more tables. The schema has no default value; when the key is unset, Bondy uses the number of Erlang schedulers on the node, which is normally the number of CPU cores. The value is read once, when the queue is created at node start.

## Serializers

@[config](serializers.json.float_format,string,[&#123;decimals&#44;16&#125;],v1.0.0)

Intended to control how floating-point numbers are written in JSON. The value is a string holding an Erlang list of [`erlang:float_to_binary/2`](https://www.erlang.org/doc/apps/erts/erlang.html#float_to_binary/2) options, for example:

```ini
serializers.json.float_format = [{decimals, 16}]
```

Bondy checks at startup that the value parses as an Erlang term. In the current release no code reads the resulting setting, so changing it has no effect. Bondy always encodes floats in JSON with `[{decimals, 16}]`, which writes 16 digits after the decimal point: `1.5` is encoded as `1.5000000000000000`.

The [WAMP RawSocket](https://wamp-proto.org/wamp_latest_ietf.html) handshake names the serializer by a number from 1 to 15. Bondy fixes slot 1 to JSON, slot 2 to MessagePack and slot 3 to CBOR. The two keys below assign slots to the Erlang-specific serializers. They exist because some clients expect a given serializer in a given slot.

@[config](wamp.serializers.erl,integer,15,v1.0.0)

The RawSocket slot for the `erl` serializer, which encodes WAMP messages in the Erlang External Term Format. Bondy decodes it with `binary_to_term/2` and the `safe` option, so a client cannot create new atoms on the node. Use a value from 4 to 15. Slots 1 to 3 are already taken by JSON, MessagePack and CBOR, and those always win. The value is not validated.

On WebSocket, the same serializer is negotiated by the `wamp.2.erl` subprotocol, and this key does not apply.

@[config](wamp.serializers.bert,integer,4,v1.0.0)

Has no effect. Bondy accepts the key, but it does not accept the BERT serializer on any transport. A RawSocket handshake that asks for this slot is refused with "serializer unsupported", and the `wamp.2.bert` WebSocket subprotocol is not offered. BERT is disabled because its decoder can create atoms from untrusted input before the client authenticates, which can exhaust the node's atom table.


