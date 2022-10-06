# Introduction to WAMP

>The Web Application Messaging Protocol (WAMP) is a routed protocol for polyglot distributed applications with all application agents connecting to a WAMP Router that performs message routing between them. WAMP unifies the two most important communication patterns under a single protocol: Publish-Subscribe and Routed Remote Procedure Calls.{.definition}

In WAMP, agents that want to interact with each other, called WAMP clients, connect to a WAMP Router. The WAMP Router is in effect an **L7 application networking platform**.

You will learn later on that these clients can be written in different programming languages, use different transports and use different message serialization formats.

The following diagram shows a number of connected devices, browser-based, mobile applications and backend services all interacting with each other using WAMP. For that, they all have individual connections to the WAMP Router.


<ZoomImg src="/assets/wamp_routing.png"/>

::: info Peer-to-peer programing model
Notice there is no difference between apps and services, they are all equal peers, each being able to send and receive messages.
:::


## How is WAMP different than other protocols?

Six key features makes WAMP unique amongst alternative application messaging protocols:

1. **Session-oriented**. All messages are routed within an established session. Sessions are authenticated and all messages are authorised.
2. **Designed for multi-tenancy** through the use of Realms for both security and routing. Realms are virtual so it does not impose additional infrastructure requirements e.g. dedicated ports. Sessions are attached to a single Realm at a time.
3. **Provides both application messaging patterns**, Publish-Subscribe (PubSub) and Routed Remote Procedure Calls (rRPC) a dynamic RPC variant where Caller and Callee are completely decoupled and no direct connection exists between them.
4. **Provides a peer-to-peer programming model**, as any distributed application component can play any and the same roles simultaneously: RPC client (Caller), RPC server (Callee), Publisher and Subscriber. This is in contrast to protocols that distiguish between RPC Client and RPC Server, treating the client as dumb e.g. HTTP and gRPC.
5. **Supports multiple-transports** and each client can choose which one to use. WAMP can run over any transport which is message-oriented, ordered, reliable, and bi-directional such as Websockets, TCP, Unix domain socket, etc.
6. **Supports multiple serializations** and each session can choose which one to use e.g. JSON, Msgpack, etc.

By combining these key features into a single infrastructure component, a WAMP Router can be used for the entire messaging requirements of a distributed systems including connected devices, browser and mobile apps and backend services, thus **reducing technology stack complexity, accidental complexity as well as networking overheads**.

## Realms and Sessions

> Realms are routing and administrative domains that act as namespaces. All resources in Bondy belong to a Realm. All messages flow within a Realm.

WAMP is a session-oriented protocol. For an application to be able to communicate with others using WAMP it needs to establish a session on the desired Realm. To establish a session the application will need to authenticate itself using the available authentication methods for the realm (See the [Realm](/reference/wamp_api/realm) documentation page for more details about authentication methods).

Once a session has been established the realm will act as a namespace, preventing clients connected to a realm from accessing other realms' resources, including the registered RPC procedures and PubSub topics.

<ZoomImg src="/assets/wamp_roles.png"/>

All messages are routed separately for each individual realm (isolation) so sessions attached to a realm won’t see messages routed on another realm.

Realms also have permissions defined and can limit the clients to perform a subset of the operations available on the available procedures and topics.

::: info Realms in Bondy
Realms in Bondy can be statically defined (via configuration) or dinamically defined (via API). Learn more about realms in the [Realm API Reference documentation](/reference/wamp_api/realm).
:::

### Establishing a Session

The typical data exchange workflow is:

- Clients connect to the *Router* using a transport, serialisation format, authentication method of choice and WAMP roles that it will play, establishing a session onto a Realm.
- The *Router* authenticates the clients and grants them permissions for the current Session.
- Clients send messages (addressed to known procedure or topics) to the Router which routes them to the target clients.


## Publish-Subscribe
> Publish-subscribe (PubSub) is a distributed application messaging pattern in which remote agents interact with each other indirectly through messages published to a named channel, called Topic. Topics are managed by a Broker, a role played by a WAMP Router (like Bondy).

