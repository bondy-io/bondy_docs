---
draft: false
related:
    - type: concepts
      text: What is WAMP
      link: /wamp/concepts/what_is_wamp
      description: Find out more about the Web Application Messaging Protocol
---

# What is Bondy

Bondy is an open-source, distributed application networking platform that unifies the capabilities of an event mesh and a service mesh into a single, always-on infrastructure component.

## The problem Bondy addresses

A distributed application typically assembles several separate components to cover authentication, authorization, RPC, Pub/Sub, service discovery, routing, and traffic management: an API gateway, a service mesh, a message broker, an identity provider, a load balancer. Each covers part of the problem; integrating them is where most of the operational complexity lives.

Bondy provides all of the above from a single platform, built on one open standard protocol, rather than composing several specialized components.

## What Bondy does

At its core, Bondy creates an application network — a dynamic overlay network that connects the elements of a distributed system: web browsers, mobile apps, backend microservices, and IoT devices all connect to Bondy and communicate over one protocol, regardless of location, language, or implementation.

::: definition Application network
An application network is a dynamic [overlay network](https://en.wikipedia.org/wiki/Overlay_network) formed by a set of Bondy nodes that interconnects different types of applications and devices, ranging from web and mobile apps to IoT devices and backend microservices.
:::

<ZoomImg
  src="/assets/bondy_diagram.png"
  caption="Bondy application network"
  width="600"/>

Bondy implements the [Web Application Messaging Protocol (WAMP)](/wamp/concepts/what_is_wamp), an open standard that provides:

1. **Authentication** with multiple methods including anonymous, password, cryptosign, and OAuth2
2. **Authorization** through fine-grained Role-Based Access Control (RBAC)
3. **Remote Procedure Calls (RPC)** with service discovery, routing, and traffic management
4. **Publish/Subscribe** for event-driven communication

This combination gives Bondy the capabilities of both an event mesh and a service mesh in one platform. It also provides an HTTP API Gateway, router bridging (Bondy Edge), and bridges to external message brokers for integrating with infrastructure that predates it.

## Open source

Bondy is licensed under Apache 2.0. The [source code](https://github.com/bondy-io/bondy) is publicly available on GitHub.

## Architecture properties

### Scaling

Bondy is built on Erlang/OTP. A single Bondy node handles millions of concurrent client connections; adding nodes adds capacity. Every node in a cluster is equal — there is no leader node and no leader election.

Distributed routing delivers RPC and Pub/Sub messages between clients connected to different nodes in the cluster automatically, so throughput scales as nodes are added. See [Architecture](/router/concepts/architecture) for the mechanism.

### Availability

State replication uses an anti-entropy protocol that maintains consistency across the cluster without requiring a consensus round on every write. All nodes being equal means there is no leader election and no split-brain scenario.

Active anti-entropy continuously repairs missing or divergent state after node failures, data corruption, or network partitions, so a new node synchronizes with the cluster and begins handling traffic without manual intervention. See [Clustering](/router/concepts/clustering) for the full mechanism.

### Cluster formation

Cluster formation is automatic: nodes discover each other through DNS (or another configured discovery mechanism) and maintain connectivity without operator intervention.

Message routing adjusts as clients connect, disconnect, and move between nodes: a newly registered RPC procedure is immediately callable from any node in the cluster, and Bondy load-balances calls across multiple providers of the same procedure using a configurable strategy. None of this requires a restart or a configuration reload.

### Client language and transport independence

Bondy's clients implement an open protocol available in multiple programming languages, over multiple transports, with multiple serialization formats. A backend service in Python, a web app in JavaScript, an IoT device in C, and a mobile app in Swift or Kotlin can all attach to the same realm and interoperate without an adapter or translation layer between them.

Clients choose WebSocket, raw TCP, or Unix domain sockets as a transport, and JSON, MessagePack, or CBOR as a serialization format, independently of each other.

### Deployment

Bondy runs on resource-constrained ARM devices at the edge, in VMs, in containers, or on bare metal, with no external dependencies — no separate distributed database, key-value store, service registry, or configuration server to operate alongside it.

## When to use Bondy

### Microservices architectures

A microservices architecture is a distributed system, and Bondy provides its networking layer: service discovery, load balancing, RPC, Pub/Sub, authentication, and authorization in one platform, in place of a separate service mesh, API gateway, and message broker.

### Multi-platform applications

Where web, mobile, and IoT clients each have their own technology stack, Bondy gives them a single protocol to integrate through, so frontend, backend, mobile, and firmware code can share the same client-side patterns.

### Peer-to-peer interactions

WAMP's routed RPC lets any client act as both Caller and Callee, so applications that need server-initiated operations on clients, device-to-device communication, or collaborative real-time interaction — video conferencing signalling, IoT device orchestration, collaborative editing — can be built directly on Bondy's peer-to-peer model, without a side-channel back to the client.

### Edge and hybrid deployments

The same Bondy release runs at the edge (for local processing and failover during a network partition) and in the cloud (for coordination), with cluster bridging connecting the two.

### AI agent communication

An AI agent system needs more than function calling: event coordination, service discovery, authentication, and authorization, plus the ability for an agent to expose capabilities as well as consume them. WAMP's routed RPC and Pub/Sub, combined with Bondy's RBAC, cover all of this in one protocol rather than requiring it to be assembled separately. See [WAMP for AI agents](/wamp/concepts/what_is_wamp#wamp-for-agent-to-agent-communication) for the detailed comparison against agent-specific protocols such as MCP.

## Bondy compared to alternatives

Bondy offers both RPC and Pub/Sub as first-class patterns, routed through a distributed, highly available infrastructure with built-in security — where most alternatives specialize in one dimension:

**Service meshes** (e.g. Istio) focus on service-to-service HTTP/gRPC traffic and require Kubernetes and sidecars. Bondy provides a peer-to-peer programming model, runs without a container orchestrator, and includes Pub/Sub natively.

**Message brokers** (e.g. RabbitMQ, Kafka) are built around Pub/Sub; RPC is not a first-class pattern. Bondy provides both, with authentication and authorization built in.

**API gateways** expose backend services to external clients but don't address service-to-service communication or events. Bondy handles both north-south and east-west traffic through the same router.

Most architectures combine several of the components above; Bondy is intended to replace that combination with one platform.

::: info Like a distributed D-Bus over a network
[D-Bus](https://en.wikipedia.org/wiki/D-Bus) is a platform-neutral messaging service in Linux distributions that offers RPC and Pub/Sub for inter-process communication on a single host.

Bondy extends the same idea across the network and across hosts: one set of messaging patterns for RPC and Pub/Sub, available to every process in a distributed application the way D-Bus makes them available to every process on one host.
:::

## The technology behind Bondy

Bondy is built on Erlang/OTP, the runtime that also underlies telecommunications infrastructure handling large call volumes. This provides:

- **Massive concurrency** — millions of lightweight processes per node
- **Fault isolation** — a "let it crash" supervision model, where a failing process is restarted in isolation rather than taking down the node
- **Distribution primitives** — clustering and inter-node communication built into the runtime
- **Hot code loading** — code can be updated without stopping the node
- **Soft real-time scheduling** — predictable latency and throughput under load

For clustering and routing, Bondy uses [Partisan](https://partisan.dev) in place of Erlang's standard distribution protocol. Partisan supports multiple network topologies; Bondy currently deploys a full-mesh topology, scaling to hundreds of nodes.[^topo]

[^topo]: A peer-to-peer topology based on Partisan's HyParView implementation, intended to scale to thousands of nodes, is in development. Partisan is maintained by the same team that builds Bondy.

## Next steps

- [WAMP](/wamp/concepts/what_is_wamp) and [Architecture](/router/concepts/architecture) — the concepts behind the protocol and the platform.
- [Getting started tutorial](/router/tutorials/getting_started/marketplace) — build something with Bondy.
- [Deployment guides](/router/guides/deployment/running_a_cluster) — run a cluster.
- [Community forum](https://github.com/bondy-io/bondy/discussions) — ask a question.
