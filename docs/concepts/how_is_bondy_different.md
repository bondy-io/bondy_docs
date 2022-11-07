---
draft: true
---
# How is Bondy different
Bondy provides a unique combination of features which sets it apart from other application networking solutions (e.g. WAMP routers) in terms of scalability, reliability, high-performance, development and operational simplicity.

## Bondy vs. other WAMP routers


### Distributed by design
Bondy was designed as a reliable distributed router, ensuring continued operation in the event of node or network failures through clustering and data replication.

Each Bondy node is capable of sending messages to and receiving messages from other nodes. All nodes in Bondy cluster act as relays, passing on a message towards its final destination.

<ZoomImg src="/assets/bondy_architecture.png"/>

### Self-sufficiency
Bondy does not depend on any external system e.g. databases, as it would not be able to guarantee their availability. Bondy stores all configuration and control plane data in its own embedded, globally-replicated database.

### Scalable
Bondy is written in Erlang/OTP which provides the underlying operating system to handle concurrency and scalability requirements, allowing it to scale to thousands and even millions of concurrent connections on a single node.

Its distributed architecture allows for horizontal scaling by simply adding nodes to the cluster.

### Decentralised, master-less
All nodes in a Bondy cluster are equal peers, there are no special nodes.
This enables Bondy's operational simplicity.

### Low latency data replication
All nodes in a Bondy cluster share a global state which is replicated through a highly scaleable and low latency eventually consistency model. Data is diseminated in real-time using epidemic broadcast trees (gossip)[^ebt].

