---
draft: true
related:
    - type: concepts
      text: What is WAMP
      link: /concepts/what_is_wamp
      description: Find out more about the Web Application Messaging Protocol
---

# What is Bondy
Bondy is an open source, always-on and scaleable **application networking platform** connecting all elements of a distributed application—offering event and service mesh capabilities combined.

## What does Bondy do?
Bondy enables application messages to be routed between Internet-connected devices such as browsers, phones, servers and IoT (Internet of Things) devices in realtime.

Bondy route messages using the two most used application communication patterns:
* Remote Procedure Calls (RPC), for point-to-point request-response message exchange, and;
* Publish/Subscribe, for one-to-many asynchronous messages

## Why should I use Bondy?
<!-- Key Benefits -->
Bondy will provide you a number of benefits when compared to the alternative of mix and matching the services required by a distributed application i.e.  Service mesh, Event mesh, HTTP API Gateway, Authentication and Authorization services.

- **Reduce development time and accidental complexity**<br>By providing the capabilities of an event and a service mesh combined, Bondy can be used for the entire messaging requirements of a distributed application thus **reducing technology stack complexity, as well as networking overheads**. With Bondy you need a single client library and a single infrastructure component. Bondy also takes care of Authentication and Authorization, further reducing the number of client libraries and infrastructure components you need to use, maintain and manage.
- **Reduce development time**<br>When using WAMP, all operations such as registering an RPC (together with its characteristics like timeout, load balancing strategy, etc) can be done in a single line of code using the programming language of your choice. No external tools required e.g. YAML. Using WAMP on a mobile app works exactly the same as in a microservice. As a result, this reduces friction and accelerates the learning curve amogst front- and back-end dev teams.
- **Unleash the power of distributed computing**<br>As opposed to traditional RPC frameworks where Web, Mobile Apps and constraint IoT devices cannot act as RPC servers, Bondy offers a **peer-to-peer programming model**, where all of them  can be both an RPC client (Caller) and an RPC server (Callee). This enables new kind of interactions between components that were not possible before e.g. a server calling an RPC on a Web App, Mobile App or constraint IoT device.
- **Better scalability and always-on**<br>A Bondy cluster using the full-mesh topology can grow to hundreds of nodes and guarantees only one hop is required to reach any other node in the cluster[^topo]. While using the peer-to-peer topology (partial mesh) a Bondy cluster could scale to thousands of nodes while intelligently reducing the number of hops required.
- **Deploy anywhere**<br>Bondy can be deployed anywhere from resource-constrained AMD64/ARM64 edge devices to private, hybrid and public clouds running bare metal, virtual machines, containers and container orchestration platforms e.g. Kubernetes.
- **No external dependencies**<br>Unlike most service meshes which depend on external technologies like Kubernetes, Istio, Envoy, Etcd or a distributed database, Bondy does not have any external dependecies. This means your distributed applications will survive beyond the lifespan of all those technologies.
- **Integration features for brownfield scenarios**<br>Bondy embeds an HTTP API Gateway which can host multiple APIs dynamically defined using a JSON-based declarative configuration syntax and offering OAuth2 authentication services. This allows the integration of existing HTTP clients and servers faciliting the adoption of Bondy in to your existing architecture. Bondy also provides a Kafka bridge and will provide additional bridges to other technologies.



## Understanding key concepts


## Bondy vs. other application networking solutions
Bondy is a **reliable application message router, designed for availability and scalability**. It scales horizontally and vertically to support a high number of concurrent clients while maintaining low latency and fault tolerance. As opposed to mainstream messaging solutions Bondy **offers both routed Remote Procedure Call (RPC) and Publish & Subscribe communication patterns**.


::: info Like a distributed D-Bus over a network
[D-Bus](https://en.wikipedia.org/wiki/D-Bus) is a platform-neutral messaging service that runs by default in most Linux distributions. As Bondy, it offers RPC and Pub-Sub, but whereas  D-Bus is designed for inter-process communication (IPC) on a single host, Bondy is designed to be distributed over a set of hosts (cluster) and used over a network.
:::

<ZoomImg src="/assets/bondy_diagram.png"/>

## Key Characteristics

- **Open Source**<br>Bondy is open source software licensed under the Apache License Version 2.0. The source code is available on [Github](https://github.com/bondy-io/bondy).
- **Scalable**<br>Bondy was designed from the ground up as a distributed router. It can leverage different network topologies for data replication and routing allowing it to scale to thousands of nodes[^topo]. Bondy is written in Erlang/OTP which offers unprecedented soft real-time, high concurrency and self-healing capabilities. A single node can handle millions of concurrent client connections.
- **Always-on**<br>Bondy replicates state across the cluster using a masterless architecture (all nodes are equal) and a gossip-based eventually consistent reliable state dissemination protocol which keeps state synchronised across nodes in the cluster without compromising availability. In addition, Bondy uses active anti-entropy to repair missing or divergent state as a result of node failure, physical data loss or corruption, and quickly bring additional nodes up-to-date. The combination of these features allow Bondy to be highly available even under network partitions, message loss and node failures.
- **Dynamic**<br>Bondy offers dynamic message routing automatically and efficiently delivering RPC and Publish/Subscribe messages between clients connected to separate nodes in the cluster. Clustering formation is automatic and self-healing which saves operators the hassle of maintaining cluster connectivity.
- **Multi-protocol**<br>Bondy implements the Web Application Messaging Protocol (WAMP) v2.0. WAMP is a routed protocol that provides two messaging patterns: Publish & Subscribe (Publish/Subscribe) and routed Remote Procedure Calls (RPC) over TCP/IP or WebSockets, and offers data transcoding support for several formats. Having a core that supports both RPC and Publish/Subscribe allows Bondy to evolve to a multi-protocol RPC and Publish/Subscribe router. As a result, Bondy already provides an HTTP Gateway to declaratively define and deploy REST APIs that dynamically translate to the underlying WAMP counterparts.
- **Easy to deploy anywhere**<br>Bondy can be deployed anywhere from resource-constrained AMD64/ARM64 edge devices to private, hybrid and public clouds running bare metal, virtual machines and containers. Bondy provides out-of-the-box automatic clustering formation based on DNS which allows deploying a cluster on one go.


[^topo]: At the moment Bondy can onlyn be deployes using the full-mesh topology that can scale to hundreds of nodes. A peer-to-peer (partial mesh) topology is in development using an implementation that has been proven to scale up to 2,000 nodes.