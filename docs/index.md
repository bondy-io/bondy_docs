---
layout: home
hero:
  name: Bondy Developer
  image: /assets/bondy_diagram.png
  text: Learn how to develop, deploy and manage distributed applications using Bondy.
  # text: Empowering everyone to connect everything
  tagline: Bondy is an open source, always-on and scalable application networking platform connecting all elements of a distributed application—offering event and service mesh capabilities combined. From web and mobile apps to IoT devices and backend microservices, Bondy allows everything to talk using one simple communication protocol.
  actions:
    - theme: brand
      text: Get Bondy
      link: /guides/index.html#get-bondy
    - theme: alt
      text: Getting Started
      link: /tutorials/getting_started/get_bondy.html
    - theme: sponsor
      text: What is Bondy?
      link: /concepts/what_is_bondy
    - theme: sponsor
      text: What is WAMP?
      link: /concepts/what_is_wamp


features:
  - title: All-in-one application network, providing both event and service mesh capabilities
    details: Bondy provides both RPC and Pub-Sub communication patterns and secure multi-tenancy for the entire messaging requirements of your distributed applications. This is done with a single infrastructure component and no sidecards.
  - title: Peer-to-peer programming model
    details: Bondy can connect all elements of a distributed application, all using a single protocol with client libraries available on the most popular programming languages. When using WAMP, all peers are the same, unlocking the potential of distributed applications.
  - title: Scalable & Always-on
    details: Bondy scales horizontally to hundreds of nodes or even thousands of nodes. Bondy is written in Erlang/OTP which offers unprecedented soft real-time and high concurrency. Its convergence-based data replication and self-healing capabilities ensures its highly available even under network partitions, message loss and node failures.
  - title: Deploy Anywhere, no dependencies
    details: Bondy can be deployed as a binary on bare metal or virtual machine. It can also be deployed on containers with or without container orchestration e.g. Kubernetes. Bondy can be deployed on low-resource ARM64 computers and boards too.

---