---
related:
    - text: Routed RPC
      type: concepts
      link: /concepts/wamp/rpc
      description: Learn about Remote Procedure Call pattern in WAMP.
    - text: Publish/Subscribe
      type: concepts
      link: /concepts/wamp/pubsub
      description: Learn about Publish/Subscribe pattern in WAMP.
    - text: Introduction to WAMP
      type: concepts
      link: /concepts/wamp/introduction
      description: Core WAMP concepts and architecture.
---
# Communication Patterns

WAMP provides two fundamental communication patterns that together enable building complete distributed applications: **Remote Procedure Calls (RPC)** and **Publish/Subscribe (PubSub)**. Both patterns are routed through the WAMP Router, providing a unified, peer-to-peer programming model.

## Overview

Traditional distributed systems often require multiple protocols and infrastructure components:
- HTTP/REST or gRPC for synchronous request-response
- Message queues (RabbitMQ, Kafka) for asynchronous events
- WebSockets for bidirectional communication
- Load balancers, API gateways, and service meshes for routing

WAMP simplifies this by providing **both patterns in a single protocol**, routed through a single infrastructure component (the WAMP Router), over a single persistent connection.

## Remote Procedure Calls (RPC)

### Pattern Description

RPC enables synchronous request-response communication where a Caller invokes a procedure implemented by a Callee, receiving a result or error in return.

```
Caller                Router (Dealer)           Callee
  |                          |                     |
  |------- CALL --------->   |                     |
  |                          |------ INVOCATION -->|
  |                          |                     | (process)
  |                          |<----- YIELD --------|
  |<----- RESULT ---------|  |                     |
```

### Key Features

**Routed and Decoupled**
- Caller doesn't know which Callee will handle the call
- Callee location and identity are abstracted by the Router
- No direct connection between Caller and Callee

**Bidirectional**
- Any client can be both Caller and Callee
- Browser apps can offer procedures callable by backend services
- True peer-to-peer communication model

**Dynamic Registration**
- Callees register procedures at runtime
- Multiple Callees can register the same procedure (load balancing)
- Callees can unregister procedures dynamically

### Use Cases

- **Microservice APIs** - Backend services expose procedures
- **Real-time operations** - User actions trigger immediate responses
- **Distributed coordination** - Services coordinate through procedure calls
- **Device control** - IoT devices expose control procedures

## Publish/Subscribe (PubSub)

### Pattern Description

PubSub enables asynchronous one-to-many communication where Publishers send events to topics, and all Subscribers to those topics receive the events.

```
Publisher             Router (Broker)          Subscribers
  |                          |                  |    |    |
  |------ PUBLISH ------>    |                  |    |    |
  |                          |------ EVENT ---->|    |    |
  |                          |------ EVENT ---------->|    |
  |                          |------ EVENT ---------------->|
  |<---- PUBLISHED ------|   |                  |    |    |
```

### Key Features

**Decoupled Communication**
- Publishers don't know who (if anyone) will receive events
- Subscribers don't know who published events
- Complete independence between publishers and subscribers

**Topic-Based Routing**
- Events are addressed to topics (URI-based)
- Subscribers express interest in specific topics
- Router handles all routing logic

**Flexible Subscription**
- Exact topic matching: `com.myapp.sensor.temperature`
- Prefix matching: `com.myapp.sensor.`
- Wildcard matching: `com.myapp..temperature`

### Use Cases

- **Event notifications** - Alert all interested parties of state changes
- **Real-time updates** - Push data changes to all connected clients
- **Activity streams** - Broadcast user activities or system events
- **IoT telemetry** - Sensors publish readings, multiple consumers subscribe

## Pattern Comparison

| Aspect | RPC | PubSub |
|--------|-----|--------|
| **Communication** | One-to-one (request-response) | One-to-many (fire-and-forget) |
| **Coupling** | Temporal (caller waits for response) | Fully decoupled (async) |
| **Response** | Always returns result or error | No response to publisher |
| **Addressing** | Procedure URI | Topic URI |
| **Discovery** | Dynamic (via registration) | Dynamic (via subscription) |
| **Cardinality** | One Callee handles each call | All Subscribers receive event |

