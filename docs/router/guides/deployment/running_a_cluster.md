---
related:
    - text: Clustering
      type: Concept
      link: /router/concepts/clustering
      description: Masterless clustering, peer discovery, and state replication.
    - text: Cluster Configuration Reference
      type: Reference
      link: /router/reference/configuration/cluster
      description: Every cluster.* and cluster.peer_discovery.* key.
    - text: Cluster
      type: WAMP API Reference
      link: /router/reference/wamp_api/cluster
      description: Observe cluster membership and connectivity via WAMP.
    - text: How to Monitor a Bondy Cluster with Prometheus and Grafana
      type: Guide
      link: /router/guides/administration/monitoring
      description: Watch cluster topology and health once nodes are joined.
---
# Running a Cluster

Bondy forms a cluster through Partisan's automatic peer discovery, configured entirely in `bondy.conf` — there is no join command to run. This guide configures DNS-based discovery, the recommended strategy for cloud and on-premise deployments alike, and points out the static-list alternative for small, fixed clusters.

**Prerequisites:** two or more hosts able to reach each other on the cluster peer port (`cluster.peer_port`, default `18086`); a DNS name that resolves to the IP address of every node in the cluster (for DNS-based discovery), or the fixed list of node addresses (for the static alternative).

::: warning Secure the peer plane first
Bondy refuses to start a node with automatic peer discovery enabled unless its Partisan peer plane is secured with TLS, or the risk is explicitly acknowledged — an insecure peer plane lets an on-path attacker read or modify replicated credentials and realm signing keys. Read [Cluster Configuration Reference](/router/reference/configuration/cluster) for `cluster.tls.*` before continuing, and decide now whether you're enabling TLS or acknowledging the risk with `cluster.tls.allow_insecure = on`.
:::

::: tip Just want to try this locally?
For a local, single-host dev cluster with no DNS setup at all, use the `make node1` / `make node2` / `make node3` targets described in [How to Monitor a Bondy Cluster](/router/guides/administration/monitoring#steps) — they start three pre-configured nodes that discover each other automatically. The rest of this guide is for a real, multi-host deployment.
:::

## Steps

### 1. Enable peer discovery on every node

In each node's `bondy.conf`:

```text
cluster.peer_discovery.enabled = on
cluster.peer_discovery.automatic_join = on
cluster.peer_discovery.type = dns
```

`enabled` turns discovery on; `automatic_join` — off by default — must also be set for Bondy to actually join a discovered peer rather than only reporting it as found.

### 2. Configure the DNS discovery strategy

Point Bondy at a DNS name that resolves to every peer's address — a headless Kubernetes Service, a cloud provider's internal DNS, or your own zone:

```text
cluster.peer_discovery.config.record_type = a
cluster.peer_discovery.config.query = bondy-cluster.internal
cluster.peer_discovery.config.node_basename = bondy
```

- `record_type` — the DNS record type to query: `a`/`aaaa` for a name that resolves directly to peer IPs (the common case, including a Kubernetes headless Service), or `srv`/`fqdns` where your DNS setup provides them.
- `query` — the DNS name to look up.
- `node_basename` — the Erlang node basename every peer uses (the part before `@` in its nodename), so a resolved IP can be turned into a full `nodename@ip` to connect to.

::: tip Verifying your DNS setup independently of Bondy
If nodes aren't finding each other, confirm the query itself resolves as expected before suspecting Bondy — e.g. `dig A bondy-cluster.internal` (for an `a`/`aaaa` query) or `dig SRV bondy-cluster.internal` (for `srv`), from one of the hosts that will run Bondy.
:::

### 3. Start each node

Start Bondy on every host. Each node polls DNS (`cluster.peer_discovery.polling_interval`, default `10s`, after an initial `cluster.peer_discovery.initial_delay` of `10s`) and joins any newly discovered peer automatically.

### 4. Verify

From any node, call [`bondy.cluster.members`](/router/reference/wamp_api/cluster#retrieve-cluster-members) — it should list every node in the cluster:

```bash
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
call bondy.cluster.members | jq
```

For live connectivity rather than expected membership, use [`bondy.cluster.info`](/router/reference/wamp_api/cluster#retrieve-cluster-info) instead — its `nodes` field lists only nodes this node currently has a connection to. Once the cluster is up, [How to Monitor a Bondy Cluster](/router/guides/administration/monitoring) gives you a standing view of topology and per-node health.

## Using a static list instead

For a small, fixed cluster where every node's address is already known and won't change, skip DNS entirely:

```text
cluster.peer_discovery.enabled = on
cluster.peer_discovery.automatic_join = on
cluster.peer_discovery.type = list
cluster.peer_discovery.config.name = bondy
cluster.peer_discovery.config.addresses._ = bondy1@10.0.0.1:18086
cluster.peer_discovery.config.addresses._ = bondy2@10.0.0.2:18086
```

`addresses` is the fixed peer list — either a bare `ip:port` (combined with `name`, this node's own Erlang basename, to build a full nodename) or an explicit `nodename@ip:port` per entry. There's nothing to poll or resolve — the list itself is the membership. This trades the flexibility of DNS (a node can be replaced without touching every other node's config) for simplicity in deployments where the node set is genuinely static.

## Result

Every configured node reports the full set of cluster peers from `bondy.cluster.members`, and the nodes it currently has live connections to from `bondy.cluster.info`. Control-plane state — realms, users, groups, sources, grants — converges across all of them through active anti-entropy; see [Clustering](/router/concepts/clustering) for how that works.

## Adding and removing nodes

Adding a node is the same as forming the cluster: configure peer discovery on the new node and start it — it discovers and joins the existing cluster the same way the first nodes discovered each other.

There is currently no supported procedure for retiring a node from a running cluster — [`bondy.cluster.leave`](/router/reference/wamp_api/cluster#not-yet-implemented) is not yet implemented, deliberately, because a fake success would stall reclamation on a member that was never actually retired. If you need to permanently decommission a node today, treat it as an operational question for your specific deployment rather than something this guide can walk you through safely.

## See also

- [Clustering](/router/concepts/clustering) — masterless clustering, state replication, and fault tolerance.
- [Cluster Configuration Reference](/router/reference/configuration/cluster) — every `cluster.*` key, including the TLS peer-plane options.
- [Cluster](/router/reference/wamp_api/cluster) — the `bondy.cluster.*` procedures and topics used to verify a cluster.
- [How to Monitor a Bondy Cluster with Prometheus and Grafana](/router/guides/administration/monitoring) — a standing view of cluster topology and health.
