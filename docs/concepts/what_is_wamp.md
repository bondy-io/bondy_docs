---
draft: false
---
# What is WAMP

The Web Application Messaging Protocol (WAMP) is an open standard that unifies the two fundamental patterns of distributed application communication—Remote Procedure Calls and Publish/Subscribe—into a single, elegant protocol.

## The Protocol That Changes Everything

Most application protocols force you to choose: Do you need request-response communication? Use HTTP or gRPC. Need event distribution? Use a message broker. Want both? You'll need multiple protocols, multiple client libraries, and the integration complexity that comes with them.

WAMP takes a different approach. It recognizes that modern distributed applications need both communication patterns, often simultaneously. Instead of forcing you to cobble together different technologies, WAMP provides both RPC and Pub/Sub in a unified protocol designed from the ground up for distributed systems.

The result is elegant: your web app, mobile app, backend services, and IoT devices all speak the same language, use the same client library, and enjoy the same capabilities—whether they're calling procedures, receiving events, or both.

## Why WAMP Matters

WAMP was created to solve a fundamental problem: the fragmentation of application messaging. By combining RPC and Pub/Sub into a single protocol with multiple transports and serialization formats, WAMP can handle all messaging requirements of a distributed application—both North-South (client-to-server) and East-West (service-to-service) traffic.

This unification delivers tangible benefits:

- **Reduced complexity** - One protocol instead of many
- **Faster development** - One client library to learn and use
- **Lower operational overhead** - One infrastructure component to deploy and manage
- **Better integration** - No impedance mismatch between different communication patterns

