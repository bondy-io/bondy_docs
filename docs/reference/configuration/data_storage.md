# Data Storage & Active Anti-entropy Configuration Reference

Bondy's storage layer is `bondy_db`: a sharded key/value facade with per-table CRDT semantics, backed by `bondy_oplog` (per-shard write-ahead log, Merkle Search Tree anti-entropy, and the applier that maintains materialised projections). Durable tables persist to a `leveled` LSM-tree store. Bondy provisions exactly two databases: `main` (durable — security, realms, the API gateway, tickets/tokens) and `registry` (ephemeral, in-memory — registrations and subscriptions).

> **Concept:** see [Architecture](/concepts/architecture) for how sharding, replication, and convergence fit together. This page covers the full `db.*` configuration surface: sharding and placement, pack-store durability, and anti-entropy sync.

::: warning No in-place migration from pre-1.0.0 releases
This storage stack replaces PlumDB/RocksDB entirely. There is no in-place migration — see [Upgrading to 1.0.0](/guides/deployment/upgrading_to_1_0_0).
:::

## Sharding and Placement

@[config](db.main.shard_count,integer,16,v1.0.0)

The shard count for the durable `main` database, applied when the catalogue first provisions it. Each shard is an independent replicated unit with its own write-ahead log, Merkle Search Tree, and projection.

@[config](db.registry.shard_count,integer,16,v1.0.0)

The shard count for the ephemeral `registry` database (registrations and subscriptions), independent of `db.main.shard_count`. The registry has no on-disk topology manifest, so this is the only registry-specific tuning knob — it carries no partition strategy, realm-prefix depth, or topology-mismatch setting, since those all concern durable, on-disk keying.

