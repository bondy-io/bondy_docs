# Overload Protection

Bondy protects itself from overload — legitimate work arriving faster than the node can perform it — with the options on this page. Protection from *abuse*, where one source sends more than its share, is a separate mechanism: see [Rate Limiting](/reference/configuration/security#rate-limiting).

For the model behind these options — what each one measures, when it acts, and what a client sees when it does — read [Understanding Load Regulation and Rate Limiting](/guides/administration/load_regulation_and_rate_limiting).

## Node Load Monitor

The load monitor samples the runtime's total run queue length and exposes a binary busy/normal status that the admission gates consult. Both watermarks are expressed as a **factor of the online scheduler count**, not an absolute queue length, so one setting is portable across machine sizes.

@[config](load_regulation.load_monitor.run_queue_high_watermark,pos_integer,8,v1.0.0)

The node enters the busy state when the sampled run queue length reaches this factor times the number of online schedulers. A factor of N means roughly N runnable processes ahead of any newly runnable one on every scheduler — a direct measure of scheduling delay.

@[config](load_regulation.load_monitor.run_queue_low_watermark,integer,4,v1.0.0)

The node returns to the normal state when the sampled run queue length falls to this factor times the number of online schedulers. Must be below the high watermark: the gap is the hysteresis that stops the status flapping at the boundary. A wider gap makes the node slower to recover but steadier; a narrower one does the reverse.

@[config](load_regulation.load_monitor.sample_interval,duration_time_units,100ms,v1.0.0)

How often the load monitor samples the run queue. The sample is cheap; this interval bounds how quickly the busy state reacts to a change in load.

## Session Admission

@[config](load_regulation.hello.enabled,on|off,on,v1.0.0)

Enables the session admission gate. While the node is in the busy state (see the load monitor options above), a new `HELLO` is refused immediately with a retryable `wamp.error.unavailable` `ABORT`, instead of being accepted into a session open that deep run queues would stretch past the client's timeout while holding a socket and session state.

Sessions already established, and handshakes already past `HELLO`, are unaffected — the gate protects the latency of admitted sessions rather than sharing the overload with them. Refusals increment `bondy_wamp_dropped_total` with `reason="admission"` and `family="hello"`.

## Load Regulation


@[config](load_regulation.enabled,on|off,on,v0.8.8)

Reserved for future overload-protection tuning. The value is currently accepted but not consulted by any code path — changing it has no effect.

@[config](load_regulation.router.pool.type,permanent|transient,transient,v0.8.8)

Whether router pool workers are `permanent` (pre-spawned and kept alive between requests) or `transient` (spawned as needed and torn down once idle). This affects worker churn under bursty load, not the pool's steady-state capacity — see [load_regulation.router.pool.size](#load_regulation.router.pool.size) below for that.

@[config](load_regulation.router.pool.size,pos_integer,16,v0.8.8)

The size of the router process pool. The configured value is used verbatim; sizing it at or above the number of Erlang schedulers (by default the number of CPU cores available to the host or assigned by the virtualization/container layer) is recommended.

This value also divides [load_regulation.router.flow_pool.capacity](#load_regulation.router.flow_pool.capacity) into each flow worker's share.


@[config](load_regulation.router.pool.capacity,pos_integer,2000000,v0.8.8)

The capacity of the router process pool, i.e. the maximum number of
active erlang processes handling router events.
Once the maximum has been reached, Bondy will respond with an overload error. This is further limited by [vm.process.limit](/reference/configuration/node).

@[config](load_regulation.router.flow_pool.capacity,integer,100000,v1.0.0)

Total number of messages that can be queued across the router flow pool
workers — the pool that preserves WAMP per-flow ordering for **ingress from
elsewhere in the cluster**: messages arriving from a peer node's relay and
from a bridge relay. Every message of a flow (a source/destination session
pair) is dispatched to the same worker, so it executes in arrival order.

Each worker's share of this capacity is this value divided by
[load_regulation.router.pool.size](#load_regulation.router.pool.size). Once a
worker's share is exhausted the message is **dropped**, not queued elsewhere
and not returned as an error: an ordered lane cannot spill to another worker
or run inline without overtaking the messages already queued for that flow, and
delivery here is at-most-once. Drops increment `bondy_wamp_dropped_total` with
`reason="shed"` and a `family` label distinguishing relay from bridge-relay
ingress.

Keep this far below [load_regulation.router.pool.capacity](#load_regulation.router.pool.capacity). Because an ordered lane cannot overflow to a neighbour, a large bound buys memory pressure rather than throughput — a flow whose consumer is persistently slower than its producer is dropped eventually either way, having held more memory on the way there.

@[config](load_regulation.aae_reactor.pool.size,integer,16,v1.0.0)

The size of the anti-entropy merge-reaction worker pool: the pool that
applies remote-merge reactions — session close, RBAC cache invalidation, and
[Registry Routing (RIB)](/concepts/registry_routing) stub updates —
triggered as anti-entropy syncs land. Events are sharded by cell key, so
increasing this only helps when reactions for many distinct cells are in
flight concurrently.

@[config](load_regulation.session_manager.pool.size,pos_integer,32,v1.0.0)

The capacity of the session manager process pool, i.e. the maximum
number of active erlang processes handling session events (default = 32).


@[config](registry.partitions,pos_integer,32,v1.0.0)

The number of registry partitions, i.e. the maximum number of active Erlang
processes handling registry operations that must be serialised.

All registrations and subscriptions for a given realm are stored in the same
(single) partition; partition assignment hashes the realm uri across the
configured number of partitions. Raising this value only helps when many
realms are in use — a single busy realm always serialises onto one
partition regardless of this setting.

