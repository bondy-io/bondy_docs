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

Bondy uses a distributed and decentralized implementation of the [Web Application Messaging Protocol (WAMP)](/concepts/what_is_wamp) as its underlying application networking protocol.

WAMP an open protocol that unifies the *core services required by every distributed application*:
- **Authentication**, providing multiple authentication methods
- **Authorization**, providing a fine-grained Role-based Access Control system
- **Inter-component communication**, implementing both
    - **(Routed) Remote Procedure Calls** (RPC) including Service Discovery, Routing and Traffic management; and
    - **Publish/Subscribe** routing
- **Message routing**, where Bondy nodes relay messages from a source to a destination within a network, as well as bridging messages between components connected to different networks, such as cloud-to-cloud or edge-to-cloud cases.

By supporting multiple transports and combining the two main application communication patterns (Remote Procedure Calls and Publish/Subscribe) into a single protocol, WAMP can be used for all messaging requirements of a distributed application, including North-South and East-West traffic, replacing protocols like HTTP, GraphQL and gRPC.

This reduces technology stack complexity and networking overheads but also provides a better deverloper and user experience.

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

## Key Benefits

### Simplified Connectivity
An application network simplifies the integration of applications and systems by providing a standardized protocol that supports multiple transports and encodings. It caters to the needs of a wide spectrum of platforms, from web apps to backend services and tools.
### Improved Agility and Time-to-Market
By leveraging an application network, you can accelerate application development and deployment processes. It enables agility by promoting modular and decoupled architectures, allowing independent updates and releases of individual components. This results in faster time-to-market.
### Scalability and Flexibility
An application network architecture supports scalability and flexibility to accommodate changing business needs. It enables organizations to handle increasing data volumes, user traffic, and application workloads by leveraging technologies such as microservices, containerization, and auto-scaling.
### Security and Governance
An application network allows for centralized security controls, authentication, authorization, and encryption. It can also facilitate adherence to regulatory compliance requirements and data privacy regulations.
### Improved User Experience
An application network helps deliver a seamless and consistent user experience by enabling smooth interactions between different applications and services through the use of different communication patterns.
### Observability
An application network can provide monitoring, analytics, and reporting capabilities to gain insights into application performance, usage patterns, and system behavior. This data helps identify bottlenecks, optimize resources, detect anomalies, and make data-driven decisions to improve application performance and user satisfaction.
### Collaboration and Innovation
An application network fosters collaboration between development teams, allowing them to build upon existing services and leverage shared functionalities through the use of a common protocol. It encourages innovation by promoting the creation of new applications by combining existing services.
### Reduce accidental complexity
An application network eliminates the need for the integration of single-purpose dedicated infrastructure components such as service mesh, event mesh, authentication and authorization services, API gateways, and real-time notification services.
### Cost Optimization
An application network can help optimize costs by reducing duplication of effort and resources. The improved time-to-market and reduced accidental complexity means you can do more with less.


## How is an application network different