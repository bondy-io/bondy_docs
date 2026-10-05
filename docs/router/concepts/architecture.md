---
outline: deep
related:
    - text: Clustering
      type: Concept
      link: /router/concepts/clustering
      description: How Bondy nodes form a cluster, replicate state, and stay available during partitions and failures.
    - text: Registry Routing (RIB)
      type: Concept
      link: /router/concepts/registry_routing
      description: How Bondy scales cross-node call and event routing without replicating every registration to every node.
    - text: Deletion and Reclamation
      type: Concept
      link: /router/concepts/deletion_and_reclamation
      description: How Bondy safely reclaims space for deleted replicated data.
    - text: Data Storage & Active Anti-entropy Configuration Reference
      type: Configuration Reference
      link: /router/reference/configuration/data_storage
      description: Sharding, placement, durability tuning, anti-entropy sync, and the authentication freshness fence.
---

# Architecture

Bondy is a masterless, always-on WAMP router. This page maps how it is built — the router, the storage and replication layer beneath it, and the clustering fabric connecting nodes — and the rationale behind the key trade-offs. Each section links to a deeper concept or reference page; this page is the map, not the territory.

## Background

Bondy's design choices follow from one constraint: **it must never depend on an external system to be available**, because it cannot guarantee the availability of something it does not control. No external database, no external coordination service (ZooKeeper, etcd, Consul) — everything a Bondy cluster needs to route messages, authenticate sessions, and enforce authorization lives inside Bondy itself, replicated across its own nodes.

That constraint rules out a class of solutions. A system that coordinates every write through a consensus protocol (Paxos, Raft) becomes, in effect, a single logical system — easy to reason about, but every update waits on a majority round-trip, and the system's own availability degrades to that of the consensus group. Bondy instead chooses **convergence**: nodes accept writes independently and reconcile afterwards, trading a moment of temporary divergence for the ability to keep accepting reads and writes through node failures and network partitions. This is the same trade-off the [CAP theorem](https://en.wikipedia.org/wiki/CAP_theorem) describes — under a partition, Bondy chooses availability over immediate cross-node consistency — and the same shape of guarantee (eventual consistency, converging once communication resumes) used by systems like DynamoDB, Cassandra, and Riak.

Choosing convergence is not choosing to ignore correctness. Bondy's storage layer uses Conflict-free Replicated Data Types (CRDTs) specifically because they make convergence a *mathematical property* of the data structure rather than an application-level discipline: however two replicas' updates are merged, and in whatever order, the result is well-defined and identical everywhere. The sections below describe where that property is load-bearing.

## Key Characteristics

- **Self-sufficient** — no external database, coordination service, or message broker. Everything ships embedded.
- **Distributed by design** — a reliable distributed router, continuing to operate through node or network failures via clustering and data replication.
- **Scalable** — built on Erlang/OTP, which supplies the concurrency substrate for handling from a handful to millions of concurrent connections on a single node; horizontal scaling is adding nodes to the cluster.
- **Peer-to-peer, masterless clustering** — every node in a Bondy cluster is equal; there is no leader election and no special node.
- **Low-latency replication** — cluster-wide state (security, realms, API specifications, and more) converges via per-table CRDTs over a pull-based anti-entropy protocol, not synchronous replication. Registrations and subscriptions stay on the node that owns them; only per-node routing summaries replicate. See [Clustering](/router/concepts/clustering) and [Registry Routing (RIB)](/router/concepts/registry_routing).
- **Embedded HTTP API Gateway** — translates HTTP/REST requests to WAMP routed RPC and Pub/Sub, with API specifications themselves replicated cluster-wide in real time.
- **Embedded identity, authentication, and RBAC** — each realm manages users, groups, sources, and grants natively, replicated across the cluster for always-on, low-latency authentication and authorization.
- **Embedded Broker Bridge** — republishes WAMP events to an external non-WAMP system, e.g. a message broker like Kafka.

## How Bondy Is Built

