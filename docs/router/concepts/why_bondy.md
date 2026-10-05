---
draft: false
---
# Why Bondy

## Distributed applications are the default, not the exception

Microservices applications are the most common and complex type of distributed application being built today. As Christopher Meiklejohn noted at Strangeloop 2022, "We are all now building distributed systems!"[^cmeik] Whether you're developing microservices, integrating multiple customer touchpoints, or connecting IoT devices, you're in the business of distributed computing.

[^cmeik]: Christopher Meiklejohn, Strangeloop 2022 [Resilient Microservices without the Chaos](https://www.youtube.com/watch?v=F32peAwCPlM)

Today's applications need real-time, networked connections between people, processes, data, and devices[^cisco-ioe]. Building those connections typically means assembling a large number of infrastructure components, protocols, APIs, and client libraries[^ogrady].

[^cisco-ioe]: [The Internet of Everything](https://www.cisco.com/c/dam/en_us/about/business-insights/docs/ioe-value-at-stake-public-sector-analysis-faq.pdf)

[^ogrady]: Stephen O'Grady, [The Developer Experience Gap](https://redmonk.com/sogrady/2020/10/06/developer-experience-gap/)

## The root cause: protocol fragmentation

A typical distributed application assembles:

- **HTTP/REST or gRPC** for synchronous request-response communication
- **A message broker** (RabbitMQ, Kafka) for asynchronous event distribution
- **A service mesh** for service discovery, load balancing, and traffic management
- **An API gateway** to expose services to external clients
- **A separate authentication and authorization service**
- **WebSockets** where HTTP's request-response model isn't enough

Each component brings its own protocol, client libraries, operational model, and failure modes.

<ZoomImg src="/assets/accidental_complexity.png"/>

Fred Brooks distinguishes *essential* complexity — inherent to the problem — from *accidental* complexity, which engineers create and can remove[^fbrooks]. The complexity of integrating six separately-designed protocols and infrastructure components to cover one application's messaging needs falls into the second category: it comes from the tools chosen, not from the problem itself.

[^fbrooks]: In [No Silver Bullet — Essence and Accident in Software Engineering](https://en.wikipedia.org/wiki/No_Silver_Bullet), Fred Brooks distinguishes between two different types of complexity: accidental complexity and essential complexity. Essential complexity is caused by the problem to be solved, and nothing can remove it. Accidental complexity relates to problems which engineers create and can fix.

Most of these protocols were designed as vertical solutions for one use case — HTTP for document retrieval, message queues for asynchronous job processing, gRPC for efficient service-to-service calls — and each carries assumptions from three-tier, monolithic applications: a client-server model where mobile apps, IoT devices, and browser tabs are not first-class participants, and where a peer-to-peer interaction has to be built as a workaround rather than expressed directly.

## What this costs

- **Slower delivery**, as developers navigate multiple technologies and integration patterns.
- **More to maintain**, since each component has its own upgrade path and failure modes.
- **More to operate**, running and monitoring several infrastructure components instead of one.
- **More points of failure**, one per component in the chain.

<ZoomImg src="/assets/without_with.png"/>

## What a single protocol buys back

WAMP unifies RPC and Pub/Sub in one protocol with a peer-to-peer programming model, transport-agnostic and with multiple serialization formats, plus built-in multi-tenancy through realms — see [What is WAMP](/router/concepts/wamp/what_is_wamp). Because every kind of client uses the same protocol and the same semantics over the same connection, a browser can expose a procedure for a server to call, not only call procedures itself: the architecture can be genuinely peer-to-peer rather than client-server with an extra channel bolted on.

Bondy is a WAMP router that additionally:

- **Scales horizontally** with a masterless distributed architecture — see [Architecture](/router/concepts/architecture).
- **Maintains availability under partition** through active anti-entropy — see [Clustering](/router/concepts/clustering).
- **Provides authentication and fine-grained RBAC** built in.
- **Integrates with existing systems** through an HTTP API Gateway and message broker bridges.
- **Runs anywhere**, from edge devices to cloud environments, with no external dependencies.

## AI agent communication

The same properties that make WAMP suit distributed applications generally — RPC and Pub/Sub unified, peer-to-peer by default, authentication/authorization/multi-tenancy built in — apply directly to AI agent systems, where an agent typically needs to both expose capabilities and consume them, and needs event coordination alongside function calling. See [WAMP for agent-to-agent communication](/router/concepts/wamp/what_is_wamp#wamp-for-agent-to-agent-communication) for the detailed case, including the comparison against agent-specific protocols such as MCP.

## What replacing the stack looks like

Instead of:

```
Web App → API Gateway → gRPC → Service A → Kafka → Service B
                ↓                          ↓
          Load Balancer            Message Queue
                ↓                          ↓
          Service Mesh             More Services
```

Every component connects directly to Bondy:

```
Web App → Bondy ← Services
```

Every component uses the same protocol and gets RPC, Pub/Sub, authentication, authorization, service discovery, and load balancing from it, without an adapter or translation layer between components that speak different protocols.

## See also

- [What is Bondy](/router/concepts/what_is_bondy) — what Bondy provides.
- [Architecture](/router/concepts/architecture) — how it's built.