An agent that wants to send a message, called Publisher, doesn't send the message directly to the interested agents, called Subscribers, but instead sends the message to a Topic, without knowledge of which Subscribers, if any, there may be.

Similarly, Subscribers express interest in one or more Topics and only receive messages sent to those topics, without knowledge of which Publishers, if any, there are.

In WAMP topic names are defined as URIs e.g. `com.myapp.event.order.created`.

The following diagram shows on Publisher (A) and two Subscribers (B) and (C) exchanging messages through a WAMP Router (Broker).

<ZoomImg src="/assets/pubsub.png"/>

- **subscribe**: a *Subscriber* (B) and (C) notifies its interest in a topic, by providing the topic URI (or URI pattern).
- **publish**: a *Publisher* (A) publishes events on a topic, by providing the topic URI. The Router (using its Broker role) routes the event to all subscribers (in this case (B) and (C)).

::: info Delivery Guarantees
In WAMP ther Router does not perform any additional effort to guarantee message delivery. This is what literature refers to as "fire and forget" and provides the same guarantee as the underlying trasport e.g. WebSockets or TCP/IP.

WAMP offers a feature called Event History, in essence a session queue, that can store events while the Subscriber is offline.

Bondy, being a distributed router, makes additional efforts when it comes to inter-cluster message delivery, but from a client point-of-view it still offers the same guarantee as WAMP and currently does not provide Event History.

Future versions of Bondy will not only provide Event History but also additional queueing capabilities and even stronger end-to-end message delivery guarantees.
:::

## Routed Remote Procedure Calls (RPC)
WAMP was designed to provide both RPC and PubSub.

**RPCs in WAMP are routed and work bidirectionally**, unlike traditional RPC frameworks which are addressed directly and are strictly unidirectional (client-to-server).

Registration of RPCs is with the WAMP router (actually the Dealer role played by the Router), and calls to procedures are similarly issued by WAMP clients to the WAMP Router. This means that a Caller can issue all RPCs via the single connection to the WAMP router (the same connection it can use to do PubSub), and does not need to have any knowledge about what Callee is currently offering the procedure, where that Callee resides or how to address it. This can indeed change between calls, opening up the possibility for advanced features such as load-balancing or fail-over for procedure calls.

The following diagram shows on Caller (A) making a call that is routed by the WAMP Router (Dealer) to the Callee (B) implementing the procedure.

<ZoomImg src="/assets/rpc.png"/>

- **register**: a *Callee* (B) exposes a procedure to be called remotely with an URI (also a URI pattern if Router provides this feature).

- **call**: a *Caller* (A) asks the *Router* to invoke procedure from (B) by providing the procedure URI.


::: info Not just a word choice
This is an important concept to remark, in WAMP we do not talk about "RPC Clients" and "RPC Servers", we talk about Callers and Callees which are roles performed by a WAMP "client".

Thus, in WAMP we use the word "client" to refer to any agent or application component that connects to a WAMP Router i.e. WAMP client library.

This is not just a language choice, it denotes a fundamental WAMP feature, becuase RPCs in WAMP are routed and work bidirectionally, this means any WAMP client can be an RPC client or RPC server at the same time!

In fact, as we will see in the next section, WAMP clients can play any of the 4 roles described in the previous sections (Caller, Callee, Publisher, Subscriber) or any combination of those at the same time.
:::

## Peer-to-peer programming model

As we mentioned before, WAMP clients can play any of the 4 roles described in the previous sections (Caller, Callee, Publisher, Subscriber) or any combination of those at the same time.

This, in effect, offers a Peer-to-peer programming model, where all WAMP clients are equal in that they can all play anyone of the WAMP client roles.

This not only avoids the traditional distinction between RPC clients and RPC server, biut also allows architectures that are impossible with traditional RPC frameworks. For example, in WAMP a browser-based client can call procedures on another browser-based client or a mobile-based client!

So we finally have a distributed systemns programming model that doesn't treat browsers and mobile phones as dumb terminals, which was the assumption behind mainstream protocols like HTTP and gRPC.






