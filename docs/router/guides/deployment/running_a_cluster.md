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
For a local, single-host dev cluster with no DNS setup at all, use the `just node1` / `just node2` / `just node3` targets described in [How to Monitor a Bondy Cluster](/router/guides/administration/monitoring#steps) — they start three pre-configured nodes that discover each other automatically. The rest of this guide is for a real, multi-host deployment.
:::

## Steps

### 1. Enable peer discovery on every node

In each node's `bondy.conf`:

```text
cluster.peer_discovery.enabled = on
cluster.peer_discovery.type = dns
```

With discovery on, Bondy joins every peer a lookup reports. There is no separate join setting.

### 2. Secure the peer plane

A node with discovery on refuses to start until the connections between nodes use TLS with certificate verification on both sides. Give every node a certificate signed by a private cluster CA (the source tree's [`deployment/cluster-ca-bootstrap.sh`](https://github.com/bondy-io/bondy/blob/develop/deployment/cluster-ca-bootstrap.sh) creates the CA and one certificate per node hostname), and in each node's `bondy.conf`:

```text
cluster.tls.enabled = on
cluster.tls.server.verify = verify_peer
cluster.tls.server.certfile = /etc/bondy/tls/bondy1.internal-cert.pem
cluster.tls.server.keyfile = /etc/bondy/tls/bondy1.internal-key.pem
cluster.tls.server.cacertfile = /etc/bondy/tls/ca.pem
cluster.tls.client.verify = verify_peer
cluster.tls.client.certfile = /etc/bondy/tls/bondy1.internal-cert.pem
cluster.tls.client.keyfile = /etc/bondy/tls/bondy1.internal-key.pem
cluster.tls.client.cacertfile = /etc/bondy/tls/ca.pem
```

Copy each node only its own key and certificate, plus the shared `ca.pem`. The CA's private key stays on the host that created it. Bind `cluster.peer_ip` to a private interface: the peer port must never be reachable from the internet, with or without TLS.

If the nodes run on a network you trust and you accept an unencrypted peer plane, set `cluster.tls.allow_insecure = on` instead. Bondy then starts with a warning. See [cluster.tls.allow_insecure](/router/reference/configuration/cluster#cluster.tls.allow_insecure) for what that exposes.

### 3. Configure the DNS discovery strategy

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

### 4. Start each node

Start Bondy on every host. Each node polls DNS (`cluster.peer_discovery.polling_interval`, default `10s`, after an initial `cluster.peer_discovery.initial_delay` of `10s`) and joins any newly discovered peer automatically.

### 5. Verify

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

To retire a node permanently, remove it from the membership with [`bondy.cluster.leave`](/router/reference/wamp_api/cluster#bondy-cluster-leave-node-map), called on the master realm with the node's name as `bondy.cluster.members` lists it. Leaving is a decommission, not a pause: it cannot be undone, and a node that later rejoins under the same name starts with a new history.

1. Call it first with the node's name as the only positional argument and `dry_run: true` in the keyword arguments, for example `Args = ["bondy3@10.0.0.3"]`, `KwArgs = {"dry_run": true}`. Bondy asks every remaining member whether it is ready and reports the result without removing anything.

2. If every remaining member answered and is ready, run the same call without `dry_run`. Bondy refuses the removal with an error when any remaining member is silent or not ready; resolve that member first.
3. Stop the node, and remove it from your discovery source (the DNS record or the static `addresses` list) so the remaining nodes stop looking it up.

## See also

- [Clustering](/router/concepts/clustering) — masterless clustering, state replication, and fault tolerance.
- [Cluster Configuration Reference](/router/reference/configuration/cluster) — every `cluster.*` key, including the TLS peer-plane options.
- [Cluster](/router/reference/wamp_api/cluster) — the `bondy.cluster.*` procedures and topics used to verify a cluster.
- [How to Monitor a Bondy Cluster with Prometheus and Grafana](/router/guides/administration/monitoring) — a standing view of cluster topology and health.