A Bondy node is three layers: the **router** that speaks WAMP and HTTP to clients, a **storage and replication layer** that gives every subsystem a replicated, convergent place to keep state, and **clustering** that connects nodes into a mesh with no leader.

<ZoomImg src="/assets/bondy_container_diagram.png" alt="Bondy container diagram"/>

### The Router

The router (`bondy_router`) implements the WAMP dealer (routed RPC) and broker (Pub/Sub) roles, the HTTP API Gateway, and the Admin API. Routing a call or an event whose destination is on another node is a cluster-routing decision — the router doesn't hold that state itself; it asks the [Registry Routing (RIB)](/router/concepts/registry_routing), which tracks which nodes can serve which procedures and topics without requiring every node to hold a copy of every registration.

### Storage and Replication

Every stateful subsystem — security (users, groups, sources, grants), realms, the API gateway, tickets and tokens — reads and writes through `bondy_db`: a sharded key/value facade where each table declares its own CRDT semantics (last-writer-wins registers, add-wins sets and maps, counters, and more). Underneath, `bondy_oplog` gives each shard a write-ahead log for durability and a Merkle Search Tree (MST) for anti-entropy: peers compare tree root hashes and exchange only the pages that actually differ, rather than comparing every key on every sync. Durable tables persist to a `leveled` LSM-tree store with an ETS point-read cache; the registry and other latency-critical state are fully in-memory.

Every replicated write carries a Hybrid Logical Clock (HLC) timestamp, giving a leaderless, causally-meaningful ordering without relying on synchronized wall clocks. Deleting a value is itself a replicated operation — it must leave a tombstone, since the tombstone is what rejects a late-arriving concurrent write — and physically reclaiming that tombstone's space is licensed only once every node has provably seen it. See [Deletion and Reclamation](/router/concepts/deletion_and_reclamation) for why that distinction matters and how it's made safe.

Because convergence never blocks on a majority round-trip, an isolated node can still serve reads and writes from what it has. The one place this needs a safeguard is authentication: a node whose view of security state is provably stale beyond a configurable bound refuses to authenticate against it rather than risk deciding on out-of-date grants. See the [Data Storage & Active Anti-entropy Configuration Reference](/router/reference/configuration/data_storage) for that fence, the sync protocol, and sharding and placement.

### Clustering

Nodes connect over [Partisan](https://partisan.dev), a high-performance Distributed Erlang replacement supporting multiple network topologies and larger clusters than standard Distributed Erlang. Partisan carries Bondy's traffic on four channels: `control_plane` for cluster membership and control messages, `data` for replicating and synchronising stored state, `wamp_relay` for routing calls and events between nodes, and `default`, used when the others are down. Each has its own connection parallelism and compression settings; see the [Cluster Configuration Reference](/router/reference/configuration/cluster). See [Clustering](/router/concepts/clustering) for cluster formation, peer discovery, and the security of the peer plane: a node with peer discovery enabled refuses to start unless the peer plane uses TLS with certificate verification, because an insecure peer plane can leak replicated credentials and signing keys.

<ZoomImg src="/assets/bondy_architecture.png" alt="Bondy architecture diagram"/>

## Consistency in Practice

Within that design, Bondy offers a few distinct consistency guarantees depending on what's being read:

- **Eventual consistency** — the default for cluster-wide state: if no new updates arrive, every replica converges to the same value.
- **Causal consistency** — if node A has observed node B's update, a subsequent read on A never returns a value older than what A has already seen.
- **Session consistency (read-your-writes)** — for the duration of a session, a client always observes the values it has itself written, on the node it is connected to.

## See also

- [Clustering](/router/concepts/clustering) — cluster formation, peer discovery, and replication in depth.
- [Registry Routing (RIB)](/router/concepts/registry_routing) — how calls and events cross nodes without full-mesh replication.
- [Deletion and Reclamation](/router/concepts/deletion_and_reclamation) — the model behind safely reclaiming deleted data.
- [Data Storage & Active Anti-entropy](/router/reference/configuration/data_storage) configuration reference.
