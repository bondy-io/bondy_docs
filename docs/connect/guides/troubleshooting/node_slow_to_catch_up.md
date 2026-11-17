---
outline: [2,3]
related:
    - text: Convergence
      type: Concept
      link: /connect/concepts/convergence
      description: What a sync round does, and how a replica that is behind is detected and repaired.
    - text: Data Storage & AAE Configuration Reference
      type: Configuration Reference
      link: /connect/reference/configuration/data_storage
      description: The anti-entropy settings this guide tells you to change.
    - text: Metrics Reference
      type: Reference
      link: /connect/reference/metrics
      description: Every series used here, including the meaning of each sync scheduler event.
    - text: Verifying Cluster Convergence
      type: How-to Guide
      link: /connect/guides/administration/verifying_cluster_convergence
      description: Establish whether the cluster has converged, and whether it is repairing itself or stuck.
---

# How to Diagnose a Node That Is Slow to Catch Up

Find what holds anti-entropy back on a node that takes too long to catch up with its peers after a restart or a network partition, and remove it.

A node that is behind routes from an incomplete view: calls on it fail with `wamp.error.no_such_procedure`, and events published on it miss subscribers on other nodes. This guide is about the *speed* of the repair. To establish whether the cluster is converging at all, start with [Verifying Cluster Convergence](/connect/guides/administration/verifying_cluster_convergence).

**Prerequisites:** Prometheus scrapes every node; see [Monitoring with Prometheus & Grafana](/connect/guides/administration/monitoring). The queries group by `node`, the target label that the bundled Prometheus configuration sets. If your scrape configuration sets no such label, group by `instance`. Replace `<node>` with the node that is behind. For how anti-entropy works, see [Convergence](/connect/concepts/convergence).

## Steps

### 1. Confirm what is behind {#step-1}

Anti-entropy runs per storage instance. Find the instances on the node that have not completed a round with a peer recently:

```text
max by (instance_id, peer) (
  bondy_oplog_peer_last_sync_age_seconds{node="<node>"}
)
```

A pair that has never completed a round since the node started has no series at all. On a node that restarted, read a missing `(instance_id, peer)` pair as "not caught up yet".

Then find the instances that are still copying a snapshot instead of pulling pages:

```text
bondy_oplog_instance_lifecycle_code{node="<node>"} < 2
```

`1` is an instance that holds no data yet and waits for, or runs, a snapshot bootstrap. `2` is a live instance.

The routing view lives in the instances whose `instance_id` starts with `registry-`. To follow only those, add `instance_id=~"registry-.*"` to any query in this guide that carries the label.

### 2. Check that the scheduler runs {#step-2}

```text
bondy_oplog_aae_enabled{node="<node>"}
bondy_oplog_sync_scheduler_enabled{node="<node>"}
rate(bondy_oplog_sync_scheduler_events_total{node="<node>", event="tick"}[5m])
```

