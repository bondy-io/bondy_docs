---
outline: deep
---

# Architecture

## Preliminaries

> A distributed system is one in which the failure of a computer you didn't even know existed can render your own computer unusable.
>
>— Leslie Lamport

::: info Distributed system
A distributed system is a group of computers working together to achieve a unified goal.
:::

### Consistency Model
Distributed systems that use replication as a strategy for high availability and fault-tolerance generally store multiple copies of the data, usually over a cluster of nodes, and so they need to define the semantics of concurrent accesses to this data.

Consistency can be simply defined by how the copies from the same data may vary (or contradict) within the same replicated distributed system. When the readings on a given data object are inconsistent with the last update on this data object, this is a consistency anomaly.

::: info Consistency Model
A Consistency Model specifies a contract between programmer and a distributed system, wherein the system guarantees that if the programmer follows the rules, data will be consistent i.e. not contradictory, and the results of reading, writing, or updating data will be predictable.
:::

Every consistency model and thus every distributed system will show different **properties** depending on their architecture design and in particular on the trade-offs made in order to achieve the system’s quality attributes (non-functional requirements).

All distributed systems properties can be expressed as the intersection of **safety** and **liveness** properties[^1].

[^1]: See [Consistency Models of NoSQL Databases](https://www.notion.so/Consistency-Models-of-NoSQL-Databases-d23a8a98ef3046198e7a6dac4ba14c7b) for an in-depth analysis of several consistency models.

#### Safety

In distributed computing, safety properties informally require that **"something bad will never happen"** in a distributed system or distributed algorithm e.g. mutual exclusion, deadlock freedom, partial correctness, and first-come-first-serve.

Unlike liveness properties, if a safety property is violated there is always a finite execution that shows the violation.

#### Liveness

A liveness property states that **"something good will eventually occur”** e.g. starvation freedom, termination, and guaranteed service.

The thing to observe about a liveness property is that no partial execution is irremediable: it always remains possible for the required 'good thing' to occur in the future.


### Consistency Approaches

>In distributed systems, there are—broadly speaking—two approaches to data consistency: consensus or convergence.
>
>— Martin Kleppmann, ACM Queue Volume 20, Issue 3

* **Consensus**, an approach that implies "making the distributed system appear as if it were not distributed (linearizable) and as if there were no concurrency (serializable)"[^2]. This model makes the system easy to use, but it comes at the cost of availability, scalability and latency because every update needs to wait for a reply from other nodes before it can complete. This is what algorithms like Paxos and Raft (a modern, easier to understand alternative to Paxos) deliver.
* **Convergence a.k.a. eventual consistency** allows different nodes to process updates independently, without waiting for each other. This is typically faster (lower latency), more robust, and more scalable, but it leads to nodes having temporarily inconsistent versions of the data. As those nodes communicate with each other, those inconsistencies must be resolved, the data must converge towards the same value.

Eventual consistency is an example of a liveness property.


[^2]: Martin Kelppmann, [ACM Queue Volume 20, Issue 3](https://queue.acm.org/detail.cfm?id=3546931)

### CAP Theorem

:::info Theorem
The CAP Theorem is a fundamental theorem in distributed systems that states that distributed systems requiring always-on, highly available operation cannot guarantee the illusion of coherent, consistent single-system operation in the presence of network partitions, which cut communication between active servers.
:::

According to CAP any networked shared-data system can have at most two of three desirable properties:

- consistency (C) equivalent to having a single up-to-date copy of the data;
- high availability (A) of that data (for updates); and
- tolerance to network partitions (P).

> The easiest way to understand CAP is to think of two nodes on opposite sides of a partition. Allowing at least one node to update state will cause the nodes to become inconsistent, thus forfeiting (C). Likewise, if the choice is to preserve consistency, one side of the partition must act as if it is unavailable, thus forfeiting (A). Only when nodes communicate is it possible to preserve both consistency and availability, thereby forfeiting (P).
— *Eric Brewer, VP Infrastructure Google*

The CAP theorem, formulated by Eric Brewer and proven by Lynch and Gilbert, dictates that it is **impossible simultaneously to achieve always-on experience** (availability) **and to ensure that users read the latest written version of a distributed database** (consistency—as formally proven, a property known as “linearizability”) in the presence of partial failure (partitions).

If two processes (or groups of processes) within a distributed system cannot communicate (P)—either because of a network failure or the failure of one of the components—then updates cannot be synchronously propagated to all processes without blocking. Under partitions, such system system cannot safely complete updates (C) and hence is unavailable to some or all of its users (A).

### PACELC Theorem

::: info Theorem
The PACELC Theorem states that in case of network partitioning (P) in a distributed computer system, one has to choose between availability (A) and consistency (C) (as per the CAP theorem), but else (E), even when the system is running normally in the absence of partitions, one has to choose between latency (L) and consistency (C).
:::

Examples:

- [DynamoDB](https://en.wikipedia.org/wiki/Amazon_DynamoDB), [Cassandra](https://en.wikipedia.org/wiki/Apache_Cassandra), [Riak](https://en.wikipedia.org/wiki/Riak) and [Cosmos DB](https://en.wikipedia.org/wiki/Cosmos_DB) are PA/EL systems: if a partition occurs, they give up consistency for availability, and under normal operation they give up consistency for lower latency.
- MongoDB is a PA/EC
- PostgreSQL, MySQL are PC/EC

### Eventual Consistency

> **Data inconsistency in large-scale reliable distributed systems must be tolerated** for two reasons: improving read and write performance under highly concurrent conditions; and handling partition cases where a majority model would render part of the system unavailable even though the nodes are up and running.
- *Werner Vogels, CTO Amazon.com*
>

::: info Eventual Consistency
Eventual consistency is a consistency model used in distributed computing to achieve high availability that informally guarantees that, if no new updates are made to a given data item, eventually all accesses to that item will return the last updated value.
:::

Eventual consistency, also called optimistic replication, is widely deployed in distributed systems, and has origins in early mobile computing projects. A system that has achieved eventual consistency is often said to have converged, or achieved replica convergence.

Eventual consistency is a weak guarantee – most stronger models, like linearizability are trivially eventually consistent, but a system that is merely eventually consistent does not usually fulfil these stronger constraints.

Eventually-consistent services are often classified as providing BASE (**B**asically **A**vailable, **S**oft state, **E**ventual consistency) semantics, in contrast to traditional ACID (Atomicity, Consistency, Isolation, Durability) guarantees.

- **(B)asically (A)vailable**: basic reading and writing operations are available as much as possible (using all nodes of a database cluster), but without any kind of consistency guarantees (the write may not persist after conflicts are reconciled, the read may not get the latest write)
- **(S)oft state**: without consistency guarantees, after some amount of time, we only have some probability of knowing the state, since it may not yet have converged
- **(E)ventually consistent**: If the system is functioning and we wait long enough after any given set of inputs, we will eventually be able to know what the state of the database is, and so any further reads will be consistent with our expectations

Eventual consistency is purely a liveness guarantee i.e. it makes not safety guarantees. Informally, it guarantees that, if no additional updates are made to a given data item, all reads to that item will eventually return the same value.

How eventual is eventually consistency? Eventually consistent systems appear strongly consistent most of the time.

::: warning REALITY CHECK - STRONG CONSISTENCY

**Stock PostgreSQL and MySQL master-slave databases replication is done asynchronously.** This means that the only way to ensure read-your-writes consistency is to perform the query on the master. Reading from a randomly selected slave results in the possibility of not finding the result (eventual consistency).

Synchronous master-to-master replication for PostgreSQL and MySQL can be obtained from companies like Percona, Galera and AWS. However, no solution is perfect or without costs and architecture trade-offs.

For example, the new Aurora multi-master offering can present lags:

> By default, the data seen by a read operation in a multi-master cluster is subject to replication lag, typically a few milliseconds.
>
>— AWS [Docs](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-multi-master.html)

> If two DB instances attempt to modify the **same data page** at almost the same instant, **a write conflict occurs**. The earliest change request is approved using a quorum voting mechanism. That change is saved to permanent storage. The DB instance whose change isn't approved rolls back the entire transaction containing the attempted change. Rolling back the transaction ensures that data is kept in a consistent state, and applications always see a predictable view of the data. Your application can detect the deadlock condition and **retry the entire transaction**.
>
>— AWS [Docs](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-multi-master.html)

Finally, AWS recommends segmenting database access i.e. **affecting the design of microservices (their bounded context/transaction) in a similar way an eventually consistent model would:**

> With an active-active workload, you perform read and write operations to all the DB instances at the same time. In this configuration, you typically **segment the workload so that the different DB instances don't modify the same underlying data at the same time**. Doing so minimizes the chance for write conflicts.
>Multi-master clusters work well with application logic that's designed for a *segmented workload*. In this type of workload, you divide write operations by database instance, database, table, or table partition.
>
> — AWS [Docs](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-multi-master.html)
:::

## Bondy Architecture Background

> If you expect failure to happen on an external service, do not make its presence a guarantee of your system.
— *Fred Hebert, It's About the Guarantees[^1]*
>

[^1]: [It's About the Guarantees](https://ferd.ca/it-s-about-the-guarantees.html)

### Key Characteristics

The following are the key characteristics of Bondy.

- **Self-sufficiency** — Bondy does not depend on any external system e.g. databases, as it would not be able to guarantee their availability.
- **Distributed by design** – ****Bondy was designed as a reliable distributed router, ensuring continued operation in the event of node or network failures through **clustering** and **data replication**.
- **Scalability** – Bondy is written in Erlang/OTP which provides the underlying operating system to handle concurrency and scalability requirements, allowing Bondy to scale to thousands and even millions of concurrent connections on a single node. Its distributed architecture also allows for horizontal scaling by simply adding nodes to the cluster.
- **Peer-to-peer master-less clustering** – All nodes in a Bondy cluster are equal, thanks to the underlying clustering and networking technology which provides a master-less architecture.
- **Low latency data replication** – All nodes in a Bondy cluster share a global state which is replicated through a highly scaleable and low latency eventually consistency model based on gossip. Bondy uses [Partisan](http://partisan.cloud/), a high-performance Distributed Erlang replacement that enables various network topologies and supports large clusters (Partisan has been demonstrated to scale up to 1,024 Erlang nodes, and provide better scalability and reduced latency than Distributed Erlang).
- **Ease of use** – Bondy is easy to operate due to its operational simplicity enabled by its peer-to-peer nature, the lack of special nodes, automatic data replication and self-healing.
- **Embedded REST API Gateway** – Bondy embeds a powerful API Gateway that can translate HTTP REST actions to WAMP routed RPC and PubSub operations. The API Gateway leverages the underlying storage and replication technology to deploy the API Specifications to the cluster nodes in real-time.
- **Embedded Identity Management & Authentication** - Each realm manages user identity and authentication using multiple WAMP and HTTP authentication methods. Identity data is replicated across the cluster to ensure always-on and low-latency operations.
- **Embedded Role-based Access Control (RBAC)** – Each realm embeds a RBAC subsystem controlling access to realm resources through the definition of groups and the assignment of permissions. RBAC data is replicated across the cluster to ensure always-on and low-latency operations.
- **Embedded Broker Bridge** – Bondy embeds a Broker Bridge that can manage a set of WAMP subscribers that re-publish WAMP events to an external non-WAMP system e.g. a message broker.

### Clustering

Bondy default mode of operation is to work as a cluster consisting of multiple nodes. When it comes to certain data such as Registry (aka process registry, routing table), Realms, RBAC entities and configuration, Bondy nodes are clones of one another. However, each node has its own set of clients and/or Bridge Relay nodes connected. The key capability of Bondy as an application router is to be able to forward messages between those connected clients transparently across the cluster.

#### Gossiping

Bondy nodes periodically exchange messages with each other to maintain their view of the cluster membership. This is done by means of a “gossip protocol”. Node joins and leaves are announced, i.e. “gossiped” to other nodes so that the other nodes can update their local views appropriately. Nodes also periodically re-announce what their view in case any nodes happened to miss previous updates.

Depending on the chosen membership strategy (full-mesh or p2p) nodes will have a full or partial view of the cluster members (respectively). The view is stored by each node using a Conflict-free Replicated Data Type (CRDT) which achieves convergence without the need for coordination.

The algorithm used to build and maintain the broadcast tree is [Epidemic Broadcast Trees](https://www.notion.so/Epidemic-Broadcast-Trees-732e731651c34799a4c932de280a4307) (a.k.a Plumtree).

#### Scalability

Bondy clustering capabilities goes beyond Distributed Erlang (a.k.a. “disterl”) in some areas. In particular, Bondy supports multiple TCP/IP connections (channels) and parallelism (more than 1 connection per channel), this allows to separate control plane from data plane traffic. Bondy underlying distribution layer also supports acknowledgment, retries, monotonic channels and preliminary support for causal delivery.

### Data Storage

Data in Bondy is stored using a combination of the following storage mechanisms:

- Erlang process heap memory
- Erlang Term Storage (ets) tables (sets, ordered_sets, bags and duplicate bags)
- A pool of embedded LevelDB databases (soon to be replaced by the more modern RocksDB, a LevelDB fork)

### Data replication

As previously mentioned most data in Bondy is replicated to all nodes in the cluster. This is done in (soft) real-time leveraging the same Gossip [infrastructure](https://www.notion.so/Bondy-s-Architecture-290c6eb6508e4182acc9d08ef4f17939) used by the cluster membership service.

Whenever an object is created, updated or deleted on a  node, a message containing the operation is broadcasted to all other nodes.

### Conflict resolution

In a distributed, eventually consistent system like Bondy, conflicts between object replicas stored on different nodes are an expected byproduct of node failure, concurrent client updates, physical data loss and corruption, and other events. These conflicts occur when objects are either missing, as when one node holds a replica of the object and another node does not, or divergent, as when the values of an existing object differ across nodes.

Bondy offers two means of resolving object conflicts:

1. Read repair - on every read,
2. Active anti-entropy (AAE)

Both mechanisms rely on a per-object causality tracking mechanism: [Dotted Version Vector Sets (DVVSets)](https://www.notion.so/Scalable-and-Accurate-Causality-Tracking-for-Eventually-Consistent-Stores-78386e0195de4ce5bff9ede895c0b819). DVVSets describe causality between related or conflicting data values. DVVSets use logical time rather than chronological time to resolve conflicts automatically and ensure your data is accurate.

#### Read repair

When an object is read Bondy checks if there are any conflicts and uses a suitable conflict resolution strategy for the case. The result is then written to the database and broadcasted to all other nodes.

#### Anti-entropy exchanges (Push-Pull)

Periodically each Bondy node will choose a random peer and perform an exchange comparing their databases and exchanging any missing and/or repairing conflicting data. This is done efficiently by using Merkle trees (a.k.a hashtrees) that are stored on LevelDB.

### Consistency models

Bondy currently offers the following consistency models

- **Eventual consistency**
- **Causal consistency** - if node A has communicated to node B that is has updated an object a subsequent access by node B will return the updated value, and a write is guaranteed to supersede the earlier write.
- **Session consistency** - As long as a session is open, Bondy guarantees read-your-writes consistency i.e. a client can always read the values that it has updated and never sees an older value.

### Bondy Eventual Consistency Configuration

- `cluster.lazy_tick_period` - a time duration with units, e.g. '10s' for 10 seconds.
Default: 1s
- `cluster.exchange_tick_period` - a time duration with units, e.g. '10s' for 10 seconds. Default: 1m
- `aae.enabled` - enable|disable active anti-entropy.
Default: true
- `aae.data_exchange_timeout` - a time duration with units, e.g. '10s' for 10 seconds.
Default: 1m
- `aae.hashtree_timer` - a time duration with units, e.g. '10s' for 10 seconds.
Default: 10s
- `aae.hashtree_ttl` - how often should the hashtrees (Merkle trees) be destroyed and rebuild. A time duration with units, e.g. '10s' for 10 seconds.
Default: 1w
- `aae.exchange_timer` - how often should a node initiate an exchange with a cluster peer, e.g. '10s' for 10 seconds.
Default: 10s

<ZoomImg src="./assets/bondy_container_diagram.png"/>


<ZoomImg src="./assets/bondy_architecture.png"/>