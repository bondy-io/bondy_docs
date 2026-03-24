---
draft: false
related:
    - text: What is Bondy
      type: concepts
      link: /concepts/what_is_bondy
      description: Overview of Bondy's capabilities and use cases.
    - text: Architecture
      type: concepts
      link: /concepts/architecture
      description: Deep dive into Bondy's distributed architecture.
    - text: What is WAMP
      type: concepts
      link: /concepts/what_is_wamp
      description: Understanding the Web Application Messaging Protocol.
---
# How Bondy Works

Bondy creates a distributed application network that connects all your components—web apps, mobile apps, backend services, and IoT devices—through a unified messaging layer. Understanding how Bondy works helps you architect better distributed systems.

## The Foundation: WAMP Router

At its core, Bondy is a sophisticated implementation of the [Web Application Messaging Protocol (WAMP)](/concepts/what_is_wamp). Think of Bondy as the intelligent middleware that sits between all your application components, routing messages and managing connections.

When a client connects to Bondy:

1. **Session Establishment** - Client negotiates transport (WebSocket, TCP, Unix socket) and serialization (JSON, MessagePack, CBOR)
2. **Authentication** - Bondy verifies identity using configured methods (anonymous, password, cryptosign, OAuth2, etc.)
3. **Authorization** - Bondy grants permissions based on realm RBAC configuration
4. **Communication** - Client can now perform RPC calls, register procedures, publish events, and subscribe to topics

The key insight: clients never communicate directly with each other. All messages flow through Bondy, which handles routing, security, and delivery.

## Message Routing

Bondy implements two routing patterns that cover all distributed application communication needs:

### RPC Routing (Dealer Role)

When a client wants to call a remote procedure:

```
1. Callee registers procedure "com.myapp.calculate"
   └─> Bondy stores registration in routing table

2. Caller invokes "com.myapp.calculate" with arguments
   └─> Bondy receives CALL message

3. Bondy looks up procedure in routing table
   └─> Finds registered Callee(s)
   └─> Applies invocation policy (single, roundrobin, random, etc.)
   └─> Selects target Callee

4. Bondy forwards INVOCATION to selected Callee
   └─> Includes call arguments and caller details (if authorized)

5. Callee processes request and returns result
   └─> Sends YIELD message to Bondy

6. Bondy forwards RESULT back to original Caller
   └─> Includes returned values or error information
```

This routed approach provides several advantages:

- **Location transparency** - Caller doesn't need to know where Callee is
- **Dynamic discovery** - Procedures can be registered/unregistered at runtime
- **Load balancing** - Multiple Callees can implement same procedure
- **Failover** - If one Callee fails, router can try another

### Pub/Sub Routing (Broker Role)

When a client wants to publish events or subscribe to topics:

```
1. Subscribers express interest in "com.myapp.events.user.login"
   └─> Bondy stores subscriptions in routing table

2. Publisher publishes event to "com.myapp.events.user.login"
   └─> Bondy receives PUBLISH message with event data

3. Bondy looks up subscriptions in routing table
   └─> Finds all matching subscribers
   └─> Applies filtering rules (eligibility, exclusions)

4. Bondy delivers EVENT message to each subscriber
   └─> Includes event payload and publisher details (if authorized)
```

Pub/Sub benefits:

- **Decoupling** - Publishers don't know who's listening
- **Fan-out** - One event reaches many subscribers efficiently
- **Pattern matching** - Subscribers can use wildcards and prefixes
- **Filtering** - Control who receives events based on rules

## Distributed Architecture

A single Bondy node provides all basic functionality. But Bondy's real power emerges when you deploy multiple nodes in a cluster.

### Masterless Clustering

Bondy uses a masterless architecture—every node is equal:

- **No leader election** - No special coordinator node
- **No single point of failure** - Any node can fail without disrupting others
- **Horizontal scaling** - Add nodes to increase capacity
- **Geographic distribution** - Deploy nodes in different regions

