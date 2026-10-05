---
outline: [2,3]
related:
    - text: Startup and Shutdown Configuration Reference
      type: Configuration Reference
      link: /router/reference/configuration/startup_shutdown
      description: The shutdown sequence and the grace period that governs it.
    - text: Data Storage & AAE Configuration Reference
      type: Configuration Reference
      link: /router/reference/configuration/data_storage
      description: The write-ahead log, journal trim and storage engine options.
    - text: Convergence
      type: Concept
      link: /router/concepts/convergence
      description: How a replica that restarted catches up with its peers.
    - text: Alarms
      type: Concept
      link: /router/concepts/alarms
      description: Conditions that are true now, and which of them take a node out of service.
---

# Node Lifecycle and Durability

A Bondy node opens its storage before it accepts a client, and it keeps every write in a write-ahead log until the state derived from that write is on disk. These two rules explain the boot order, the meaning of "ready", the shutdown sequence, and why an acknowledged write survives a crash.

## The problem

A node has two audiences with different needs. An orchestrator such as Kubernetes needs a node that answers its probes at once and continuously, or it kills the node and starts it again. Clients need a node that routes correctly, which it cannot do before its stores are open and its realms are configured.

Opening a large store can take minutes. A node that answered nothing for that long would be killed during its own recovery, restart, open the same store, and be killed again. A node that accepted clients before its stores opened would serve requests it cannot honour.

Storage has the same tension in a different form. A write must be safe the moment it is acknowledged, but making every derived structure durable before each acknowledgement would bound throughput to the slowest of them. Bondy makes one structure durable at acknowledgement, the write-ahead log, and derives everything else from it.

## Boot

A node starts in a fixed order. Each step depends on the steps before it.

