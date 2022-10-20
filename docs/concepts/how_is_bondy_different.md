# How is Bondy different
> Bondy provides a unique combination of features which sets it apart from other application networking solutions (e.g. WAMP routers) in terms of scalability, reliability, high-performance, development and operational simplicity.{.definition}

## Bondy vs. other WAMP routers

### Self-sufficiency
Bondy does not depend on any external system e.g. databases, as it would not be able to guarantee their availability.

### Distributed by design
Bondy was designed as a reliable distributed router, ensuring continued operation in the event of node or network failures through clustering and data replication.

Each Bondy node is capable of sending messages to and receiving messages from other nodes. The nodes act as relays, passing on a message towards its final destination.

<ZoomImg src="/assets/bondy_architecture.png"/>

### Scalable
Bondy is written in Erlang/OTP which provides the underlying operating system to handle concurrency and scalability requirements, allowing it to scale to thousands and even millions of concurrent connections on a single node. Its distributed architecture also allows for horizontal scaling by simply adding nodes to the cluster.

### Decentralised
All peer nodes in a Bondy cluster are equal, thanks to the underlying clustering and networking technology which provides a master-less architecture.

### Low latency data replication
All nodes in a Bondy cluster share a global state which is replicated through a highly scaleable and low latency eventually consistency model. Data is diseminated in real-time using epidemic broadcast trees (gossip). Bondy uses [Partisan](https://github.com/lasp-lang/partisan), a high-performance Distributed Erlang replacement that enables various network topologies and supports large clusters.

### Easy to operate
Bondy is easy to operate mainly due to its decentralised peer-to-peer nature, the lack of special nodes, automatic data replication and self-healing.

### Multi-tenancy
Bondy Realms (WAMP Realms) allow for complete administrative and routing isolation. By mapping a realm to a tenancy you can enable multi-tenant architecture designs. Realm Same Sign-on and Prototypes provides further flexibility, allowing a tenancy to be mapped to a set of realms.

### Identity Management & Authentication
Each Realm represents a User Identity domain and embeds an Identity Management and Authentication service which multiple WAMP and HTTP authentication methods. Identity data is replicated across the cluster to ensure always-on and low-latency operations.

### Authorization
Each Realm embeds an Authorization service based on a Role-based Access Control (RBAC) subsystem which controls access to realm resources and operations. Every message flowing through a realm is individually authorized. RBAC data is replicated across the cluster to ensure always-on and low-latency operations.

### HTTP API Gateway
Bondy embeds a powerful API Gateway that can translate HTTP actions to WAMP routed RPC and PubSub operations. The API Gateway leverages the underlying storage and replication technology to deploy the API Specifications to the cluster nodes in real-time.

### Broker Bridge
Bondy embeds a Broker Bridge that can manage a set of internal WAMP subscribers that re-publishes WAMP events to an external non-WAMP system e.g. a message broker.

## Bondy vs. an RPC Framework

## Bondy vs. a Service Mesh

## Bondy vs. a Message Broker

## Bondy vs. an Event Mesh

## Bondy vs. an API Gateway





