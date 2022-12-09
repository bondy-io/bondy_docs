# Frequently Asked Questions

## General

### What is Bondy?

Bondy is an open source, always-on and scaleable application networking platform connecting all elements of a distributed application—offering event and service mesh capabilities combined. From web and mobile apps to IoT devices and backend microservices, Bondy allows everything to talk using one simple and secured communication protocol.

Read more about Bondy in the [What is Bondy](/concepts/what_is_bondy) section.

### What is WAMP?

The Web Application Messaging Protocol (WAMP) is an open, routed protocol for polyglot distributed applications with all application agents connecting to a WAMP Router that performs message routing between them. WAMP unifies the two most important communication patterns under a single protocol: Publish-Subscribe and Routed Remote Procedure Calls.

Read more about Bondy in the [What is WAMP](/concepts/what_is_wamp) section.

### How is WAMP different than other messaging technologies?

In short: WAMP unifies Remote Procedure Calls (RPC) and Publish & Subscribe and offers a peer-to-peer programming model.

In general, WAMP differs from other messaging platforms in that it natively (and by design) provides an implementation of routed Remote Procedure Calls (RPC) together with Publish & Subscribe.

As its name implies, Publish & Subscribe offers at most once semantics a.k.a fire-and-forget, whereas other messaging platforms provide stronger message delivery guarantees e.g. at least once and exactly once semantics.

Being an extensible protocol means we can extend the message delivery guarantees and we have plans to do so e.g. at least once.

For a further comparison with other products and technologies we invite you to review the [Bondy Compared](/about/bondy_compared) section and the [WAMP Compared article](https://wamp-proto.org/comparison.html) in the protocol specification website.

### How is Bondy different than other WAMP routers?

Bondy provides a unique sets of features which sets it apart from other WAMP router implementations in terms of *scalability, reliability, high-performance and operational simplicity*.

Read more about this differences in [What is Bondy](https://www.notion.so/What-is-Bondy-fac8112658494e0ca15611a8cfd201e8) page.

## Protocol Support

### Is Bondy multi-protocol?

At its core Bondy implements the Web Application Messaging Protoco (WAMP). Learn why this is important in [Why Bondy](/concepts/why_bondy).

However, Bondy was envisioned as a multi-protocol router. Bondy already offers HTTP API Gateway capabilities, allowing to configure a mapping between arbitrary HTTP messages to WAMP messages, covering both RPC and Publish/Subscribe interactions.  Bondy also currently provides a Kafka Bridge, allowing to configure a mapping from WAMP topics to Kafka topics.

In the near future, Bondy will incorporate additional protocols and communication patterns, but always maintaining its core capability: being able to offer multiple communication patterns under a single protocol (when using WAMP) and a single networking application platform.

### How compliant is Bondy to WAMP?

Please find the answers to this question in the [WAMP Compliance](/concepts/wamp/compliance.md) page.


## Architecture

### In which programming language is Bondy implemented?

Bondy is implemented in Erlang, a wonderful programming language and operating system for concurrent and (soft) real-time applications that is behind the success of many real-time messaging platforms like Whatsapp.

### Why does Bondy use an eventually consistent model?

Because we wanted Bondy to be scaleable and always-on in the cases of inter- and/or intra-datacentre connectivity disruptions.

We think it is really stupid to design super scaleable and fault-tolerant backend architectures using NoSQL databases, eventually consistency and more sophisticated techniques like CRDTs only to then define a message routing and/or API gateway layer that relies on strong consistency e.g. SQL database. All the hard work you've done in the backend to provide an always-on system is then hampered by an entry point which is not!

## Realms

### How many realms can Bondy hold?
Bondy doesn't impose a limit on the number of realms. In principle, you can have as many as a single node can hold in memory (as part of the realm configuration is kept in memory).

### Can I make an RPC call to a procedure registered in another realm?
All messages within Bondy are routed within a realm. A client with a session attached to realm A cannot send/receive messages to/from clients attached to realm B.

## Data Storage

### Does Bondy depend on an external database server?

No, Bondy does not depend on any external database server. Every Bondy node embeds a database which at the moment is based on Basho's fork of LevelDB but we have plans to support and/or migrate to other backends in the future.

### Why does Bondy use its own embedded database?

Because we want to provide an always-on platform which is also easy to manage.

Most data entities in Bondy are resident in memory to reduce latency e.g. routing tables but some data has to be persisted and replicated e.g. security data used for authentication and authorization. Using an external database would imply not only the possibility of losing the connection to it and most probably the need to instrument a caching layer.

### Can Bondy use an external database for storing its state?

The answer is "not now" for some data entities while "not ever" for some others.

For example, some data entities could be managed externally and we have plans to enable that capability through plugins e.g. managing user identities in an external LDAP or database. But for some others it would be in detriment of Bondy's capabilities and the architectural tradeoffs that justify its current design.

Please refer to [Why does Bondy use its own embedded database?](https://www.notion.so/FAQs-f4c4d6b48cfa40e7b3e6fc6d0173ac87).

## License

### Is Bondy free to use?

Yes.

### Is Bondy open source software?

Yes. See [How is Bondy licensed?](https://www.notion.so/FAQs-f4c4d6b48cfa40e7b3e6fc6d0173ac87).

### How is Bondy licensed?

Leapsight Bondy is licensed under the Apache License 2.0, review a copy of the license [here](https://gitlab.com/leapsight/bondy/blob/develop/LICENSE).

### How is this documentation licensed?

You can find the answer in the [Documentation License](https://www.notion.so/Documentation-License-47b7f938c4c343a89672e9f67f000f5c)  page.

## Commercial Support

### Do you provide Commercial Support?

Yes, please contact [us](mailto:info@leapsight.com) to understand the service level options.