@[config](db.main.partition_strategy,aggregate&#124;realm&#124;entity,aggregate,v1.0.0)

How a `(realm, key)` write maps to one of `db.main.shard_count` shards. This sets both the write-atomicity grain (entities sharing a shard are written in one atomic batch) and which reads are shard-local versus scatter-gather. `main`-only — `registry` has no partition-strategy knob:

- **`aggregate`** (recommended) — shard = hash of `(realm, aggregate_root)`. A subject's record, grants, and memberships co-locate, giving atomic per-subject writes, while subjects spread across all shards so a single realm still uses every shard. Realm-wide listings scatter-gather.
- **`realm`** — shard = hash of a realm-URI prefix (depth set by `db.main.realm_prefix_depth`). A realm's whole dataset lives on one shard, enabling single-shard realm scans, but a single busy realm collapses onto one shard — suited to many-small-realm fleets only.
- **`entity`** — shard = hash of `(entity_type, key)`. Maximum write parallelism, with no cross-entity atomicity (the pre-`bondy_db` behaviour).

::: warning Topology-defining
`partition_strategy` is frozen in the on-disk topology manifest at first provision. Changing it on a populated node requires a re-key: export, wipe the data directory, reimport. See `db.main.on_topology_mismatch` below.
:::

@[config](db.main.realm_prefix_depth,integer,1,v1.0.0)

Only used when `partition_strategy = realm`: the number of leading dot-separated realm-URI components that share a shard. `1` shards per realm; `2` co-locates e.g. `org.acme.sso` with `org.acme.app`. Also topology-defining, `main`-only.

## Keying Topology Safety

@[config](db.main.on_topology_mismatch,warn&#124;stop,warn,v1.0.0)

Boot behaviour when the on-disk topology manifest disagrees with the configured topology (`partition_strategy`, `shard_count`, `realm_prefix_depth`, or a table's shard key). On-disk data is keyed under the manifest's topology, so a changed configuration cannot simply be applied without a re-key. `main`-only — `registry` is ephemeral, has no manifest, and cannot mismatch.

- **`warn`** — log a loud warning naming the diverging keys and keep running on the on-disk topology; the new configuration is *not* applied.
- **`stop`** — refuse to boot. Recommended for production, so a topology change is never silently ignored.

## Pack Store and Durability

@[config](db.pack_auto_seal_bytes,bytesize,2MB,v1.0.0)

Byte threshold at which a durable shard's pack-store MST seals its incoming pack into a sealed pack. The seal rewrites the whole incoming pack in one fsync'd pass; its cost scales linearly with this threshold. The pack store's native 16MB behaviour produces seal freezes of 600ms or more — large enough to push read-after-write freshness lag toward the authentication fence's default window (`db.aae.fence.max_lag`, 1s) and trigger spurious authentication refusals. The 2MB default keeps each freeze to tens of milliseconds at no throughput or hot-read cost, since reads are served from the projection and cache, never the MST directly. A smaller value seals more often into more sealed packs, adding only anti-entropy/compaction/cold-boot work. Global — applies to every durable shard node-wide, not a specific database.

@[config](db.pack_seal_mode,async&#124;sync,async,v1.0.0)

Seal driver for the durable shard pack-store MST. `async` rolls the incoming pack aside at the commit barrier and rewrites it into a sealed pack on a monitored worker, keeping the (multi-hundred-millisecond) rewrite off the write path entirely — measured roughly 44% lower p99 apply latency versus the inline alternative. It does not change durable write throughput, which is bounded by disk fsync bandwidth regardless of where the seal runs. `sync` restores the historical inline behaviour (the store seals on `put` at the threshold). Affects only durable shards — ephemeral instances never seal. Global, like `db.pack_auto_seal_bytes`.

## Instance Memory Management

@[config](db.gc_interval,duration_time_units,2s,v1.0.0)

Interval at which each oplog instance checks its own heap and fullsweep-hibernates it if growth has exceeded `db.gc_heap_delta` over its post-GC baseline. This reclaims transient apply/anti-entropy garbage that a long-lived instance would otherwise retain until the next major GC — most visibly during a solo import with no peers, where the anti-entropy-driven hibernate never fires. `0` disables the monitor. Global — applies to every oplog instance node-wide, not a specific database.

@[config](db.gc_heap_delta,bytesize,16MB,v1.0.0)

Heap-growth threshold above an instance's post-GC baseline that triggers the periodic monitor above. Keying on growth over the live baseline, rather than absolute heap size, avoids GC-thrashing an instance with a large live MST: it fires once per roughly this many bytes of accumulated garbage, capping the transient peak at approximately `live + this`. Lower trades a touch more fullsweep work for a tighter memory ceiling. Global, like `db.gc_interval`.

## Write-Ahead Log

@[config](db.wal.fsync_mode,per_write&#124;batched,per_write,v1.0.0)

Fsync driver for the durable write-ahead log. `per_write` fsyncs every append, bounding the writer to the storage device's fsync rate (roughly 6,000 ops/s on typical NVMe) but guaranteeing each write is durable before it returns — required for security-class namespaces (grants, tickets, users). `batched` defers fsync to a size or time boundary (`db.wal.batched_fsync_bytes` / `db.wal.batched_fsync_interval`) and exposes durability via an explicit wait instead of the append call returning; it reaches roughly two orders of magnitude higher throughput at the cost of a bounded durability window. Global — affects every durable oplog instance node-wide; the ephemeral `registry` in-memory WAL never fsyncs and ignores this.

@[config](db.wal.max_segment_bytes,bytesize,64MB,v1.0.0)

Rotation threshold for the durable WAL's head segment. The writer rotates to a fresh segment once the next frame would push the head past this size; rotation fsyncs the sealed segment and advances the durable position. Global, like `db.wal.fsync_mode`.

@[config](db.wal.batched_fsync_interval,duration_time_units,50ms,v1.0.0)

Batched-mode fsync time trigger: the writer fsyncs at most this long after the first un-fsynced append. Only consulted when `db.wal.fsync_mode = batched`. Global, like `db.wal.fsync_mode`.

@[config](db.wal.batched_fsync_bytes,bytesize,1MB,v1.0.0)

Batched-mode fsync size trigger: the writer fsyncs once accumulated un-fsynced bytes exceed this threshold. Only consulted when `db.wal.fsync_mode = batched`. Global, like `db.wal.fsync_mode`.

@[config](db.drain.stall_alarm,duration_time_units,1m,v1.0.0)

How long a per-shard WAL drain may actively process frames without committing any new consumer position before Bondy raises a `bondy_oplog_drain_stalled` alarm (visible via `/metrics` and cleared automatically once the drain progresses again). This guards against a wedged or endlessly-re-reading log consumer on a node that anti-entropy would otherwise still report as converged. `0` disables the detector.

## Active Anti-entropy

Bondy's storage layer converges leaderlessly: peers compare Merkle Search Tree root hashes and exchange only the divergent pages, rather than comparing every key. A sync scheduler discovers peers from the live Partisan cluster membership and runs sync sessions over a dedicated Partisan channel, converging each node's view of every replicated table — security (users/grants), realms, the API gateway, the registry, and more.

> **Concept:** see [Clustering](/concepts/clustering) for how this fits into cluster formation and convergence generally.

@[config](db.aae,on|off,on,v1.0.0)

Master switch for active anti-entropy. The sync scheduler process always runs, but with this off, no Partisan peer source is wired in, so the scheduler has no peers and stays inert. A single-node deployment is unaffected either way — it has no peer to sync with, and the authentication freshness fence (below) treats a lone node as vacuously fresh.

@[config](db.aae.interval,duration_time_units,500ms,v1.0.0)

Interval between sync scheduler ticks. Each tick, the scheduler asks the peer source for peers and dispatches sync sessions. Only relevant when `db.aae` is on.

### Live-Sync Throttling

@[config](db.aae.live_sync,on|off,on,v1.0.0)

Adaptively throttles live (post-bootstrap) syncs. A converged shard only re-syncs to discover divergence; once its data has settled it has nothing to pull, yet a naive scheduler would still dispatch a session against every peer every tick — the dominant steady-state cost of running anti-entropy across many shards. When on, each shard syncs at the tick interval while its data is actively changing, and backs off geometrically up to `db.aae.live_sync.max` once it goes quiescent, resetting to the fast cadence the moment its data moves again. Shards backing the authentication freshness fence are exempt and always sync every tick, so this never affects auth availability. When off, every live shard syncs every peer every tick (the historical behaviour).

@[config](db.aae.live_sync.max,duration_time_units,5s,v1.0.0)

Upper bound on the adaptive live-sync poll interval: once a shard goes quiescent, its sync cadence doubles each round up to this cap. Because `bondy_db` propagates changes pull-only (no eager push), this cap is also the steady-state cross-node convergence latency for a quiescent shard — set it below the convergence SLA you need. The first poll that pulls anything resets the shard to the fast cadence. Only relevant when `db.aae` and `db.aae.live_sync` are both on.

### Concurrency and Memory

@[config](db.aae.max_concurrency,integer,3,v1.0.0)

Maximum number of anti-entropy sync sessions allowed to run concurrently on this node. Anti-entropy is background work subordinate to routing — this cap keeps it from saturating the node. It governs speed and fairness, never the memory ceiling: the per-round page batch is `db.aae.max_pages_in_flight` divided by this value, so raising concurrency shrinks each session's batch while the node-wide page budget stays fixed. More concurrency means more peers/shards make progress at once — no shard starves behind a single serial sync — each running slower, not using more RAM. `1` serialises anti-entropy entirely.

@[config](db.aae.max_pages_in_flight,integer,2048,v1.0.0)

Node-wide budget, in MST pages, for anti-entropy reconciliation in flight at any instant. This is the lever that bounds anti-entropy's peak memory: a sync session pulls missing pages in bounded rounds of `max_pages_in_flight / max_concurrency` pages, so total in-flight pages stay near this budget regardless of dataset size or concurrency. Larger means faster sync with a higher peak; smaller is gentler on RAM but slower.

### Load-Adaptive Yielding

@[config](db.aae.load_adaptive,on|off,off,v1.0.0)

Yields anti-entropy's throttleable dispatches while the node is busy. The concurrency cap bounds anti-entropy in aggregate; this adds a temporal dimension — even within the cap, a routing load spike transiently defers anti-entropy so background reconciliation never steals scheduler time from the node's real job. When on, the scheduler samples a node-load signal each tick and, while the node is backlogged past `db.aae.load_run_queue_threshold`, skips throttleable dispatches (bootstrap snapshot ships and non-fence live syncs) for that tick — in-flight sessions are never aborted, and deferred shards retry on the next quiet tick. Shards backing the authentication freshness fence are exempt and always sync, so this can never affect auth availability, only convergence latency under load. Off by default, since the concurrency cap and live-sync throttle already keep anti-entropy subordinate; enable it where routing latency is sensitive to anti-entropy scheduler pressure under load.

@[config](db.aae.load_run_queue_threshold,float,2.0,v1.0.0)

Run-queue length per online scheduler — EWMA-smoothed across ticks — at or above which anti-entropy yields its throttleable dispatches (only consulted when `db.aae.load_adaptive` is also on). The signal is `erlang:statistics(run_queue)` divided by the online scheduler count: the average number of ready processes queued per scheduler. A healthy node hovers near 0–1; a sustained 2 or more means work is queuing faster than the schedulers drain it. Lower yields anti-entropy sooner (more protective of routing latency, slower convergence under load); higher lets it work closer to saturation.

### Peer Sampling

@[config](db.aae.fanout,integer,3,v1.0.0)

Number of peers the sync scheduler samples from the Partisan cluster membership each tick.

@[config](db.aae.prefix_hold,on|off,on,v1.0.0)

Enforces per-origin prefix closure at the replay fold: a node never materialises a peer origin's later operation while an earlier one is missing (history truncated at every live peer before this node pulled it). The non-contiguous remainder is held — excluded from the fold and from the applied-frontier advance — and re-presents each replay until the gap fills or the frontier-gap detection schedules a catalogue rebootstrap, which supplies both the data and the frontier. This closes a window in which observed-remove (add-wins) tables could silently drop a concurrent add. Turning it off is an emergency measure only. The hold's one cost is that a permanently missing operation converts into a rebootstrap instead of a silent gap. Observability: `bondy_oplog_events_held_total` (hold engaging — a burst on a rejoining node is the mechanism working), `bondy_oplog_prefix_holes_total` (gaps that materialised — exclude own-origin transients before alerting), `bondy_oplog_seqs_burned_total` (permanently unfillable sequence numbers). See [Per-Origin Prefix Closure](/concepts/prefix_closure).

### Authentication Freshness Fence

Because Bondy's storage layer has no consensus round, a partitioned node could otherwise authenticate against a stale view of the security tables. The freshness fence closes that gap.

@[config](db.aae.fence.max_lag,duration_time_units,1s,v1.0.0)

The freshness bound for the fence. A node refuses new authentication when its view of the security tables (users/grants) has not been confirmed by a local commit or a successful anti-entropy round within this window — bounding how stale a credential or permission change a node may authenticate against. Lower is tighter security (a lagging node refuses sooner); higher favours availability under partition or lag. Only relevant when `db.aae` is on — the fence is otherwise a no-op, since local writes are synchronous.

@[config](db.aae.fence.on_isolation,refuse&#124;proceed&#124;quorum,refuse,v1.0.0)

What the fence does on a node in a multi-node cluster that currently cannot confirm freshness with any peer — partitioned into a minority, or cold-started before its first anti-entropy round completes. A genuine single-node deployment (membership is just this node) is **not** governed by this policy: with no peer to lag, its view is vacuously fresh and it always authenticates, so turning `db.aae` on never locks out a lone node.

- **`refuse`** (secure default) — fail closed: refuse all new authentication until a peer round confirms freshness. A node restarting into an established cluster refuses only until its first sync round, typically sub-second.
- **`proceed`** — treat unreachable peers as vacuously fresh and keep authenticating. Most available, but during a partition a stale minority node could accept a token revoked elsewhere until it heals. Not recommended for a security fence.
- **`quorum`** — certify freshness, and so authenticate, only while connected to a majority of the expected cluster membership; a minority partition refuses even if it can still sync internally. Secure and available for the majority side. Requires a Partisan cluster.

## Deprecated and Removed Keys

Every storage-related `bondy.conf` key was renamed or removed when this release replaced the storage engine — see [Upgrading to 1.0.0](/guides/deployment/upgrading_to_1_0_0) for the full migration procedure. The old keys are kept here, greyed out, so a key you remember from an earlier release is still findable on this page rather than silently gone.

### Renamed

The `oplog.` prefix is now `db.`. Four keys additionally drop their `core.` segment, since they were never specific to one database, and four more move from `oplog.core.*` to `db.main.*`, since the durable database itself was renamed from `core` to `main`.

@[configDeprecated](oplog.aae,db.aae,v1.0.0)

@[configDeprecated](oplog.aae.interval,db.aae.interval,v1.0.0)

@[configDeprecated](oplog.aae.live_sync,db.aae.live_sync,v1.0.0)

@[configDeprecated](oplog.aae.live_sync.max,db.aae.live_sync.max,v1.0.0)

@[configDeprecated](oplog.aae.max_concurrency,db.aae.max_concurrency,v1.0.0)

@[configDeprecated](oplog.aae.max_pages_in_flight,db.aae.max_pages_in_flight,v1.0.0)

@[configDeprecated](oplog.aae.load_adaptive,db.aae.load_adaptive,v1.0.0)

@[configDeprecated](oplog.aae.load_run_queue_threshold,db.aae.load_run_queue_threshold,v1.0.0)

@[configDeprecated](oplog.aae.fanout,db.aae.fanout,v1.0.0)

@[configDeprecated](oplog.aae.fence.max_lag,db.aae.fence.max_lag,v1.0.0)

@[configDeprecated](oplog.aae.fence.on_isolation,db.aae.fence.on_isolation,v1.0.0)

@[configDeprecated](oplog.core.gc_interval,db.gc_interval,v1.0.0)

@[configDeprecated](oplog.core.gc_heap_delta,db.gc_heap_delta,v1.0.0)

@[configDeprecated](oplog.core.pack_auto_seal_bytes,db.pack_auto_seal_bytes,v1.0.0)

@[configDeprecated](oplog.core.pack_seal_mode,db.pack_seal_mode,v1.0.0)

@[configDeprecated](oplog.core.shard_count,db.main.shard_count,v1.0.0)

@[configDeprecated](oplog.core.partition_strategy,db.main.partition_strategy,v1.0.0)

@[configDeprecated](oplog.core.realm_prefix_depth,db.main.realm_prefix_depth,v1.0.0)

@[configDeprecated](oplog.core.on_topology_mismatch,db.main.on_topology_mismatch,v1.0.0)

In each case the value and its meaning are unchanged — only the key name moved.

### Removed

These keys have no replacement. Setting them in a pre-1.0.0-rc.65 `bondy.conf` did nothing in any released version; they are listed here only so their disappearance isn't mistaken for an oversight.

@[configRemoved](oplog.catalog,Never had a consumer,v1.0.0)

@[configRemoved](oplog.core.scan_max_concurrency,Never wired to any code path,v1.0.0)

@[configRemoved](store.*,RocksDB tuning; RocksDB was replaced by leveled,v1.0.0)

The `leveled` backend that replaced RocksDB has no equivalent `bondy.conf` tuning surface yet — if you relied on `store.*` for capacity planning, there is currently nothing to replace it with.

## See also

- [Reclamation Configuration Reference](/reference/configuration/reclamation) — how anti-entropy's confirmed roots license space reclamation.
- [Deletion and Reclamation](/concepts/deletion_and_reclamation) — the concept behind reclamation.
- [Clustering](/concepts/clustering) — cluster formation and convergence generally.
- [Upgrading to 1.0.0](/guides/deployment/upgrading_to_1_0_0) — the full migration procedure from 1.0.0-rc.65.
