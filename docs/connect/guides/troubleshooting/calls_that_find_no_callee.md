---
outline: [2,3]
related:
    - text: Call Routing and Retry Options
      type: Reference
      link: /connect/reference/protocols/wamp_call_options
      description: The exact contract of _retries, _deadline, _idempotent and _routing_max_candidates.
    - text: Registry Routing (RIB)
      type: Concept
      link: /connect/concepts/registry_routing
      description: How a node decides which nodes can serve a procedure, and the two ways its view can be wrong.
    - text: Metrics Reference
      type: Reference
      link: /connect/reference/metrics
      description: Every series used here, with its labels.
    - text: Diagnosing a Node That Is Slow to Catch Up
      type: How-to Guide
      link: /connect/guides/troubleshooting/node_slow_to_catch_up
      description: Find what holds anti-entropy back on a node whose routing view is behind.
---

# How to Diagnose Calls That Find No Callee

Find out why calls on a cluster fail with `wamp.error.no_such_procedure` or `wamp.error.no_eligible_callee` while a callee for the procedure is running, and choose the fix.

**Prerequisites:** Prometheus scrapes every node; see [Monitoring with Prometheus & Grafana](/connect/guides/administration/monitoring). The queries group by `node`, the target label that the bundled Prometheus configuration sets. If your scrape configuration sets no such label, group by `instance`. This guide assumes you know how a node routes a call to another node; see [Registry Routing (RIB)](/connect/concepts/registry_routing).

## Steps

### 1. Find which error, and on which node {#step-1}

The two errors have different causes, so separate them first:

```text
sum by (node, error_uri) (
  rate(bondy_wamp_error_messages_total{
    error_uri=~"wamp.error.no_such_procedure|wamp.error.no_eligible_callee"
  }[5m])
)
```

Read the result against this table, then go to the step it names.

|What you see|What it means|Go to|
|---|---|---|
|`no_such_procedure` on every node|No node knows of a callee. The callee is not registered, is registered in another realm, or the caller uses the wrong URI.|[Step 2](#step-2)|
|`no_such_procedure` on one node, or on a few|Those nodes have not learned of the callee. Their routing view is behind.|[Step 3](#step-3)|
|`no_eligible_callee` on any node|The node knew of callees, and every node it tried had none. Its routing view lists callees that are gone.|[Step 4](#step-4)|

A callee that restarts produces a short burst of either error on its own. Look for a rate that persists.

### 2. Confirm that a callee is registered {#step-2}

Ask the node that the callee is connected to. Call [`wamp.registration.match`](/connect/reference/wamp_api/registration) with the procedure URI, through a session on that node and in the callee's realm. A `null` result means that no registration matches the URI in that realm.

If the callee registers late, for example a service that starts after its callers, callers can wait for it: set [`_retries`](/connect/reference/protocols/wamp_call_options#retries) and [`_deadline`](/connect/reference/protocols/wamp_call_options#deadline) on the call.

### 3. Compare the routing views {#step-3}

Each node routes from the summary cells it holds for the other nodes. Compare how many each node holds:

```text
sum by (node) (bondy_registry_rib_stub_cells{type="registration"})
```

On a healthy cluster with steady registrations, the values are close and flat. A node that reports `no_such_procedure` and holds far fewer cells than its peers is routing from an incomplete view. That is the normal state of a node for a while after it restarts, or after it rejoins from a network partition: it starts from nothing and pulls the cells through anti-entropy.

Watch the value on that node:

- **It climbs.** The node is catching up, and the errors stop when it levels with its peers. If that takes too long for your callers, go to [Diagnosing a Node That Is Slow to Catch Up](/connect/guides/troubleshooting/node_slow_to_catch_up).
- **It is flat and low.** The node is not pulling. Go to the same guide, and start at its first step.
- **It is level with its peers and the errors continue.** The view is not the cause. Return to step 2 and check the realm and the URI.

`bondy_registry_rib_divergences` does not help here. It compares a node's own cells with its own registry, so it stays `0` on a node whose view of its peers is behind.

### 4. Measure misses and failover {#step-4}

A miss is a call that one node forwarded to another, and that the receiving node could not serve. The receiving node counts it:

```text
sum by (node, outcome) (rate(bondy_rpc_rib_completions_total[5m]))
```

The `node` with a `miss` rate is the node that other nodes still believe has callees. Its callees left, and the news has not reached the callers' nodes yet.

Then read what the callers' nodes did about it:

```text
sum by (node, outcome) (rate(bondy_rpc_rib_retries_total[5m]))
```

|`outcome`|Meaning|
|---|---|
|`node`|Bondy routed the call to another node. The caller saw no error.|
|`local`|A registration on the caller's own node took the call. The caller saw no error.|
|`exhausted`|No untried node, no time, or no budget was left. The caller received `wamp.error.no_eligible_callee`.|

A `miss` rate that `node` and `local` absorb is failover working, and it ends when the stale cells are replaced. An `exhausted` rate is the part callers see.

### 5. Apply the fix {#step-5}

|Cause|Fix|
|---|---|
|No callee is registered|Start the callee, or correct the realm or URI. Where callees start after callers, set `_retries` and `_deadline` on the calls.|
|A node's view is behind after a restart or a partition|The node heals when anti-entropy catches up. To shorten that, follow [Diagnosing a Node That Is Slow to Catch Up](/connect/guides/troubleshooting/node_slow_to_catch_up). Until then, have callers set `_retries` and a `_deadline` longer than the catch-up time, or keep client traffic away from the node until its cell count levels with its peers.|
|Calls exhaust their candidates|Raise [`_routing_max_candidates`](/connect/reference/protocols/wamp_call_options#routing-max-candidates) on the calls, up to the number of nodes that host callees of the procedure. Check that the timeout leaves room: the attempts share one call timeout.|

`_retries` and `_routing_max_candidates` solve different problems. `_retries` makes a call wait on a node that knows of no callee. `_routing_max_candidates` moves a call off a node that turned out to have none. Neither makes a node ask its peers for a callee it has not heard of.

## Result

The error rate from step 1 returns to zero, and stays there across several scrapes. For a node that was behind, `bondy_registry_rib_stub_cells` on that node is level with its peers.

## See also

- [Call Routing and Retry Options](/connect/reference/protocols/wamp_call_options) for the contract of each option.
- [Diagnosing Events That Do Not Reach Subscribers on Another Node](/connect/guides/troubleshooting/events_not_reaching_remote_subscribers) for the same routing view applied to events.
- [Verifying Cluster Convergence](/connect/guides/administration/verifying_cluster_convergence) to check every replicated table, not only the registry.
