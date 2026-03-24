---
related:
    - text: What is Bondy
      type: concepts
      link: /concepts/what_is_bondy
      description: Learn what Bondy is and what problems it solves.
    - text: Why Bondy
      type: concepts
      link: /concepts/why_bondy
      description: Understand the need for a unified application networking platform.
    - text: Architecture
      type: concepts
      link: /concepts/architecture
      description: Deep dive into Bondy's distributed architecture.
---
# Features

Bondy provides a comprehensive set of features for building scalable, real-time distributed applications through a single, unified platform.

## Core Messaging

### Routed RPC and PubSub
- **Unified protocol** - Both RPC and PubSub in WAMP
- **Peer-to-peer** - Any client can play any role
- **Pattern matching** - Exact, prefix, and wildcard URI matching
- **Load balancing** - Built-in round-robin, random, first/last policies

### Transport Flexibility
- **WebSocket** - For browsers and modern apps
- **Raw TCP** - For backend services
- **Unix Domain Sockets** - For local IPC
- **TLS/SSL** - Secure transport encryption

### Serialization Options
- **JSON** - Human-readable, universal
- **MessagePack** - Compact binary format
- **CBOR** - Concise Binary Object Representation
- Client chooses per-connection

## Distributed System

### Clustering
- **Masterless architecture** - No single point of failure
- **Automatic peer discovery** - DNS, static, Kubernetes
- **Full mesh topology** - Direct node-to-node connections
- **Horizontal scaling** - Add nodes for more capacity

### High Availability
- **Automatic failover** - Clients reconnect to surviving nodes
- **Data replication** - State replicated across all nodes
- **Active Anti-Entropy** - Proactive inconsistency detection and repair
- **Partition tolerance** - Continues operating during network splits

### Consistency Model
- **Eventually consistent** - AP in CAP theorem
- **Conflict-free** - CRDT-based state replication
- **Convergent** - Merkle tree-based reconciliation
- **Tunable** - Application-level consistency where needed

## Identity & Access Management

### Multi-Tenancy
- **Realms** - Isolated routing and administrative domains
- **Virtual** - No infrastructure overhead per realm
- **Dynamic** - Create/manage realms via API
- **Unlimited** - No predefined limit on realm count

### Authentication Methods
- **Anonymous** - For public access
- **Password** - Simple username/password
- **WAMP-CRA** - Challenge-Response Authentication
- **Cryptosign** - Cryptographic signatures
- **Ticket** - Pre-issued authentication tokens
- **OAuth2** - Token-based (via HTTP Gateway)
- **Trust** - IP-based trust (localhost)

### Authorization
- **Role-Based Access Control (RBAC)** - Users, groups, permissions
- **URI-based** - Granular control per procedure/topic
- **Pattern matching** - Exact, prefix, wildcard permissions
- **Source-based** - CIDR network restrictions
- **Dynamic** - Change permissions without restart

## API Gateway

### HTTP Gateway
- **REST API mapping** - HTTP → WAMP RPC conversion
- **API specifications** - OpenAPI-like configuration
- **OAuth2 support** - Token generation and validation
- **CORS** - Cross-origin resource sharing
- **Rate limiting** - Request throttling

### GraphQL Gateway (Planned)
- Queries → RPC calls
- Subscriptions → PubSub topics
- Schema-driven development

## Integration & Interoperability

### Broker Bridge (Edge)
- **Connect remote Bondy clusters** - WAN-optimized
- **Selective replication** - Choose what to bridge
- **Bidirectional** - Messages flow both ways
- **Resilient** - Automatic reconnection

### Kafka Bridge
- **Publish to Kafka** - Forward WAMP events to Kafka topics
- **Consume from Kafka** - Kafka messages → WAMP events
- **Configurable** - Per-topic routing rules
- **High-throughput** - Optimized for streaming

### WAMP Client Libraries
- JavaScript/TypeScript
- Python
- Java
- Erlang/Elixir
- And more via community

