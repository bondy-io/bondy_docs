# Reclamation Configuration Reference

The configuration surface for projection-cell reclamation and origin
retirement. Reclamation and retirement are **on by default**; deletion
itself is always available and needs no configuration.

> **Concept:** [Deletion and Reclamation →](/concepts/deletion_and_reclamation)

::: warning Not bondy.conf keys
Unlike most of this reference, the options below are **Erlang application
environment** keys under the `bondy_oplog` application, not `bondy.conf`
settings — there is no cuttlefish mapping for them. Set them via an
`advanced.config` file alongside `bondy.conf` in the release's `etc/`
directory (the standard mechanism for options a cuttlefish schema doesn't
cover), e.g.:

```erlang
%% etc/advanced.config
[
  {bondy_oplog, [
    {reclaim_interval_ms, 120000},
    {origin_retirement, true}
  ]}
].
```

Read once at node start; changing a value requires a restart.
:::

## Enabling reclamation

### `reclaim_enabled`

`boolean()`, default `true`.

Whether the reclamation scheduler ticks. When `false` the scheduler process
runs idle: deletes still converge and tombstones are retained indefinitely,
exactly as before the feature existed.

### `reclaim_interval_ms`

`non_neg_integer()`, default `60000`.

Milliseconds between reclamation passes. Deliberately much larger than the
compaction cadence: reclamation is a space concern, not a liveness one, and
each pass re-derives stability from peer state that only changes as
anti-entropy rounds complete. `0` disables periodic passes.

### `reclaim_batch_cells`

`pos_integer()`, default `500`.

Cells scanned per pass batch. The sweep runs inside the applier — the one
process on each node that writes to that node's local projection for a
shard — so this bound caps how long one batch can stall a concurrent apply.
A pass loops batches to completion; writes interleave between batches.

## Origin retirement

### `origin_retirement`

`boolean()`, default `true`.

Whether the origin-retirement pass auto-reacts to cluster membership
changes. When enabled, each node reacts to an observed membership removal —
and reconciles once at boot, covering removals that happened while it was
down — by forgetting departed peers from its peer state and reaping dead
origins from cell states by complement. The pass is fail-closed: if any
current member cannot be queried for the origins it claims, nothing is
reaped and the pass retries on the next trigger. It never bans an origin.

### `origin_retirement_interval_ms`

`non_neg_integer()`, default `600000`.

Milliseconds between periodic retirement passes, in addition to the
membership-event trigger. The periodic pass covers origin-epoch turnover
that produces no membership event — a node that loses its storage and
rejoins under the same name mints fresh origins without any member joining
or leaving, and only a periodic pass on the surviving nodes reaps the dead
epoch.

## Shared scheduler machinery

The reclamation scheduler is an instance of the same scheduler that drives
compaction. One option is shared between them; the compaction-only options
are listed here only to state that they do **not** govern reclamation.

### `gc_max_concurrency`

`pos_integer()`, default `4`.

Cap on concurrently running trigger workers, per scheduler instance. Applies
to both the compaction scheduler and the reclamation scheduler.

### `peer_timeout_ms`

`non_neg_integer()`, default `30000`.

This recency filter applies to **compaction**'s reading of peer state only.
Reclamation uses a strict, membership-based reading with no recency
filter — a silent member holds reclamation down until retired by a
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
