---
outline: [2,3]
related:
    - text: Registry Routing (RIB)
      type: Concept
      link: /connect/concepts/registry_routing
      description: How a node finds the nodes that hold subscribers, and what happens when that view is behind.
    - text: Metrics Reference
      type: Reference
      link: /connect/reference/metrics
      description: Every series used here, with its labels.
    - text: Overload Protection Configuration Reference
      type: Configuration Reference
      link: /connect/reference/configuration/overload_protection
      description: The capacity settings behind a shed event.
    - text: Diagnosing a Node That Is Slow to Catch Up
      type: How-to Guide
      link: /connect/guides/troubleshooting/node_slow_to_catch_up
      description: Find what holds anti-entropy back on a node whose routing view is behind.
---

# How to Diagnose Events That Do Not Reach Subscribers on Another Node

Find out why an event published on one node of a cluster does not reach a subscriber connected to another node, when subscribers on the publisher's own node receive it.

A lost event raises no error. The publisher's `PUBLISH` succeeds, so the metrics are the only place the loss shows. This guide finds the hop where the event stops.

**Prerequisites:** Prometheus scrapes every node; see [Monitoring with Prometheus & Grafana](/connect/guides/administration/monitoring). The queries group by `node`, the target label that the bundled Prometheus configuration sets. If your scrape configuration sets no such label, group by `instance`. Replace `<publisher-node>` and `<subscriber-node>` with the nodes the two sessions are connected to. For how a node relays an event, see [Registry Routing (RIB)](/connect/concepts/registry_routing).

## Steps

### 1. Rule out the subscription and the publication {#step-1}

Confirm that the subscriber holds a subscription that matches the topic. Call [`wamp.subscription.match`](/connect/reference/wamp_api/subscription) with the topic URI, through a session on the subscriber's node and in the subscriber's realm. A `null` result means that no subscription matches.

Then check the options of the `PUBLISH`. `exclude`, `eligible` and their `authid` and `authrole` forms remove subscribers by design. An empty `eligible` list delivers the event to no subscriber.

### 2. Check the publisher node's view of subscribers {#step-2}

The publisher's node relays an event only to the nodes that it knows hold a matching subscription. Compare how many subscription cells each node holds for the others:

```text
sum by (node) (bondy_registry_rib_stub_cells{type="subscription"})
```

On a healthy cluster with steady subscriptions, the values are close and flat.

- **The publisher's node holds far fewer cells than its peers.** Its view is behind, so it does not relay to nodes it has not learned about. This is the normal state of a node for a while after it restarts or rejoins from a network partition. The events published on it in that time are not delivered later. Follow [Diagnosing a Node That Is Slow to Catch Up](/connect/guides/troubleshooting/node_slow_to_catch_up), and keep publishers away from the node until its count levels with its peers.
- **The counts are level.** The publisher's node knows the subscriber's node. Go to step 3.

### 3. Check whether the subscriber's node shed the event {#step-3}

A relayed event arrives on the subscriber's node in an ordered lane with a bounded capacity. When the lane is full, the node drops the event and counts it:

```text
sum by (node, reason, family) (rate(bondy_wamp_dropped_total[5m]))
```

|`reason`|Meaning|
|---|---|
|`shed` with `family="relay"`|The node dropped messages that arrived from a peer node, because the flow worker's share of [`load_regulation.router.flow_pool.capacity`](/connect/reference/configuration/overload_protection#load_regulation.router.flow_pool.capacity) was in use. The subscribers on this node are slower than the publishers that feed them.|
|`payload_size_exceeded`|An `EVENT` was longer than the message length a RawSocket subscriber announced. Only that subscriber missed it. See [RawSocket message length](/connect/reference/protocols/wamp#rawsocket-message-length).|

A `shed` rate on the subscriber's node is the loss. Go to step 4 to find what makes the lane slow.

### 4. Find the slow hop on the subscriber's node {#step-4}

Three histograms cover the path of a relayed event on the receiving node:

```text
histogram_quantile(0.95, sum by (le) (
  rate(bondy_router_flow_queue_depth_bucket{node="<subscriber-node>", family="relay"}[5m])))

histogram_quantile(0.95, sum by (le) (
  rate(bondy_router_flow_service_microseconds_bucket{node="<subscriber-node>", family="relay"}[5m])))

histogram_quantile(0.95, sum by (le, transport) (
  rate(bondy_wamp_egress_queue_depth_bucket{node="<subscriber-node>"}[5m])))
```

|What you see|What it means|
|---|---|
|Flow queue depth grows, service time is flat|More relayed traffic arrives than the flow workers can run in order. Give the node more capacity, or spread the publishers that target one subscriber session.|
|Flow service time grows|Each relayed message takes longer to authorize, match and fan out. Look at `bondy_broker_publish_match_microseconds` for a match that grew with the number of pattern subscriptions.|
|Egress queue depth grows for one `transport`|The subscribers' connections do not drain. The clients, or the network to them, are slower than the events arrive.|

Depth multiplied by service time estimates the wait of each message in a queue.

### 5. Apply the fix {#step-5}

|Cause|Fix|
|---|---|
|No matching subscription, or the `PUBLISH` options exclude the subscriber|Correct the client.|
|The publisher node's view is behind|The node heals when anti-entropy catches up; see [Diagnosing a Node That Is Slow to Catch Up](/connect/guides/troubleshooting/node_slow_to_catch_up). Keep publishers off the node until then. A publisher cannot detect or retry this loss.|
|The subscriber's node sheds relayed events|Remove the slow hop found in step 4. Raising `load_regulation.router.flow_pool.capacity` delays the drops and holds more memory; it does not make a slow consumer faster.|
|An `EVENT` exceeds a subscriber's message length|Have the subscriber announce a larger length in the RawSocket handshake, or publish smaller payloads.|

## Result

`bondy_wamp_dropped_total` stops growing on the subscriber's node, and `bondy_registry_rib_stub_cells{type="subscription"}` is level across the nodes. A test event published on the publisher's node reaches the subscriber.

## See also

- [Prometheus Metrics Reference](/connect/reference/metrics#event-delivery-path) for every histogram on the delivery path.
- [WAMP Compliance](/connect/reference/protocols/wamp#nc1) for the ordering Bondy guarantees between nodes.
- [Diagnosing Calls That Find No Callee](/connect/guides/troubleshooting/calls_that_find_no_callee) for the same routing view applied to calls.
