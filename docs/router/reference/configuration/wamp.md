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

Master switch for message retention. When off, Bondy accepts a publish with retention options but does not store the event, so a later subscriber sees nothing retained.

@[config](wamp.message_retention.storage_type,ram|disk|ram_disk,ram,v0.9.0)

Where retained messages are stored. `ram` is fastest but does not survive a node restart; `disk` persists across restarts at the cost of write latency; `ram_disk` keeps a working set in memory backed by a disk copy.

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

@[config](wamp.dealer.progressive_call_results,on|off,off,v1.0.0)

Enables the dealer's [Progressive Call Results](/wamp/concepts/advanced/rpc#progressive-call-results) feature (WAMP Advanced Profile).

::: warning Mixed-version clusters
Only enable this once every node in the cluster runs a Bondy version that supports it. A node without support settles a call on the first progressive result, truncating a stream that crosses it. The flag is read at call time on the node the caller is connected to, so it can be flipped without a restart.
:::

@[config](wamp.dealer.progressive_calls,on|off,off,v1.0.0)

Enables the dealer's [Progressive Calls](/wamp/concepts/advanced/rpc#progressive-calls) feature (WAMP Advanced Profile) — streaming a call's arguments from caller to callee in successive chunks.

::: warning Mixed-version clusters
Only enable this once every node in the cluster runs a Bondy version that supports it. While the flag is on, every `CALL` on that node pays a small bounded promise lookup to tell a first chunk from a subsequent one — a low constant cost, but paid by all calls on the node, not only progressive ones. Toggling it off while a stream is open is safe but coarse: the node stops recognising further chunks as continuations, so the caller's in-flight stream fails rather than completing. Flip it during a quiet window, not mid-stream.
:::


