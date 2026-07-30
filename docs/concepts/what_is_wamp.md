---
draft: false
---
# What is WAMP

The Web Application Messaging Protocol (WAMP) is an open standard that unifies the two fundamental patterns of distributed application communication — Remote Procedure Calls and Publish/Subscribe — into a single protocol.

## The problem WAMP addresses

Most application protocols specialize in one communication pattern: HTTP or gRPC for request-response, a message broker for event distribution. Using both patterns in one application means integrating multiple protocols and multiple client libraries.

WAMP provides RPC and Pub/Sub in a single protocol designed for distributed systems, so a web app, a mobile app, backend services, and IoT devices can use one client library and one set of capabilities regardless of which pattern a given interaction needs.

## Why WAMP exists

WAMP combines RPC and Pub/Sub, over multiple transports and serialization formats, so a single protocol can handle both north-south (client-to-server) and east-west (service-to-service) traffic in a distributed application. This unification means:

- **One protocol** instead of a separate stack per communication pattern.
- **One client library** to learn and use across RPC and Pub/Sub.
- **One infrastructure component** to deploy and operate.
- **No impedance mismatch** between the request-response and event-driven parts of an application.

WAMP is a community-driven open standard; its [specification](https://wamp-proto.org/wamp_latest_ietf.html) is freely available under an open license, and anyone can implement, use, or extend it.

::: info Like D-Bus over a network
[D-Bus](https://en.wikipedia.org/wiki/D-Bus) is a platform-neutral messaging service that runs by default in most Linux distributions. It offers the same two basic workflows as WAMP — RPC and Pub/Sub — but whereas WAMP is designed for distributed systems over a network, D-Bus is designed for inter-process communication (IPC) on a single host.
:::

## WAMP for agent-to-agent communication

An AI agent needs to discover services, invoke functions, coordinate actions, and react to events, often concurrently. That requires authentication, authorization, and the ability to communicate peer-to-peer, rather than only within a fixed client-server hierarchy.

WAMP covers this in a single protocol, and has been running in production for over a decade — longer than agent-specific protocols such as MCP (Model Context Protocol) have existed.

### What WAMP provides

- **RPC for function calling** — agents invoke capabilities on other agents or services.
- **Pub/Sub for event coordination** — agents subscribe to events and publish state changes.
- **Authentication** — cryptosign, tickets, OAuth2, and other methods verify agent identity.
- **Authorization** — fine-grained RBAC controls what each agent can access.
- **Service discovery** — agents discover available procedures and topics dynamically.
- **Load balancing** — multiple agents can provide the same capability, with calls distributed across them automatically.
- **Multi-tenancy** — realms isolate different agent systems from each other.

A protocol that covers only one of function calling or event coordination requires assembling a second protocol for the other. WAMP provides both from one connection.

### Peer-to-peer agent architecture

WAMP does not distinguish client and server roles: every connected agent can register procedures for other agents to call, call procedures on other agents, publish events, and subscribe to events, all over one connection. This matters for agent systems where the client/server distinction doesn't hold cleanly — an agent that analyzes images may also need to accept analysis requests from other agents, and a planning agent may coordinate execution agents while also answering queries from a monitoring agent. Protocols built around a client-server or hierarchical model (MCP among them) constrain this kind of symmetric interaction; WAMP's routed RPC does not.

### Example: two agents coordinating over RPC and Pub/Sub

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

One protocol and one connection cover both the function call and the event notification.

### Compared to MCP and similar agent protocols

MCP focuses on connecting AI models to data sources and tools, typically through a client-server pattern. It does not, by itself, provide native Pub/Sub for agent coordination, peer-to-peer semantics for symmetric agent interaction, built-in authentication and authorization, or multi-tenancy. Building a complete agent system on MCP means pairing it with additional protocols and infrastructure for those concerns; WAMP provides all of them from a single router. See [What is Bondy](/concepts/what_is_bondy) for a WAMP router built on this model.

### Example use cases

- **Multi-agent LLM systems** — a research agent queries knowledge bases and publishes findings; a synthesis agent subscribes to those findings and generates a report; a validation agent checks outputs and invokes corrections. All three coordinate over the same router.
- **Agentic workflow automation** — a data-collection agent publishes raw data; a processing agent subscribes and transforms it; a decision agent analyzes results and invokes an action agent; a monitoring agent tracks health and triggers interventions.
- **Distributed AI inference** — an edge agent handles local inference for latency-sensitive requests; a cloud agent handles heavier computation; the router load-balances between them and distributes model-update events.
- **Cross-vendor agent interoperability** — agents built on different frameworks interoperate because they speak the same wire protocol, with realms isolating unrelated agent systems from each other.

## Core architecture: routed communication

WAMP is a routed protocol: every component — web app, mobile app, backend service, IoT device — connects to a WAMP Router, which handles message routing, authentication, authorization, and session management, rather than each component handling these concerns itself.

Routing everything through one component gives:

- **Decoupling** — a component doesn't need to know another component's location or identity.
- **Dynamic discovery** — procedures and topics are discovered at runtime, not fixed at compile time.
- **Load balancing** — multiple components can implement the same procedure, with the router distributing calls across them.
- **Centralized security** — authentication and fine-grained authorization live at the routing layer, not duplicated in every component.

<ZoomImg src="/assets/wamp_flows.png" width="600"/>

## RPC and Pub/Sub as routed patterns

WAMP treats both RPC and Pub/Sub as routed patterns, rather than layering one on top of point-to-point connections.

### Remote Procedure Calls

A WAMP call is routed through the Router rather than addressed directly from caller to callee, which gives:

- **Peer-to-peer semantics** — any client can be both a caller and a callee.
- **Dynamic routing** — the router decides which registered implementation handles a given call.
- **Location transparency** — a caller doesn't need to know where the callee is running.
- **Load balancing** — multiple callees can register the same procedure.

This differs from HTTP/REST or gRPC, where the connection is direct and unidirectional (the client calls the server, never the reverse). Because WAMP routes the call, a browser can expose a procedure for a backend service to call, and a mobile app can act as an RPC server — roles a direct client-server protocol cannot support without a separate side channel.

### Publish/Subscribe

WAMP's Pub/Sub follows the same routed model: a publisher sends an event to a topic via the Router, which delivers it to every interested subscriber. The router handles:

- **Topic-based routing** — an event is addressed by URI, not by destination.
- **Pattern matching** — a subscription can use exact, prefix, or wildcard matching.
- **Publisher isolation** — a publisher does not need to know who, if anyone, is subscribed.
- **Delivery filtering** — a subscriber can be excluded or whitelisted per publication.

## No client/server distinction

Every WAMP client is a peer: over a single connection, it can call procedures on other components, register procedures for other components to call, publish events, and subscribe to events — all four roles are available to every client at once. This enables patterns that are awkward to build on a strict client-server protocol:

- **Server-initiated operations** — a backend calls a procedure on the frontend directly, without a separate push channel.
- **Device orchestration** — IoT devices call procedures on each other through the router.
- **Multi-party workflows** — several components coordinate directly rather than through a hub each side has to poll.

## Multi-tenancy through realms

A WAMP Router organizes clients into realms — isolated routing and administrative domains that a client selects when it establishes a session. Within a realm:

- **Namespace isolation** — a client in one realm cannot reach a procedure or topic in another.
- **Independent permissions** — each realm has its own authorization rules.
- **No added infrastructure** — a realm is virtual; creating one does not require provisioning anything.

<ZoomImg src="/assets/realm_diagram.png"/>

Realms support URI-based permissions with exact, prefix, or wildcard matching, so which procedures and topics a client can reach is controlled at the routing layer rather than in application code.

## Transport flexibility

WAMP runs over any transport that is message-oriented, ordered, reliable, and bidirectional. In practice this includes:

- **WebSocket** — for browser and mobile apps.
- **Raw TCP** — for backend services.
- **Unix domain sockets** — for local IPC.
- **TLS** — layered under any of the above for secure connections.

A client chooses its transport independently of every other client on the same router — a browser over WebSocket and a backend service over raw TCP interoperate through the same Router.

## Serialization options

WAMP does not mandate one serialization format. A client chooses:

- **JSON** — human-readable, universally supported.
- **MessagePack** — a compact binary format.
- **CBOR** — Concise Binary Object Representation, for constrained environments.

The Router converts between formats as needed, so clients using different serializations still communicate.

## Session workflow

A WAMP session follows:

1. **Connection** — the client connects to the Router over its chosen transport and serialization.
2. **Authentication** — the Router authenticates the client using one of the realm's configured methods.
3. **Authorization** — the Router grants permissions based on the realm's configuration.
4. **Communication** — the client performs RPC and Pub/Sub operations.

### RPC

**Register a procedure:**

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

**Call a procedure:**

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

### Pub/Sub

**Subscribe to a topic:**

```javascript
wampy.subscribe('com.example.events', function(args, kwargs, details) {
    console.log('Event received:', args);
});
```

**Publish an event:**

```javascript
wampy.publish('com.example.events', ['Hello World'], {
    acknowledge: true
});
```

## What distinguishes WAMP

1. **Multi-tenancy through realms** — virtual isolation for security and routing, with no added infrastructure.
2. **Unified messaging patterns** — RPC and Pub/Sub in one protocol, not one layered on top of the other.
3. **Routed RPC with peer-to-peer semantics** — any client can be both caller and callee.
4. **Transport independence** — WebSocket, TCP, Unix sockets, or any other reliable bidirectional transport.
5. **Serialization flexibility** — JSON, MessagePack, CBOR, or a custom format.

Together, these mean a WAMP Router provides RPC, Pub/Sub, authentication, authorization, service discovery, and load balancing from a single infrastructure component, rather than a combination of several.

## See also

- [What is Bondy](/concepts/what_is_bondy) — a production WAMP router implementing everything described here.
- [Architecture](/concepts/architecture) — how a WAMP router's storage and routing layers are built.