Both gauges are `1` on a node that syncs. The tick rate is one per [`db.oplog.aae.interval`](/connect/reference/configuration/data_storage#db.oplog.aae.interval): `2` per second at the default of `500ms`.

- **A gauge is `0`.** Anti-entropy is off by configuration ([`db.oplog.aae`](/connect/reference/configuration/data_storage#db.oplog.aae)), and the node never catches up. Turn it on.
- **The tick rate is well below the expected rate.** The scheduler process is not getting CPU time. The node is saturated; reduce its load before you tune anything else.

### 3. Check whether bootstraps wait for a slot {#step-3}

A node that restarts rebuilds its routing view with bootstraps: snapshot transfers, one for each `registry-` instance. [`db.oplog.aae.bootstrap.max_concurrency`](/connect/reference/configuration/data_storage#db.oplog.aae.bootstrap.max_concurrency) limits how many run at once on the node.

```text
bondy_oplog_sync_scheduler_inflight{node="<node>", kind="bootstrap"}

sum by (event) (
  rate(bondy_oplog_sync_scheduler_events_total{
    node="<node>", event=~"bootstrap_started|bootstrap_capped"
  }[5m])
)
```

- **`inflight` sits at the limit, and the `bootstrap_capped` rate is comparable to or above the `bootstrap_started` rate.** Bootstraps wait for slots. Raise `db.oplog.aae.bootstrap.max_concurrency`. A higher value puts more snapshot work on the peers that serve the bootstraps.
- **`inflight` is below the limit and nothing is capped.** Slots are free. Go to step 4.

Two settings cannot be the cause on a Bondy node. [`db.oplog.aae.max_concurrency`](/connect/reference/configuration/data_storage#db.oplog.aae.max_concurrency) does not limit the live syncs of a Bondy node, and [`db.oplog.aae.load_adaptive`](/connect/reference/configuration/data_storage#db.oplog.aae.load_adaptive) defers none of its sessions. Each option's reference entry states this known limitation.

### 4. Check whether peers refuse bootstraps {#step-4}

A node serves at most [`db.oplog.aae.bootstrap.serve.max_concurrency`](/connect/reference/configuration/data_storage#db.oplog.aae.bootstrap.serve.max_concurrency) bootstraps at once and refuses the next one. The node that asked waits for its retry backoff and asks again.

```text
sum by (peer) (
  rate(bondy_oplog_bootstrap_sessions_total{node="<node>", outcome="busy"}[5m])
)

sum by (node) (rate(bondy_oplog_bootstrap_serve_refused_total[5m]))
```

The first query counts the refusals the node received, by the peer that refused. The second counts the refusals each node gave.

- **Refusals continue while the node is behind.** The peers are at their serving limit. This is expected when several nodes recover at once, and each refused bootstrap starts after a backoff. To shorten the catch-up, raise `db.oplog.aae.bootstrap.serve.max_concurrency` on the nodes that refuse. A higher value lets recovering nodes put more load on a serving node.
- **A peer refuses while no other node recovers.** A bootstrap whose asking node stopped counts against the limit until it expires, 60 seconds after its last request. Wait for that time, then read the rate again.
- **Both rates are `0`.** No peer refuses. Go to step 5.

### 5. Check whether sessions fail {#step-5}

```text
sum by (peer, outcome) (
  rate(bondy_oplog_sync_sessions_total{node="<node>"}[5m])
)

sum by (peer, outcome) (
  rate(bondy_oplog_bootstrap_sessions_total{node="<node>"}[5m])
)
```

- **`error` dominates for one peer.** The node cannot complete a session with that peer. Check that the peer is connected with `bondy_cluster_peer_connected{node="<node>"}`, then read the node's log for the sync warning, which names the reason. A peer the node cannot reach is logged at debug level only.
- **Bootstraps fail and back off.** A non-zero rate of `event="bootstrap_retry_scheduled"` in `bondy_oplog_sync_scheduler_events_total` means that bootstrap sessions fail. `event="bootstrap_backoff_deferred"` counts the ticks an instance then waits before its next attempt.
- **An item is too large to send.** `bondy_oplog_sync_oversized_item_total{kind="page"}` above `0` means a page exceeds the cluster message size, and the instance makes no progress until [`cluster.max_message_size`](/connect/reference/configuration/cluster) is raised. `bondy_oplog_sync_oversized_item_last_bytes` gives the size to exceed. This condition also raises the `bondy_oplog_sync_oversized_items` alarm.
- **`ok` dominates.** Sessions complete. Go to step 6.

### 6. Check how long sessions take {#step-6}

```text
histogram_quantile(0.95,
  sum by (le, outcome) (
    rate(bondy_oplog_sync_duration_microseconds_bucket{node="<node>"}[5m])
  )
)
```

Compare the value with a peer that is not behind. Sessions that run and succeed, and take far longer on this node, are starved of CPU time: they are ordinary processes and compete with routing for the same schedulers. Nothing in the anti-entropy configuration fixes that. Take client traffic off the node until it has caught up, or give the node more capacity.

Then check that the node applies what it pulls:

```text
max by (instance_id) (bondy_oplog_wal_consumer_lag_bytes{node="<node>"})
```

A backlog that grows while sessions succeed means the node receives operations faster than it applies them. The node is saturated, and the same remedy applies.

## Result

Every `(instance_id, peer)` pair from step 1 has a series, and its age stays within a few multiples of [`db.oplog.aae.interval`](/connect/reference/configuration/data_storage#db.oplog.aae.interval). For the routing view, `bondy_registry_rib_stub_cells` on the node is level with its peers. Confirm the whole cluster with step 1 of [Verifying Cluster Convergence](/connect/guides/administration/verifying_cluster_convergence).

If you changed a setting to get there, decide whether to keep it. Higher bootstrap limits make every future catch-up faster, and make a recovering node put more load on its peers while it catches up.

## See also

- [Prometheus Metrics Reference](/connect/reference/metrics#sync-scheduler-events) for the meaning of every `event` value.
- [Load Regulation and Rate Limiting](/connect/guides/administration/load_regulation_and_rate_limiting) for how anti-entropy shares a node with routing.
- [Diagnosing Calls That Find No Callee](/connect/guides/troubleshooting/calls_that_find_no_callee) for the symptom a node that is behind shows to callers.
