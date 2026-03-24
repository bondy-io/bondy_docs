---
draft: false
related:
    - text: What is Bondy
      type: concepts
      link: /concepts/what_is_bondy
      description: Overview of Bondy's capabilities and use cases.
    - text: What is WAMP
      type: concepts
      link: /concepts/what_is_wamp
      description: Understanding the Web Application Messaging Protocol.
    - text: Architecture
      type: concepts
      link: /concepts/architecture
      description: Deep dive into Bondy's distributed architecture.
---
# How is Bondy Different

Bondy provides a unique combination of features that sets it apart from other application networking solutions. This document offers an objective comparison with WAMP routers, message brokers, RPC frameworks, and service meshes to help you understand where Bondy fits in the distributed systems landscape.

## Understanding the Comparison

Bondy occupies a unique position in the distributed systems ecosystem:

- **As a WAMP router**: Bondy competes with other WAMP implementations like Crossbar.io
- **As a message broker**: Bondy provides pub/sub capabilities comparable to NATS, Kafka, RabbitMQ, and Pulsar
- **As an RPC framework**: Bondy offers routed RPC similar to gRPC but with built-in service discovery
- **As a service mesh**: Bondy provides application-level routing, security, and observability like Istio

The key difference: Bondy unifies all these capabilities in a single platform based on an open standard protocol (WAMP).

## Bondy vs. Other WAMP Routers

### Crossbar.io

Crossbar.io is the most well-known WAMP router, created by the team that designed WAMP. Here's how Bondy differs:

**Architecture:**
- **Crossbar.io**: Single-node router written in Python, with clustering available only in commercial Crossbar.io FX offering
- **Bondy**: Distributed-first architecture written in Erlang/OTP with open-source masterless clustering

**Scalability:**
- **Crossbar.io**: Scales to hundreds of thousands of connections per node; horizontal scaling requires commercial version
- **Bondy**: Scales to millions of connections per node; horizontal scaling via clustering is built-in and open-source

**Operational Model:**
- **Crossbar.io**: Requires configuration files and restarts for changes; dynamic configuration in commercial version
- **Bondy**: All configuration is dynamic via APIs; no restarts required for realm, user, or permission changes

**Data Replication:**
- **Crossbar.io**: No built-in state replication in open-source version
- **Bondy**: Embedded globally-replicated database using epidemic broadcast trees; all configuration and control plane data replicated across cluster

**Additional Features:**
- **Crossbar.io**: Strong application component hosting, extensive protocol bridges
- **Bondy**: Embedded HTTP API Gateway, Same Sign-On, Kafka bridge, no external dependencies

**When to Choose:**
- **Crossbar.io**: Single-node deployments, Python ecosystem, need extensive protocol bridges, commercial support available
- **Bondy**: Distributed deployments, high availability requirements, operational simplicity, Erlang/OTP benefits, no vendor lock-in

### Autobahn

Note: Autobahn is a **client library**, not a router. All WAMP router functionality was separated into Crossbar.io. Autobahn provides excellent client implementations for Python, JavaScript, and other languages that work with any WAMP router including Bondy.

## Bondy vs. Message Brokers and Streaming Platforms

The following comparisons are based on documented features from official sources and recent 2024 information.

