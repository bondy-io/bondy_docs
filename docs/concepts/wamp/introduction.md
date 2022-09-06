# Introduction to WAMP

>The Web Application Messaging Protocol (WAMP) is a routed protocol for distributed applications with all application components connecting to a WAMP Router that performs message routing between them. WAMP provides the two most important communication patterns for loosely couple distributed architectures: Publish-Subscribe and Routed Remote Procedure Calls.

<ZoomImg src="/assets/wamp_routing.png"/>

## How is WAMP different than other protocols?

Five key features makes WAMP unique amongst alternative application messaging protocols:

1. **Session-oriented**. All messages are routed within an established session. Sessions are authenticated and all messages are authorised.
2. **Designed for multi-tenancy** through the use of Realms for both security and routing. Realms are virtual so it does not impose additional infrastructure requirements e.g. dedicated ports. Sessions are attached to a single Realm at a time.
3. **Provides both application messaging patterns**, Publish-Subscribe (PubSub) and Routed Remote Procedure Calls (rRPC) a dynamic RPC variant where Caller and Callee are completely decoupled and no direct connection exists between them.
4. **Provides a peer-to-peer programming model**, as any distributed application component can play any and the same roles simultaneously: RPC client (Caller), RPC server (Callee), Publisher and Subscriber. This is in contrast to protocols that distiguish between RPC Client and RPC Server, treating the client as dumb e.g. HTTP and gRPC.
5. **Supports multiple-transports** and each client can choose which one to use. WAMP can run over any transport which is message-oriented, ordered, reliable, and bi-directional such as Websockets, TCP, Unix domain socket, etc.
6. **Supports multiple serializations** and each session can choose which one to use.

By combining these key features into a single infrastructure component, a WAMP Router can be used for the entire messaging requirements of a distributed systems including connected devices, browser and mobile apps and backend services, thus **reducing technology stack complexity, accidental complexity as well as networking overheads**.

## Realms and Sessions

<ZoomImg src="/assets/wamp_roles.png"/>


## Peer-to-peer programming

## Routed RPC




---

Web Application Messaging Protocol (WAMP)

## What is WAMP?

>WAMP is an open standard for (soft) real-time message exchange amongst system components—applications, (micro-) services and connected devices—that eases the creation of loosely coupled distributed architectures.


## Key Characteristics

* **It is a routed protocol**<br>All components connecting to a **WAMP** [Router](/concepts/router), where the router performs message routing between **WAMP** [Clients](/concepts/client).

### Unified routing for both RPC and Pub/Sub

### Peer-to-peer programming model
In WAMP all clients are peers i.e. they can play all and the same roles.

### Multi-tenancy

Routers define realms as administrative domains, and clients must specify which realm they want to join upon session establishment. Once joined, the realm will act as a namespace, preventing clients connected to a realm from accessing other realms  RPC procedures and PubSub topics. Clients connected to a realm cannot see messages from clients in another realm.

<ZoomImg src="/assets/realm_diagram.png"/>


Realms also have permissions attached and can limit the clients to perform a subset of the operations available on the available procedures and topics either through exact, prefix or wildcard matching of their URIs.

### Routed RPC (Peer-to-Peer RPC)

WAMP was designed to provide both RPC and PubSub, unlike other messaging protocols in which RPC are implemented on top of PubSub.

**RPCs in WAMP are routed by a middleware and work bidirectionally**, unlike with traditional RPCs, which are addressed directly from a caller (client) to the callee offering the procedure (server) and are strictly unidirectional (client-to-server),

Registration of RPCs is with the WAMP router, and calls to procedures are similarly issued to the WAMP router. This means first of all that a client can issue all RPCs via the single connection to the WAMP router, and does not need to have any knowledge what client is currently offering the procedure, where that client resides or how to address it. This can indeed change between calls, opening up the possibility for advanced features such as load-balancing or fail-over for procedure calls.

This additionally means that all WAMP clients are equal in that they can offer procedures for calling. This avoids the traditional distinction between clients and server backends, and allows architectures where browser clients call procedures on other browser clients, **with an API that feels like peer to peer communication**. This is depicted in the diagram below where client can play all or a subset of 4 roles: Caller, Callee, Subscriber, Publisher.

### Choice of transports

### Choice of serializations

Message serialization assumes integers, strings and ordered sequence types are available, and defaults to JSON as the most common format offering but allows Clients and Routers to use alternative serializations.

## Session establishing Message Flows

The typical data exchange workflow is:

- Clients connect to the *Router* using a transport, serialisation format and authentication method of choice, establishing a session onto a realm.
- The *Router* authenticates the clients and grants them permissions for the current session.
- Clients send messages to the router which routes them to the targets using message URIs.


## Routed RPC Message Flows
The clients send these messages using the two high-level primitives that are routed RPC and PubSub, doing four core interactions:

- **register**: a client (*Callee*) exposes a procedure to be called remotely with an URI (also a URI pattern if Router provides this feature).

    ```bash
    session.register("com.example.add", [], {}, fun(a, b){return a + b})
    ```

- **call**: a client (*Caller*) asks the *Router* to invoke procedure from another client by providing the procedure URI.

    ```bash
    Res = session.call("com.example.add", [3, 4])
    // Res = 7
    ```

## Pub/Sub Message Flows

- **subscribe**: a client (*Subscriber*) notifies its interest in a topic, by providing the topic URI (or URI pattern).
- **publish**: a client (*Publisher*) publishes events on a topic, by providing the topic URI.
