---
draft: false
outline: [2,3]
related:
    - text: "Prometheus Metrics Reference"
      type: "Reference"
      link: "/router/reference/metrics"
      description: "Every metric family exposed on the Admin API /metrics endpoint, grouped by subsystem."
    - text: "Clustering"
      type: "Concept"
      link: "/router/concepts/clustering"
      description: "How Bondy nodes form a cluster and converge replicated state."
    - text: "Registry Routing (RIB)"
      type: "Concept"
      link: "/router/concepts/registry_routing"
      description: "The routing-summary machinery behind the dashboard's Registry RIB row."
---

# How to Monitor a Bondy Cluster with Prometheus and Grafana

Bondy ships a ready-to-run Prometheus and Grafana stack under `monitoring/` in the source tree, pre-provisioned with scrape targets, datasources and five Grafana dashboards covering cluster topology, the storage stack, the router and WAMP layer, and the BEAM VM. This guide brings the stack up against a local multi-node dev cluster.

**Prerequisites:** a Bondy source checkout (the stack lives in `monitoring/`, it is not part of the release package), Docker and Docker Compose, and the ability to build and run a local dev cluster (`make node1` and friends). See [Clustering](/router/concepts/clustering) for the concepts behind what the dashboards show.

## Steps

### 1. Start one or more dev nodes

From the repository root, build and start each dev-cluster node you want to observe:

```bash
make node1        # and optionally, in separate terminals:
make node2
make node3
```

Each target builds that node's release and starts it attached to your terminal (`bondy console`) &mdash; run each one in its own terminal, or background it. The dev cluster offsets each node's Admin API port by `100`: node1 serves `18081`, node2 `18181`, node3 `18281`.

### 2. Start the monitoring stack

```bash
cd monitoring
docker compose up -d
```

This starts two containers: Prometheus (`prom/prometheus`, port `9090`) and Grafana (`grafana/grafana`, port `3000`), wired together by `monitoring/docker-compose.yml`. Grafana is provisioned with:

- a **Prometheus** datasource pointing at the `prometheus` container;
- an **Infinity** datasource (`yesoreyeram-infinity-datasource`, installed automatically) used to shape the cluster topology graph;
- five dashboards, auto-loaded from `monitoring/grafana/dashboards/` into a **Bondy** folder, refreshed every 30 seconds if you edit the JSON files on disk.

Prometheus scrapes every `10s` and retains `7d` of data by default (`monitoring/prometheus/prometheus.yml` and the `--storage.tsdb.retention.time` flag in `docker-compose.yml`, respectively) &mdash; enough for local debugging, not a production retention policy.

::: warning Workstation use only
Grafana is provisioned for anonymous admin access (`GF_AUTH_ANONYMOUS_ENABLED`) so the quick start needs no login. Do not reuse this `docker-compose.yml` as-is anywhere reachable beyond your workstation &mdash; disable anonymous auth and put Grafana behind real credentials first.
:::

### 3. Open Grafana

```bash
open http://localhost:3000
```

You land directly on the dashboard list &mdash; no login required. Prometheus itself, useful for ad hoc PromQL, is at `http://localhost:9090`. Every dashboard has a **Node** selector at the top that filters panels to the node(s) you pick; it is populated from the `node` label Prometheus attaches to each scrape target.

## Adapting to other topologies

The bundled `monitoring/prometheus/prometheus.yml` hard-codes three static targets for the dev cluster (`host.docker.internal:18081/18181/18281`, labelled `node: bondy1@127.0.0.1` and so on). To point the stack at a different set of nodes &mdash; an `edge1` dev node, a staging cluster, or hosts other than `host.docker.internal` &mdash; edit the `scrape_configs` targets and labels directly:

```yaml
- targets: ["host.docker.internal:19081"]
  labels:
    node: edge1@127.0.0.1
```

Prometheus is started with `--web.enable-lifecycle`, so a config edit does not require restarting the container:

```bash
curl -X POST http://localhost:9090/-/reload
```

On Linux, `host.docker.internal` needs the `extra_hosts: host-gateway` entry already present in `docker-compose.yml`; on Docker Desktop for macOS and Windows it resolves automatically.

## Reading the dashboards

Each dashboard opens on the **Bondy** folder and answers a different operational question.

