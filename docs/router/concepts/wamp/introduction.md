# Introduction to WAMP

The WAMP model has few parts: peers, a router, realms, sessions and roles. Every other WAMP page uses these terms with the meanings given here. For why WAMP exists and what it replaces, read [What is WAMP?](/router/concepts/wamp/what_is_wamp) first.

## Peers and the router

A **peer** is a program that speaks WAMP. WAMP has two kinds of peer: clients and routers.

A **client** is an application component: a browser app, a mobile app, a backend service, a device. A **router** is the peer that clients connect to. Bondy is a router. Clients never connect to each other. Each client holds one connection to the router, and the router moves every message between clients.

<ZoomImg src="/assets/wamp_routing.png"/>

This is what makes WAMP *routed*. A client addresses a message to a name, not to another client. The router decides which clients receive it. So a client does not need to know where the other clients run, how many there are, or whether any exist.

::: info Like D-Bus over a network
[D-Bus](https://en.wikipedia.org/wiki/D-Bus) gives the programs on one Linux host RPC and publish/subscribe through a message bus. WAMP gives the same two patterns to programs on a network, through a router.
:::

## Realms

A **realm** is a routing and administrative domain. Every procedure, topic, user, group and permission belongs to one realm. The router routes each realm separately, so a message in one realm never reaches a client in another.

A realm is a name, not a piece of infrastructure. Creating one does not need a new port, process or host. That is what makes a router multi-tenant: one Bondy cluster can serve many applications, or many customers of one application, each in its own realm.

In Bondy, a realm exists on every node of a cluster. A client connected to any node reaches the procedures and topics of its realm on every other node.

<ZoomImg src="/assets/wamp_roles.png"/>

## Sessions

A **session** is a client's attachment to one realm. A client opens a session by sending `HELLO` with the realm it wants. The router authenticates the client with one of the realm's authentication methods, and answers `WELCOME` with a session ID. From then on, the router authorizes each message the client sends against the realm's permissions for that client.

A session belongs to one realm for its whole life. A client that needs two realms opens two sessions. In Bondy, each transport connection carries exactly one session.

[Connections and Sessions](/router/concepts/wamp/sessions) describes the session lifecycle, and [Security](/router/concepts/wamp/security) how authentication and authorization work.

## Roles

A **role** is a part a peer plays in a messaging pattern. WAMP defines two patterns, each with two client roles and one router role.

|Pattern|Client roles|Router role|
|:---|:---|:---|
|[Routed RPC](/router/concepts/wamp/rpc)|**Callee** registers a procedure. **Caller** calls it.|**Dealer** routes each call to a callee, and the result back to the caller.|
|[Publish/Subscribe](/router/concepts/wamp/pubsub)|**Subscriber** subscribes to a topic. **Publisher** publishes an event to it.|**Broker** delivers each event to the topic's subscribers.|

A client states the roles it plays, and the features of each role it supports, in its `HELLO`. The router states its own in `WELCOME`. Bondy plays both router roles in every realm. [WAMP Compliance](/router/reference/protocols/wamp) lists the features Bondy announces.

### Every client can play every role

Roles belong to a session, not to a kind of program. One session can be caller, callee, publisher and subscriber at the same time, over its single connection.

So WAMP has no RPC server and no RPC client. A browser app can register a procedure that a backend service calls. A device can call a procedure on another device. Neither one opens a port: each only connects out to the router. Protocols like HTTP and gRPC make the client the side that asks and the server the side that answers, and a server that needs to reach a client needs a second channel. WAMP needs only the session the client already has.

## Names

Clients address procedures and topics by **URI**: a dotted string such as `com.example.orders.create`. Procedure URIs and topic URIs are separate namespaces in each realm. A registration or subscription can match a URI exactly, by prefix or by wildcard. [Naming](/router/concepts/wamp/naming) gives guidance on designing URIs.

The router identifies sessions, registrations, subscriptions and publications by **ID**, a number it assigns. A URI is chosen by the application and stays the same; an ID is chosen by the router and lasts only as long as the thing it identifies.

## Delivery

To a client, the router delivers each message at most once. It does not queue a message for a client that is not connected. An event published while a subscriber is disconnected does not reach that subscriber. Bondy does not implement event history, so a subscriber that reconnects cannot ask for the events it missed. The one exception is a retained event: a publisher can ask Bondy to keep the last event on a topic, and a new subscriber can ask to receive it; see [Advanced Pub/Sub](/router/concepts/wamp/advanced/pubsub). The ordering that Bondy guarantees, and where it does not, is in [WAMP Compliance](/router/reference/protocols/wamp#nc1).

## See also

- [Communication Patterns](/router/concepts/wamp/communication_patterns): when to use RPC and when to use publish/subscribe.
- [Connections and Sessions](/router/concepts/wamp/sessions): the session lifecycle.
- [WAMP Compliance](/router/reference/protocols/wamp): which parts of the specification Bondy implements.
