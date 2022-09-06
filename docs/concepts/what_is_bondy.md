# What is Bondy

> Bondy is an open source, always-on and scalable application L7 networking platform for modern distributed architectures.  It is an all-in-one event and service mesh with support for multiple communication patterns and secure multi-tenancy.

Bondy is a **reliable application message router, designed for availability and scalability**. It scales horizontally and vertically to support a high number of concurrent clients while maintaining low latency and fault tolerance. As opposed to mainstream messaging solutions Bondy **offers both routed Remote Procedure Call (RPC) and Publish & Subscribe communication patterns**.

By combining the capabilities of a service mesh and an event mesh, Bondy can be used for the entire messaging requirements of a distributed system, from web and mobile apps to IoT devices and backend services, allowing everything to talk using **one single, simple messaging protocol**, thus **reducing technology stack complexity, as well as networking overheads**.‌


At its core, Bondy is a feature rich, scalable, robust and secure implementation of the open [Web Application Messaging Protocol (WAMP)](/guides/wamp.md) , a single secure and multi-tenant messaging protocol that provides Routed RPC and Pub-Sub. But Bondy goes beyond WAMP.

## Features

- **Open Source**<br>Bondy is open source software licensed under the Apache License Version 2.0. The source code is available at: https://github/leapsight/bondy.
- **Scalable**<br>Bondy was designed from the ground up as a distributed router and broker. It can leverage different network topologies for data replication and routing allowing it to scale to thousands of nodes.  Bondy is written in Erlang/OTP which offers unprecedented soft real-time, high concurrency and self-healing capabilities. A single node can handle millions of concurrent client connections.
- **Dynamic**<br>Bondy offers dynamic message routing automatically and efficiently delivering RPC and PubSub messages between clients connected to separate nodes in the cluster. Clustering formation is automatic and self-healing which saves operators the hassle of maintaining cluster connectivity.
- **Always-on**<br>Bondy replicates state across the cluster using a masterless architecture (all nodes are equal) and a gossip-based eventually consistent reliable state dissemination protocol which keeps state synchronised across nodes in the cluster without compromising availability. In addition, Bondy uses active anti-entropy to repair missing or divergent state as a result of node failure, physical data loss or corruption, and quickly bring additional nodes up-to-date. The combination of these features allow Bondy to be highly available even under network partitions, message loss and node failures.
- **Multi-protocol**<br>Bondy implements the Web Application Messaging Protocol (WAMP) v2.0. WAMP is a routed protocol that provides two messaging patterns: Publish & Subscribe (PubSub) and routed Remote Procedure Calls (RPC) over TCP/IP or WebSockets, and offers data transcoding support for several formats. Having a core that supports both RPC and PubSub allows Bondy to evolve to a multi-protocol RPC and PubSub router. As a result, Bondy already provides a REST/HTTP Gateway to declaratively define and deploy REST APIs that dynamically translate to the underlying WAMP counterparts.
- **Easy to deploy anywhere**<br>Bondy can be deployed anywhere from resource-constrained x86/ARM edge devices to private, hybrid and public clouds running bare metal, virtualisation or containers. Bondy provides out-of-the-box automatic clustering formation based on DNS which allows deploying a cluster on one go.

## Benefits

- **Reduce development time and accidental complexity**<br>Avoid the need to use a combination of protocols to support PubSub and RPC in your microservices or translate those to REST/HTTP for you web and mobile apps. With Bondy all elements of the application can communicate using a single underlying WAMP API while still leveraging different transports and encodings per client and even declaratively define a REST/HTTP API internally and externally.
- **Better scalability and reduced latency**<br>A Bondy cluster can scale to hundreds of nodes by leveraging different network topologies for communication. A full-mesh topology  guarantees only one hop is required to reach any node in the cluster, while more a peer-to-peer topology can maintain smaller groups of interconnected nodes to enable the whole cluster to grow larger while intelligently reducing the number of hops required.
- **Build and deploy REST APIs in no time thanks to Bondy REST Gateway**<br>Bondy embeds an HTTP Gateway which can host multiple APIs defined declaratively using a JSON specification format. The specification allows the developer to map an HTTP verbs and nouns to a WAMP actions. The Gateway offers seemless integration to Bondy's security subsystem exposing an OAUTH2 API. API Specifications are synchronised to all Bondy nodes in real-time.
- **Deploy anywhere**<br>Bondy can be deployed anywhere from resource-constrained x86/ARM edge devices to private, hybrid and public clouds running bare metal, virtualisation or containers.


## How is Bondy different than other WAMP routers?
Bondy provides a unique combination of features which sets it apart from other application networking solutions and WAMP routers in terms of *scalability, reliability, high-performance, development and operational simplicity.*



<ZoomImg src="/assets/bondy_diagram.png"/>

- **Distributed by design** – As opposed to existing WAMP Router implementations, Bondy was designed as a reliable distributed router, ensuring continued operation in the event of node or network failures through clustering and data replication.
- **Scalability** – Bondy is written in Erlang/OTP which provides the underlying operating system to handle concurrency and scalability requirements, allowing it to scale to thousands and even millions of concurrent connections on a single node. Its distributed architecture also allows for horizontal scaling by simply adding nodes to the cluster.
- **Decentralised** – All peer nodes in a Bondy cluster are equal, thanks to the underlying clustering and networking technology which provides a master-less architecture.
- **Low latency data replication** – All nodes in a Bondy cluster share a global state which is replicated through a highly scaleable and low latency eventually consistency model. Data is diseminated in real-time using epidemic broadcasting (gossip). Bondy uses [Partisan](https://github.com/lasp-lang/partisan), a high-performance Distributed Erlang replacement that enables various network topologies and supports large clusters.
- **Ease of use** – Bondy is easy to operate due to its operational simplicity enabled by its decentralised peer-to-peer nature, the lack of special nodes, automatic data replication and self-healing.
- **Embedded REST API Gateway** – Bondy embeds a powerful API Gateway that can translate HTTP REST actions to WAMP routed RPC and PubSub operations. The API Gateway leverages the underlying storage and replication technology to deploy the API Specifications to the cluster nodes in real-time.
- **Embedded Broker Bridge** – Bondy embeds a Broker Bridge that can manage a set of WAMP subscribers that re-publish WAMP events to an external non-WAMP system e.g. a message broker.
- **Embedded Identity Management & Authentication** - Each realm manages user identity and authentication using multiple WAMP and HTTP authentication methods. Identity data is replicated across the cluster to ensure always-on and low-latency operations.
- **Embedded Role-based Access Control (RBAC)** – Each realm embeds a RBAC subsystem controlling access to realm resources through the definition of groups and the assignment of permissions. RBAC data is replicated across the cluster to ensure always-on and low-latency operations.


