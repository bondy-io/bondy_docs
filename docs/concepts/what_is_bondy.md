---
draft: false
related:
    - type: concepts
      text: What is WAMP
      link: /concepts/what_is_wamp
      description: Find out more about the Web Application Messaging Protocol
---

# What is Bondy

Bondy is an open-source, distributed application networking platform that unifies the capabilities of an event mesh and service mesh into a single, always-on infrastructure component.

## The Problem Bondy Solves

Building distributed applications today means assembling a complex stack of technologies: API gateways, service meshes, message brokers, authentication services, and load balancers. Each component solves part of the puzzle, but together they create integration nightmares, operational complexity, and countless potential points of failure.

Bondy takes a radically different approach. Instead of layering multiple specialized components, it provides everything your distributed application needs in a single platform: authentication, authorization, RPC, Pub/Sub, service discovery, routing, and traffic management—all built on an open standard protocol.

## What Bondy Does

At its core, Bondy creates an application network—a dynamic overlay network that connects all elements of your distributed system. Web browsers, mobile apps, backend microservices, and IoT devices all connect to Bondy and communicate seamlessly, regardless of their location, language, or implementation.

::: definition Application network
An application network is a dynamic [overlay network](https://en.wikipedia.org/wiki/Overlay_network) formed by a set of Bondy nodes that interconnects different types of applications and devices, ranging from web and mobile apps to IoT devices and backend microservices.
:::

<ZoomImg
  src="/assets/bondy_diagram.png"
  caption="Bondy application network"
  width="600"/>

Bondy implements the [Web Application Messaging Protocol (WAMP)](/concepts/what_is_wamp), an open standard that provides:

1. **Authentication** with multiple methods including anonymous, password, cryptosign, and OAuth2
2. **Authorization** through fine-grained Role-Based Access Control (RBAC)
3. **Remote Procedure Calls (RPC)** with service discovery, routing, and traffic management
4. **Publish/Subscribe** for event-driven communication

This combination delivers event and service mesh capabilities in a unified platform. But Bondy goes further, offering additional integration options like an HTTP API Gateway, router bridging (Bondy Edge), and bridges to external message brokers.

## Built for the Real World

Bondy wasn't designed in a lab or as an academic exercise. It was born from practical necessity—we needed a solution that could handle the demands of production distributed systems without drowning us in complexity.

### Open Source and Community-Driven

Bondy is open-source software licensed under Apache 2.0. The [source code](https://github.com/bondy-io/bondy) is freely available, and we welcome contributions from the community. You can use it, extend it, or fork it as your needs dictate.

### Scalable by Design

Scalability isn't an afterthought—it's fundamental to Bondy's architecture. Built on Erlang/OTP, Bondy leverages battle-tested distributed systems technology that powers global telecommunications infrastructure.

A single Bondy node can handle millions of concurrent client connections. Need more capacity? Add nodes. Bondy's masterless architecture means every node is equal—no special leader nodes, no single points of failure, no complicated failover mechanisms.

The distributed routing automatically and efficiently delivers RPC and Pub/Sub messages between clients connected to different nodes in the cluster. As you scale horizontally, throughput scales with you.

### Always-On Architecture

In distributed systems, failure is not an exception—it's the norm. Networks partition, nodes crash, disks fail. Bondy is designed to keep running through all of it.

State replication uses a gossip-based protocol that maintains consistency across the cluster without sacrificing availability. All nodes are equal in the masterless architecture, so there's no leader election, no split-brain scenarios, no complex consensus protocols to understand and debug.

Active anti-entropy continuously repairs missing or divergent state, healing the cluster from node failures, data corruption, or network partitions. When you bring new nodes online, they quickly synchronize with the cluster and begin handling traffic.

The result: high availability even under adverse conditions. Your application keeps running when others would fail.

### Dynamically Adaptive

Bondy adapts to your application in real-time. Cluster formation is automatic and self-healing—nodes discover each other through DNS and maintain connectivity without operator intervention.

Message routing adjusts dynamically as clients connect, disconnect, and move between nodes. Register a new RPC procedure? It's immediately available to all clients across the cluster. Multiple services implement the same procedure? Bondy load-balances calls automatically using configurable strategies.

All of this happens at runtime, with no restarts, no configuration reloads, no service interruptions.

### Truly Polyglot

Bondy clients implement an open protocol that works with multiple programming languages, transport mechanisms, and serialization formats. Your backend services can use Python, your web app JavaScript, your IoT devices C, and your mobile apps Swift or Kotlin—all communicating seamlessly without adapters or translation layers.

Choose WebSocket for browsers, raw TCP for high-performance services, or Unix domain sockets for local IPC. Serialize with JSON for human readability, MessagePack for efficiency, or CBOR for constrained environments. Every client can make its own choices, and they all interoperate.

### Deploy Anywhere

Bondy runs wherever you need it: resource-constrained ARM devices at the edge, VMs in private clouds, containers in Kubernetes, or bare metal in your data center. There are no external dependencies—no distributed database, no key-value store, no service registry, no configuration server.

This independence means your applications survive technology churn. They won't break when Kubernetes evolves, when etcd changes its API, or when the cloud provider deprecates a service. Bondy is self-contained, battle-tested infrastructure that just works.

DNS-based clustering makes deployment straightforward. Whether you're deploying on-premise or in the cloud, spin up your nodes, point them at each other via DNS, and they automatically form a cluster. No complicated orchestration, no manual configuration distribution.

## Why Choose Bondy

### Simplify Development

With Bondy, you use one client library instead of five. One protocol instead of half a dozen. One infrastructure component instead of an entire service mesh, API gateway, and message broker stack.

This isn't just about reducing lines of configuration—it's about reducing cognitive load. Your developers learn one API and use it everywhere: frontend, backend, mobile, IoT. No context switching, no integration code, no impedance mismatch between different messaging patterns.

### Accelerate Delivery

Go from zero to a fully functioning distributed application with a single infrastructure component. No API gateway configuration, no service mesh setup, no message broker clustering. Just connect your clients to Bondy and start building features.

WAMP operations like registering an RPC procedure (including its load balancing strategy) take a single line of code. No YAML manifests, no separate service discovery, no configuration management system. The protocol is the configuration.

### Unlock New Capabilities

Traditional RPC frameworks treat web browsers, mobile apps, and IoT devices as second-class citizens—they can call procedures, but they can't expose them. Bondy's peer-to-peer model changes this.

Now your backend can call procedures on the frontend. Your server can invoke operations on mobile apps or IoT devices. Browser tabs can communicate through the router. These capabilities open up architectural patterns that simply don't exist with conventional protocols.

### Improve Operations

Because Bondy handles sessions, authentication, authorization, and routing centrally, you gain unprecedented visibility into your distributed system. Every interaction flows through the router, making monitoring, debugging, and auditing straightforward.

Fine-grained RBAC at the routing layer means you can control access to procedures and topics without modifying application code. Change a permission, and it takes effect immediately for all active sessions.

### Maintain Independence

Deploy Bondy without external dependencies, vendor lock-in, or technology obsolescence worries. Your application isn't coupled to Kubernetes, Istio, Envoy, or any other specific infrastructure technology.

This independence is liberating. Migrate between cloud providers, move workloads to the edge, or bring everything on-premise—your application's messaging layer remains unchanged.

### Integrate Gradually

You don't need to rewrite everything to use Bondy. The embedded HTTP API Gateway lets you expose your existing HTTP services through Bondy, with OAuth2 authentication and dynamic API definitions using JSON configuration.

Bridges to Kafka and other message brokers enable gradual integration with existing infrastructure. Start with new components using WAMP, integrate legacy systems through bridges, and migrate at your own pace.

## When to Use Bondy

Bondy shines in scenarios where distributed application complexity has become a bottleneck:

### Microservices Architectures

If you're building microservices, you're building a distributed system. Bondy provides the networking layer these architectures need: service discovery, load balancing, RPC, Pub/Sub, authentication, and authorization—all in one platform.

Replace your service mesh, API gateway, and message broker with a single component. Reduce operational complexity while gaining capabilities.

### Multi-Platform Applications

When you have web, mobile, and IoT clients each with its own technology stack, integration becomes expensive. Bondy provides a universal protocol that works everywhere, reducing friction between teams and enabling code reuse.

Frontend and backend teams speak the same language. Mobile developers use the same patterns as backend engineers. IoT firmware and cloud services share the same client library.

### Peer-to-Peer Interactions

Applications requiring server-initiated operations on clients, device-to-device communication, or collaborative real-time interactions need Bondy's peer-to-peer model.

Enable video conferencing where browsers communicate directly through the router. Build IoT systems where devices orchestrate each other. Create collaborative editing where clients coordinate through pub/sub and RPC.

### Edge and Hybrid Deployments

Deploy Bondy at the edge for local processing and failover, with cluster bridging to the cloud for coordination. The same software, same configuration model, same operational characteristics—whether running on a Raspberry Pi or in a data center.

### AI Agent Communication

AI agents need comprehensive communication infrastructure—not just function calling, but event coordination, service discovery, authentication, authorization, and true peer-to-peer capabilities. Bondy provides everything AI agent systems require:

- **Complete agent platform** - RPC, Pub/Sub, security, and discovery in one protocol
- **True peer-to-peer** - Agents expose and consume capabilities symmetrically
- **Sophisticated coordination** - Multi-agent workflows, event-driven reactions, collaborative problem-solving
- **Production-ready infrastructure** - Scale to millions of agents with proven reliability

Unlike emerging agent protocols like MCP that offer partial solutions, Bondy delivers the full stack that sophisticated multi-agent systems demand. From multi-agent LLM systems to agentic workflow automation to distributed AI inference, Bondy's WAMP foundation provides capabilities that limited agent protocols are only beginning to address.

[Learn more about WAMP for AI agents](/concepts/what_is_wamp#wamp-for-the-ai-age-agent-to-agent-communication).

## Bondy vs. Alternatives

Unlike traditional application messaging solutions, Bondy offers both RPC and Pub/Sub as first-class patterns, routed through a distributed, highly available infrastructure with built-in security.

**Compared to Service Meshes**: Service meshes like Istio focus on service-to-service HTTP/gRPC traffic and require Kubernetes, sidecars, and external dependencies. Bondy provides a peer-to-peer programming model, works anywhere, and includes Pub/Sub natively.

**Compared to Message Brokers**: Message brokers like RabbitMQ and Kafka excel at pub/sub but treat RPC as an afterthought. Bondy provides both patterns equally, with authentication and authorization built in.

**Compared to API Gateways**: API gateways expose backend services to external clients but don't help with service-to-service communication or events. Bondy handles North-South and East-West traffic uniformly.

**Compared to Multiple Components**: Most architectures combine several of the above. Bondy replaces them all with a single platform, reducing integration complexity and operational overhead.

::: info Like a distributed D-Bus over a network
[D-Bus](https://en.wikipedia.org/wiki/D-Bus) is a platform-neutral messaging service in Linux distributions that offers RPC and Pub/Sub for inter-process communication on a single host.

Bondy extends this model across the network and across hosts, providing the same unified messaging patterns for distributed applications that D-Bus provides for local processes.
:::

## The Technology Behind Bondy

Bondy is built on Erlang/OTP, the runtime system that powers telecommunications infrastructure handling billions of calls daily. This foundation provides:

- **Massive concurrency** - Millions of lightweight processes
- **Fault tolerance** - "Let it crash" philosophy with supervisor trees
- **Distribution** - Built-in clustering and communication primitives
- **Hot code loading** - Update code without stopping the system
- **Soft real-time** - Predictable latency and throughput

For clustering and routing, Bondy uses [Partisan](https://partisan.dev), a high-performance alternative to Erlang's standard distribution. Partisan enables different network topologies, with current support for full-mesh configurations scaling to hundreds of nodes. Future versions will support peer-to-peer topologies based on HyParView, proven to scale to thousands of nodes.[^topo]

[^topo]: Bondy uses [Partisan](https://partisan.dev), which allows different network topologies. Currently, Bondy deploys using full-mesh topology, scaling to hundreds of nodes. A peer-to-peer topology based on Partisan HyParView is in development, proven to scale up to 2,000 nodes. Partisan is maintained by the same team that created Bondy.

## Getting Started

Ready to simplify your distributed application architecture?

- **Learn the concepts**: Understand [WAMP](/concepts/what_is_wamp) and [Bondy's architecture](/concepts/architecture)
- **See it in action**: Follow the [getting started tutorial](/tutorials/getting_started/marketplace)
- **Deploy it**: Check out the [deployment guides](/guides/deployment/running_a_cluster)
- **Get support**: Join the [community forum](https://github.com/bondy-io/bondy/discussions)

Bondy brings sanity back to distributed application development. It won't solve every problem—essential complexity remains—but it eliminates the accidental complexity that has plagued the industry for too long.

Simple. Powerful. Open source. That's Bondy.