1. **Configuration.** The node reads its configuration and applies it to the applications it starts next.
2. **Early listeners.** Listeners with `start_phase = early` bind before anything else. Until the node's services are up they serve only the liveness probe (`/ping`) and the readiness probe (`/ready`). `/ready` answers `503` throughout boot. Every other route on an early listener, `/metrics` among them, answers `404` until the services behind it start. This is what keeps an orchestrator from killing a node that is still opening its stores. See [`listeners.$name.start_phase`](/router/reference/configuration/listeners).
3. **Partisan.** The cluster transport starts.
4. **The peer-plane gate.** If peer discovery is on (`cluster.peer_discovery.enabled`) and the peer plane is not TLS with `verify_peer` on both the server and the client side, the node refuses to start. Setting `cluster.tls.allow_insecure` turns the refusal into a logged warning. The gate runs before storage opens and before any listener for clients binds, so an insecure clustered node never holds or replicates state. Nodes without peer discovery are not gated. See [Cluster Configuration Reference](/router/reference/configuration/cluster#cluster.tls.allow_insecure).
5. **Anti-entropy wiring.** When oplog anti-entropy is enabled, the node points its sync scheduler at Partisan's membership and transport. This happens before storage opens because the scheduler reads those settings once, when it starts.
6. **Storage.** `bondy_db` opens. Each durable shard recovers its write-ahead log and resumes from it (see [Recovery](#recovery)).
7. **Services.** The node configures the master realm and the realms in its configuration, initialises the registry indices, gives the early listeners their full route set, and starts the MCP gateway.
8. **Normal listeners.** Client-facing listeners bind, and the node marks itself `ready`. The HTTP connector, mail and broker bridge applications start after this point.

### Degraded boot

If the durable `main` store fails to open, the node does not stop. It raises the [`bondy_db_main_unavailable`](/router/reference/alarms#bondy-db-main-unavailable) alarm, skips realm configuration and the registry index rebuild, mounts the early listeners' routes, and starts no client listener. The node stays up so an operator can inspect it, and it reports not ready until the store is repaired and the node restarted.

Stopping the application instead would remove the diagnostic surface the operator needs, and an orchestrator would restart it into the same failure.

## What "ready" means

`/ready` and the `bondy_node_ready` metric answer from one function, so a load balancer and a dashboard cannot disagree about the same node. A node is ready when all of these hold:

- Boot reached the normal listeners and marked the node `ready`.
- The durable `main` store is open.
- Every storage shard the node keeps is running.
- No active alarm declares `affects_ready`.

The second and third conditions are read from the storage layer's own status, not from the alarms that mirror it. An alarm handler that crashes restarts with an empty alarm set; the storage status survives it. See [Alarms](/router/concepts/alarms#readiness-is-a-separate-declaration) for why readiness is a per-alarm declaration rather than a severity threshold.

"Ready" means that boot finished. It does not mean that no client has connected yet. Normal listeners accept connections as soon as they bind, and the node marks itself ready just after. The two phases order the listeners against each other; they do not keep clients out.

## Durability

### The log owns durability

Each shard of a `bondy_db` table has its own write-ahead log. A write is a signed event appended to that log. Everything else the shard holds, the projection that clients read and the Merkle Search Tree that anti-entropy compares, is derived from the log by the shard's **applier**, which reads the log in order and installs each event.

The log is the source of truth. After a crash, any frame that survives log recovery is durable, and anything after the last valid frame is discarded. The derived structures can always be brought back to the log's state by reading it again, so they need not be on disk when a write is acknowledged.

### When a write is acknowledged

[`db.wal.fsync_mode`](/router/reference/configuration/data_storage#db.wal.fsync_mode) decides when an appended event is on disk.

- `per_write`, the default, fsyncs before the append returns. Concurrent appends share one fsync, so throughput scales with concurrency up to the device's fsync rate.
- `batched` returns before the fsync and fsyncs at a time or size boundary ([`db.wal.batched_fsync_interval`](/router/reference/configuration/data_storage#db.wal.batched_fsync_interval), [`db.wal.batched_fsync_bytes`](/router/reference/configuration/data_storage#db.wal.batched_fsync_bytes)). A crash can lose the events appended inside that window.

A write through `bondy_db` returns once its event is in the log and the applier has installed it in the projection, so the writer reads its own write on the next read. A write the applier refuses stays in the log but never reaches the projection, and the caller is told so.

A failed write or fsync stops the log's writer, and every caller whose event was not yet durable receives the error. The writer does not retry: a retried fsync can report success for pages the kernel already discarded. Recovery on restart truncates the log at its last valid frame, so no acknowledged event sits behind a torn one.

### Projections may lag the disk

Durable projections are [leveled](/router/reference/configuration/data_storage#storage-engine-leveled) stores opened in `head_only` mode. Under the default [`db.leveled.sync_strategy = none`](/router/reference/configuration/data_storage#db.leveled.sync_strategy), leveled acknowledges a projection write when it reaches the operating system's page cache, not the disk.

This is safe because the log keeps the event until the projection is known to be durable. Two rules enforce it:

- The applier records how far it has read (`consumer.offset`) only at a commit boundary, after the instance confirms that every installed event is in a durable tree root. If that confirmation fails, the offset stays where it was (`bondy_oplog_commit_barrier_test`).
- Before the shard truncates history or writes a checkpoint that claims events have been applied, it fsyncs the projection. A claim is read before the sync, so it cannot name a write the sync did not cover (`bondy_oplog_projection_sync_test`).

The log's retention sweep deletes a segment only when it lies below both the applier's committed segment and the compaction snapshot watermark. A segment the projection may still need is never removed.

Ephemeral tables, such as the registry, use in-memory projections. Their state is meant to vanish with the node, because the sessions that created it vanish too, and it reconverges from peers. Their log lives under a path tied to the operating-system process, so a new node never replays a previous run's ephemeral history.

### Small files are replaced atomically

The log's manifest, its sparse indices, the consumer offset, the snapshot watermark and the compaction checkpoint are each written in four steps: write a temporary file, fsync it, rename it over the target, and fsync the directory. A reader sees the old file or the new one, never a mix. Without the directory fsync, a power loss could keep the rename's effect on one file and lose another file's new name. The failure and crash interleavings are exercised by `bondy_log_io_test`.

### Recovery

When a shard opens an existing log, it:

1. Reads the manifest and refuses to open on an identity or schema mismatch.
2. Removes temporary files and segment files the manifest no longer lists.
3. Checks the identity in each sealed segment's header, refusing on a mismatch such as a segment copied from another shard, and rebuilds any missing or unreadable sparse index.
4. Scans the head segment frame by frame and truncates it at the first invalid frame.
5. Clamps the consumer offset to a real frame boundary in a live segment.

The applier then resumes. A durable shard resumes from its consumer offset and re-applies the events between that offset and the end of the log. The tree insert is idempotent, so the overlap costs nothing there. An ephemeral shard replays from the beginning to rebuild what it lost.

Events re-applied after a crash are published to subscribers again. Delivery to subscribers is at least once, and subscribers must tolerate duplicates.

### The scrubber

Recovery checks the head segment, which the writer is still appending to. Sealed segments are checked by the **scrubber**, which reads each sealed segment and verifies every frame's checksum. It reports the first bad frame in a segment and records an alert in the manifest. It does not repair anything: a damaged segment is re-derived from peers or from a snapshot. The scrubber is off unless its interval is set.

### The journal trim

In `head_only` mode leveled writes every projection write twice: the cell into its ledger, and the same data into a journal that exists only to recover the ledger after an unclean stop. Leveled never reclaims that journal in this mode, so without help it would hold every version of every cell ever written.

Bondy trims each journal on a timer, [`db.journal_trim_interval`](/router/reference/configuration/data_storage#db.journal_trim_interval). A trim drops only the journal files older than the one holding the ledger's highest persisted sequence number, which is history a clean restart would not replay. After each trim Bondy fsyncs the ledger's directories, because leveled does not fsync a directory after renaming a ledger file into it. That fsync is intended to finish before leveled deletes the dropped journal files, which it does after a poll of about ten seconds; nothing else orders the two.

Two windows remain inside leveled itself: a ledger merge can delete replaced files before the new names reach disk, and closing a store deletes its pending journal files at once.

## Shutdown

A node shuts down in an order that lets clients leave cleanly while the orchestrator still sees a live node.

1. The node marks itself shutting down, so `/ready` answers `503` from here on, and stops accepting connections on its normal listeners. Existing connections continue. The early listeners keep answering `/ping`, `/ready` and `/metrics`, so an orchestrator does not read the draining node as dead and kill it.
2. It sends `GOODBYE` to every client session.
3. It waits for [`shutdown.grace_period`](/router/reference/configuration/startup_shutdown). The wait is a fixed sleep: the node waits the full period even when every client has already left.
4. It leaves the cluster if [`cluster.automatic_leave`](/router/reference/configuration/cluster#cluster.automatic_leave) is on.
5. It stops the normal listeners, which closes every remaining connection. When a connection ends, the node removes its session together with the session's registrations and subscriptions.
6. Last, it stops the early listeners.

Because the grace period is a fixed sleep, a process supervisor must allow longer than it before killing the node.

A shutdown does not need to flush storage to be safe. Every acknowledged write is already in the log, and the next boot recovers from it as it would after a crash.

## Alternatives and trade-offs

**Open storage before any listener.** This is the simplest order, and it fails on large stores: the orchestrator sees no liveness answer and kills the node mid-recovery. The early phase exists to break that loop.

**Fsync every projection write.** This would make the projection itself durable at acknowledgement, at the cost of an fsync on a second store for every write. Keeping the log as the only structure fsynced on the write path, and syncing the projection only before history is discarded, moves that cost off the write path. The price is that the log must retain events until the projection is synced, which the retention rules above guarantee.

**Batched log fsync.** `batched` raises write throughput by about two orders of magnitude and accepts a bounded window of loss on crash. `per_write` is the default, and the setting applies to every durable shard on the node, security state such as grants, tickets and users included.

## See also

- [Startup and Shutdown Configuration Reference](/router/reference/configuration/startup_shutdown): the grace period and the shutdown steps.
- [Data Storage & AAE Configuration Reference](/router/reference/configuration/data_storage): the log, journal trim and storage engine options.
- [Listeners Configuration Reference](/router/reference/configuration/listeners): listener phases.
- [Prometheus Metrics Reference](/router/reference/metrics): `bondy_node_ready` and the storage metrics.
- [Alarm Catalogue](/router/reference/alarms): `bondy_db_main_unavailable` and `bondy_oplog_instance_down`.
- [Architecture](/router/concepts/architecture): where storage sits in a node.
- [Convergence](/router/concepts/convergence): how a restarted replica catches up with its peers.
- [Per-Origin Prefix Closure](/router/concepts/prefix_closure): the ordering property replication preserves.
