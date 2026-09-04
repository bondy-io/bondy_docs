---
outline: [2,3]
related:
    - text: Convergence
      type: Concept
      link: /router/concepts/convergence
      description: What the frontier is, and what the repair counters mean.
    - text: Metrics Reference
      type: Reference
      link: /router/reference/metrics
      description: Every series used here, with its labels.
    - text: Monitoring with Prometheus & Grafana
      type: How-to Guide
      link: /router/guides/administration/monitoring
      description: Getting the bundled stack running against your cluster.
    - text: Data Storage & AAE Configuration Reference
      type: Configuration Reference
      link: /router/reference/configuration/data_storage
      description: The anti-entropy tunables referenced below.
---

# Verifying Cluster Convergence

Establish whether a cluster's replicated state has converged, and — when it has
not — whether it is repairing itself or stuck. Use this after a node restart, a
partition, a rolling upgrade, or any time a write made on one node is not
visible on another.

This guide assumes Prometheus is scraping every node. See [Monitoring with
Prometheus & Grafana](/router/guides/administration/monitoring) if it is not.
For what the signals mean, see [Convergence](/router/concepts/convergence).

## 1. Ask whether it has converged

An instance is converged when every node reports the same applied-frontier hash.
Count the distinct values:

```
count by (instance_id) (
  count_values by (instance_id) ("hash", bondy_oplog_instance_frontier_hash)
)
```

`1` for every instance is convergence. Anything above `1` names an instance
whose nodes disagree.

The check costs nothing at scrape time — the hash is computed locally on each
node and compared in PromQL, so no node contacts another to answer it.

::: warning Compare at rest
Under active writes the hash legitimately differs between nodes at any instant.
Run this against a quiet cluster, or treat a *persistently* stable disagreement
— the same instance above `1` across several scrapes — as the signal.
:::

To alert on it:

```
count by (instance_id) (
  count_values by (instance_id) ("hash", bondy_oplog_instance_frontier_hash)
) > 1
```

with a `for:` at least a few multiples of `db.aae.interval`, so ordinary
replication lag does not fire it.

## 2. Find which node is behind

The hash says *that* nodes disagree, not which is behind. The frontier's summed
sequence number does — it is monotone, so the lower value is the laggard:

```
sum by (node) (
  bondy_oplog_instance_frontier_seq_total{instance_id="<the disagreeing instance>"}
)
```

Then check how recently that node last completed a round with each peer:

```
max by (node, peer) (
  bondy_oplog_peer_last_sync_age_seconds{instance_id="<the disagreeing instance>"}
)
```

An age growing without bound means rounds are not completing at all — the peer
is unreachable, or the scheduler is not dispatching. Check
`bondy_oplog_sync_scheduler_enabled` and `bondy_oplog_aae_enabled` are `1` on
both nodes before looking further; anti-entropy can be turned off by
configuration (`db.aae`), and a node with it off will never converge.

## 3. Decide whether it is repairing itself

A cluster that is behind but repairing looks different from one that is stuck.
Three counters separate them.

**Is a gap being detected?**

```
sum by (instance_id, peer) (rate(bondy_oplog_frontier_gap_verdicts_total[5m]))
```

Isolated verdicts are expected under write load and heal on the next round. A
rate that stays non-zero for the same `(instance_id, peer)` means the gap is
standing.

**Has the remedy fired?**

```
sum by (instance_id, peer) (increase(bondy_oplog_rebootstraps_scheduled_total[1h]))
```

A re-bootstrap streams the peer's whole projection. One after a node returns
from a long absence is the mechanism working. A count that keeps climbing for
the same pair means each re-bootstrap is failing to fix the cause, and that is
the point to escalate.

**Is the applier keeping up?**

```
sum by (instance_id) (rate(bondy_oplog_compaction_holds_total[5m]))
```

Sustained growth means compaction is repeatedly capping its truncation because
the projection has not folded delivered operations yet. Convergence is not at
risk — the cap exists to protect it — but disk will grow. Confirm against the
drain backlog:

```
max by (instance_id) (bondy_oplog_wal_consumer_lag_bytes)
```

A growing backlog alongside the holds points at a starved or wedged applier
rather than at replication.

## 4. Check for page loss

The counters above describe a cluster that is merely behind. Two others describe
one that has lost pages, and neither should ever be non-zero in normal
operation:

```
sum by (instance_id, classification) (increase(bondy_mst_gc_aborted_total[24h]))
sum by (instance_id, reason) (increase(bondy_oplog_mst_rebuilt_total[24h]))
```

`bondy_mst_gc_aborted_total` means a sweep found the current root unservable and
declined to run. The `classification` label says which layer lost the page —
`transient` is benign (readable on re-probe), `deleted` and `tombstoned` are
not.

`bondy_oplog_mst_rebuilt_total` means a node dropped its own tree and started
over. It is a self-heal and it is safe, but any occurrence is worth
investigating: the question is why pages went missing, not whether the heal
worked.

Per-hash evidence for aborts is retained in the node and outlives the log:

```bash
bin/bondy eval 'bondy_oplog_instance:gc_aborts().'
```

Pass an instance id to narrow it — `bondy_oplog_instance:gc_aborts(<<"registry-4">>)`.
An instance id is the `-`-separated form shown in the `instance_id` label on
every metric above.

## 5. Confirm the recovery

After a remedy has run, return to step 1. Convergence is reached when the
distinct-hash count is back to `1` for every instance and stays there across
several scrapes.

If it does not return to `1`, the useful next question is whether the two nodes
are exchanging rounds at all (step 2) or exchanging them and still disagreeing
(step 3). Those have different causes: the first is connectivity or scheduling,
the second is a standing gap the remedy has not resolved.

## Expected timings

Do not read "not converged yet" as "broken" too early. The path back has three
stages, and each costs more than the one before it:

| Situation | What has to happen | Roughly bounded by |
|---|---|---|
| Ordinary lag | One sync round for that instance | `db.aae.interval`, times how many ticks the instance waits for a slot under `db.aae.max_concurrency`, + transfer |
| Standing gap | Two complete rounds to strike twice, then the remedy | Two rounds + settle |
| Re-bootstrap | Full projection transfer for the instance | Size of the instance |

A node that returned from a partition and is still missing data seconds later is
normally inside the detection window, not faulty. Alert on the *persistence* of
disagreement, not on its presence.

## See also

- [Convergence](/router/concepts/convergence) — why each counter exists.
- [Per-Origin Prefix Closure](/router/concepts/prefix_closure) — the related
  `bondy_oplog_events_held_total` and `bondy_oplog_prefix_holes_total` signals.
- [Alarm Catalogue](/router/reference/alarms) — the conditions that raise an
  alarm rather than only moving a counter.
