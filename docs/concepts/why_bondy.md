---
draft: false
---
# Why Bondy

The modern distributed application landscape has become unnecessarily complex. Bondy exists to change that.

## The Distributed Application Complexity Crisis

Microservices applications are the most common and complex type of distributed application being built today. As Christopher Meiklejohn noted at Strangeloop 2022, "We are all now building distributed systems!"[^cmeik] Whether you're developing microservices, integrating multiple customer touchpoints, or connecting IoT devices, you're in the business of distributed computing.

[^cmeik]: Christopher Meiklejohn, Strangeloop 2022 [Resilient Microservices without the Chaos](https://www.youtube.com/watch?v=F32peAwCPlM)

And distributed computing is hard. Really hard.

Today's customer experiences demand real-time, networked connections between people, processes, data, and devices[^cisco-ioe]. Yet creating these connections has become shockingly complicated. The typical modern application requires an overwhelming number of infrastructure components, protocols, APIs, and client libraries[^ogrady]. What should be straightforward application logic gets buried under layers of integration code.

[^cisco-ioe]: [The Internet of Everything](https://www.cisco.com/c/dam/en_us/about/business-insights/docs/ioe-value-at-stake-public-sector-analysis-faq.pdf)

[^ogrady]: Stephen O'Grady, [The Developer Experience Gap](https://redmonk.com/sogrady/2020/10/06/developer-experience-gap/)

## The Root Cause: Protocol Fragmentation

Consider what it takes to build a typical distributed application today. You need:

- **HTTP/REST or gRPC** for synchronous request-response communication
- **Message brokers** (RabbitMQ, Kafka) for asynchronous event distribution
- **Service mesh** for service discovery, load balancing, and traffic management
- **API Gateway** to expose services to external clients
- **Authentication and authorization services** to secure it all
- **WebSockets** when HTTP's request-response model isn't enough

Each component brings its own protocol, client libraries, operational complexity, and failure modes. Each requires specialized knowledge to deploy, configure, and maintain. Each adds latency, potential points of failure, and cognitive overhead.

<ZoomImg src="/assets/accidental_complexity.png"/>

This isn't essential complexity—the inherent difficulty of the problems we're solving. This is accidental complexity—problems we've created for ourselves through the tools we've chosen[^fbrooks].

[^fbrooks]: In [No Silver Bullet — Essence and Accident in Software Engineering](https://en.wikipedia.org/wiki/No_Silver_Bullet), Fred Brooks distinguishes between two different types of complexity: accidental complexity and essential complexity. Essential complexity is caused by the problem to be solved, and nothing can remove it. Accidental complexity relates to problems which engineers create and can fix.

## Why Are We Doing This?

The answer is simple but frustrating: most protocols were designed as vertical solutions for specific use cases. HTTP was designed for document retrieval. Message queues were designed for asynchronous job processing. gRPC was designed for efficient service-to-service calls. Each solves its particular problem well, but together they create an integration nightmare.

Moreover, many of these technologies carry assumptions from the three-tier monolithic applications of the past. They weren't designed for the reality of hundreds or thousands of microservices deployed on cloud-native infrastructure. They weren't designed for mobile apps and IoT devices to be first-class participants in application logic. They weren't designed for the peer-to-peer architectures that modern applications increasingly require.

## The Cost of Complexity

While the industry's largest companies can afford teams of specialists to manage this complexity, most development teams cannot. The result is:

- **Slower time-to-market** as developers navigate multiple technologies and integration patterns
- **Increased maintenance burden** from managing disparate systems
- **Higher operational costs** from running and monitoring multiple infrastructure components
- **Developer fatigue** from context-switching between different paradigms and tools
- **Fragile systems** with more potential points of failure

Microservices were supposed to help us scale development by decomposing monoliths into manageable pieces. Instead, the tooling ecosystem has created a new monolith—a distributed monolith of tangled infrastructure dependencies.

<ZoomImg src="/assets/without_with.png"/>

## A Better Way

What if you could have all the capabilities you need—RPC, Pub/Sub, service discovery, load balancing, authentication, and authorization—in a single protocol and a single infrastructure component?

What if your web app, mobile app, backend services, and IoT devices could all communicate using the same client library, with the same semantics, over the same connection?

What if a browser could not only call server procedures but could also expose procedures for servers to call? What if your architecture could be truly peer-to-peer, not just client-server with extra steps?

This isn't a utopian vision. This is what Bondy delivers today.

## Enter Bondy

Bondy is built on the Web Application Messaging Protocol (WAMP), an open standard that was ahead of its time. WAMP unifies RPC and Pub/Sub in a single protocol with a peer-to-peer programming model. It's transport-agnostic, supports multiple serialization formats, and includes built-in support for multi-tenancy through realms.

But Bondy isn't just a WAMP router. It's a complete, production-ready application networking platform that:

- **Scales horizontally** with a masterless distributed architecture
- **Ensures high availability** through active anti-entropy and gossip protocols
- **Provides built-in security** with multiple authentication methods and fine-grained RBAC
- **Integrates with existing systems** through an HTTP API Gateway and message broker bridges
- **Deploys anywhere** from edge devices to cloud environments with zero external dependencies

We built Bondy because we needed it ourselves. We were tired of the complexity tax. We wanted to focus on building features, not integrating infrastructure. We've used Bondy in production for years, and it has dramatically reduced our time-to-market and operational overhead.

## Perfect for the AI Age

As AI agents become ubiquitous in modern applications, Bondy provides the ideal infrastructure for agent-to-agent communication. Unlike emerging protocols like MCP (Model Context Protocol) that offer partial solutions, WAMP—and by extension Bondy—delivers everything AI agent systems need:

**Complete Agent Communication Platform**

AI agents require more than just function calling. They need event coordination, service discovery, authentication, authorization, and the ability to act as both service providers and consumers. Bondy provides all of this out of the box:

- **True peer-to-peer** - Agents can expose capabilities and consume them symmetrically
- **RPC and Pub/Sub unified** - Function calling and event coordination in one protocol
- **Dynamic discovery** - Agents find each other's capabilities at runtime
- **Secure multi-tenancy** - Isolate different agent systems through realms
- **Production-grade infrastructure** - Scale to millions of agents with high availability

**Beyond Limited Agent Protocols**

Protocols designed specifically for AI agents often focus narrowly on model-to-tool communication or simple request-response patterns. They lack the comprehensive capabilities needed for sophisticated multi-agent systems:

- No native event/pub-sub for agent coordination
- Client-server hierarchies that constrain agent architectures
- Missing authentication, authorization, and multi-tenancy primitives
- Immature infrastructure and limited production deployments

Bondy, through WAMP, provides the complete foundation. Deploy one platform, get all capabilities integrated and working together. Your agents can coordinate complex workflows, react to environmental changes, and collaborate in ways that limited protocols simply cannot support.

Whether you're building multi-agent LLM systems, agentic workflow automation, distributed AI inference, or collaborative agent environments, Bondy's proven, production-ready platform delivers what you need—today, not in some future roadmap.

Learn more about [WAMP for AI agents](/concepts/what_is_wamp#wamp-for-the-ai-age-agent-to-agent-communication).

## The Bondy Difference

With Bondy, you replace this:

```
Web App → API Gateway → gRPC → Service A → Kafka → Service B
                ↓                          ↓
          Load Balancer            Message Queue
                ↓                          ↓
          Service Mesh             More Services
```

With this:

```
Web App → Bondy ← Services
```

Everyone connects to Bondy. Everyone uses the same protocol. Everyone gets RPC, Pub/Sub, authentication, authorization, service discovery, and load balancing out of the box. No adapters, no translation layers, no impedance mismatch.

## Bringing Back the Joy

Distributed application development should be about solving business problems, not wrestling with infrastructure. It should be about delivering value to users, not debugging integration failures.

Bondy brings back the joy to distributed application development by eliminating the accidental complexity that has plagued the industry for too long. It's not a silver bullet for all of distributed computing's challenges—those essential complexities remain. But it removes the accidental ones, letting you focus on what matters: building great applications.

Ready to simplify your architecture? Let's explore [what Bondy is](/concepts/what_is_bondy) and [how it works](/concepts/architecture).