Nodes automatically discover each other through DNS and form a mesh network. When a client connects to any node, it can interact with clients connected to any other node in the cluster.

### State Replication

Critical state must be consistent across all nodes for routing to work correctly. Bondy replicates:

- **Realm configurations** - Security settings, RBAC rules
- **User credentials** - For authentication
- **Registration data** - Which procedures are available where
- **Subscription data** - Which topics have subscribers where

Bondy uses a gossip-based protocol for state dissemination:

1. When state changes on one node, it's immediately shared with a few peers
2. Those peers share with their peers
3. Eventually all nodes receive the update
4. Updates are idempotent and commutative (CRDTs)

This approach ensures **eventual consistency** while maintaining **high availability**. Nodes continue operating during network partitions, with reconciliation happening automatically when connectivity restores.

### Active Anti-Entropy

Gossip is efficient but can miss updates. Bondy includes Active Anti-Entropy (AAE) for repair:

- Each node maintains Merkle trees of its state
- Nodes periodically compare trees with peers
- Differences are identified and reconciled
- Missing or divergent data is synchronized

AAE runs in the background, continuously healing the cluster from:
- Network partitions that prevented gossip delivery
- Node crashes before gossip completed
- Disk corruption or data loss

### Cross-Cluster Routing

When a client connected to Node A calls a procedure registered on Node B:

```
1. Client → Node A: CALL message
2. Node A checks local routing table
3. Finds procedure registered on Node B
4. Node A → Node B: Forward INVOCATION
5. Node B → Callee: Deliver INVOCATION
6. Callee → Node B: Return YIELD
7. Node B → Node A: Forward RESULT
8. Node A → Client: Deliver RESULT
```

This happens automatically and transparently. From the client's perspective, it's just calling a procedure. Bondy handles all cross-node routing internally.

The same applies to Pub/Sub—events published on one node are automatically delivered to subscribers on other nodes.

## Security Model

Bondy enforces security at the routing layer, before messages reach application code.

### Authentication

When a client connects, Bondy authenticates identity:

- **Anonymous** - No credentials required (for public access)
- **Ticket** - Pre-issued token authentication
- **WAMP-CRA** - Challenge-Response Authentication Protocol
- **Cryptosign** - Public key cryptography
- **Password** - Username/password (hashed and salted)
- **OAuth2** - Token-based (via HTTP Gateway)
- **Trust** - IP-based (for localhost/internal networks)

Multiple authentication methods can be enabled simultaneously. Clients choose which to use during session negotiation.

### Authorization

After authentication, Bondy determines what the client can do using Role-Based Access Control:

**Permissions are URI-based:**
- `wamp.register` - Register procedures
- `wamp.call` - Call procedures
- `wamp.subscribe` - Subscribe to topics
- `wamp.publish` - Publish events

**Permissions use pattern matching:**
- Exact: `com.myapp.users.get`
- Prefix: `com.myapp.users.`
- Wildcard: `com.myapp.*.get`

**Example policy:**
```json
{
  "roles": ["backend_service"],
  "permissions": ["wamp.register", "wamp.call"],
  "resources": [{
    "uri": "com.myapp.internal.",
    "match": "prefix"
  }]
}
```

This grants backend services permission to register and call any procedure starting with `com.myapp.internal.`

Bondy evaluates permissions **before routing**. Unauthorized requests are rejected immediately, never reaching target procedures or subscribers.

### Multi-Tenancy

Realms provide isolation boundaries:

- Each realm has independent routing tables
- Each realm has independent RBAC configuration
- Clients in one realm cannot access another realm's resources
- Realms are virtual—no infrastructure overhead

This enables:
- **SaaS multi-tenancy** - One Bondy cluster serving many customers
- **Environment isolation** - Separate dev, staging, production
- **Security boundaries** - Partition sensitive systems

## Performance Characteristics

Bondy is built for high performance distributed systems:

### Concurrency

Built on Erlang/OTP, Bondy handles massive concurrency:

