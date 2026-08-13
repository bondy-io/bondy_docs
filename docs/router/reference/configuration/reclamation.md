# Reclamation Configuration Reference

The configuration surface for projection-cell reclamation and origin
retirement. Reclamation and retirement are **on by default**. Deletion
itself is always available and always converges regardless of these
settings — they only tune *when* the space a deleted or superseded value
occupied is physically reclaimed.

> **Concept:** [Deletion and Reclamation →](/router/concepts/deletion_and_reclamation)

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

Whether the origin-retirement pass runs. When enabled, each node reacts to
an observed membership removal — and reconciles once at boot, covering
removals that happened while it was down — by forgetting departed peers from
its peer state and reaping dead origins from cell states by complement. Each
pass also pulls every member's retirement set and unions it in, and drops
the applied-frontier entry of any origin every member has retired.

The pass is fail-closed: if any current member cannot be queried, nothing is
learned and nothing is reaped, and the pass retries on the next trigger. It
never retires an origin on its own — see
[Retiring a decommissioned node](#retiring-a-decommissioned-node).

@[config](db.origin_retirement.path,file,origin_retirement,v1.0.0)

Where this node stores its retirement set, relative to `platform_data_dir`
unless absolute. A retirement is permanent, so it must survive a restart: a
node that forgot one would re-learn the origin's frontier entry from a peer
and then read its own absence as a deficit, paying a catalogue rebootstrap
for data it already holds. A node that cannot write this file refuses to
retire and refuses to reap — retirement is disabled there and nothing else
is affected.

The file is written **before** the retirement takes effect, so a failed
write retires nothing at all — there is no half-applied state to recover
from, and the operation can simply be retried. A node whose write fails
keeps its already-persisted retirements and stops reaping until a write
succeeds; the next successful write restores both.

Because reaping requires **every** member to hold the retirement, one node
that cannot persist stops the whole cluster from reclaiming. A configured
path that cannot be read or written therefore raises the
`bondy_oplog_retirement_not_persistent` alarm as well as logging at error,
once per episode. An unconfigured path is a deployment choice, announced
once at info and never alarmed.

@[config](db.origin_retirement.interval,duration_time_units,10m,v1.0.0)

Interval between periodic retirement passes, in addition to the
membership-event trigger. The periodic pass covers origin-epoch turnover
that produces no membership event — a node that loses its storage and
rejoins under the same name mints fresh origins without any member joining
or leaving, and only a periodic pass on the surviving nodes reaps the dead
epoch. It is also the cadence at which retirements propagate between nodes.

### Retiring a Decommissioned Node

Removing a node from the cluster membership stops it participating; it does
not release the applied-frontier entries its origins hold on every surviving
replica. Those entries are permanent claims — one per durable shard, so the
cost of a departure scales with `db.main.shard_count` — and only a
retirement releases them.

Retirement is an operator act, never derived from membership, because
membership is reversible: a departed node returns with the disk it left with
and resumes minting under the same origin, and survivors that had reaped it
on absence alone would silently skip its new events.

After removing the node from the membership, on any remaining node:

```erlang
{ok, Retired} = bondy_oplog_origin_retirement:retire_dead().
```

This takes the origins no current member claims and retires them. Each
retirement is banned, persisted, and replicated to the other nodes by the
periodic pass; once every member holds it, each node drops the corresponding
frontier entries on its own next pass.

::: warning Retire only after convergence
Retiring bans the origin cluster-wide, and a ban is permanent. Any of the
departed node's events a replica has not yet applied become permanently
unreachable to it. A reap taken over replicas that disagree on the origin's
sequence logs a warning and emits
`[bondy_oplog, retirement, reaped_unconverged]`, which is the signal that
retirement happened too early.
:::

A partitioned node cannot retire the rest of the cluster: membership changes
only by a deliberate join or leave, so an unreachable peer is still a
member, and a member that cannot answer aborts the pass.

Run it with every instance up. The set of unclaimed origins is built from
what nodes advertise, and a durable instance that is stopped does not
advertise its origin, so a live origin could be caught in it. This node's
own half is checked — while any local instance is down the call refuses with
`{error, {instances_down, Ids}}` — but a *peer* under-advertising cannot be
detected, so the instruction stands as well as the check. The origins
retired are named in a notice log, but retirement cannot be undone.

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
[Instance Memory Management](/router/reference/configuration/data_storage#instance-memory-management).

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
| `[bondy_oplog, retirement, completed]` | Per successful retirement pass | `dead_origins`, `origins_reaped`, `origins_scanned`, `retirements_learned`, `frontiers_reaped` | `forgotten_peers` |
| `[bondy_oplog, retirement, skipped]` | Per pass whose reap-by-complement aborted; replication runs either way | `retirements_learned`, `frontiers_reaped` | `reason` |
| `[bondy_oplog, retirement, reaped_unconverged]` | A frontier entry dropped while members still disagree on the origin's sequence | `count` | `instance_id` |
| `[bondy_oplog, applier, origins_reaped]` | When a reap pass rewrites cells | `cells`, `origins` | `instance_id` |
| `[bondy_oplog, applier, retired_pairs_dropped]` | A page merge carried events authored by a retired origin | `count` | `instance_id` |

`idle` is the benign steady state of a converged quiescent shard — nothing
is stalled, there is simply nothing to certify. It is the only reason that
never produces a warning log; see
[Deletion and Reclamation](/router/concepts/deletion_and_reclamation) for the full
reasoning behind that distinction.

Alongside the telemetry, a scheduler-driven reclamation stall also produces
a warning log naming the instance and the missing members, rate-limited to
one line per instance per 60 seconds.

## See also

- [Deletion and Reclamation](/router/concepts/deletion_and_reclamation) — the model
  these options control.
- [Data Storage & Active Anti-entropy Configuration Reference](/router/reference/configuration/data_storage) — sharding, pack-store durability, the write-ahead log, and anti-entropy sync.