[^ebt]: [Epidemic broadcast trees](https://www.gsd.inesc-id.pt/~ler/reports/srds07.pdf), João Leitão, José Pereira and Luís Rodrigues

Bondy uses [Partisan](https://github.com/lasp-lang/partisan), a high-performance Distributed Erlang alternative that enables various network topologies and supports larger clusters.

### Easy to operate
Bondy is easy to operate mainly due to its decentralised peer-to-peer nature, the lack of special nodes, automatic data replication and self-healing.

### Multi-tenancy
Bondy Realms (WAMP Realms) allow for complete administrative and routing isolation. By mapping a realm to a tenancy you can enable multi-tenant architecture designs. Realm Same Sign-on and Prototypes provides further flexibility, allowing a tenancy to be mapped to a set of realms.

### Identity Management & Authentication
Each Realm represents a User Identity domain and embeds an Identity Management and Authentication service which multiple WAMP and HTTP authentication methods. Identity data is replicated across the cluster to ensure always-on and low-latency operations.

### Authorization
Each Realm embeds an Authorization service based on a Role-based Access Control (RBAC) subsystem which controls access to realm resources and operations. Every message flowing through a realm is individually authorized. RBAC data is replicated across the cluster to ensure always-on and low-latency operations.

### HTTP API Gateway
Bondy embeds a powerful API Gateway that can translate HTTP actions to WAMP routed RPC and PubSub operations. The API Gateway leverages the underlying storage and replication technology to deploy the API Specifications to the cluster nodes in real-time.

### Broker Bridge
Bondy embeds a Broker Bridge that can manage a set of internal WAMP subscribers that re-publishes WAMP events to an external non-WAMP system e.g. a message broker.


In this comparison, we will be featuring NATS, Apache Kafka, RabbitMQ, Apache Pulsar, and gRPC.


## Bondy vs. other messaging technologies

This section presents a summary of how Bondy compares with popular messaging technologies of today. This is by no means an exhaustive list and each technology should be investigated thoroughly to decide which will work best for your implementation.



::: info Atribution
In this comparison, we will be featuring NATS, Apache Kafka, RabbitMQ, Apache Pulsar, and gRPC. The content is based on the article [Compare NATS](https://docs.nats.io/compare-nats).
:::

### Language and Platform Coverage

|Project|Features and Capabilities|
|---|---|
|Bondy| 36 known WAMP clients contributed by the community covering 21 programming languages.|
|NATS|Core NATS: 48 known client types, 11 supported by maintainers, 18 contributed by the community. NATS Streaming: 7 client types supported by maintainers, 4 contributed by the community. NATS servers can be compiled on architectures supported by Golang. NATS provides binary distributions.|
|gRPC|13 client languages.|
|Kafka|18 client types supported across the community and by Confluent. Kafka servers can run on platforms supporting java; very wide support.|
|Pulsar|7 client languages, 5 third-party clients - tested on macOS and Linux.|
|RabbitMQ|At least 10 client platforms that are maintainer-supported with over 50 community supported client types. Servers are supported on the following platforms: Linux Windows, NT.|

### Built-in Communication Patterns

|Project|Features and Capabilities|
|---|---|
|Bondy|As a WAMP router, Bondy provides support for publish/subscribe and Routed RPC, a first-class RPC implementation supporting URI-based discovery, call timeouts, failover/standy and load balancing. Payload pass-through mode supported.|
|NATS|Streams and Services through built-in publish/subscribe, request-reply, and load-balanced queue subscriber patterns. Dynamic request permissioning and request subject obfuscation is supported.|
|gRPC|One service, which may have streaming semantics, per channel. Load Balancing for a service can be done either client-side or by using a proxy.|
|Kafka|Streams through publish/subscribe. Load balancing can be achieved with consumer groups. Application code must correlate requests with replies over multiple topics for a service (request-reply) pattern.|
|Pulsar|Streams through publish/subscribe. Multiple competing consumer patterns support load balancing. Application code must correlate requests with replies over multiple topics for a service (request-reply) pattern.|
|RabbitMQ|Streams through publish/subscribe, and services with a direct reply-to feature. Load balancing can be achieved with a Work Queue. Applications must correlate requests with replies over multiple topics for a service (request-reply) pattern.|

### Delivery Guarantees

|Project|Features and Capabilities|
|---|---|
|Bondy|At most once.|
|NATS|At most once, at least once, and exactly once is available in JetStream.|
|gRPC|At most once.|
|Kafka|At least once, exactly once.|
|Pulsar|At most once, at least once, and exactly once.|
|RabbitMQ|At most once, at least once.|

### Multi-tenancy and Sharing

|Project|Features and Capabilities|
|---|---|
|Bondy|Bondy supports true multi-tenancy and decentralised security through WAMP Realms.|
|NATS|NATS supports true multi-tenancy and decentralized security through accounts and defining shared streams and services.|
|gRPC|N/A|
|Kafka|N/A|
|Pulsar|Multi-tenancy is implemented through tenants; built-in data sharing across tenants is not supported. Each tenant can have its own authentication and authorization scheme.|
|RabbitMQ|Multi-tenancy is supported with vhosts; data sharing is not supported.|

### Authentication

|Project|Features and Capabilities|
|---|---|
|Bondy|Crytosign, Ticket (JWT), OAuth2 (JWT), username and password, Trust and anonymous. All authentication methods support CIDR address restrictions.|
|NATS|NATS supports TLS, NATS credentials, NKEYS (NATS ED25519 keys), username and password, or simple token.|
|gRPC|TLS, ALT, Token, channel and call credentials, and a plug-in mechanism.|
|Kafka|Supports Kerberos and TLS. Supports JAAS and an out-of-box authorizer implementation that uses ZooKeeper to store connection and subject.|
|Pulsar|TLS Authentication, Athenz, Kerberos, JSON Web Token Authentication.|
|RabbitMQ|TLS, SASL, username and password, and pluggable authorization.|

### Authorization

|Project|Features and Capabilities|
|---|---|
|Bondy|Realms provide a fine grained Role-based Access Control (RBAC) model which enables user-level publish/subscribe and RPC permissions and CIDR address restrictions.|
|NATS|Account limits including number of connections, message size, number of imports and exports. User-level publish and subscribe permissions, connection restrictions, CIDR address restrictions, and time of day restrictions.|
|gRPC|Users can configure call credentials to authorize fine-grained individual calls on a service.|
|Kafka|Supports JAAS, ACLs for a rich set of Kafka resources including topics, clusters, groups, and others.|
|Pulsar|Permissions may be granted to specific roles for lists of operations such as produce and consume.|
|RabbitMQ|ACLs dictate permissions for configure, write, and read operations on resources like exchanges, queues, transactions, and others. Authentication is pluggable.|

### Message Retention and Persistence

|Project|Features and Capabilities|
|---|---|
|Bondy||
|NATS||
|gRPC||
|Kafka||
|Pulsar||
|RabbitMQ||

### High Availability and Fault Tolerance

|Project|Features and Capabilities|
|---|---|
|Bondy||
|NATS||
|gRPC||
|Kafka||
|Pulsar||
|RabbitMQ||

### Deployment

|Project|Supported Deployment Models|
|---|---|
|Bondy||
|NATS||
|gRPC||
|Kafka||
|Pulsar||
|RabbitMQ||

### Monitoring

|Project|Monitoring Tooling|
|---|---|
|Bondy||
|NATS||
|gRPC||
|Kafka||
|Pulsar||
|RabbitMQ||

### Management

|Project|Management Tooling|
|---|---|
|Bondy||
|NATS||
|gRPC||
|Kafka||
|Pulsar||
|RabbitMQ||

### Integrations

|Project|Built-in and 3rd-party Integrations|
|---|---|
|Bondy||
|NATS||
|gRPC||
|Kafka||
|Pulsar||
|RabbitMQ||






