---
related:
    - text: Architecture
      type: concepts
      link: /concepts/architecture
      description: Learn about Bondy's distributed architecture and design principles.
    - text: Registry Routing (RIB)
      type: concepts
      link: /concepts/registry_routing
      description: How calls and events cross nodes without replicating every registration to every node.
    - text: Deletion and Reclamation
      type: concepts
      link: /concepts/deletion_and_reclamation
      description: How Bondy safely reclaims space for deleted replicated data.
    - text: Cluster Configuration
      type: reference
      link: /reference/configuration/cluster
      description: Configure cluster formation, peer discovery, and cluster parameters.
    - text: Running a Cluster
      type: guide
      link: /guides/deployment/running_a_cluster
      description: Step-by-step guide to deploying and operating a Bondy cluster.
---
# Clustering

Bondy is designed from the ground up as a distributed system that forms clusters automatically, providing scalability, high availability, and fault tolerance for your application network.

## Overview

A Bondy cluster is a group of Bondy nodes that work together as a single logical unit to:
- **Scale horizontally** - Handle more concurrent connections and throughput by adding nodes
- **Provide high availability** - Continue operating even when nodes fail or are taken offline
- **Distribute load** - Balance client connections and message routing across multiple nodes
- **Replicate state** - Synchronize Realm configuration, user data, and routing information across all nodes

::: definition Cluster
A Bondy cluster is a collection of interconnected Bondy nodes that share state and collaboratively route WAMP messages, appearing to clients as a single, unified WAMP Router.
:::

## Architecture

### Masterless Design

Bondy uses a **masterless (peer-to-peer) architecture** where all nodes are equal. There are no master or slave nodes, which provides several advantages:

- **No single point of failure** - Any node can fail without losing cluster functionality
- **Simpler operations** - No need to elect or promote masters during failures
- **Symmetric scaling** - All nodes contribute equally to cluster capacity
- **Uniform client experience** - Clients can connect to any node with identical functionality

### Full Mesh Topology

Nodes in a Bondy cluster form a **full mesh network**, meaning:
- Every node maintains direct connections to every other node
- Cluster coordination and state replication happen directly between all peers
- No reliance on external coordination services (like ZooKeeper or etcd)

::: info Cluster Size
While Bondy supports clusters of hundreds of nodes, most production deployments run 3-7 nodes for optimal balance between fault tolerance and coordination overhead. Larger clusters are possible but require careful network and resource planning.
:::

## State Replication

### Control Plane State

Bondy replicates control plane data across cluster nodes as **per-table CRDTs** (Conflict-free Replicated Data Types), converging via a pull-based anti-entropy protocol rather than a gossip broadcast: peers compare Merkle Search Tree root hashes and exchange only the pages that actually differ. See [Architecture](/concepts/architecture) for how the storage layer (`bondy_db`/`bondy_oplog`) fits together. This covers:

- **Realm definitions** - URIs, security settings, SSO configuration
- **User accounts** - Identities, credentials, group memberships
- **Access control rules** - Permissions, role assignments, source definitions
- **API Gateway specifications** - HTTP routing rules and transformations

Deleting a value here is itself a replicated operation, and the space it occupied is only physically reclaimed once every cluster member has provably seen the deletion — see [Deletion and Reclamation](/concepts/deletion_and_reclamation) for why that distinction is necessary and how Bondy makes it safe.

### Eventual Consistency

Bondy's replication follows the **AP** model from the CAP theorem:
- **Available** - Nodes remain operational during network partitions
- **Partition-tolerant** - Cluster continues functioning when nodes can't communicate
- **Eventually consistent** - State converges when connectivity is restored

This means:
- Updates are accepted on any node without requiring consensus
- State may temporarily diverge during partitions
- The system automatically reconciles conflicts when healed

