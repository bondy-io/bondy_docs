# Overload Protection

Bondy protects itself from overload — legitimate work arriving faster than the node can perform it — with the options on this page. Protection from *abuse*, where one source sends more than its share, is a separate mechanism: see [Rate Limiting](/router/reference/configuration/security#rate-limiting).

For the model behind these options — what each one measures, when it acts, and what a client sees when it does — read [Understanding Load Regulation and Rate Limiting](/router/guides/administration/load_regulation_and_rate_limiting).

## Node Load Monitor

The load monitor samples the runtime's total run queue length and exposes a binary busy/normal status that the admission gates consult. Both watermarks are expressed as a **factor of the online scheduler count**, not an absolute queue length, so one setting is portable across machine sizes.

@[config](load_regulation.load_monitor.run_queue_high_watermark,pos_integer,8,v1.0.0)

The node enters the busy state when the sampled run queue length reaches this factor times the number of online schedulers. A factor of N means roughly N runnable processes ahead of any newly runnable one on every scheduler — a direct measure of scheduling delay.

@[config](load_regulation.load_monitor.run_queue_low_watermark,integer,4,v1.0.0)

The node returns to the normal state when the sampled run queue length falls to this factor times the number of online schedulers. Must be below the high watermark: the gap is the hysteresis that stops the status flapping at the boundary. A wider gap makes the node slower to recover but steadier; a narrower one does the reverse.

@[config](load_regulation.load_monitor.sample_interval,duration_time_units,100ms,v1.0.0)

How often the load monitor samples the run queue. The sample is cheap; this interval bounds how quickly the busy state reacts to a change in load.

## Memory Monitor

The memory monitor samples the node's memory use against its limit and exposes a binary high/normal status that the admission gates consult, alongside the load monitor. Inside a cgroup it reads the cgroup: use is the cgroup's anonymous memory and the limit is the cgroup's, because that is the limit the kernel enforces. Outside one, or when `load_regulation.memory_monitor.limit` is set, use is the runtime's own total against that limit. With neither a configured limit nor a bounded cgroup, the monitor logs this once at start and never reports high.

Entering or leaving the high state requires the crossing to hold for three consecutive samples. Entering it raises the [`bondy_memory_high`](/router/reference/alarms#bondy-memory-high) alarm; leaving it clears the alarm.

@[config](load_regulation.memory_monitor.high_watermark,pos_integer,85,v1.0.0)

The node enters the memory-high state when its sampled use reaches this percentage of its limit. While it holds, the admission gates refuse new work with a retryable refusal; work already admitted is not shed.

@[config](load_regulation.memory_monitor.low_watermark,integer,75,v1.0.0)

The node returns to normal when its sampled use falls to this percentage of its limit. Must be below the high watermark: the gap is the hysteresis that stops the status flapping at the boundary.

@[config](load_regulation.memory_monitor.sample_interval,duration_time_units,1s,v1.0.0)

How often the memory monitor samples memory use. Memory moves more slowly than the run queue, so the default is ten times the load monitor's.

@[config](load_regulation.memory_monitor.limit,bytesize,,v1.0.0)

The memory limit to compare against when the node is not in a cgroup that sets one (a bare VM, a developer's machine), or when the cgroup's limit is not the one that matters. When set it wins over the cgroup, and use is then measured as the runtime's own total (`erlang:memory(total)`). Unset by default.

## Session Admission

@[config](load_regulation.hello.enabled,on|off,on,v1.0.0)

Enables the session admission gate. While the node is in the busy state or the memory-high state (see the monitor options above), a new `HELLO` is refused immediately with a retryable `wamp.error.unavailable` `ABORT`, instead of being accepted into a session open that deep run queues would stretch past the client's timeout while holding a socket and session state.

Sessions already established, and handshakes already past `HELLO`, are unaffected — the gate protects the latency of admitted sessions rather than sharing the overload with them. Refusals increment `bondy_wamp_dropped_total` with `reason="admission"` and `family="hello"`.

@[config](load_regulation.oauth2.enabled,on|off,on,v1.0.0)

Enables the admission gate at the OAuth2 token and revocation endpoints, the HTTP counterpart of `load_regulation.hello.enabled`. While the node is in the busy state or the memory-high state, a request is answered immediately with a retryable `503` and a `Retry-After` header, before any credential verification, store read or token write. Requests already past the gate are unaffected.

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
Once the maximum has been reached, Bondy will respond with an overload error. This is further limited by [vm.process.limit](/router/reference/configuration/node#vm.process.limit).

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
[Registry Routing (RIB)](/router/concepts/registry_routing) stub updates —
triggered as anti-entropy syncs land. Events are sharded by cell key, so
increasing this only helps when reactions for many distinct cells are in
flight concurrently.

@[config](load_regulation.session_manager.pool.size,pos_integer,32,v1.0.0)

The capacity of the session manager process pool, i.e. the maximum
number of active erlang processes handling session events (default = 32).

@[config](load_regulation.job_manager.pool.size,pos_integer,16,v1.0.0)

The number of job manager workers. The job manager runs background work off the request path: the WAMP meta events for registrations and subscriptions, the WAMP events Bondy publishes for its own events (realm, session, cluster connection and alarm changes), and the [token and ticket reclamation](/router/reference/configuration/security#token-and-ticket-reclamation) sweeps.

Each worker owns one FIFO queue and runs its jobs one at a time, in queue order. A job goes to the worker chosen by hashing its partition key, so jobs that share a key — the meta events of one session, for example — run in the order they were queued.

@[config](load_regulation.job_manager.queue.size,pos_integer,160000,v1.0.0)

The total capacity of the job queues, split evenly across the workers: each worker's queue holds `queue.size / pool.size` jobs, rounded.

When a worker's queue is full, a new job for it is refused. Jobs already queued are kept. What happens to the refused job depends on its kind:

- A meta event or a Bondy event is dropped. The drop is counted in `bondy_wamp_dropped_total` with `reason="shed"` and logged as a warning at most once per window. Subscribers to those topics miss the event.
- A reclamation round is logged as a warning and retried after about five minutes.

@[config](load_regulation.job_manager.queue.ttl,duration_time_units,1m,v1.0.0)

Bondy sets this value as the maximum waiting time of each worker queue.

::: warning No effect in this release
The worker queues are passive queues of the `jobs` library, and that library checks a queue's maximum waiting time only for queues it schedules itself. A job in a passive queue is never evicted for age, so this setting does not remove old jobs.
:::


@[config](registry.partitions,pos_integer,32,v1.0.0)

The number of registry partitions — the stores that hold registrations and
subscriptions, each owned by one Erlang process.

The partition process is not a serialisation point: writes run in the
caller's process, with exact-match indices going to concurrent ETS tables
and prefix/wildcard indices to a persistent radix tree updated by
path-copy plus a compare-and-swap on its root — concurrent writers retry
on CAS loss (visible as `bondy_registry_ptrie_cas_retries_total`). The
owning process holds the tables and runs the memory-reclamation janitors.

All registrations and subscriptions for a given realm are stored in the
same partition; assignment hashes the realm URI across the configured
number of partitions. Raising this value spreads *realms* across more
stores; a single busy realm always maps onto one partition regardless,
where its prefix/wildcard writers contend on that store's root.