### Bondy — Cluster Overview

Cluster-wide health at a glance: node up/down, Partisan connectivity, convergence, active alarms, and per-node vital signs. Start here to answer "is the cluster healthy?" before drilling into a specific area; clicking a node or series jumps to its detail dashboard. Rows: **Cluster state**, **Nodes & connectivity**, **Per-node vitals**, **Inter-node links — Partisan** (RTT, backpressure, connection churn).

### Bondy — Cluster Graph

A node-graph rendering of cluster topology &mdash; members as nodes, live Partisan connections as edges annotated with average heartbeat RTT and connection count &mdash; built from a single node's `GET /cluster/topology` response via the Infinity datasource. The query targets one node's Admin API port at a time (dev default: node1 on `18081`); edit the panel's query URL to view the graph from a different node's perspective.

### Bondy — bondy_db / oplog / MST

The storage and replication stack, plus enough of router/WAMP/HTTP/BEAM to correlate a storage issue with its symptoms. This is the dashboard for anti-entropy and write-path questions:

- **Cluster — Partisan** and **Cluster — inter-node links** &mdash; the same connectivity signals as the observer_cli `C` pane, as time series.
- **Sync / AAE — frontier convergence** &mdash; the observer_cli `Y` pane as time series: convergence is judged by the applied-frontier version vector (`bondy_oplog_instance_frontier_hash`), not the MST root, so an instance is in sync when every selected node reports the same hash.
- **Frontier sync matrix** and **Pair inspector** &mdash; an N&times;N grid of diverged-shard counts per node pair; clicking a cell drills into the diverged shards for that pair, their applied-sequence gap, and recent sync-session outcomes.
- **Write path — instances & WAL**, **Applier pipeline**, **Core substrate**, **Leveled projection store (LSM)**, **MST & page store**, **Secondary indexes**, **AAE Sync — Oversized items** &mdash; throughput, latency and backpressure for every stage between an accepted write and a converged, queryable projection.

### Bondy — Router / WAMP

Per-node router internals, WAMP session and messaging traffic, the HTTP API gateway, and Registry RIB routing. This is the dashboard for "why is a call slow / a client dropping / a route failing" questions:

- **Router internals — RPC, listeners, jobs & limits** &mdash; in-flight RPC promises (callee saturation), listener accept/terminate rates, load-regulation queue depth, rate-limiter and OIDC table sizes.
- **WAMP — sessions & transports** &mdash; session churn and close reasons, session duration, router-initiated ping RTT.
- **WAMP — messaging & RPC** &mdash; message mix by type, call round-trip latency (heatmap, quantiles, slowest procedures), in-flight invocations per procedure, dropped messages, registration/subscription churn.
- **HTTP — API gateway & admin listeners** &mdash; status-class, error and duration panels, including per-route golden signals.
- **Registry RIB — routing summaries, retry & presence** &mdash; the routing-summary machinery behind [Registry Routing](/router/concepts/registry_routing): summary occupancy, consistency-sweep divergences, and cross-node call retry/completion outcomes.

### Bondy — Runtime / BEAM

Per-node BEAM VM runtime: scheduler microstate-accounting breakdown, run queues, memory, process/port counts, garbage collection and I/O. Use this dashboard to tell a Bondy-level slowdown apart from a VM-level one (scheduler starvation, a long GC pause, memory pressure).

## Result

You now have a live Prometheus and Grafana stack scraping your dev cluster's Admin API `/metrics` endpoint every 10 seconds, with five dashboards covering cluster topology, the storage stack, the router and WAMP layer, and the BEAM VM. Stop it with:

```bash
docker compose down          # add -v to also drop the Prometheus/Grafana data volumes
```

## See also

- [Prometheus Metrics Reference](/router/reference/metrics) &mdash; every metric family behind these dashboards, with a pointer to the self-documenting `/metrics` endpoint for full detail.
- [Clustering](/router/concepts/clustering) &mdash; the concepts behind the Cluster Overview and Cluster Graph dashboards.
- [Data Storage & Active Anti-entropy Configuration Reference](/router/reference/configuration/data_storage#active-anti-entropy) &mdash; tune the sync scheduler whose state the Sync/AAE row visualises.
