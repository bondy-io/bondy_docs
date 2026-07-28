# Data Storage Configuration Reference

Bondy's storage layer is `bondy_db`: a sharded key/value facade with per-table CRDT semantics, backed by `bondy_oplog` (per-shard write-ahead log, Merkle Search Tree anti-entropy, and the applier that maintains materialised projections). Durable tables persist to a `leveled` LSM-tree store; ephemeral tables (e.g. the registry) are fully in-memory and carry no configuration here.

> **Concept:** see [Architecture](/concepts/architecture) for how sharding, replication, and convergence fit together. This page covers only the `oplog.core.*` configuration surface — the durable `core` database used by security (users/grants/sources), realms, the API gateway, and tickets/tokens.

::: warning No in-place migration from pre-1.0.0 releases
This storage stack replaces PlumDB/RocksDB entirely. There is no in-place migration — see [Upgrading to 1.0.0](/guides/deployment/upgrading_to_1_0_0).
:::

## Sharding and Placement

@[config](oplog.core.shard_count,integer,16,v1.0.0)

The shard count for the `core` database, applied when the catalogue first provisions it. Each shard is an independent replicated unit with its own write-ahead log, Merkle Search Tree, and projection.

@[config](oplog.core.partition_strategy,aggregate&#124;realm&#124;entity,aggregate,v1.0.0)

How a `(realm, key)` write maps to one of `oplog.core.shard_count` shards. This sets both the write-atomicity grain (entities sharing a shard are written in one atomic batch) and which reads are shard-local versus scatter-gather:

- **`aggregate`** (recommended) — shard = hash of `(realm, aggregate_root)`. A subject's record, grants, and memberships co-locate, giving atomic per-subject writes, while subjects spread across all shards so a single realm still uses every core. Realm-wide listings scatter-gather.
- **`realm`** — shard = hash of a realm-URI prefix (depth set by `oplog.core.realm_prefix_depth`). A realm's whole dataset lives on one shard, enabling single-shard realm scans, but a single busy realm collapses onto one shard — suited to many-small-realm fleets only.
- **`entity`** — shard = hash of `(entity_type, key)`. Maximum write parallelism, with no cross-entity atomicity (the pre-`bondy_db` behaviour).

::: warning Topology-defining
`partition_strategy` is frozen in the on-disk topology manifest at first provision. Changing it on a populated node requires a re-key: export, wipe the data directory, reimport. See `oplog.core.on_topology_mismatch` below.
:::

@[config](oplog.core.realm_prefix_depth,integer,1,v1.0.0)

Only used when `partition_strategy = realm`: the number of leading dot-separated realm-URI components that share a shard. `1` shards per realm; `2` co-locates e.g. `org.acme.sso` with `org.acme.app`. Also topology-defining.

@[config](oplog.core.scan_max_concurrency,integer,0,v1.0.0)

Maximum number of shards a single cross-shard scatter-gather scan folds concurrently, bounding the fan-out of realm-wide listings under the `aggregate`/`entity` strategies. `0` (the default) means no cap — fan out to all shards. Runtime-tunable, not part of the frozen topology.

## Keying Topology Safety

@[config](oplog.core.on_topology_mismatch,warn&#124;stop,warn,v1.0.0)

Boot behaviour when the on-disk topology manifest disagrees with the configured topology (`partition_strategy`, `shard_count`, `realm_prefix_depth`, or a table's shard key). On-disk data is keyed under the manifest's topology, so a changed configuration cannot simply be applied without a re-key.

- **`warn`** — log a loud warning naming the diverging keys and keep running on the on-disk topology; the new configuration is *not* applied.
- **`stop`** — refuse to boot. Recommended for production, so a topology change is never silently ignored.

## Pack Store and Durability

@[config](oplog.core.pack_auto_seal_bytes,bytesize,2MB,v1.0.0)

Byte threshold at which a durable shard's pack-store MST seals its incoming pack into a sealed pack. The seal rewrites the whole incoming pack in one fsync'd pass; its cost scales linearly with this threshold. The pack store's native 16MB behaviour produces seal freezes of 600ms or more — large enough to push read-after-write freshness lag toward the authentication fence's default window (`oplog.aae.fence.max_lag`, 1s) and trigger spurious authentication refusals. The 2MB default keeps each freeze to tens of milliseconds at no throughput or hot-read cost, since reads are served from the projection and cache, never the MST directly. A smaller value seals more often into more sealed packs, adding only anti-entropy/compaction/cold-boot work.

@[config](oplog.core.pack_seal_mode,async&#124;sync,async,v1.0.0)

Seal driver for the durable shard pack-store MST. `async` rolls the incoming pack aside at the commit barrier and rewrites it into a sealed pack on a monitored worker, keeping the (multi-hundred-millisecond) rewrite off the write path entirely — measured roughly 44% lower p99 apply latency versus the inline alternative. It does not change durable write throughput, which is bounded by disk fsync bandwidth regardless of where the seal runs. `sync` restores the historical inline behaviour (the store seals on `put` at the threshold). Affects only durable shards — ephemeral instances never seal.

## Instance Memory Management

@[config](oplog.core.gc_interval,duration_time_units,2s,v1.0.0)

Interval at which each oplog instance checks its own heap and fullsweep-hibernates it if growth has exceeded `oplog.core.gc_heap_delta` over its post-GC baseline. This reclaims transient apply/anti-entropy garbage that a long-lived instance would otherwise retain until the next major GC — most visibly during a solo import with no peers, where the anti-entropy-driven hibernate never fires. `0` disables the monitor.

@[config](oplog.core.gc_heap_delta,bytesize,16MB,v1.0.0)

Heap-growth threshold above an instance's post-GC baseline that triggers the periodic monitor above. Keying on growth over the live baseline, rather than absolute heap size, avoids GC-thrashing an instance with a large live MST: it fires once per roughly this many bytes of accumulated garbage, capping the transient peak at approximately `live + this`. Lower trades a touch more fullsweep work for a tighter memory ceiling.

## Write-Ahead Log

@[config](oplog.drain.stall_alarm,duration_time_units,1m,v1.0.0)

How long a per-shard WAL drain may actively process frames without committing any new consumer position before Bondy raises a `bondy_oplog_drain_stalled` alarm (visible via `/metrics` and cleared automatically once the drain progresses again). This guards against a wedged or endlessly-re-reading log consumer on a node that anti-entropy would otherwise still report as converged. `0` disables the detector.

## See also

- [Active Anti-entropy Configuration Reference](/reference/configuration/aae) — how shards converge across the cluster.
- [Reclamation Configuration Reference](/reference/configuration/reclamation) — how deleted data is physically reclaimed.
- [Deletion and Reclamation](/concepts/deletion_and_reclamation) — the concept behind reclamation.
