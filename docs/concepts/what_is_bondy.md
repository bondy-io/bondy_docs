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
Bondy routes application messages between Internet-connected devices such as browsers, phones, servers and IoT (Internet of Things) devices in realtime by creating an application network.

::: definition Application network
An application network is a dynamic [overlay network](https://en.wikipedia.org/wiki/Overlay_network) formed by one or several Bondy nodes (a Bondy cluster) and software running on the connected devices (embedding a client library that speaks a protocol supported by Bondy).
:::

<ZoomImg src="/assets/bondy_diagram.png" caption="Bondy application network"/>

At its core, Bondy implements the [Web Application Messaging Protocol (WAMP)](/concepts/what_is_wamp) an open protocol that unifies the **key services required by every distributed application**:
1. **Authentication**, providing multiple authentication methods
1. **Authorization**, providing a fine-grained Role-based Access Control system
1. **Remote Procedure Calls (RPC)** incl. Service Discovery, Routing and Traffic management
1. **Publish/Subscribe** routing

As a result, Bondy offers event and service mesh capabilities combined. But as you will learn in the following sections, Bondy goes further by providing an HTTP API Gateway, Router bridging (a.k.a. Bondy Edge) and additional integration capabilities.


### Key Characteristics

- **Open Source**<br>Bondy is open source software licensed under the Apache License Version 2.0. The source code is available on [Github](https://github.com/bondy-io/bondy).
- **Scalable**<br>Bondy was designed from the ground up as a distributed router. It can leverage different network topologies for data replication and routing allowing it to scale to thousands of nodes[^topo]. Bondy is written in Erlang/OTP which offers unprecedented soft real-time, high concurrency and self-healing capabilities. A single node can handle millions of concurrent client connections.
- **Always-on**<br>Bondy replicates state across the cluster using a masterless architecture (all nodes are equal) and a gossip-based eventually consistent reliable state dissemination protocol which keeps state synchronised across nodes in the cluster without compromising availability. In addition, Bondy uses active anti-entropy to repair missing or divergent state as a result of node failure, physical data loss or corruption, and quickly bring additional nodes up-to-date. The combination of these features allow Bondy to be highly available even under network partitions, message loss and node failures.
- **Dynamic**<br>Bondy offers dynamic message routing automatically and efficiently delivering RPC and Publish/Subscribe messages between clients connected to separate nodes in the cluster. Clustering formation is automatic and self-healing which saves operators the hassle of maintaining cluster connectivity.
- **Easy to deploy anywhere**<br>Bondy can be deployed anywhere from resource-constrained AMD64/ARM64 edge devices to private, hybrid and public clouds running bare metal, virtual machines and containers. Bondy provides out-of-the-box automatic clustering formation based on DNS which allows deploying a cluster on one go.

## Why should I use Bondy?
<!-- Key Benefits -->
Bondy will provide you a number of benefits when compared to the alternative of integrating and matching individual (partial) implementations of the services required by a distributed application.

- **Simplify development by removing accidental complexity**<br>By providing the capabilities of an event and a service mesh combined—thanks to its [WAMP](/concepts/what_is_wamp) core—Bondy can be used for the entire messaging requirements of a distributed application thus **reducing technology stack complexity, as well as networking overheads**. With Bondy you need a single client library and a single infrastructure component. Bondy also takes care of Authentication and Authorization, further reducing the number of client libraries and infrastructure components you need to use, maintain and manage.
- **Improve productivity**<br>With Bondy you can go from zero to fully-functioning distributed app with a single infrastructure component. This is because using WAMP on a Web or Mobile app works exactly the same as in a microservice which reduces the need for additional gateways and adapters. This also provides a universal language between frontend, backend and embedded dev teams. Moreover, WAMP operations such as registering an RPC (together with its configuration e.g. load balancing strategy) can be done in a single line of code without external tools e.g. YAML, Service Discovery service.
- **Unleash the power of distributed computing**<br>As opposed to traditional [RPC](https://en.wikipedia.org/wiki/Remote_procedure_call) frameworks where Web, Mobile Apps and constraint IoT devices cannot act as RPC servers, Bondy offers a **peer-to-peer programming model**, where all of them  can be both an RPC client (Caller) and an RPC server (Callee). This enables new kind of interactions between components that were not possible before e.g. a server calling an procedure on a Web App, Mobile App or IoT device.
- **Improve manageability and observability**<br>Because Bondy manages session creation, authentication, authorization and routing for RPC and Publish/Subscribe messages.
- **Deploy anywhere without external dependencies**<br>Bondy can be deployed anywhere from resource-constrained AMD64/ARM64 edge devices to private, hybrid and public clouds running bare metal, virtual machines, containers and container orchestration platforms e.g. Kubernetes. Unlike most service meshes which depend on external technologies like Kubernetes, Istio, Envoy, Etcd or a distributed database, Bondy does not have any external dependecies. This means your distributed applications will survive beyond the lifespan of all those technologies.
- **Integrate it in your existing architecture**<br>Bondy embeds an HTTP API Gateway which can host multiple APIs dynamically defined using a JSON-based declarative configuration syntax and offering OAuth2 authentication services. This allows the integration of existing HTTP clients and servers faciliting the adoption of Bondy into your existing architecture. Bondy also provides a Kafka bridge and will provide additional bridges to other technologies.

## When should I consider using Bondy

[^cmeik]: Christopher Meiklejohn, Strangeloop 2022 [Resilient Microservices without the Chaos](https://www.youtube.com/watch?v=F32peAwCPlM)

You should consider using Bondy when:

* You are developing and application that uses the [microservices architectural](/reference/glossary#microservices-architecture) style.
* You have multiple user touch-points each running its own technology stack e.g. Web, Mobile, IoT Device, yet you want to reduce friction between dev teams by using a common universal protocol while still being able to integrate legacy components.
* You want to enable new type of component interactions that are only possible using a peer-to-peer programming model e.g. a Web, Mobile apps or IoT device as callees (RPC servers).

Read more in [Why Bondy](/concepts/why_bondy).


## Bondy vs. other application networking solutions
Bondy is a **reliable application message router, designed for availability and scalability**. It scales horizontally and vertically to support a high number of concurrent clients while maintaining low latency and fault tolerance. As opposed to mainstream messaging solutions Bondy **offers both routed Remote Procedure Call (RPC) and Publish & Subscribe communication patterns**.

Learn more in the [How is Bondy different](/concepts/how_is_bondy_different) section.

::: info Like a distributed D-Bus over a network
[D-Bus](https://en.wikipedia.org/wiki/D-Bus) is a platform-neutral messaging service that runs by default in most Linux distributions. As Bondy, it offers RPC and Pub-Sub, but whereas  D-Bus is designed for inter-process communication (IPC) on a single host, Bondy is designed to be distributed over a set of hosts (cluster) and used over a network.
:::


[^topo]: At the moment Bondy can onlyn be deployes using the full-mesh topology that can scale to hundreds of nodes. A peer-to-peer (partial mesh) topology is in development using an implementation that has been proven to scale up to 2,000 nodes.