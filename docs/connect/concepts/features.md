---
related:
    - text: What is Bondy
      type: concepts
      link: /connect/concepts/what_is_bondy
      description: Learn what Bondy is and what problems it solves.
    - text: Why Bondy
      type: concepts
      link: /connect/concepts/why_bondy
      description: Understand the need for a unified application networking platform.
    - text: Architecture
      type: concepts
      link: /connect/concepts/architecture
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
- **HTTP long-poll and Server-Sent Events** - For clients that cannot open a WebSocket; JSON only
- **TLS/SSL** - Secure transport encryption

### Serialization Options
- **JSON** - Human-readable, universal
- **MessagePack** - Compact binary format
- **CBOR** - Concise Binary Object Representation
- Client chooses per-connection

## Distributed System

### Clustering
- **Masterless architecture** - No single point of failure
- **Automatic peer discovery** - DNS or a static list; Kubernetes uses DNS through a headless Service
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
- **Convergent** - Anti-entropy that compares Merkle Search Trees
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

## Integration & Interoperability

### Bridge Relay (Bondy Edge)
- **Connect to a remote Bondy router** - The edge dials out, so it needs no inbound port
- **Selective sharing** - The edge proxies its registrations, and the events of the topics configured with `direction: out`, to the remote router
- **Security sync** - The remote router syncs the bridged realm's security model to the edge
- **Resilient** - Automatic reconnection with backoff

See [Bondy Edge (Bridge Relay)](/connect/concepts/bridge_relay).

### Broker Bridge
- **Publish to Kafka** - Forward WAMP events to Kafka topics; there is no consumer side back into WAMP
- **SMS and email** - Send an SMS through AWS SNS, or an email through SMTP, Mailgun or SendGrid
- **Configurable** - Per-subscription action templates

See [Broker Bridge](/connect/concepts/broker_bridge).

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
- **Structured logging** - Key-value (`key=value`) log lines
- **Log levels** - Fine-grained control
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
- **Kubernetes** - Runs the Docker image as a StatefulSet; there is no official Helm chart or Operator
- **Release tarball** - Runs as a service under a process supervisor such as systemd
- **Cloud-ready** - AWS, Azure, GCP compatible

### Configuration
- **File-based** - A key-value `bondy.conf`, plus JSON files for security configuration and API specifications
- **Environment variables** - 12-factor app compatible
- **Dynamic** - Runtime configuration changes
- **Defaults** - Sensible out-of-box settings

### Upgrades
- **Full-restart upgrades** - Upgrade a cluster by restarting every node on the new release; rolling upgrades are not supported
- **Backward compatible** - Clients don't require updates
- **Configuration migration** - `scripts/migrate_conf.escript` checks a `bondy.conf` and rewrites renamed or removed keys

## Developer Experience

### Documentation
- **Comprehensive** - Concepts, guides, API reference
- **Examples** - Real-world code samples
- **Tutorials** - Step-by-step learning paths
- **API docs** - Auto-generated from specs

### Tooling
- **CLI** - Command-line tools for common tasks
- **Client libraries** - Multiple language support
- **Testing tools** - Mock routers, test utilities

### Community
- **Open source** - Apache 2.0 license
- **Active development** - Regular releases
- **Support** - Community forum and chat
- **Commercial support** - Available from vendors

## Advanced Features

### Same Sign-On (SSO)
- **Multi-realm auth** - One set of credentials for many realms; with a ticket, authenticate once (Single Sign-On)
- **Credential sharing** - Centralized user management

### Overload Protection
- **Load regulation** - Bounded router worker pools, and load and memory monitors (`load_regulation.*`)
- **Rate limiting** - Per-source-IP token buckets for handshakes, authentication, connections and HTTP requests, and an opt-in per-session message rate (`security.rate_limit.*`, off by default)

## See Also

- [What is Bondy](/connect/concepts/what_is_bondy) - Overview and introduction
- [Architecture](/connect/concepts/architecture) - Technical deep dive
- [Clustering](/connect/concepts/clustering) - Distributed system design
- [Realms](/connect/concepts/realms) - Multi-tenancy and isolation
