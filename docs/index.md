---
layout: home
hero:
  name: Bondy
  image: /assets/bondy_diagram.png
  text: Application networking
  tagline: One platform for RPC, Pub/Sub, authentication, authorization, and routing — in place of a separate API gateway, service mesh, and message broker. No external dependencies.
  actions:
    - theme: brand
      text: Get Bondy
      link: /guides/index.html#get-bondy
    - theme: brand
      text: Get Started
      link: /tutorials/index#get-started
    - theme: alt
      text: What is Bondy?
      link: /concepts/what_is_bondy
    - theme: alt
      text: What is WAMP?
      link: /concepts/what_is_wamp

features:
  - title: Event and Service Mesh in One
    details: RPC and Pub/Sub in one protocol, with authentication, authorization, service discovery, and load balancing built in — no separate systems to assemble.
  - title: Peer-to-Peer Programming
    details: Any component can call any other. A browser can expose procedures, a backend can call the frontend, IoT devices can call each other — patterns a traditional client-server protocol doesn't support.
  - title: Distributed and Available
    details: Masterless clustering with automatic failover, scaling horizontally to millions of concurrent connections. CRDT-based replication with active anti-entropy keeps the cluster available through network partitions and node failures.
  - title: No External Dependencies
    details: No database, no ZooKeeper, no etcd, no Redis — everything runs embedded. Deploys on bare metal, VMs, containers, Kubernetes, or ARM devices. Built on Erlang/OTP.
  - title: Multi-Tenant by Design
    details: Realms isolate routing, authentication, and authorization per tenant, with Same Sign-On for shared credentials across realms. A realm is virtual — creating one adds no infrastructure.
  - title: Agent-to-Agent Communication
    details: RPC, Pub/Sub, discovery, and security in one protocol, so an agent can expose capabilities as well as consume them. See how this compares to MCP.

---
