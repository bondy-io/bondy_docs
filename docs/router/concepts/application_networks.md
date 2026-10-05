---
draft: true
outline: [2,3]
---
# Application Networks
An application network is a dynamic overlay network formed by a set of Bondy nodes that interconnects different types of applications and devices, ranging from web and mobile apps to IoT devices and backend microservices.


## Overview

::: definition Application network
An application network is a dynamic [overlay network](https://en.wikipedia.org/wiki/Overlay_network) formed by a set of Bondy nodes that interconnects different types of applications and devices, ranging from web and mobile apps to IoT devices and backend microservices.
:::

An application network helps ensure efficient and secure communication between Internet-connected devices such as browsers, phones, servers and IoT (Internet of Things) devices in realtime.
 
In a typical distributed application, there are two main flows of traffic:

- **North-South** traffic represents the communication coming in and going out of a data center from/to external components of the application. For example, front-end components such as web apps and mobile apps, embedded apps (IoT) and/or external API clients that need to communicate with backend components inside the data center.
- **East-West** traffic represents the communication within the data center. For example, the case of inter-service communication in a microservice architecture.

<ZoomImg
  src="/assets/application_network_traffic.png"
  caption="Bondy application network"
  width="600"/>

It is common to use different protocols and infrastructure components for each type of traffic, but this practice is often based on commercial, political, cultural, or historical reasons.

Bondy offers a unified application networking platform that can serve the needs of both North-South and East-West traffic, greatly simplifying the development of distributed applications.


## How is an application network implemented

Bondy uses a distributed and decentralized implementation of the [Web Application Messaging Protocol (WAMP)](/router/concepts/wamp/what_is_wamp) as its underlying application networking protocol.

WAMP an open protocol that unifies the *core services required by every distributed application*:
- **Authentication**, providing multiple authentication methods
- **Authorization**, providing a fine-grained Role-based Access Control system
- **Inter-component communication**, implementing both
    - **(Routed) Remote Procedure Calls** (RPC) including Service Discovery, Routing and Traffic management; and
    - **Publish/Subscribe** routing
- **Message routing**, where Bondy nodes relay messages from a source to a destination within a network, as well as bridging messages between components connected to different networks, such as cloud-to-cloud or edge-to-cloud cases.

By supporting multiple transports and combining the two main application communication patterns (Remote Procedure Calls and Publish/Subscribe) into a single protocol, WAMP can be used for all messaging requirements of a distributed application, including North-South and East-West traffic, in place of separate protocols such as HTTP, GraphQL, and gRPC for each.

This reduces the number of protocols, client libraries, and infrastructure components a distributed application needs to integrate.

### Key Characteristics

- Session-oriented
- Multiple transports and serialization formats
- Multiple communication patterns
- Peer-to-peer programming model
- Secured and multi-tenant
- Polyglot<br>Use any programming language and framework
- Decoupled - participants in the network do not know each other or their locations, they interact using named resources like remote procedures and topics.
- Connections are always initiated by clients - this removes the need for clients to open ports while still allowing other clients to call them (RPC).

::: tip Solving the Reverse VPN problem

Most HTTP-based IoT protocols require devices, or software running on devices, to open connection ports so that an external system can send commands and/or retrieve information. This introduces a security risk. A way to mitigate this risk is to use a reverse VPN (Virtual Private Network).

A reverse VPN is used to expose devices and software from your edge network to the public. This is a common use case in IoT, where a user wants to remotely control home or office devices.

However, this is a complicated setup that is prone to errors and misconfiguration. It also requires your device to run a VPN client, which is sometimes not possible.
:::

## Consequences of a single protocol

- **Fewer components to integrate.** One protocol, over multiple transports and encodings, connects web apps, backend services, and tools, rather than a different protocol per platform.
- **Independent deployability.** Because participants are decoupled and addressed by named resource (a procedure or topic URI) rather than by network location, one component can be updated or redeployed without the others needing to know.
- **Scaling per component.** Adding capacity for one service (more instances registering the same procedure, or subscribing to the same topic) doesn't require re-architecting how other services reach it.
- **Centralized security.** Authentication, authorization, and encryption are enforced at the router rather than reimplemented per component.
- **One place to observe.** Because every call and event passes through the router, it is also the one place to monitor traffic, latency, and error rates across the whole network — see [Prometheus Metrics Reference](/router/reference/metrics).
- **Less accidental complexity.** An application network replaces the combination of a service mesh, event mesh, authentication/authorization service, and API gateway with the single router, rather than integrating each separately.

## How is an application network different

A traditional network routes traffic by IP address and port: two components communicate once one knows the other's network location. An application network routes by named resource instead — a procedure URI or a topic URI — so a component reaches another by what it does, not where it runs. This is what lets Bondy relocate, scale, or replace a component behind a stable name, and what lets the same overlay carry both North-South and East-West traffic through one addressing scheme instead of two.