# Getting Started with
> WAMP is a routed protocol for distributed applications with all application components connecting to a WAMP Router, where the WAMP Router performs message routing between them. WAMP provides two communication patterns: Publish-Subscribe and Routed Remote Procedure Calls.

WAMP is an open standard for soft real-time message exchange amongst system components — applications, (micro-) services and connected devices — that eases the creation of loosely coupled distributed architectures.


## How is WAMP different than other protocols?

Five key features makes WAMP unique amongst alternative application messaging protocols:

1. **Session-oriented**. All messages are routed within an established session. Sessions are authenticated and all messages are authorised.
2. **Designed for multi-tenancy** through the use of Realms for both security and routing. Realms are virtual so it does not impose additional infrastructure requirements e.g. dedicated ports. Sessions are attached to a single Realm at a time.
3. **Provides both application messaging patterns**, Publish-Subscribe (PubSub) and Routed Remote Procedure Calls (rRPC) a dynamic RPC variant where Caller and Calle are completely decoupled and no direct connection exists between them.
4. **Provides a peer-to-peer programming model**, as any distributed application component can play any and the same roles simultaneously: RPC client (Caller), RPC server (Callee), Publisher and Subscriber. This is in contrast to protocols that distiguish between RPC Client and RPC Server, treating the client as dumb e.g. HTTP and gRPC.
5. **Supports multiple-transports** and each client can choose which one to use. WAMP can run over any transport which is message-oriented, ordered, reliable, and bi-directional such as Websockets, TCP, Unix domain socket, etc.
6. **WAMP supports multiple serializations** and each session can choose which one to use.

By combining these key features into a single infrastructure component, a WAMP Router can be used for the entire messaging requirements of all the components of distributed systems including connected devices, browser and mobile apps and backend services, thus **reducing technology stack complexity, accidental complexity as well as networking overheads**.

<ZoomImg src="/assets/wamp_roles.png"/>

## Establishing a Session

## Registering a procedure

## Making Calls

## Publishing to a topic

## Subscribing to a topic