## Security

### Transport Security
- **TLS/SSL** - Encrypted connections
- **Certificate validation** - Client and server certs
- **Perfect forward secrecy** - Ephemeral key exchange

### Application Security
- **Session-based** - All messages authenticated
- **Fine-grained authorization** - Per-URI permissions
- **Audit logging** - Track all administrative actions
- **Security events** - Subscribe to security-related events

### Network Security
- **CIDR-based rules** - IP address restrictions
- **Firewall-friendly** - Works through HTTP proxies
- **DDoS protection** - Rate limiting, connection limits

## Observability

### Monitoring
- **Metrics API** - Prometheus-compatible metrics
- **Health checks** - Liveness and readiness probes
- **Session tracking** - Active connections and their state
- **Resource usage** - CPU, memory, connections

### Logging
- **Structured logging** - JSON-formatted logs
- **Log levels** - Fine-grained control
- **Audit trails** - Security and admin operations
- **Integration** - Works with standard log aggregators

### Admin APIs
- **WAMP API** - Manage via WAMP procedures
- **HTTP API** - RESTful management interface
- **Real-time events** - Subscribe to system events
- **CLI tools** - Command-line administration

## Performance

### Scalability
- **Millions of connections** - Per node
- **Thousands of messages/sec** - Per connection
- **Hundreds of nodes** - In a cluster
- **Linear scaling** - Performance scales with nodes

### Latency
- **Sub-millisecond** - In-node routing
- **Low overhead** - Minimal protocol overhead
- **Persistent connections** - No connection setup per message
- **Efficient serialization** - Binary formats available

### Resource Efficiency
- **Erlang VM** - Lightweight process model
- **Concurrent** - Millions of concurrent processes
- **Memory efficient** - Small footprint per connection
- **CPU efficient** - Multi-core utilization

## Operations

### Deployment
- **Docker** - Official Docker images
- **Kubernetes** - Helm charts available
- **Systemd** - Native Linux service
- **Cloud-ready** - AWS, Azure, GCP compatible

### Configuration
- **File-based** - YAML/JSON configuration
- **Environment variables** - 12-factor app compatible
- **Dynamic** - Runtime configuration changes
- **Defaults** - Sensible out-of-box settings

### Upgrades
- **Rolling upgrades** - Zero-downtime updates (minor versions)
- **Backward compatible** - Clients don't require updates
- **Schema evolution** - Config format versioning

## Developer Experience

### Documentation
- **Comprehensive** - Concepts, guides, API reference
- **Examples** - Real-world code samples
- **Tutorials** - Step-by-step learning paths
- **API docs** - Auto-generated from specs

### Tooling
- **CLI** - Command-line tools for common tasks
- **Web Console** (Planned) - Browser-based admin UI
- **Client libraries** - Multiple language support
- **Testing tools** - Mock routers, test utilities

### Community
- **Open source** - Apache 2.0 license
- **Active development** - Regular releases
- **Support** - Community forum and chat
- **Commercial support** - Available from vendors

## Advanced Features

### Same Sign-On (SSO)
- **Multi-realm auth** - Authenticate once, access many realms
- **Credential sharing** - Centralized user management
- **Flexible** - Configure SSO groups

### Event History (Planned)
- **Persistent events** - Store events for offline clients
- **Replay** - Retrieve missed events on reconnect
- **TTL** - Configurable retention

### Overload Protection
- **Backpressure** - Flow control mechanisms
- **Circuit breakers** - Prevent cascade failures
- **Load shedding** - Graceful degradation under load
- **Quotas** - Per-user/per-session limits

## See Also

- [What is Bondy](/concepts/what_is_bondy) - Overview and introduction
- [Architecture](/concepts/architecture) - Technical deep dive
- [Clustering](/concepts/clustering) - Distributed system design
- [Realms](/concepts/realms) - Multi-tenancy and isolation
