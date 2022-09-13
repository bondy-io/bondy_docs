# How is Bondy different
> Bondy provides a unique combination of features which sets it apart from other application networking solutions and WAMP routers in terms of scalability, reliability, high-performance, development and operational simplicity.{.definition}


## Self-sufficiency
Bondy does not depend on any external system e.g. databases, as it would not be able to guarantee their availability.

## Distributed by design
As opposed to existing WAMP Router implementations, Bondy was designed as a reliable distributed router, ensuring continued operation in the event of node or network failures through clustering and data replication.

<ZoomImg src="/assets/bondy_architecture.png"/>


## Scalable
Bondy is written in Erlang/OTP which provides the underlying operating system to handle concurrency and scalability requirements, allowing it to scale to thousands and even millions of concurrent connections on a single node. Its distributed architecture also allows for horizontal scaling by simply adding nodes to the cluster.

## Decentralised
All peer nodes in a Bondy cluster are equal, thanks to the underlying clustering and networking technology which provides a master-less architecture.

## Low latency data replication
All nodes in a Bondy cluster share a global state which is replicated through a highly scaleable and low latency eventually consistency model. Data is diseminated in real-time using epidemic broadcasting (gossip). Bondy uses [Partisan](https://github.com/lasp-lang/partisan), a high-performance Distributed Erlang replacement that enables various network topologies and supports large clusters.

## Easy to operate
Bondy is easy to operate due to its operational simplicity enabled by its decentralised peer-to-peer nature, the lack of special nodes, automatic data replication and self-healing.

## Identity Management & Authentication
Each realm manages user identity and authentication using multiple WAMP and HTTP authentication methods. Identity data is replicated across the cluster to ensure always-on and low-latency operations.

## Authorization
Each realm embeds a Role-based Access Control (RBAC) subsystem controlling access to realm resources and operations. Every message flowing through a realm is authorized. RBAC data is replicated across the cluster to ensure always-on and low-latency operations.

## HTTP API Gateway
Bondy embeds a powerful API Gateway that can translate HTTP actions to WAMP routed RPC and PubSub operations. The API Gateway leverages the underlying storage and replication technology to deploy the API Specifications to the cluster nodes in real-time.

## Broker Bridge
Bondy embeds a Broker Bridge that can manage a set of WAMP subscribers to re-publish WAMP events to an external non-WAMP system e.g. a message broker.