- **Millions of lightweight processes** - One per connection
- **Lock-free message passing** - No shared state bottlenecks
- **Multi-core utilization** - Scales with CPU cores
- **Soft real-time** - Predictable latency under load

A single Bondy node can handle millions of concurrent client connections.

### Latency

Message routing is fast:

- **In-node routing** - Sub-millisecond when caller and callee are on same node
- **Cross-node routing** - Single-digit milliseconds in same datacenter
- **Persistent connections** - No connection setup overhead per message
- **Binary protocols** - Efficient serialization with MessagePack/CBOR

### Throughput

Bondy scales horizontally:

- **Add nodes** - Increase cluster capacity linearly
- **Distribute load** - Clients connect to different nodes
- **Partition workload** - Different services on different nodes
- **No central bottleneck** - No coordinator or database dependency

Typical deployments handle tens of thousands of messages per second per node.

## Operational Model

Bondy is designed for operational simplicity:

### Zero Dependencies

Unlike service meshes or message brokers, Bondy has no external dependencies:
- No Kubernetes required
- No etcd or ZooKeeper
- No PostgreSQL or MongoDB
- No Redis or Memcached

Everything needed is embedded. This means:
- Simpler deployment
- Fewer failure modes
- Lower operational overhead
- Easier disaster recovery

### Self-Healing

Bondy clusters automatically heal from failures:

- **Node failure** - Clients reconnect to surviving nodes
- **Network partition** - Clusters split and merge automatically
- **Data corruption** - AAE detects and repairs
- **Configuration drift** - Gossip resynchronizes

Operators don't need to manually intervene for common failure scenarios.

### Observability

Bondy provides visibility into operation:

- **Metrics API** - Prometheus-compatible metrics export
- **Session tracking** - See all active connections and their state
- **WAMP meta events** - Subscribe to registration/subscription changes
- **Admin APIs** - Query and manage realms, users, permissions

## Integration Points

Bondy integrates with existing infrastructure:

### HTTP API Gateway

Expose WAMP procedures as REST APIs:
- Define API specs in JSON
- Map HTTP requests to RPC calls
- Handle OAuth2 authentication
- Serve static files

This allows legacy HTTP clients to access WAMP services without modification.

### Message Broker Bridges

Connect to external message systems:
- **Kafka** - Forward WAMP events to Kafka topics or consume from Kafka
- **MQTT** - Bridge to IoT networks (future)
- **RabbitMQ** - Integration with existing message infrastructure (future)

Bridges enable gradual migration and hybrid architectures.

### Bondy Edge (Router Bridging)

Connect Bondy clusters across WAN:
- Bridge geographically distributed clusters
- Selective topic/procedure replication
- Compress and secure inter-cluster traffic
- Maintain local autonomy during network issues

## Putting It All Together

Here's how all these pieces work in a real deployment:

1. **Deploy** - Stand up Bondy cluster (3-5 nodes for HA)
2. **Configure** - Define realms, users, and permissions
3. **Connect** - Clients establish sessions to any node
4. **Communicate** - Clients call procedures and publish events
5. **Route** - Bondy delivers messages across cluster
6. **Secure** - Bondy enforces authentication and authorization
7. **Scale** - Add nodes as traffic grows
8. **Heal** - Cluster automatically recovers from failures
9. **Monitor** - Track metrics and health via APIs
10. **Integrate** - Bridge to HTTP clients or message brokers as needed

The result is a robust, scalable, secure application network that simplifies distributed system development.

## Next Steps

- **Understand the architecture** - Read [Architecture](/concepts/architecture) for technical details
- **Learn about clustering** - See [Clustering](/concepts/clustering) for deployment patterns
- **Explore security** - Review [Security](/concepts/wamp/security) for authentication and authorization
- **Try it yourself** - Follow the [Getting Started tutorial](/tutorials/getting_started/marketplace)

Bondy works by making the complex simple. It handles the hard parts of distributed systems—routing, security, clustering, failure recovery—so you can focus on building features.
