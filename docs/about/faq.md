# Frequently Asked Questions

## General

### What is Bondy?

Bondy is an open-source application networking platform that connects the elements of a distributed application — web and mobile apps, IoT devices, and backend microservices — combining event mesh and service mesh capabilities in a single protocol.

Read more about Bondy in the [What is Bondy](/concepts/what_is_bondy) section.

### What is WAMP?

The Web Application Messaging Protocol (WAMP) is an open, routed protocol for polyglot distributed applications with all application agents connecting to a WAMP Router that performs message routing between them. WAMP unifies the two most important communication patterns under a single protocol: Publish-Subscribe and Routed Remote Procedure Calls.

Read more about Bondy in the [What is WAMP](/concepts/what_is_wamp) section.

### How is WAMP different than other messaging technologies?

In short: WAMP unifies Remote Procedure Calls (RPC) and Publish & Subscribe and offers a peer-to-peer programming model.

In general, WAMP differs from other messaging platforms in that it natively (and by design) provides an implementation of routed Remote Procedure Calls (RPC) together with Publish & Subscribe.

As its name implies, Publish & Subscribe offers at most once semantics a.k.a fire-and-forget, whereas other messaging platforms provide stronger message delivery guarantees e.g. at least once and exactly once semantics.

Being an extensible protocol means we can extend the message delivery guarantees and we have plans to do so e.g. at least once.

For a further comparison with other products and technologies we invite you to review the [How is Bondy different](/concepts/how_is_bondy_different) section and the [WAMP Compared article](https://wamp-proto.org/comparison.html) in the protocol specification website.

### How is Bondy different than other WAMP routers?

See [How is Bondy Different](/concepts/how_is_bondy_different) for a full comparison, covering scalability, availability, and operational simplicity.

## Protocol Support

### Is Bondy multi-protocol?

At its core Bondy implements the Web Application Messaging Protocol (WAMP). Learn why this is important in [Why Bondy](/concepts/why_bondy).

However, Bondy was envisioned as a multi-protocol router. Bondy already offers HTTP API Gateway capabilities, allowing to configure a mapping between arbitrary HTTP messages to WAMP messages, covering both RPC and Publish/Subscribe interactions.  Bondy also currently provides a Kafka Bridge, allowing to configure a mapping from WAMP topics to Kafka topics.

In the near future, Bondy will incorporate additional protocols and communication patterns, but always maintaining its core capability: being able to offer multiple communication patterns under a single protocol (when using WAMP) and a single networking application platform.

### How compliant is Bondy to WAMP?

Please find the answers to this question in the [WAMP Compliance](/concepts/wamp/compliance.md) page.


## Architecture

### In which programming language is Bondy implemented?

Bondy is implemented in Erlang, a programming language and runtime built for concurrent, soft-real-time applications — the same runtime behind other real-time messaging platforms such as WhatsApp.

### Why does Bondy use an eventually consistent model?

So that Bondy stays scalable and available through inter- or intra-datacentre connectivity disruptions.

An eventually consistent, CRDT-based backend gains little if the message routing or API gateway layer in front of it depends on strong consistency (e.g. a SQL database): a disruption at that layer takes the whole system down regardless of how available the backend is behind it. Bondy's routing layer uses the same eventually consistent model as its storage layer, so the property holds end to end.

## Realms

### How many realms can Bondy hold?
Bondy doesn't impose a limit on the number of realms. In principle, you can have as many as a single node can hold in memory (as part of the realm configuration is kept in memory).

### Can I make an RPC call to a procedure registered in another realm?
All messages within Bondy are routed within a realm. A client with a session attached to realm A cannot send/receive messages to/from clients attached to realm B.

## Data Storage

### Does Bondy depend on an external database server?

No, Bondy does not depend on any external database server. Every Bondy node embeds `bondy_db`, a purpose-built storage and replication stack: durable tables are backed by a `leveled` LSM-tree store, with per-table CRDT convergence replicated across the cluster via `bondy_oplog`'s anti-entropy protocol. See [Data Storage & Replication](/concepts/architecture) for details.

### Why does Bondy use its own embedded database?

Because we want to provide an always-on platform which is also easy to manage.

Most data entities in Bondy are resident in memory to reduce latency e.g. routing tables but some data has to be persisted and replicated e.g. security data used for authentication and authorization. Using an external database would imply not only the possibility of losing the connection to it and most probably the need to instrument a caching layer.

### Can Bondy use an external database for storing its state?

The answer is "not now" for some data entities while "not ever" for some others.

For example, some data entities could be managed externally, and there are plans to enable that through plugins, e.g. managing user identities in an external LDAP or database. But for others, doing so would undermine the architectural trade-offs that justify Bondy's current design — see the previous answer.

## License

### Is Bondy free to use?

Yes.

### Is Bondy open-source software?

Yes. See [How is Bondy licensed?](#how-is-bondy-licensed).

### How is Bondy licensed?

Bondy is licensed under the Apache License 2.0; review a copy of the license [here](https://github.com/bondy-io/bondy/blob/develop/LICENSE).

### How is this documentation licensed?

See [Documentation License](/about/terms_and_policies#documentation-license).

## Commercial Support

### Do you provide Commercial Support?

Yes, please contact [us](mailto:info@leapsight.com) to understand the service level options.