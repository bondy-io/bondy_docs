# Introduction to WAMP

>The Web Application Messaging Protocol (WAMP) is a routed protocol for distributed applications with all application agents connecting to a WAMP Router that performs message routing between them. WAMP unifies the two most important communication patterns under a single protocol: Publish-Subscribe and Routed Remote Procedure Calls.{.definition}

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

Realms are routing and administrative domains that act as namespaces. All resources in Bondy belong to a Realm.

For an application to be able to communicate with others using WAMP it needs to establish a session on the desired Realm. To establish a session the application will need to authenticate itself using the available authentication methods for the realm.

Once a session has been established the realm will act as a namespace, preventing clients connected to a realm from accessing other realms' resources, including the registered RPC procedures and PubSub topics.

<ZoomImg src="/assets/wamp_roles.png"/>

All messages are routed separately for each individual realm (isolation) so sessions attached to a realm won’t see messages routed on another realm.

Realms also have permissions defined and can limit the clients to perform a subset of the operations available on the available procedures and topics.

::: info Realms in Bondy
Realms in Bondy can be statically defined (via configuration) or dinamically defined (via API). Learn more about realms in the [Realm API Reference documentation](/reference/wamp_api/realm).
:::



## Publish-Subscribe
Publish-subscribe (PubSub) is a distributed application messaging pattern in which remote agents interact with each other indirectly through messages published to a named channel, called Topic. Topics are managed by a Broker, a role played by a WAMP Router (like Bondy).

An agent that wants to send a message, called Publisher, doesn't send the message directly to the interested agents, called Subscribers, but instead sends the message to a Topic, without knowledge of which Subscribers, if any, there may be.

Similarly, Subscribers express interest in one or more Topics and only receive messages sent to those topics, without knowledge of which Publishers, if any, there are.

In WAMP topic names are defined as URIs e.g. `com.myapp.event.order.created`.

The following diagram shows on Publisher (A) and two Subscribers (B) and (C) exchanging messages through a WAMP Router (Broker).

<ZoomImg src="/assets/pubsub.png"/>

### Delivery Guarantees

In WAMP there is no guarantee of message delivery. This is what literature refers to "fire and forget" and provides the same guarantee as the underlying trasport e.g. WebSockets or TCP/IP.

::: info Bondy Delivery Guarantees
Bondy, being a distributed router, makes additional efforts when it comes to inter-cluster message delivery, but from a client point-of-view it still offers the same guarantee as WAMP.

Future versions of Bondy will offer stronger end-to-end delivery guarantees.
:::

### Routed Remote Procedure Calls (RPC)
WAMP adapts and extends the

The following diagram shows on Caller (A) making a call that is routed by the WAMP Router (Dealer) to the Callee (B) implementing the procedure.

<ZoomImg src="/assets/rpc.png"/>

::: info Client-Router vs Clients-Servers?
You might have noticed that as compared to traditional RPC frameworks like CORBA and lately gRPC, in WAMP we do not talk about "RPC Clients" and "RPC Servers", we talk about Callers and Callees.

This is not just a language preference, it denotes a fundamental WAMP feature: unlike with traditional RPCs, which are addressed directly from a client to server and are strictly unidirectional (client-to-server), RPCs in WAMP are routed by a middleware and work bidirectionally. This means any remote agent can be a client and server at the same time. The next section will explain this in detail.

In WAMP we use the word "client" to refer to any agent or application component that connectes to the Router. WAMP clients can be Callers, Callees, Publishers, Subscribers or any combination of those 4 roles.
:::

## Peer-to-peer programming model

In WAMP all clients are peers i.e. they can play all and the same roles.


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
