---
draft: true
related:
    - type: concepts
      text: What is WAMP
      link: /concepts/what_is_wamp
      description: Find out more about the Web Application Messaging Protocol
---

# What is Bondy

> Bondy is an open source, always-on and scaleable application networking platform connecting all elements of a distributed application—offering event and service mesh capabilities combined.
> It enables data to be routed between Internet-connected devices such as browsers, phones, servers and IoT (Internet of Things) devices in realtime.{.definition}

## What does Bondy do?

## Why should I use Bondy?

## Understanding key concepts

## Bondy vs. other application networking solutions


By providing these two application communication patterns and the capabilities of an event and a service mesh combined, Bondy can be used for the entire messaging requirements of a distributed system thus **reducing technology stack complexity, as well as networking overheads**.

Bondy is a **reliable application message router, designed for availability and scalability**. It scales horizontally and vertically to support a high number of concurrent clients while maintaining low latency and fault tolerance. As opposed to mainstream messaging solutions Bondy **offers both routed Remote Procedure Call (RPC) and Publish & Subscribe communication patterns**.


::: info Like a distributed D-Bus over a network
[D-Bus](https://en.wikipedia.org/wiki/D-Bus) is a platform-neutral messaging service that runs by default in most Linux distributions. As Bondy, it offers RPC and Pub-Sub, but whereas Bondy is designed for be distributed over a set of hosts (cluster) and used over a network, D-Bus is designed for inter-process communication (IPC) on a single host.
:::

<ZoomImg src="/assets/bondy_diagram.png"/>

## Key Characteristics

- **Open Source**<br>Bondy is open source software licensed under the Apache License Version 2.0. The source code is available on [Github](https://github.com/Leapsight/bondy).
- **Scalable**<br>Bondy was designed from the ground up as a distributed router and broker. It can leverage different network topologies for data replication and routing allowing it to scale to thousands of nodes.  Bondy is written in Erlang/OTP which offers unprecedented soft real-time, high concurrency and self-healing capabilities. A single node can handle millions of concurrent client connections.
- **Dynamic**<br>Bondy offers dynamic message routing automatically and efficiently delivering RPC and PubSub messages between clients connected to separate nodes in the cluster. Clustering formation is automatic and self-healing which saves operators the hassle of maintaining cluster connectivity.
- **Always-on**<br>Bondy replicates state across the cluster using a masterless architecture (all nodes are equal) and a gossip-based eventually consistent reliable state dissemination protocol which keeps state synchronised across nodes in the cluster without compromising availability. In addition, Bondy uses active anti-entropy to repair missing or divergent state as a result of node failure, physical data loss or corruption, and quickly bring additional nodes up-to-date. The combination of these features allow Bondy to be highly available even under network partitions, message loss and node failures.
- **Multi-protocol**<br>Bondy implements the Web Application Messaging Protocol (WAMP) v2.0. WAMP is a routed protocol that provides two messaging patterns: Publish & Subscribe (PubSub) and routed Remote Procedure Calls (RPC) over TCP/IP or WebSockets, and offers data transcoding support for several formats. Having a core that supports both RPC and PubSub allows Bondy to evolve to a multi-protocol RPC and PubSub router. As a result, Bondy already provides an HTTP Gateway to declaratively define and deploy REST APIs that dynamically translate to the underlying WAMP counterparts.
- **Easy to deploy anywhere**<br>Bondy can be deployed anywhere from resource-constrained x86/ARM edge devices to private, hybrid and public clouds running bare metal, virtualisation or containers. Bondy provides out-of-the-box automatic clustering formation based on DNS which allows deploying a cluster on one go.

## Key Benefits

- **Reduce development time and accidental complexity**<br>Avoid the need to use a combination of protocols to support PubSub and RPC in your microservices or translate those to REST/HTTP for you web and mobile apps. With Bondy all elements of the application can communicate using a single underlying WAMP API while still leveraging different transports and encodings per client and even declaratively define a REST/HTTP API internally and externally.
- **Better scalability and reduced latency**<br>A Bondy cluster can scale to hundreds of nodes by leveraging different network topologies for communication. A full-mesh topology  guarantees only one hop is required to reach any node in the cluster, while more a peer-to-peer topology can maintain smaller groups of interconnected nodes to enable the whole cluster to grow larger while intelligently reducing the number of hops required.
- **Build and deploy REST APIs in no time thanks to Bondy REST Gateway**<br>Bondy embeds an HTTP Gateway which can host multiple APIs defined declaratively using a JSON specification format. The specification allows the developer to map an HTTP verbs and nouns to a WAMP actions. The Gateway offers seemless integration to Bondy's security subsystem exposing an OAUTH2 API. API Specifications are synchronised to all Bondy nodes in real-time.
- **Deploy anywhere**<br>Bondy can be deployed anywhere from resource-constrained x86/ARM edge devices to private, hybrid and public clouds running bare metal, virtualisation or containers.

