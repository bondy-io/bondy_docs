# Data Storage & Active Anti-entropy Configuration Reference

Bondy's storage layer is `bondy_db`: a sharded key/value facade with per-table CRDT semantics, backed by `bondy_oplog` (per-shard write-ahead log, Merkle Search Tree anti-entropy, and the applier that maintains materialised projections). Durable tables persist to a `leveled` LSM-tree store. Bondy provisions exactly two databases: `main` (durable — security, realms, the API gateway, tickets/tokens) and `registry` (ephemeral, in-memory — registrations and subscriptions).

> **Concept:** see [Architecture](/router/concepts/architecture) for how sharding, replication, and convergence fit together. This page covers the full `db.*` configuration surface: sharding and placement, pack-store durability, and anti-entropy sync.

::: warning No in-place migration from pre-1.0.0 releases
This storage stack replaces PlumDB/RocksDB entirely. There is no in-place migration — see [Upgrading to 1.0.0](/router/guides/deployment/upgrading_to_1_0_0).
:::

## Sharding and Placement

@[config](db.main.shard_count,integer,16,v1.0.0)

The shard count for the durable `main` database, applied when the catalogue first provisions it. Each shard is an independent replicated unit with its own write-ahead log, Merkle Search Tree, and projection.

@[config](db.registry.shard_count,integer,16,v1.0.0)