WAMP is a community-driven open standard, with its [specification](https://wamp-proto.org/wamp_latest_ietf.html) freely available under an open license. Anyone can implement it, use it, or extend it.

::: info Like D-Bus over a network
[D-Bus](https://en.wikipedia.org/wiki/D-Bus) is a platform-neutral messaging service that runs by default in most Linux distributions. It offers the same two basic workflows as WAMP—RPC and Pub/Sub—but whereas WAMP is designed for distributed systems over a network, D-Bus is designed for inter-process communication (IPC) on a single host.
:::

## WAMP for the AI Age: Agent-to-Agent Communication

As AI agents become central to modern applications, the need for robust agent-to-agent communication has never been more critical. AI agents need to discover services, invoke functions, coordinate actions, and react to events—often in real-time. They require authentication, authorization, and the ability to communicate peer-to-peer without rigid client-server hierarchies.

WAMP is uniquely positioned as the ideal protocol for AI agent communication, offering capabilities that emerging alternatives like MCP (Model Context Protocol) and other agent-to-agent protocols are only beginning to address—and it's been production-ready for years.

### Why WAMP Excels for AI Agents

**Complete Out-of-the-Box Solution**

WAMP provides everything AI agents need in a single, unified protocol:

- **RPC for function calling** - Agents invoke capabilities on other agents or services
- **Pub/Sub for event coordination** - Agents subscribe to events and publish state changes
- **Authentication** - Multiple methods (cryptosign, tickets, OAuth2) to verify agent identity
- **Authorization** - Fine-grained RBAC to control what each agent can access
- **Service discovery** - Agents discover available procedures and topics dynamically
- **Load balancing** - Multiple agents can provide the same capability with automatic distribution
- **Multi-tenancy** - Isolate different agent systems through realms

Competing protocols require you to assemble these capabilities from multiple sources. With WAMP, they're built-in and work together seamlessly.

**True Peer-to-Peer Agent Architecture**

Unlike protocols that maintain client-server distinctions, WAMP enables genuine peer-to-peer agent communication. Every agent can:

- **Expose capabilities** by registering procedures that other agents can invoke
- **Consume capabilities** by calling procedures on other agents
- **Broadcast state** by publishing events to topics
- **React to events** by subscribing to relevant topics

This symmetry is crucial for AI agent ecosystems where the distinction between "client" and "server" is artificial. An agent analyzing images might also need to accept analysis requests from other agents. A planning agent might coordinate with execution agents while also responding to queries from monitoring agents.

WAMP makes this natural. MCP and similar protocols typically impose hierarchical models that constrain how agents interact.

**Agent Coordination Patterns Made Simple**

AI agents frequently need complex coordination patterns:

- **Multi-agent workflows** - Chain agent capabilities together
- **Event-driven reactions** - Agents respond to environmental changes
- **Collaborative problem-solving** - Multiple agents work on shared goals
- **Agent orchestration** - Supervisor agents coordinate worker agents

With WAMP's unified RPC and Pub/Sub:

```javascript
// Agent registers its capability
wampy.register('ai.agent.vision.analyze', {
    rpc: async function(args, kwargs) {
        const image = kwargs.image;
        const analysis = await analyzeImage(image);

        // Publish result as event for interested agents
        wampy.publish('ai.agent.vision.analysis_complete', null, {
            image_id: kwargs.image_id,
            analysis: analysis
        });

        return analysis;
    }
});

// Another agent invokes it and subscribes to results
wampy.subscribe('ai.agent.vision.analysis_complete', function(args, kwargs) {
    console.log('Analysis ready:', kwargs.analysis);
    // Coordinate next steps
});

wampy.call('ai.agent.vision.analyze', null, {
    image: imageData,
    image_id: 'img_123'
});
```

One protocol, one connection, multiple coordination patterns.

**Production-Ready Infrastructure**

WAMP has been used in production for over a decade. Routers like [Bondy](/concepts/what_is_bondy) provide:

- **Horizontal scalability** - Scale agent populations to millions
- **High availability** - Fault-tolerant, self-healing clusters
- **Low latency** - Sub-millisecond routing for time-critical agent interactions
- **Transport flexibility** - WebSocket, TCP, Unix sockets as needed
- **Zero external dependencies** - Deploy anywhere without additional infrastructure

Newer agent protocols are still maturing their infrastructure story. WAMP's is proven.

### Beyond Limited Agent Protocols

**MCP (Model Context Protocol)** focuses primarily on connecting AI models to data sources and tools, typically in a client-server pattern. While useful for its specific use case, it lacks:

- Native event/pub-sub capabilities for agent coordination
- Peer-to-peer semantics for symmetric agent interaction
- Built-in authentication and authorization
- Multi-tenancy and isolation primitives
- Production-grade routing infrastructure

**Other Agent-to-Agent protocols** often face similar limitations:

- Narrow focus on specific interaction patterns
- Require additional protocols for complete agent systems
- Limited production deployments and infrastructure
- Proprietary or vendor-specific implementations

**WAMP provides the complete foundation** that agent systems need. Rather than assembling multiple protocols and infrastructure components, you deploy a WAMP router and build agent systems with all capabilities integrated and working together.

### Real-World AI Agent Use Cases

**Multi-Agent LLM Systems**

Connect multiple specialized language models where each agent has distinct capabilities:
- Research agents query knowledge bases and publish findings
- Synthesis agents subscribe to research results and generate reports
- Validation agents check outputs and invoke corrections
- All coordinated through WAMP's RPC and pub/sub

**Agentic Workflow Automation**

Build agent-driven automation where:
- Data collection agents publish raw data streams
- Processing agents subscribe and transform data
- Decision agents analyze results and invoke action agents
- Monitoring agents track system health and trigger interventions

**Distributed AI Inference**

Deploy inference across edge and cloud:
- Edge agents handle local inference with low latency
- Cloud agents provide heavy computational capabilities
- Load balancing distributes requests automatically
- Pub/sub coordinates model updates and configuration

**Collaborative Agent Environments**

Enable agents from different vendors and frameworks to interoperate:
- Each agent speaks WAMP regardless of internal implementation
- Secure multi-tenancy isolates competing agent systems
- Dynamic discovery allows agents to find and use new capabilities
- Standardized protocol eliminates integration code

## Core Architecture: Routed Communication

WAMP is fundamentally a routed protocol. All application components—web apps, mobile apps, backend services, IoT devices—connect to a WAMP Router. The Router handles message routing, authentication, authorization, and session management, freeing your application code from these concerns.

This architecture brings several advantages:

- **Decoupling** - Components don't need to know about each other's location or identity
- **Dynamic discovery** - Procedures and topics are discovered at runtime, not compile time
- **Load balancing** - Multiple components can implement the same procedure, with the router distributing calls
- **Security** - Centralized authentication and fine-grained authorization at the routing layer

<ZoomImg src="/assets/wamp_flows.png" width="600"/>

## Unified Routing for RPC and Pub/Sub

WAMP's genius lies in treating both RPC and Pub/Sub as first-class routing patterns, not afterthoughts or workarounds.

### Remote Procedure Calls

In WAMP, RPCs are routed through the Router, not directly addressed from caller to callee. This seemingly simple change has profound implications:

- **Peer-to-peer semantics** - Any client can be both a caller and a callee
- **Dynamic routing** - The router determines which implementation handles each call
- **Location transparency** - Callers don't need to know where callees are located
- **Built-in load balancing** - Multiple callees can register the same procedure

This is fundamentally different from traditional RPC systems like HTTP/REST or gRPC, where communication is direct and unidirectional (client calls server, never the reverse). With WAMP, a browser can expose procedures for backend services to call. A mobile app can be an RPC server. This opens up architectural possibilities that simply don't exist with traditional protocols.

### Publish/Subscribe

WAMP's Pub/Sub follows the same routed architecture. Publishers send events to topics via the Router, which delivers them to all interested subscribers. The Router handles:

- **Topic-based routing** - Events are addressed by URI, not destination
- **Pattern matching** - Subscribers can use exact, prefix, or wildcard matching
- **Publisher isolation** - Publishers don't know (or need to know) who's listening
- **Flexible delivery** - Subscribers can filter, exclude, or whitelist publishers

## The Peer-to-Peer Revolution

Traditional protocols maintain a strict client-server dichotomy. Clients consume APIs. Servers provide them. WAMP obliterates this distinction.

In WAMP, every client is a peer. A browser can:
- Call procedures on backend services (traditional client role)
- Register procedures for backends to call (traditional server role)
- Publish events (publisher role)
- Subscribe to events (subscriber role)

All four roles are available to every client, all over a single connection. This peer-to-peer programming model enables architectural patterns that are awkward or impossible with traditional protocols:

- **Server-initiated operations** - The backend can call procedures on the frontend without WebSocket hacks
- **Device orchestration** - IoT devices can call procedures on each other through the router
- **Distributed workflows** - Complex multi-party interactions become straightforward

## Multi-Tenancy Through Realms

WAMP Routers organize clients into realms—isolated routing and administrative domains. When establishing a session, clients specify which realm to join. Once connected:

- **Namespace isolation** - Clients in one realm cannot access procedures or topics in another
- **Independent permissions** - Each realm has its own authorization rules
- **Shared infrastructure** - Realms are virtual, requiring no additional resources
- **Unlimited scalability** - Create as many realms as needed

<ZoomImg src="/assets/realm_diagram.png"/>

Realms support fine-grained URI-based permissions using exact, prefix, or wildcard matching. This allows precise control over who can call which procedures and subscribe to which topics, all without modifying application code.

## Transport Flexibility

WAMP is transport-agnostic. It works over any transport that is:
- Message-oriented
- Ordered
- Reliable
- Bi-directional

In practice, this means WAMP runs over:

- **WebSocket** - For browser and mobile apps
- **Raw TCP** - For backend services
- **Unix Domain Sockets** - For local IPC
- **TLS** - For secure communications

Clients choose their transport based on their needs and constraints. A browser uses WebSocket. A backend service might use TCP for lower overhead. An embedded device might use Unix sockets. All communicate seamlessly through the Router.

## Serialization Options

WAMP doesn't mandate a single serialization format. Clients can choose based on their requirements:

- **JSON** - Human-readable, universally supported
- **MessagePack** - Compact binary format for efficiency
- **CBOR** - Concise Binary Object Representation for constrained environments

The Router handles conversion when necessary, allowing clients using different serializations to communicate transparently.

## How WAMP Works: The Workflow

A typical WAMP session follows this flow:

1. **Connection** - Client connects to the Router using chosen transport and serialization
2. **Authentication** - Router authenticates the client using one of several supported methods
3. **Authorization** - Router grants permissions based on realm configuration
4. **Communication** - Client performs RPC and Pub/Sub operations

### RPC Operations

**Register a Procedure:**

```javascript
wampy.register('com.example.add', {
    rpc: function(args) {
        return args[0] + args[1];
    },
    invoke: 'single',
    match: 'exact',
    onSuccess: function(reg) {
        console.log('Procedure registered successfully');
    },
    onError: function(err) {
        console.error('Registration failed:', err);
    }
});
```

**Call a Procedure:**

```javascript
wampy.call('com.example.add', [3, 4], {
    onSuccess: function(result) {
        console.log('Result:', result); // Result: 7
    },
    onError: function(err) {
        console.error('Call failed:', err);
    }
});
```

### Pub/Sub Operations

**Subscribe to a Topic:**

```javascript
wampy.subscribe('com.example.events', function(args, kwargs, details) {
    console.log('Event received:', args);
});
```

**Publish an Event:**

```javascript
wampy.publish('com.example.events', ['Hello World'], {
    acknowledge: true
});
```

## What Makes WAMP Unique

Five key features distinguish WAMP from other application messaging protocols:

1. **Multi-tenancy through Realms** - Virtual isolation for security and routing without infrastructure overhead

2. **Unified messaging patterns** - Both RPC and Pub/Sub in a single protocol, not layered on top of each other

3. **Routed RPC with peer-to-peer semantics** - Any client can be both caller and callee, enabling true distributed architectures

4. **Transport independence** - Run over WebSocket, TCP, Unix sockets, or any reliable bi-directional transport

5. **Serialization flexibility** - Choose JSON, MessagePack, CBOR, or implement your own

By combining these features, a WAMP Router provides everything needed for distributed application messaging—RPC, Pub/Sub, authentication, authorization, service discovery, and load balancing—in a single infrastructure component.

## The Result: Simplicity at Scale

WAMP reduces technology stack complexity, accidental complexity, and networking overhead. Instead of assembling and maintaining multiple messaging technologies—each with its own protocol, client library, and operational characteristics—you deploy a single WAMP Router and use a single client library.

Your browser app, mobile app, backend services, and IoT devices all speak WAMP. They all get the same capabilities. They all benefit from the same security model. And they all communicate seamlessly, regardless of where they're deployed or what language they're written in.

This is the vision of WAMP: a universal application messaging protocol that makes distributed systems simpler, more powerful, and more elegant.

Ready to see WAMP in action? [Explore Bondy](/concepts/what_is_bondy), a production-ready WAMP router that brings these capabilities to life.