## Combined Usage

The real power of WAMP comes from using both patterns together in the same application:

### Example: E-commerce Order Processing

```
1. User clicks "Place Order" (browser)
   → RPC CALL to `com.shop.order.create`

2. Order Service (Callee) processes order
   → Returns order ID to browser

3. Order Service publishes event
   → PUBLISH to `com.shop.order.created`

4. Multiple services receive event:
   - Inventory Service → Updates stock
   - Email Service → Sends confirmation
   - Analytics Service → Records metrics
   - User's browser → Shows confirmation

All over one protocol, one connection!
```

### Workflow Orchestration

RPCs and PubSub naturally complement each other:
- **Commands** (RPC) - "Do this specific thing and tell me the result"
- **Events** (PubSub) - "Something happened, whoever cares should know"

This enables **event-driven architectures** with **request-response semantics** where needed.

## Roles and Sessions

Each WAMP session can play multiple roles simultaneously:

| Role | Pattern | Action |
|------|---------|--------|
| **Caller** | RPC | Invokes procedures |
| **Callee** | RPC | Implements procedures |
| **Publisher** | PubSub | Publishes events |
| **Subscriber** | PubSub | Receives events |

A typical application session might:
- Register procedures (Callee) for others to call
- Call procedures (Caller) on other services
- Publish events (Publisher) when state changes
- Subscribe to topics (Subscriber) for updates

This **peer-to-peer model** is unique to WAMP and enables highly flexible architectures.

## Advanced Features

Both patterns support advanced features:

### RPC Features
- **Progressive call results** - Stream partial results before completion
- **Call cancellation** - Cancel in-flight calls
- **Call timeouts** - Automatic timeout handling
- **Pattern-based registration** - Register with prefix/wildcard URIs

### PubSub Features
- **Publisher identification** - Know who published each event
- **Publisher exclusion** - Don't receive own publications
- **Subscriber blacklisting/whitelisting** - Control event delivery
- **Event history** - Retrieve missed events when reconnecting

### Shared Features
- **Authentication** - All actions authenticated per session
- **Authorization** - Fine-grained access control per URI
- **Encryption** - TLS transport encryption
- **Serialization choice** - JSON, MessagePack, CBOR

## Comparison with Other Protocols

| Protocol | RPC | PubSub | Routed | Peer-to-Peer |
|----------|-----|--------|--------|--------------|
| **WAMP** | Yes | Yes | Yes | Yes |
| **HTTP/REST** | Yes | No | No | No (client→server only) |
| **gRPC** | Yes | Streaming only | No | No (client→server only) |
| **MQTT** | No | Yes | Yes | No (pub/sub only) |
| **AMQP** | No | Yes | Yes | No (pub/sub only) |
| **WebSocket** | No | No | No | Manual implementation |

WAMP is the only protocol providing **both patterns, routed, with peer-to-peer semantics** in a single unified protocol.

## Best Practices

### Choosing the Right Pattern

Use **RPC** when:
- You need a response
- Operation has a clear owner/handler
- Synchronous execution is acceptable
- Error handling is important

Use **PubSub** when:
- Fire-and-forget semantics are acceptable
- Multiple consumers need the same information
- Event-driven architecture
- Real-time updates to many clients

### Naming Conventions

Use hierarchical URI naming for both procedures and topics:
- `com.myapp.service.action` for procedures
- `com.myapp.service.event.type` for topics

This enables prefix/wildcard matching and logical organization.

### Error Handling

- **RPC errors** - Return structured error with URI and details
- **PubSub failures** - Publisher doesn't know if delivery failed
- **Connection loss** - Both patterns: client must reconnect and re-establish state

## See Also

- [Routed RPC](/concepts/wamp/rpc) - Deep dive into RPC pattern
- [Publish/Subscribe](/concepts/wamp/pubsub) - Deep dive into PubSub pattern
- [Introduction to WAMP](/concepts/wamp/introduction) - WAMP fundamentals
- [Sessions](/concepts/wamp/sessions) - Understanding WAMP sessions
