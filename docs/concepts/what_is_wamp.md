---
draft: true
---
# What is WAMP
Web Application Messaging Protocol (WAMP) is an open standard protocol for (soft) real-time message exchange that provides two application messaging patterns in one unified protocol: Remote Procedure Calls and Publish/Subscribe.

## Introduction

The Web Application Messaging Protocol (WAMP) is intended to provide application developers with the semantics they need to handle messaging between components in distributed applications.

By combining the two main application communication patterns–Remote Procedure Calls and Publish/Subscribe– into a single protocol, it can be used for the entire messaging requirements of a distributed application, thus reducing technology stack complexity, as well as networking overheads.

WAMP is a community effort and the [protocol specification](https://wamp-proto.org/wamp_latest_ietf.html) is made available for free under an open license for everyone to use or implement.

## Key Characteristics

* **It is a routed protocol**<br>All components connecting to a [Router](/concepts/router), where the router performs message routing between [Clients](/concepts/client).

::: info Like D-Bus over a network
[D-Bus](https://en.wikipedia.org/wiki/D-Bus) is a platform-neutral messaging service that runs by default in most Linux distributions. It offers the same two basic workflows as WAMP, but whereas WAMP is designed for use over a network, D-Bus is designed for inter-process communication (IPC) on a single host.
:::

## Unified routing for both RPC and Pub/Sub

<ZoomImg src="/assets/wamp_flows.png"/>

## Peer-to-peer programming model
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

## Workflow

The typical data exchange workflow is:

- Clients connect to the *Router* using a transport, serialisation format and authentication method of choice, establishing a session onto a realm.
- The *Router* authenticates the clients and grants them permissions for the current session.
- Clients send messages to the router which routes them to the targets using message URIs.

The clients send these messages using the two high-level primitives that are routed RPC and PubSub, doing four core interactions:

### RPC
#### Register
A client (*Callee*) exposes a procedure to be called remotely with an URI (also a URI pattern if Router provides this feature).

:::::: tabs code
::: tab Javascript
```javascript
session.register(
    "com.example.add", // procedure URI
    function(a, b){return a + b;}, // callback
    {invoke: "single", match: "exact"} // registration options
).then(
    function(reg){...},
    function(err){...}
);
```
:::
::::::


#### Call
A client (*Caller*) asks the *Router* to invoke procedure from another client by providing the procedure URI.

:::::: tabs code
::: tab Javascript
```javascript
Res = session.call(
    "com.example.add", // procedure URI
    [3, 4] // positional args
).then(
    function(res){
        var val = res.args[0]; // access positional result, Val = 7
        ...
    },
    function(err){...}
);
```
:::
::::::

### Publish/Subscribe

#### Subscribe
A client (*Subscriber*) notifies its interest in a topic, by providing the topic URI (or URI pattern).

#### Publish
A client (*Publisher*) publishes events on a topic, by providing the topic URI.

::: info SUMMARY: How is WAMP different than other protocols?

Five key features makes WAMP unique amongst alternative application messaging protocols:

1. **WAMP provides multi-tenancy** through the use of Realms for both security and routing. Realms are virtual so it does not impose additional infrastructure requirements e.g. dedicated ports.
2. **WAMP provides both application messaging patterns,** Publish & Subscribe (PubSub) and Remote Procedure Calls (RPC).
3. **WAMP offers routed RPC**, a dynamic RPC variant that enables a **peer-to-peer communication pattern,** as any distributed application component can act as both client (caller) and servers (callee).
4. **WAMP offers multiple-transports** and each client can choose which one to use. WAMP can run over any transport which ismessage-oriented, ordered, reliable, and bi-directionalsuch as Websockets, TCP, Unix domain socket, etc.
5. **WAMP supports multiple serializations** and each client can choose which one to use.

By combining these key features into a single infrastructure component, a WAMP Router can be used for the entire messaging requirements of all the components of distributed systems including connected devices, browser and mobile apps and backend services, thus **reducing technology stack complexity, accidental complexity as well as networking overheads**.
:::