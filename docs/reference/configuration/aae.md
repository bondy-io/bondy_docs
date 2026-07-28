# Active Anti-entropy Configuration Reference

Bondy's storage layer converges leaderlessly: peers compare Merkle Search Tree root hashes and exchange only the divergent pages, rather than comparing every key. A sync scheduler discovers peers from the live Partisan cluster membership and runs sync sessions over a dedicated Partisan channel, converging each node's view of every replicated table — security (users/grants), realms, the API gateway, the registry, and more.

> **Concept:** see [Clustering](/concepts/clustering) for how this fits into cluster formation and convergence generally.

@[config](oplog.aae,on|off,on,v1.0.0)

Master switch for active anti-entropy. The sync scheduler process always runs, but with this off, no Partisan peer source is wired in, so the scheduler has no peers and stays inert. A single-node deployment is unaffected either way — it has no peer to sync with, and the authentication freshness fence (below) treats a lone node as vacuously fresh.

@[config](oplog.aae.interval,duration_time_units,500ms,v1.0.0)

Interval between sync scheduler ticks. Each tick, the scheduler asks the peer source for peers and dispatches sync sessions. Only relevant when `oplog.aae` is on.

## Live-Sync Throttling

@[config](oplog.aae.live_sync,on|off,on,v1.0.0)

Adaptively throttles live (post-bootstrap) syncs. A converged shard only re-syncs to discover divergence; once its data has settled it has nothing to pull, yet a naive scheduler would still dispatch a session against every peer every tick — the dominant steady-state cost of running anti-entropy across many shards. When on, each shard syncs at the tick interval while its data is actively changing, and backs off geometrically up to `oplog.aae.live_sync.max` once it goes quiescent, resetting to the fast cadence the moment its data moves again. Shards backing the authentication freshness fence are exempt and always sync every tick, so this never affects auth availability. When off, every live shard syncs every peer every tick (the historical behaviour).

@[config](oplog.aae.live_sync.max,duration_time_units,5s,v1.0.0)

Upper bound on the adaptive live-sync poll interval: once a shard goes quiescent, its sync cadence doubles each round up to this cap. Because `bondy_db` propagates changes pull-only (no eager push), this cap is also the steady-state cross-node convergence latency for a quiescent shard — set it below the convergence SLA you need. The first poll that pulls anything resets the shard to the fast cadence. Only relevant when `oplog.aae` and `oplog.aae.live_sync` are both on.

## Concurrency and Memory

@[config](oplog.aae.max_concurrency,integer,3,v1.0.0)

Maximum number of anti-entropy sync sessions allowed to run concurrently on this node. Anti-entropy is background work subordinate to routing — this cap keeps it from saturating the node. It governs speed and fairness, never the memory ceiling: the per-round page batch is `oplog.aae.max_pages_in_flight` divided by this value, so raising concurrency shrinks each session's batch while the node-wide page budget stays fixed. More concurrency means more peers/shards make progress at once — no shard starves behind a single serial sync — each running slower, not using more RAM. `1` serialises anti-entropy entirely.

@[config](oplog.aae.max_pages_in_flight,integer,2048,v1.0.0)

Node-wide budget, in MST pages, for anti-entropy reconciliation in flight at any instant. This is the lever that bounds anti-entropy's peak memory: a sync session pulls missing pages in bounded rounds of `max_pages_in_flight / max_concurrency` pages, so total in-flight pages stay near this budget regardless of dataset size or concurrency. Larger means faster sync with a higher peak; smaller is gentler on RAM but slower.

## Load-Adaptive Yielding

@[config](oplog.aae.load_adaptive,on|off,off,v1.0.0)

Yields anti-entropy's throttleable dispatches while the node is busy. The concurrency cap bounds anti-entropy in aggregate; this adds a temporal dimension — even within the cap, a routing load spike transiently defers anti-entropy so background reconciliation never steals scheduler time from the node's real job. When on, the scheduler samples a node-load signal each tick and, while the node is backlogged past `oplog.aae.load_run_queue_threshold`, skips throttleable dispatches (bootstrap snapshot ships and non-fence live syncs) for that tick — in-flight sessions are never aborted, and deferred shards retry on the next quiet tick. Shards backing the authentication freshness fence are exempt and always sync, so this can never affect auth availability, only convergence latency under load. Off by default, since the concurrency cap and live-sync throttle already keep anti-entropy subordinate; enable it where routing latency is sensitive to anti-entropy scheduler pressure under load.

@[config](oplog.aae.load_run_queue_threshold,float,2.0,v1.0.0)

Run-queue length per online scheduler — EWMA-smoothed across ticks — at or above which anti-entropy yields its throttleable dispatches (only consulted when `oplog.aae.load_adaptive` is also on). The signal is `erlang:statistics(run_queue)` divided by the online scheduler count: the average number of ready processes queued per scheduler. A healthy node hovers near 0–1; a sustained 2 or more means work is queuing faster than the schedulers drain it. Lower yields anti-entropy sooner (more protective of routing latency, slower convergence under load); higher lets it work closer to saturation.

## Peer Sampling

@[config](oplog.aae.fanout,integer,3,v1.0.0)

Number of peers the sync scheduler samples from the Partisan cluster membership each tick.

## Authentication Freshness Fence

Because Bondy's storage layer has no consensus round, a partitioned node could otherwise authenticate against a stale view of the security tables. The freshness fence closes that gap.

@[config](oplog.aae.fence.max_lag,duration_time_units,1s,v1.0.0)

The freshness bound for the fence. A node refuses new authentication when its view of the security tables (users/grants) has not been confirmed by a local commit or a successful anti-entropy round within this window — bounding how stale a credential or permission change a node may authenticate against. Lower is tighter security (a lagging node refuses sooner); higher favours availability under partition or lag. Only relevant when `oplog.aae` is on — the fence is otherwise a no-op, since local writes are synchronous.

@[config](oplog.aae.fence.on_isolation,refuse&#124;proceed&#124;quorum,refuse,v1.0.0)

What the fence does on a node in a multi-node cluster that currently cannot confirm freshness with any peer — partitioned into a minority, or cold-started before its first anti-entropy round completes. A genuine single-node deployment (membership is just this node) is **not** governed by this policy: with no peer to lag, its view is vacuously fresh and it always authenticates, so turning `oplog.aae` on never locks out a lone node.

- **`refuse`** (secure default) — fail closed: refuse all new authentication until a peer round confirms freshness. A node restarting into an established cluster refuses only until its first sync round, typically sub-second.
- **`proceed`** — treat unreachable peers as vacuously fresh and keep authenticating. Most available, but during a partition a stale minority node could accept a token revoked elsewhere until it heals. Not recommended for a security fence.
- **`quorum`** — certify freshness, and so authenticate, only while connected to a majority of the expected cluster membership; a minority partition refuses even if it can still sync internally. Secure and available for the majority side. Requires a Partisan cluster.

## See also

- [Data Storage Configuration Reference](/reference/configuration/data_storage) — sharding, placement, and the pack store.
- [Reclamation Configuration Reference](/reference/configuration/reclamation) — how anti-entropy's confirmed roots license space reclamation.
- [Deletion and Reclamation](/concepts/deletion_and_reclamation) — the concept behind reclamation.