The shard count for the ephemeral `registry` database (registrations and subscriptions), independent of `db.main.shard_count`. The registry has no on-disk topology manifest, so it carries no partition strategy, realm-prefix depth, or topology-mismatch setting, since those all concern durable, on-disk keying. Its only other settings are the history retention bounds under [Instance Memory Management](#instance-memory-management).

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

@[config](db.journal_trim_interval,duration_time_units,1h,v1.0.0)

Interval at which Bondy trims each durable leveled store's journal back to the files still needed to recover the ledger. Bondy opens every durable store in leveled's `head_only` mode. In that mode each write lands twice: the whole cell in the ledger, and the same object specs, payload included, in the journal. The journal exists only to recover the ledger after an unclean stop; no read path reads it. Leveled never reclaims this journal on its own in `head_only` mode.

A trim drops the journal files strictly older than the one holding the ledger's persisted sequence number. A clean restart would not replay that history, so trimming it costs no durability. Leveled deletes a dropped file only once no snapshot can still read it, so disk space returns a few seconds after each pass. The pass scans the journal manifest and rewrites nothing, so it is cheap; the interval only sets how promptly disk space returns. Global — applies to every durable store node-wide.

::: warning Setting 0 lets the journal grow without bound
`0` disables the trim. The journal then keeps every version of every cell ever written, while the ledger holds only the live set, so disk use grows with cumulative writes for as long as the node runs.
:::

## Instance Memory Management

@[config](db.gc_interval,duration_time_units,2s,v1.0.0)

Interval at which each oplog instance checks its own heap and fullsweep-hibernates it if growth has exceeded `db.gc_heap_delta` over its post-GC baseline. This reclaims transient apply/anti-entropy garbage that a long-lived instance would otherwise retain until the next major GC — most visibly during a solo import with no peers, where the anti-entropy-driven hibernate never fires. `0` disables the monitor. Global — applies to every oplog instance node-wide, not a specific database.

@[config](db.gc_heap_delta,bytesize,16MB,v1.0.0)

Heap-growth threshold above an instance's post-GC baseline that triggers the periodic monitor above. Keying on growth over the live baseline, rather than absolute heap size, avoids GC-thrashing an instance with a large live MST: it fires once per roughly this many bytes of accumulated garbage, capping the transient peak at approximately `live + this`. Lower trades a touch more fullsweep work for a tighter memory ceiling. Global, like `db.gc_interval`.

### Registry History Retention

Each shard of the ephemeral `registry` database keeps an op-log history: the Merkle Search Tree events that anti-entropy compares and exchanges. Normally peer-confirmed compaction bounds that history. Compaction truncates only events every peer already holds, so it never strands a lagging peer. The two keys below are an overload backstop. They truncate history locally whether peers have confirmed it or not, and both are off by default. They apply only to `registry`; durable databases are never retention-bounded.

@[config](db.registry.retention.max_age_ms,integer,0,v1.0.0)

Retention window for `registry` history, in milliseconds. When peer-confirmed compaction has nothing to truncate, a shard truncates history older than this window. A peer that lags past the window can no longer catch up from history and must re-bootstrap from the catalogue. `0` disables the age bound. Enable it only when sustained overload demonstrably outruns peer-confirmed compaction.

@[config](db.registry.retention.max_events,integer,0,v1.0.0)

Event-count bound, per shard, for `registry` history. When a shard's live history exceeds this many events, the shard truncates its whole applied history at the next compaction tick (every second), independent of `db.registry.retention.max_age_ms`. This keeps a write burst from outrunning the age window. Peers within one anti-entropy round keep their own copies; a peer that lags further must re-bootstrap from the catalogue. `0` disables the size bound. With both keys at `0`, peer-confirmed compaction alone bounds history.

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

@[config](db.frontier.hole_alarm,duration_time_units,5m,v1.0.0)

How long a shard may carry a hole in its applied frontier before Bondy raises a `bondy_oplog_frontier_hole` alarm. A hole is a run of one origin's sequence numbers that this replica never received, while later sequences from the same origin are already applied. The replica holds its reported frontier below the hole. Peers therefore keep re-offering that origin, and the shard's Merkle Search Tree cannot truncate past the hole.

Short-lived holes are routine: a local WAL commit lands out of sequence order, or a missing sequence is one anti-entropy round away. The alarm therefore fires on the age of a hole, not on its occurrence. Keep this value well above `db.aae.interval`. The `bondy_oplog_instance_frontier_holes` gauge shows current holes without waiting for the alarm. `0` disables the detector and clears any alarm it raised.

The detector runs whether `db.aae` is on or off. A node with anti-entropy off is more likely to carry a standing hole, not less.

## Index Reads

@[config](db.primary_scan_limit,integer,1000000,v1.0.0)

Maximum number of primary cells one stale-index fallback read may enumerate. When a secondary index is stale, Bondy answers the query by scanning every primary cell in the realm and recomputing each value's index terms. This limit stops that scan from running unbounded. Size it to the number of cells in your largest realm. Global — applies to every database node-wide.

::: warning A scan that reaches the limit returns incomplete results
When the scan reaches the limit, Bondy returns the cells it has read so far and logs a warning naming the realm and the limit. The caller is not told that the result may be incomplete. If a realm holds more cells than this limit, raise it.
:::

## Active Anti-entropy

Bondy's storage layer converges leaderlessly: peers compare Merkle Search Tree root hashes and exchange only the divergent pages, rather than comparing every key. A sync scheduler discovers peers from the live Partisan cluster membership and runs sync sessions over a dedicated Partisan channel, converging each node's view of every replicated table — security (users/grants), realms, the API gateway, the registry, and more.

> **Concept:** see [Convergence](/router/concepts/convergence) for what a sync round does, how a replica that is genuinely behind is detected, and what the repair costs; and [Clustering](/router/concepts/clustering) for how this fits into cluster formation.

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

### Authentication Freshness Fence

Because Bondy's storage layer has no consensus round, a partitioned node could otherwise authenticate against a stale view of the security tables. The freshness fence closes that gap.

@[config](db.aae.fence.max_lag,duration_time_units,60s,v1.0.0)

The freshness bound for the fence. A node refuses new authentication when its view of the security tables (users/grants) has not been confirmed by a local commit or a successful anti-entropy round within this window — bounding how stale a credential or permission change a node may authenticate against. Lower is tighter security (a lagging node refuses sooner); higher favours availability under partition or lag. Only relevant when `db.aae` is on — the fence is otherwise a no-op, since local writes are synchronous.

Do not set this near the anti-entropy tick period. The anti-entropy rounds that confirm freshness are background work, and their completion stretches whenever the node is busy. A bound of about 1s therefore refuses authentication in bulk during a burst of session opens, with no actual staleness involved. Revocation of a single user's credentials does not depend on this bound: it is handled separately, by the per-user token version and by invalidating cached RBAC state when replicated changes arrive.

@[config](db.aae.fence.on_isolation,refuse&#124;proceed&#124;quorum,refuse,v1.0.0)

What the fence does on a node in a multi-node cluster that currently cannot confirm freshness with any peer — partitioned into a minority, or cold-started before its first anti-entropy round completes. A genuine single-node deployment (membership is just this node) is **not** governed by this policy: with no peer to lag, its view is vacuously fresh and it always authenticates, so turning `db.aae` on never locks out a lone node.

- **`refuse`** (secure default) — fail closed: refuse all new authentication until a peer round confirms freshness. A node restarting into an established cluster refuses only until its first sync round, typically sub-second.
- **`proceed`** — treat unreachable peers as vacuously fresh and keep authenticating. Most available, but during a partition a stale minority node could accept a token revoked elsewhere until it heals. Not recommended for a security fence.
- **`quorum`** — certify freshness, and so authenticate, only while connected to a majority of the expected cluster membership; a minority partition refuses even if it can still sync internally. Secure and available for the majority side. Requires a Partisan cluster.

## Storage Engine (leveled)

The `db.leveled.*` keys are passed to every durable leveled store this node starts. They are advanced tuning keys, and most deployments leave them at their defaults. Each default is leveled's own, except `db.leveled.cache_size`, which keeps the 2000 Bondy has always used. The keys are global, like `db.wal.*`. The ephemeral `registry` database keeps its projection in memory and starts no leveled store, so none of them apply to it.

A leveled store has two parts. The **ledger** is an LSM tree of keys and their current values, maintained by the **penciller**. The **journal** is an append-only log of writes, used only to recover the ledger after an unclean stop. Bondy opens every store in leveled's `head_only` mode, in which leveled never compacts the journal; `db.journal_trim_interval` is what bounds it.

### Caches

@[config](db.leveled.cache_size,integer,2000,v1.0.0)

Size, in objects, of the ledger cache: the in-memory buffer of recent ledger additions, flushed to the penciller when full. Larger values reduce pressure on the penciller and use more memory. Leveled ignores values below 100, and adds random jitter to the configured value so that stores do not flush in lockstep.

@[config](db.leveled.cache_multiple,integer,2,v1.0.0)

Multiple of `db.leveled.cache_size` beyond which the ledger cache does not grow, even while the penciller is busy. On reaching it, every write returns a pause. This applies back-pressure to the writer instead of letting memory grow without bound.

@[config](db.leveled.penciller_cache_size,integer,28000,v1.0.0)

Maximum number of keys the penciller holds in memory before it writes a new level-zero file to disk. Larger values mean fewer, bigger level-zero writes and more memory held.

@[config](db.leveled.ledger_preload_pagecache_level,integer,4,v1.0.0)

Ledger level at and above which leveled preloads files into the OS page cache when it opens them. Higher values preload more of the tree, trading memory and startup work for lower first-read latency.

@[config](db.leveled.max_merge_below,integer&#124;infinity,24,v1.0.0)

Maximum number of ledger files a single file may be merged into. With fewer overlapping files than this in the level below, the merge runs in full; at or above it, the merge is partial. `infinity` never bounds the merge. Leveled is tested at the default. Change it only when tuning under measurement.

### Journal

@[config](db.leveled.max_journal_size,bytesize,1000000000,v1.0.0)

Maximum size of one journal file, in bytes (the default is 10^9 bytes). Leveled starts a new file when the current one reaches this size or `db.leveled.max_journal_objects`, whichever comes first. The absolute ceiling is 4GB, set by leveled's 4-byte file pointers. The value applies only to files started after a change; existing files are not rewritten.

This key bounds the size of each file, not the number of files. In `head_only` mode the journal records the payload of every write, so it holds every version ever written. `db.journal_trim_interval` bounds the total.

@[config](db.leveled.max_journal_objects,integer,200000,v1.0.0)

Maximum number of objects in one journal file. This is the companion bound to `db.leveled.max_journal_size`; each file stays within both.

@[config](db.leveled.sync_strategy,none&#124;sync,none,v1.0.0)

Whether leveled flushes to disk after every write. `none` lets the operating system schedule the flush. `sync` forces a flush per write, which is markedly slower unless the hardware absorbs it (a battery-backed write cache).

This key governs the durable projection, not the write-ahead log. A write is already durable in the WAL before it reaches leveled; `db.wal.fsync_mode` governs that. With `none`, Bondy fsyncs the leveled journal itself before it truncates the log or checkpoints anything a write was claimed to cover.

#### Journal Compaction

The following four keys are accepted but have **no effect**. Journal compaction never runs: leveled accepts compaction only for stores not in `head_only` mode, and Bondy opens every store in `head_only` mode. The descriptions state what each key would control if compaction ran.

@[config](db.leveled.waste_retention_period,off&#124;duration_secs,off,v1.0.0)

How long leveled would keep journal files after compacting them. `off` keeps no such files. A period would keep them, so the store could be restored to an earlier point in time, at the cost of the disk they occupy.

@[config](db.leveled.max_run_length,default&#124;integer,default,v1.0.0)

How many journal files one compaction run could include. `default` uses leveled's built-in run length of 8.

@[config](db.leveled.singlefile_compaction_percentage,float,30.0,v1.0.0)

Compaction score at or below which a single journal file would be eligible for compaction on its own. Lower values make single-file compactions rarer, favouring longer runs.

@[config](db.leveled.maxrunlength_compaction_percentage,float,70.0,v1.0.0)

Compaction score a full-length run would need to be eligible. Raising it, or lowering `db.leveled.singlefile_compaction_percentage`, makes leveled prefer a long run over a short one.

@[config](db.leveled.journal_compaction_score_one_in,integer,1,v1.0.0)

How often a journal file would be scored. `1` scores every file on every run. A value of `n` scores a given file on roughly one run in `n` and uses a cached score otherwise.

### Compression

@[config](db.leveled.compression_method,lz4&#124;native&#124;zstd&#124;none,lz4,v1.0.0)

Compression algorithm for stored values. `none` disables compression. `native` uses the Erlang term compressor. `lz4` and `zstd` trade CPU for space, `zstd` more aggressively than `lz4`.

@[config](db.leveled.compression_level,integer,1,v1.0.0)

Compression level, used when `db.leveled.compression_method` is `zstd`. Higher values compress harder and cost more CPU.

@[config](db.leveled.compression_point,on_receipt&#124;on_compact,on_receipt,v1.0.0)

When leveled compresses journal records. `on_receipt` compresses each record as it arrives, spending CPU on the write path to keep the journal small. `on_compact` defers compression to journal compaction, which never runs in Bondy. With `on_compact`, journal records therefore stay uncompressed. This key governs the journal only; the ledger uses `db.leveled.ledger_compression`.

@[config](db.leveled.ledger_compression,as_store&#124;native&#124;lz4&#124;zstd&#124;none,as_store,v1.0.0)

Compression for the ledger. `as_store` follows `db.leveled.compression_method`. The other values override it for the ledger alone, for when the ledger and the journal need different trade-offs.

### Snapshots

A snapshot pins the files it was opened against. A snapshot that is never released holds disk space that would otherwise be reclaimed; these timeouts bound that.

@[config](db.leveled.snapshot_timeout_short,duration_secs,15m,v1.0.0)

How long a short-lived snapshot may stay open before leveled releases it.

@[config](db.leveled.snapshot_timeout_long,duration_secs,12h,v1.0.0)

The same bound for snapshots registered as long-running, such as full-store folds.

### Logging and Statistics

@[config](db.leveled.log_level,debug&#124;info&#124;warning&#124;error&#124;critical,info,v1.0.0)

Minimum severity at which leveled logs. It is independent of Bondy's own log level, because leveled is verbose at `debug`.

@[config](db.leveled.stats_percentage,integer,10,v1.0.0)

Percentage of operations leveled samples for its internal timing statistics. Sampling keeps the cost of statistics off the hot path. Raising it gives more precise numbers at more cost.

@[config](db.leveled.stats_log_frequency,duration_secs,30s,v1.0.0)

How often leveled logs its accumulated timing statistics.

## Deprecated and Removed Keys

Every storage-related `bondy.conf` key was renamed or removed when this release replaced the storage engine — see [Upgrading to 1.0.0](/router/guides/deployment/upgrading_to_1_0_0) for the full migration procedure. The old keys are kept here, greyed out, so a key you remember from an earlier release is still findable on this page rather than silently gone.

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

The `leveled` backend that replaced RocksDB has its own tuning keys, `db.leveled.*` (see [Storage Engine (leveled)](#storage-engine-leveled)), which are not one-to-one replacements for `store.*`.

## See also

- [Reclamation Configuration Reference](/router/reference/configuration/reclamation) — how anti-entropy's confirmed roots license space reclamation.
- [Deletion and Reclamation](/router/concepts/deletion_and_reclamation) — the concept behind reclamation.
- [Convergence](/router/concepts/convergence) — what these options converge, and how a lagging replica is detected and repaired.
- [Verifying Cluster Convergence](/router/guides/administration/verifying_cluster_convergence) — checking the result on a running cluster.
- [Clustering](/router/concepts/clustering) — cluster formation and convergence generally.
- [Upgrading to 1.0.0](/router/guides/deployment/upgrading_to_1_0_0) — the full migration procedure from 1.0.0-rc.65.
