---
outline: [2,3]
related:
    - text: Broker Bridge Configuration Reference
      type: Configuration Reference
      link: /reference/configuration/broker_bridge
      description: Every broker_bridge.* configuration key, across all five bridges.
    - text: Kafka Bridge Tutorial
      type: Tutorial
      link: /tutorials/kafka_bridge
      description: A worked example forwarding WAMP events to Kafka.
    - text: HTTP Connector
      type: Concept
      link: /concepts/http_connector
      description: The RPC-call equivalent — bridging a WAMP call out to an upstream HTTP API, rather than an event out to a broker.
---

# Broker Bridge
The Broker Bridge re-publishes WAMP events to a system that doesn't speak WAMP: a message broker, an SMS gateway, or an email service. A subscription declares which realm and topic to watch and which external system to forward to; when a matching event is published, the bridge translates it into that system's own action — a Kafka message, an SMS, an email — and sends it.

Bondy uses "bridge" for several distinct integrations, each in a different direction; it's worth being precise about which one this is:

|Bridge|Direction|
|:---|:---|
|**Broker Bridge** (this page)|WAMP event out → external message broker, SMS, or email|
|[HTTP Connector](/concepts/http_connector)|WAMP call out → upstream HTTP/REST API|
|[HTTP API Gateway](/concepts/api_gateway)|Inbound HTTP request → WAMP call|
|[Bondy Edge (Bridge Relay)](/concepts/bridge_relay)|WAMP ↔ WAMP, between two Bondy routers|

## Five bridges, one mechanism
Bondy ships five bridge implementations, each a thin adapter around a specific external system:

|Bridge|Sink|
|:---|:---|
|Kafka|Apache Kafka, via `brod`|
|AWS SNS|SMS delivery via AWS SNS (`erlcloud`) — not general SNS pub/sub|
|**SMTP**|**Email through a [mail relay](/concepts/mail) declared in `bondy.conf` — the recommended way to send email**|
|Mailgun|Email via the Mailgun API. Superseded by the SMTP bridge|
|SendGrid|Email via the SendGrid API, with template support. Superseded by the SMTP bridge|

All five are the same underlying mechanism wearing different action shapes: each implements a common interface — set up a connection, validate an action, execute an action, tear down — so the subscription machinery, the templating language, and the specification file format are identical regardless of which one a given subscription targets. Learning one teaches you all five; the [Configuration Reference](/reference/configuration/broker_bridge) covers what differs between them (mostly credentials and the shape of the action itself).

Because each subscription names its own target bridge, a single specification file can mix them — one subscription forwarding order events to Kafka for downstream analytics, another sending an SMS on a critical alert topic, a third emailing a report — all driven by one `bondy.conf` and one JSON file.

## From a WAMP event to an external action
Three things happen, in order, every time an event matches a subscription:

1. **Match.** The subscription's `realm`/`topic`/match-policy selects which events it sees — the same `exact`/`prefix`/`wildcard` vocabulary as a normal WAMP subscription.
2. **Template.** The subscription's `action` is a [Mops](/reference/api_gateway/expressions) template, evaluated against a context built from the event (`realm`, `topic`, `subscription_id`, `publication_id`, `details`, `args`, `kwargs`) plus whatever the target bridge's own setup contributes — for example, Kafka's bridge exposes the topic-name mappings configured in `bondy.conf` under `{{kafka.topics.*}}`, and the email bridges expose the configured sender under `{{email_sender}}`. Evaluating the template turns the abstract action spec into a concrete one: a Kafka message with a real topic and key, an email with a resolved recipient and body.
3. **Execute.** The evaluated action is validated against the target bridge's own action shape (e.g. Kafka needs `topic`/`key`/`value`; an email bridge needs `email_address`/`sender`/`subject`/`body`) and handed to the bridge to actually send. A transient failure (a dropped connection, a timeout) can be retried; a malformed action is rejected before anything is sent.

## Choosing a sink
- **Kafka** — the default choice for anything downstream that already speaks Kafka, or where you need ordering, replay, or high volume. It only produces to Kafka; there is no consumer side that turns Kafka messages back into WAMP events.
- **AWS SNS** — a one-off SMS notification (an alert, a one-time code), not a queue you consume from.
- **SMTP** — transactional email, and the one to reach for. Credentials, TLS, sender policy and which realms may send are declared once in `bondy.conf` as a [mail relay](/concepts/mail); the subscription only names it. Delivery runs on a bounded worker pool off the routing path, so a slow relay degrades mail and nothing else.
- **Mailgun / SendGrid** — provider HTTP APIs, predating the SMTP bridge. They do not share its authority model, its pooling or its error handling, and they configure the *same* underlying HTTP client through global application settings, so **enabling both at once is mutually destructive**. Prefer the SMTP bridge unless you specifically need SendGrid's server-side templates (`template_id` + `template_data`).

## Configuring at runtime vs. bondy.conf
A specification file is the normal way to define subscriptions, loaded once from the path in `broker_bridge.config_file`. There is also a `subscribe/5` function that creates a subscription at runtime — but it is a plain Erlang API, not a WAMP procedure; there is no `bondy.broker_bridge.*` (or similar) WAMP admin surface for it. Managing subscriptions dynamically today means editing the specification file (and reloading), not calling a procedure.

## See also
- [Broker Bridge Configuration Reference](/reference/configuration/broker_bridge) — every `broker_bridge.*` key, across all five bridges.
- [Mail](/concepts/mail) — the relay model the SMTP bridge sends through.
- [Sending Email with the SMTP Bridge](/tutorials/smtp_bridge) — a worked example against a local mail server.
- [Kafka Bridge Tutorial](/tutorials/kafka_bridge) — a worked example, including the specification file end to end.
- [HTTP Connector](/concepts/http_connector) — the equivalent bridge for outbound RPC calls rather than outbound events.
- [Bondy Edge (Bridge Relay)](/concepts/bridge_relay) — bridging WAMP to WAMP, between two Bondy routers.