::: tip Active Anti-Entropy
Bondy uses **Active Anti-Entropy (AAE)** to proactively detect and repair state divergence. AAE periodically compares each shard's Merkle Search Tree against a peer's and pulls only the divergent pages, ensuring convergence even after prolonged partitions. See the [Data Storage & Active Anti-entropy Configuration Reference](/reference/configuration/data_storage#active-anti-entropy) for the sync protocol and its tunables, including the authentication freshness fence that refuses to authenticate against provably stale security state.
:::

### Message Routing

Unlike control plane state, **WAMP messages are routed in real-time** without replicating every registration or subscription cluster-wide. Instead, each node publishes a compact routing summary of what it can serve — see [Registry Routing (RIB)](/concepts/registry_routing) — and cross-node routing is decided from the merged summaries:

- **RPC calls** - Routed to Callees on any node in the cluster, node-addressed via the RIB
- **PubSub events** - Relayed to the nodes hosting interested Subscribers, then delivered locally on each
- **Registration/Subscription routing** - Dynamically maintained across the cluster via the RIB's summary cells, not full-entry replication

Bondy tracks which node hosts each client session and routes messages accordingly. If a node fails, clients on that node disconnect, but other clients continue operating normally.

## Cluster Formation

### Automatic Discovery

Bondy supports multiple peer discovery mechanisms:

1. **DNS-based** - Query DNS records for cluster peers
2. **Multicast** - Broadcast on local network (development only)
3. **Static** - Manually configured list of seed nodes
4. **Kubernetes** - Query Kubernetes API for pod IPs

The recommended approach for production is **DNS-based discovery**, which works in all cloud and on-premise environments.

### Join Process

When a new node starts:

1. **Discovery** - Node queries configured discovery mechanism for peers
2. **Connection** - Node establishes connections to discovered peers
3. **Handshake** - Nodes exchange cluster membership and version information
4. **State Sync** - New node receives full state replication from existing nodes
5. **Join Complete** - Node begins accepting client connections and routing messages

::: warning Version Compatibility
All nodes in a cluster must run compatible Bondy versions. Rolling upgrades are supported within minor versions (e.g., 1.1.x → 1.2.x), but major version upgrades typically require cluster downtime — see [Upgrading to 1.0.0](/guides/deployment/upgrading_to_1_0_0) for the current major upgrade.
:::

::: warning Peer plane security
The Partisan peer plane (the connections nodes use to cluster) is plaintext and unauthenticated by default. When automatic peer discovery is configured, Bondy refuses to start unless the peer plane is secured with TLS, or the risk is explicitly acknowledged for a network-isolated cluster — an insecure peer plane would otherwise let an on-path attacker read or modify replicated credentials and realm signing keys. See [Cluster Configuration](/reference/configuration/cluster) for `cluster.tls.*`.
:::

## Fault Tolerance

### Node Failures

When a node fails or becomes unreachable:

- **Clients disconnect** - Sessions on the failed node are terminated
- **Cluster continues** - Remaining nodes operate normally
- **State remains available** - Control plane data is still on remaining nodes
- **Routing adapts** - Calls/events route to active nodes only

Clients should implement **automatic reconnection** with exponential backoff to connect to surviving nodes.

### Network Partitions

During a network partition (split-brain):

- **Both sides remain available** - Each partition continues accepting updates
- **State diverges** - Updates on each side aren't immediately visible to the other
- **Clients stay connected** - Sessions remain active on their partition
- **Healing** - When connectivity restores, AAE repairs state divergence

::: tip Partition Handling
Bondy prioritizes availability during partitions. For scenarios requiring strict consistency, implement application-level coordination (e.g., distributed locks via procedures that check quorum).
:::

### Recovery

After failures or partitions:

1. **Reconnection** - Nodes automatically reconnect when available
2. **State synchronization** - AAE detects and repairs divergence
3. **Membership updates** - Cluster membership list is reconciled
4. **Normal operation** - Cluster returns to fully consistent state

## Scaling

### Horizontal Scaling

Add capacity by adding nodes:

```bash
# Start new node pointing to existing cluster
bondy start -name bondy4@host4 -cluster_seeds "bondy1@host1,bondy2@host2"
```

Benefits:
- **More client connections** - Each node can handle millions of connections
- **Higher message throughput** - Message routing distributes across all nodes
- **Increased fault tolerance** - More nodes means higher redundancy

### Load Distribution

Bondy distributes load across nodes through:

- **Client distribution** - Use DNS round-robin or load balancer to spread connections
- **RPC load balancing** - Router distributes calls across available Callees
- **PubSub fan-out** - Events are published to local subscribers and relayed to remote nodes

::: info Session Affinity
For optimal performance, use **session affinity** (sticky sessions) at your load balancer. This minimizes inter-node routing overhead by keeping a client's messages local to one node when possible.
:::

## Operational Considerations

### Monitoring

Key metrics to monitor:

- **Cluster membership** - Number of connected nodes
- **Inter-node latency** - Network round-trip time between nodes
- **AAE queue depth** - State repair backlog
- **Message routing hops** - Cross-node routing overhead
- **State divergence** - Detected inconsistencies between nodes

### Best Practices

1. **Use odd-numbered clusters** - Provides clear majority for conflict resolution
2. **Co-locate with clients** - Deploy nodes in same regions as your applications
3. **Size appropriately** - Start with 3-5 nodes, scale based on actual load
4. **Monitor network health** - Low latency and high bandwidth between nodes is critical
5. **Plan for failures** - Test failure scenarios before production
6. **Use DNS discovery** - Most flexible and works across all environments

### Common Topologies

**Development** (1-node cluster)
```
bondy@localhost
```

**Small Production** (3-node cluster)
```
bondy1@host1 ←→ bondy2@host2
       ↖     ↙
      bondy3@host3
```

**Multi-Region** (5-node cluster)
```
Region A          Region B
bondy1 ←→ bondy2  bondy4 ←→ bondy5
   ↖         ↙  ↘    ↙
      bondy3 (core region)
```

## See Also

- [Architecture](/concepts/architecture) - Deep dive into Bondy's distributed design
- [Registry Routing (RIB)](/concepts/registry_routing) - How calls and events cross nodes at scale
- [Deletion and Reclamation](/concepts/deletion_and_reclamation) - How deleted replicated data is safely reclaimed
- [Running a Cluster](/guides/deployment/running_a_cluster) - Deployment guide
- [Cluster Configuration](/reference/configuration/cluster) - Configuration reference
- [Data Storage & Active Anti-entropy](/reference/configuration/data_storage) - AAE configuration and tuning
