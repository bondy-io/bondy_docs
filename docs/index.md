---
layout: home
hero:
  name: Bondy Developer
  image: /assets/bondy_diagram.png
  text: Learn how to develop, deploy and manage distributed applications using Bondy.
  # text: Empowering everyone to connect everything
  tagline: Bondy is an open source application networking platform connecting all elements of a distributed application. From web and mobile apps to IoT devices and backend microservices, Bondy allows everything to talk using one simple communication protocol.
  actions:
    - theme: brand
      text: Get Started
      link: /guides/getting_started/index
    - theme: alt
      text: What is Bondy?
      link: /concepts/what_is_bondy
    - theme: alt
      text: What is WAMP?
      link: /concepts/what_is_wamp


features:
  - title: All-in-one Event and Service Mesh
    details: Bondy provides both RPC and Pub-Sub communication patterns and secure multi-tenancy for the entire messaging requirements of your distributed applications. This is done with a single infrastructure component and no sidecards.
  - title: Protocol-oriented
    details: At its core, Bondy is a feature rich, scalable, robust and secure implementation of the open Web Application Messaging Protocol (WAMP), a messaging protocol that provides Routed RPC and Pub-Sub. Bondy takes a completly different approach to existing solutions in order to minimise accidental complexity. No sidecars, no wrapper APIs.
  - title: Peer-to-peer programming model
    details: Bondy can connect all elements of a distributed application, all using a single protocol with client libraries available on the most popular programming languages. When using WAMP, all peers are the same, unlocking the potential of distributed applications.
  - title: Scalable & Always-on
    details: Bondy scales horizontally to hundreds of nodes or even thousands of nodes. Bondy is written in Erlang/OTP which offers unprecedented soft real-time and high concurrency. Its convergence-based data replication and self-healing capabilities ensures its highly available even under network partitions, message loss and node failures.

---