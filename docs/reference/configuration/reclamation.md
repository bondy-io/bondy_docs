# Reclamation Configuration Reference

The configuration surface for projection-cell reclamation and origin
retirement. Reclamation and retirement are **on by default**. Deletion
itself is always available and always converges regardless of these
settings — they only tune *when* the space a deleted or superseded value
occupied is physically reclaimed.

> **Concept:** [Deletion and Reclamation →](/concepts/deletion_and_reclamation)

## Enabling Reclamation

@[config](db.reclaim,on|off,on,v1.0.0)

Whether the reclamation scheduler ticks. Deletion (`bondy_db:delete/3`)
always converges and is unaffected by this setting: turning reclamation off
only stops the underlying tombstone from being *physically* reclaimed once
every node has certified it causally stable. With it off,
tombstones are retained indefinitely, exactly as if reclamation did not
exist.

@[config](db.reclaim.interval,duration_time_units,1m,v1.0.0)

Interval between reclamation passes. Deliberately much larger than the
compaction cadence: reclamation is a space concern, not a liveness one, and
each pass re-derives stability from peer state that only changes as
anti-entropy rounds complete. `0` disables periodic passes — an operator can
still trigger one explicitly.

@[config](db.reclaim.batch_cells,integer,500,v1.0.0)

Cells scanned per pass batch. The sweep runs inside the applier — the one
process on each node that writes to that node's local projection for a
shard — so this bound caps how long one batch can stall a concurrent apply.
A pass loops batches to completion; writes interleave between batches.

## Origin Retirement

@[config](db.origin_retirement,on|off,on,v1.0.0)

Whether the origin-retirement pass auto-reacts to cluster membership
changes. When enabled, each node reacts to an observed membership removal —
and reconciles once at boot, covering removals that happened while it was
down — by forgetting departed peers from its peer state and reaping dead
origins from cell states by complement. The pass is fail-closed: if any
current member cannot be queried for the origins it claims, nothing is
reaped and the pass retries on the next trigger. It never bans an origin.

@[config](db.origin_retirement.interval,duration_time_units,10m,v1.0.0)

Interval between periodic retirement passes, in addition to the
membership-event trigger. The periodic pass covers origin-epoch turnover
that produces no membership event — a node that loses its storage and
rejoins under the same name mints fresh origins without any member joining
or leaving, and only a periodic pass on the surviving nodes reaps the dead
epoch.

## Shared Scheduler Machinery

The reclamation scheduler is an instance of the same scheduler that drives
compaction. One option is shared between them; the other governs compaction
only and is listed here just to state that it does **not** affect
reclamation.

@[config](db.gc_max_concurrency,integer,4,v1.0.0)

Cap on concurrently running trigger workers, per scheduler instance —
shared between the compaction scheduler and the reclamation scheduler. This
is a distinct subsystem from `db.gc_interval`/`db.gc_heap_delta`, the
per-instance BEAM heap monitor that happens to share the "gc" name; see
[Instance Memory Management](/reference/configuration/data_storage#instance-memory-management).

@[config](db.compaction.peer_timeout,duration_time_units,30s,v1.0.0)

This recency filter applies to **compaction**'s reading of peer state only.
Reclamation (`db.reclaim`) uses a strict, membership-based reading with no
recency filter — a silent member holds reclamation down until retired by a
membership act, and no timeout changes that.

## Telemetry

Reclamation fails silently in both directions, so its observability surface
is part of the contract.

| Event | Emitted | Measurements | Metadata |
|---|---|---|---|
| `[bondy_oplog, applier, cells_swept]` | Per sweep batch | `scanned`, `discarded`, `reduction_skipped`, `skipped` | `instance_id`, `stable_hlc` |
| `[bondy_oplog, reclamation, stalled]` | Every attempt that reclaims nothing | `count` | `instance_id`, `reason` (`idle`, `unconfirmed`, `membership_unavailable`, `no_frontier`, `non_event_frontier`, `no_applier`), `missing_members` |
| `[bondy_oplog, scheduler, gc, trigger_outcome]` | Per trigger run, every scheduler instance | `count` | `scheduler`, `instance_id`, `outcome` |
| `[bondy_oplog, retirement, completed]` | Per successful retirement pass | `dead_origins`, `origins_reaped` | `forgotten_peers` |
| `[bondy_oplog, retirement, skipped]` | Per aborted retirement pass | — | `reason` |
| `[bondy_oplog, applier, origins_reaped]` | When a reap pass rewrites cells | `cells`, `origins` | `instance_id` |

`idle` is the benign steady state of a converged quiescent shard — nothing
is stalled, there is simply nothing to certify. It is the only reason that
never produces a warning log; see
[Deletion and Reclamation](/concepts/deletion_and_reclamation) for the full
reasoning behind that distinction.

Alongside the telemetry, a scheduler-driven reclamation stall also produces
a warning log naming the instance and the missing members, rate-limited to
one line per instance per 60 seconds.

## See also

- [Deletion and Reclamation](/concepts/deletion_and_reclamation) — the model
  these options control.
- [Data Storage & Active Anti-entropy Configuration Reference](/reference/configuration/data_storage) — sharding, pack-store durability, the write-ahead log, and anti-entropy sync.
