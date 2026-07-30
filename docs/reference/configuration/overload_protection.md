# Overload Protection

## Load Regulation


@[config](load_regulation.enabled,on|off,on,v0.8.8)

Reserved for future overload-protection tuning. The value is currently accepted but not consulted by any code path — changing it has no effect.

@[config](load_regulation.router.pool.type,permanent|transient,transient,v0.8.8)

Whether router pool workers are `permanent` (pre-spawned and kept alive between requests) or `transient` (spawned as needed and torn down once idle). This affects worker churn under bursty load, not the pool's steady-state capacity — see [load_regulation.router.pool.size](#load_regulationrouterpoolsize) below for that.

@[config](load_regulation.router.pool.size,pos_integer,8,v0.8.8)

The size of the router process pool.
The actual size will be the maximum between the configured value and
the number of Erlang schedulers (which by default is the number of CPU cores) of the host or the number assigned by the virtualization|container layer.


@[config](load_regulation.router.pool.capacity,pos_integer,100000,v0.8.8)

The capacity of the router process pool, i.e. the maximum number of
active erlang processes handling router events (default = 100000).
Once the maximum has been reached, Bondy will respond with an overload error.

@[config](load_regulation.router.flow_pool.capacity,integer,100000,v1.0.0)

Total number of messages that can be queued across the router flow pool
workers — the pool that preserves WAMP per-flow ordering (calls and their
results, and events for a given subscription, delivered in strict order).
Each worker's share of this capacity is this value divided by
[load_regulation.router.pool.size](#load_regulationrouterpoolsize); once a
worker's share is exhausted, Bondy responds with an overload error for
messages on that flow.

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