::: info Attribution
This comparison includes NATS, Apache Kafka, RabbitMQ, Apache Pulsar, and gRPC. The structure is inspired by the [Compare NATS](https://docs.nats.io/compare-nats) documentation, with content updated for accuracy and objectivity.
:::

### Language and Platform Coverage

|Project|Client Support|
|---|---|
|**Bondy**|36+ known WAMP client libraries across 21+ programming languages (community-contributed). Runs on any platform supporting Erlang/OTP: Linux, macOS, Windows, FreeBSD, ARM devices.|
|**NATS**|Core NATS: 48+ client types (11 maintainer-supported, 18+ community). NATS Streaming: 7 maintainer-supported, 4 community. Servers compile on Golang-supported architectures with binary distributions available.|
|**gRPC**|13 officially supported languages. Servers and clients available for most platforms. Requires HTTP/2 support.|
|**Kafka**|18+ client types (community and Confluent-supported). Requires JVM; runs on any platform with Java support. Very wide deployment base.|
|**Pulsar**|7 official client languages, 5 third-party clients. Tested on macOS and Linux. Requires JVM.|
|**RabbitMQ**|10+ maintainer-supported clients, 50+ community clients. Servers run on Linux, Windows, macOS, and other platforms supporting Erlang/OTP.|

### Built-in Communication Patterns

|Project|Patterns and Features|
|---|---|
|**Bondy**|**Routed RPC** (first-class with URI-based discovery, call timeouts, cancellation, multiple invocation policies, failover) + **Pub/Sub** (pattern-based subscriptions, event retention, filtering). Unified in single protocol. Payload pass-through mode supported.|
|**NATS**|**Pub/Sub** (core messaging) + **Request-Reply** (built-in) + **Queue Groups** (load balancing). JetStream adds persistence, replay, and exactly-once semantics. Dynamic request permissioning supported.|
|**gRPC**|**RPC only** (unary and streaming semantics). One service per channel. Load balancing requires client-side logic or external proxy. No built-in pub/sub; must use separate system.|
|**Kafka**|**Pub/Sub** (streaming model with consumer groups for load balancing). Request-reply requires application code to correlate messages across topics. Primarily designed for event streaming and log aggregation.|
|**Pulsar**|**Pub/Sub** (streaming model with multiple consumer patterns). Request-reply requires application code to correlate messages. Strong multi-tenancy support.|
|**RabbitMQ**|**Pub/Sub** (AMQP model) + **Work Queues** (load balancing) + **Direct Reply-To** (RPC pattern). Applications must correlate request-reply messages.|

### Delivery Guarantees

|Project|Guarantees|
|---|---|
|**Bondy**|Currently: at-most-once. Roadmap: at-least-once and exactly-once delivery for critical operations (trust levels feature).|
|**NATS**|Core: at-most-once. JetStream: at-least-once and exactly-once available.|
|**gRPC**|At-most-once (depends on underlying transport and application retry logic).|
|**Kafka**|At-least-once (default), exactly-once semantics available for producer-to-consumer scenarios.|
|**Pulsar**|At-most-once, at-least-once, and exactly-once (with deduplication).|
|**RabbitMQ**|At-most-once (default), at-least-once with acknowledgments and publisher confirms.|

### Multi-Tenancy and Isolation

|Project|Multi-Tenancy Support|
|---|---|
|**Bondy**|**True multi-tenancy through WAMP Realms**. Each realm has independent routing tables, authentication, authorization (RBAC), and user management. Same Sign-On allows shared credentials across realms. Zero overhead—realms are virtual isolation boundaries.|
|**NATS**|**True multi-tenancy through Accounts**. Each account can define shared streams/services across accounts. Decentralized security model.|
|**gRPC**|No built-in multi-tenancy. Must implement at application level or use external service mesh.|
|**Kafka**|No native multi-tenancy. Can use separate clusters or topic naming conventions. KRaft improves isolation over ZooKeeper model.|
|**Pulsar**|**Multi-tenancy through Tenants**. Built-in concept with separate authentication/authorization per tenant. No built-in data sharing across tenants.|
|**RabbitMQ**|**Virtual hosts (vhosts)** provide isolation. No built-in data sharing across vhosts.|

### Authentication

|Project|Authentication Methods|
|---|---|
|**Bondy**|WAMP-Cryptosign (public key), WAMP-Ticket (JWT), WAMP-CRA (challenge-response), Password (salted/hashed), OAuth2 (via HTTP Gateway), Trust (IP-based), Anonymous. All methods support CIDR restrictions.|
|**NATS**|TLS, NATS credentials, NKEYS (ED25519), username/password, simple token. NATS 2.0+ decentralized security model.|
|**gRPC**|TLS/mTLS, token-based, per-call credentials, channel credentials, pluggable authentication mechanism.|
|**Kafka**|Kerberos, TLS/SSL, SASL (PLAIN, SCRAM), OAuth. Integrates with JAAS. KRaft mode reduces dependency on ZooKeeper.|
|**Pulsar**|TLS, Athenz, Kerberos, JSON Web Token (JWT). Pluggable authentication.|
|**RabbitMQ**|TLS/mTLS, SASL, username/password, x509 certificates. Pluggable authentication backends.|

### Authorization

|Project|Authorization Model|
|---|---|
|**Bondy**|**Fine-grained RBAC** at realm level. Per-user permissions for register, call, subscribe, publish on URI patterns (exact, prefix, wildcard). CIDR restrictions. Authorization happens at routing layer before message delivery.|
|**NATS**|Account limits (connections, message size, imports/exports). User-level pub/sub permissions, CIDR restrictions, time-of-day restrictions.|
|**gRPC**|No built-in authorization. Requires application-level implementation or external policy engine (e.g., OPA). Can use call credentials per-RPC.|
|**Kafka**|**JAAS-based ACLs** for topics, clusters, consumer groups, and other resources. Integrates with external authorization systems.|
|**Pulsar**|**Role-based permissions** for operations (produce, consume, functions). Namespace and topic-level granularity.|
|**RabbitMQ**|**ACLs** for configure/write/read operations on resources (exchanges, queues). Pluggable authorization. Topic-level authorization available.|

### Message Retention and Persistence

|Project|Retention and Persistence|
|---|---|
|**Bondy**|Event retention (last event per topic for late subscribers). Event history on roadmap. In-memory by default; no disk persistence yet. Focus on real-time communication.|
|**NATS**|Core NATS: in-memory, no persistence. **JetStream**: persistent streams with configurable retention (time/size/count-based), replicated across cluster (R=1,3,5). File or memory storage.|
|**gRPC**|No persistence—pure RPC framework. Requires application-level implementation or separate storage system.|
|**Kafka**|**Persistent by design**. All messages written to disk and replicated. Configurable retention (time-based: default 7 days; size-based: per partition). Retention policies: delete or compact.|
|**Pulsar**|**Durable message storage** with separation of compute and storage layers. Retention policies, tiered storage (hot/warm/cold). Configurable per-topic retention.|
|**RabbitMQ**|Optional persistence (durable queues + persistent messages). Messages can be stored on disk. Quorum queues provide replication (Raft-based). No log-style retention.|

### High Availability and Fault Tolerance

|Project|HA and Fault Tolerance|
|---|---|
|**Bondy**|**Masterless clustering** (all nodes equal). Automatic failover for RPC registrations and subscriptions. Gossip-based state replication + active anti-entropy for self-healing. No leader election. Continues operating during network partitions with eventual consistency.|
|**NATS**|Core: full-mesh clustering with self-healing. **JetStream**: Raft-based clustering for persistence with R=3 (tolerates 1 failure), R=5 (tolerates 2 failures). Sub-millisecond pause times with generational ZGC (2024).|
|**gRPC**|No built-in HA—client must implement retry logic and connect to healthy servers. Requires external load balancer or service discovery. Often deployed with service mesh for resilience.|
|**Kafka**|Replication factor R (default 3) with leader-replica model per partition. Tolerates R-1 broker failures. **KRaft mode** (ZooKeeper removal in v4.0, Q3 2024) improves availability. Controller quorum requires majority.|
|**Pulsar**|Separation of brokers (stateless) and BookKeeper (storage). **Geo-replication** across clusters. Broker failure handled by reassignment. BookKeeper uses quorum writes (ensemble model). High availability with minimal downtime.|
|**RabbitMQ**|**Quorum queues** (Raft-based, recommended for HA). Mirrors provide replication (R=2 or R=3 typical). Requires N >= 3 nodes for consensus. Classic mirroring deprecated. Automatic failover with quorum queues.|

### Deployment

|Project|Deployment Models|
|---|---|
|**Bondy**|Binary releases, Docker containers, Kubernetes (Helm charts). **Zero external dependencies**—no database, no key-value store, no coordination service. Runs on bare metal, VMs, containers, ARM devices. DNS-based clustering.|
|**NATS**|Binary distributions, Docker, Kubernetes (Helm charts, NACK operator for JetStream CRDs). Lightweight footprint. Simple configuration. NATS surveyor for monitoring integration.|
|**gRPC**|Library embedded in applications (not standalone service). Deploy with application code. Often paired with service mesh (Istio, Linkerd) or external load balancer. Kubernetes Gateway API integration (2024 preview).|
|**Kafka**|Requires JVM. Traditionally requires ZooKeeper (being removed in v4.0). Docker, Kubernetes (Strimzi operator). Confluent offers managed cloud services. Resource-intensive—requires careful capacity planning.|
|**Pulsar**|Requires JVM. **Multi-component architecture**: brokers, BookKeeper (storage), ZooKeeper (metadata). Docker, Kubernetes (Pulsar operators). StreamNative offers managed services. More complex than single-component systems.|
|**RabbitMQ**|Binary packages, Docker, Kubernetes (cluster operator). Requires Erlang/OTP runtime. Plugins extend functionality. Management UI included. Relatively straightforward deployment compared to Kafka/Pulsar.|

### Monitoring

|Project|Monitoring and Observability|
|---|---|
|**Bondy**|Prometheus-compatible metrics export. HTTP APIs for querying node status, sessions, registrations, subscriptions. WAMP meta events for real-time monitoring. Admin API for inspection. Built-in observability at routing layer.|
|**NATS**|HTTP endpoints for monitoring. NATS surveyor for metrics collection. Prometheus integration. JetStream advisories published to subjects ($JS.EVENT.ADVISORY.>). Grafana dashboards available.|
|**gRPC**|OpenTelemetry integration for traces and metrics. Requires external monitoring setup. Health checking protocol built-in. eBPF-based monitoring tools available (2024). No built-in metrics export.|
|**Kafka**|JMX metrics (hundreds available). Prometheus exporters (third-party). Confluent Control Center (commercial). Cruise Control (open-source) for cluster management. Extensive metrics require expertise to navigate.|
|**Pulsar**|Prometheus metrics endpoint. Pulsar Manager (GUI). Grafana dashboards. Topic, namespace, and broker-level metrics. Health check endpoints. BookKeeper has separate metrics.|
|**RabbitMQ**|**rabbitmq_prometheus plugin** (recommended for production). Management UI with real-time metrics. HTTP API for programmatic access. Grafana dashboards. Low overhead monitoring. PerfTest tool for benchmarking.|

### Management

|Project|Management Tools|
|---|---|
|**Bondy**|HTTP Admin API + WAMP Admin API for all management operations. Dynamic configuration—all changes take effect immediately without restarts. No separate management tool required; can build custom tools using APIs. Realm, user, permission, and cluster management via API.|
|**NATS**|CLI tools (nats, nsc for security). NATS surveyor for operational metrics. Configuration via files or environment. JetStream managed via CLI or client libraries. Lightweight operational model.|
|**gRPC**|No management layer—each service manages itself. Requires application-level tooling. When deployed with service mesh, managed by mesh control plane (Istio, Linkerd). Configuration management depends on deployment.|
|**Kafka**|**kafka-topics, kafka-configs, kafka-console-** CLI tools. Kafka Manager, Kafdrop (GUI tools). Confluent Control Center (commercial). KRaft simplifies operational model vs ZooKeeper. Complex operational overhead.|
|**Pulsar**|**pulsar-admin** CLI tool. Pulsar Manager (web GUI). REST Admin API. Functions and connectors managed separately. BookKeeper and ZooKeeper have separate management. More operational complexity than single-component systems.|
|**RabbitMQ**|**rabbitmqctl** CLI tool. Management UI (plugin) with comprehensive web interface. HTTP API for automation. rabbitmq-diagnostics for troubleshooting. Relatively simple operations compared to distributed streaming platforms.|

### Integrations

|Project|Built-in and Third-Party Integrations|
|---|---|
|**Bondy**|**Built-in HTTP API Gateway** (REST to WAMP translation). **Kafka Bridge** (bidirectional WAMP-Kafka mapping). OAuth2 support. Extensible via WAMP application components. MQTT bridge on roadmap. Focus on enabling gradual adoption.|
|**NATS**|Extensive integrations: Kafka, AWS services, GCP, Azure, databases, monitoring tools. NATS Streaming provides additional connectors. Community-contributed bridges. Strong cloud-native ecosystem integration.|
|**gRPC**|No built-in integrations—pure RPC library. gRPC Gateway for REST-to-gRPC transcoding (third-party). Integrations typically at application level. Wide language support enables broad integration.|
|**Kafka**|**Kafka Connect** framework with hundreds of connectors (databases, cloud services, data lakes, monitoring). KSQL for stream processing. Strong ecosystem. De facto standard for event streaming integration.|
|**Pulsar**|**Pulsar IO** (connectors for sources/sinks). Pulsar Functions (stream processing). Protocol handlers (Kafka, AMQP). Tiered storage integrations (S3, GCS, Azure). Growing ecosystem.|
|**RabbitMQ**|Federation plugin (broker-to-broker). Shovel plugin (message forwarding). Protocol plugins (MQTT, STOMP). Community plugins extend functionality. HTTP API enables custom integrations. Flexible integration model.|

## Bondy vs. Service Mesh

Service meshes like Istio provide infrastructure-level features for service-to-service communication. Here's how Bondy differs:

### Istio

**Deployment Model:**
- **Istio**: Requires Kubernetes; deploys as sidecar proxies (traditional) or ambient mode (2024 GA). Operates at network layer (L4/L7). Adds complexity to infrastructure.
- **Bondy**: Runs anywhere (bare metal, VMs, containers, edge devices). Application-level messaging platform. No sidecars or infrastructure proxies.

**Communication Patterns:**
- **Istio**: HTTP/gRPC traffic management. No native pub/sub. Must integrate with external message broker for events.
- **Bondy**: Native RPC and pub/sub in unified protocol. True peer-to-peer programming model—any client can be publisher, subscriber, caller, and callee.

**Service Discovery:**
- **Istio**: Kubernetes-native service discovery. Services registered via K8s API.
- **Bondy**: Dynamic URI-based procedure registration. Services register/unregister at runtime via WAMP protocol. Works across any environment.

**Security:**
- **Istio**: mTLS for service-to-service encryption. Authorization policies at network level. Certificate management via control plane.
- **Bondy**: Authentication at connection time (multiple methods). Fine-grained RBAC at message/URI level. Authorization happens at routing layer.

**Observability:**
- **Istio**: Distributed tracing (Jaeger), metrics (Prometheus), logs. Comprehensive telemetry via Envoy proxies.
- **Bondy**: Prometheus metrics, WAMP meta events, session tracking, admin APIs. Observability at application messaging layer.

**Operational Complexity:**
- **Istio**: Complex setup and configuration. Requires understanding of service mesh concepts, Envoy, and K8s. Ambient mode (2024) reduces complexity vs sidecars.
- **Bondy**: Simple deployment with zero external dependencies. Configuration via APIs. Masterless architecture simplifies operations.

**When to Choose:**
- **Istio**: Already on Kubernetes, need infrastructure-level traffic management, polyglot services using HTTP/gRPC, require mTLS encryption, want comprehensive observability without application changes.
- **Bondy**: Need unified RPC + pub/sub, true peer-to-peer capabilities, want protocol-level features (pattern subscriptions, load balancing policies), require multi-tenancy, prefer application-level messaging over infrastructure proxies.

## Key Differentiators

### What Makes Bondy Unique

1. **Unified Protocol**: RPC and pub/sub in single protocol vs. combining separate systems (gRPC + Kafka)
2. **Distributed by Design**: Masterless clustering with eventual consistency; no leader election or split-brain scenarios
3. **Zero External Dependencies**: No database, coordination service, or external storage required
4. **True Multi-Tenancy**: Realms provide complete isolation with independent security domains
5. **Peer-to-Peer Programming Model**: Any client can be caller, callee, publisher, and subscriber—enabling backend-to-frontend calls
6. **Operational Simplicity**: Dynamic configuration, automatic failover, self-healing cluster, no special nodes
7. **Built on Erlang/OTP**: Proven fault-tolerance, massive concurrency (millions of connections), hot code loading

### When to Choose Bondy

Choose Bondy when you need:

- **Unified application networking**: Avoid assembling separate API gateway, service mesh, and message broker
- **True peer-to-peer communication**: Enable any component to call any other component (including frontend calling backend)
- **Real-time distributed systems**: WebSocket-based persistent connections with routed messaging
- **Multi-tenant architectures**: Built-in realm isolation for SaaS or microservices-per-tenant
- **Operational simplicity**: No external dependencies, dynamic configuration, self-healing infrastructure
- **IoT and edge computing**: Lightweight deployment on ARM devices with same capabilities as cloud
- **AI agent communication**: Complete RPC + pub/sub + security + discovery for multi-agent systems

### When to Choose Alternatives

Consider alternatives when:

- **Need persistent event log**: Kafka or Pulsar provide durable log-based storage with replay capabilities
- **Require exactly-once semantics today**: NATS JetStream, Kafka, and Pulsar offer this; Bondy has it on roadmap
- **Only need message broker**: RabbitMQ or NATS core may be simpler if you don't need RPC
- **Only need RPC**: gRPC is simpler if you don't need pub/sub or peer-to-peer capabilities
- **Kubernetes-centric**: Istio provides deeper K8s integration and infrastructure-level features
- **Existing ecosystem lock-in**: Kafka ecosystem is vast; migration costs may outweigh Bondy benefits
- **Need specific client language**: Check WAMP client availability for your language/platform

## Summary

Bondy occupies a unique position in the distributed systems landscape by unifying capabilities typically provided by multiple systems:

- Provides RPC like gRPC, but with built-in service discovery, load balancing, and failover
- Provides pub/sub like NATS/Kafka/RabbitMQ, but with integrated RPC and authentication
- Provides application networking like Istio, but without Kubernetes dependency or sidecar complexity
- Provides multi-tenancy better than most alternatives, with complete isolation per realm
- Provides true peer-to-peer communication enabling architectural patterns impossible with traditional client-server protocols

The trade-off is adopting WAMP as your application protocol. If you need these unified capabilities and can adopt WAMP, Bondy offers significant advantages in simplicity, operational overhead, and architectural flexibility. If you need specific features like Kafka's persistent log model or Istio's mTLS mesh, specialized tools may be better fits.

The best choice depends on your specific requirements, existing infrastructure, and team expertise. This comparison aims to provide objective information to guide your decision.
