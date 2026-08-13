---
related:
    - text: Broker Bridge
      type: Concept
      link: /router/concepts/broker_bridge
      description: What the broker bridge is for, how a subscription becomes an external action, and how to pick a sink.
    - text: Kafka Bridge Configuration Reference
      type: Configuration Reference
      link: /router/reference/configuration/kafka_bridge
      description: The Kafka-specific client, producer, and topic-mapping keys.
    - text: Kafka Bridge Tutorial
      type: Tutorial
      link: /router/tutorials/kafka_bridge
      description: A worked example forwarding WAMP events to Kafka.
---
# Broker Bridge Configuration Reference
The Broker Bridge subsystem runs a set of supervised, embedded WAMP subscribers that re-publish matching events to an external system — a message broker, an SMS gateway, or an email service — using the [Mops](/router/reference/api_gateway/expressions) expression language to map a WAMP event onto that system's own action shape. See [Broker Bridge](/router/concepts/broker_bridge) for the concepts behind the specification file and how a bridge module plugs into it.

Five bridges ship with Bondy: [Kafka](#kafka), [AWS SNS](#aws-sns-sms) (SMS), [SMTP](#smtp) (email), [Mailgun](#mailgun) (email) and [SendGrid](#sendgrid) (email). Each is enabled independently and can be mixed within the same specification file — one subscription might forward to Kafka while another sends an SMS, both driven by the same running bridge.

::: tip Use the SMTP bridge for email
[SMTP](#smtp) is the supported path: it sends through a [mail relay](/router/concepts/mail) whose credentials, TLS settings and sender policy live in `bondy.conf`, on a bounded worker pool off the routing path. Mailgun and SendGrid predate it, configure the same underlying HTTP client through global application settings — so **enabling both at once is mutually destructive** — and support neither attachments nor custom headers.
:::

@[config](broker_bridge.config_file,path,'/platform_etc_dir/broker_bridge_config.json',v0.8.8)

Path to the Broker Bridge's JSON specification file, which declares the actual subscriptions and their per-bridge action mappings.

## Broker Bridge Specification Object

```json
{
    "id": "com.example.bridges",
    "kind": "broker_bridge",
    "version": "v1.0",
    "meta": {},
    "subscriptions": [
        {
            "bridge": "bondy_kafka_bridge",
            "match": {
                "realm": "com.example.realm",
                "topic": "com.example.topic",
                "options": {"match": "exact"}
            },
            "action": {
                "type": "produce_sync",
                "topic": "{{kafka.topics.wamp_events}}",
                "key": "\"{{event.topic}}/{{event.publication_id}}\"",
                "value": "{{event}}",
                "options": {
                    "client_id": "default",
                    "acknowledge": true,
                    "required_acks": "all",
                    "partition": null,
                    "partitioner": {
                        "algorithm": "fnv32a",
                        "value": "\"{{event.topic}}/{{event.publication_id}}\""
                    },
                    "encoding": "json"
                }
            }
        }
    ]
}
```

Each entry in `subscriptions` names the target `bridge` module, a `match` selecting which realm/topic (with the usual `exact`/`prefix`/`wildcard` policy) triggers it, and an `action` — a Mops template evaluated against the event before being handed to that bridge's own action spec (see each bridge's section below for its `action` keys).

## Kafka
Forwards WAMP events to Apache Kafka, and is by far the most configurable of the five — see the [Kafka Bridge Configuration Reference](/router/reference/configuration/kafka_bridge) for its clients, producer tuning, and topic mapping, and the [Kafka Bridge Tutorial](/router/tutorials/kafka_bridge) for a worked example.

@[config](broker_bridge.kafka.enabled,on|off,off,v0.8.8)

Enables the Kafka bridge.

## AWS SNS (SMS)
Sends SMS messages via AWS SNS (`erlcloud_sns:publish_to_phone/2`) — not general SNS pub/sub, specifically the SMS delivery path. An action needs only `phone_number` (E.164 format) and `text_message`.

@[config](broker_bridge.aws.sns.enabled,on|off,off,v0.8.8)

Enables the AWS SNS bridge.

@[config](broker_bridge.aws.region,string,N/A,v0.8.8)

The AWS region SNS requests are sent to.

@[config](broker_bridge.aws.sns_host,string,N/A,v0.8.8)

Overrides the SNS endpoint host, for a non-default AWS endpoint (e.g. a local test double).

@[config](broker_bridge.aws.access_key_id,string,N/A,v0.8.8)

@[config](broker_bridge.aws.secret_access_key,string,N/A,v0.8.8)

The AWS credentials used to authenticate SNS requests.

## SMTP
Sends email through a [mail relay](/router/concepts/mail) declared in `bondy.conf`. The action carries the message; the relay carries the credentials, the TLS settings, which realms may send, and which senders they may claim. Nothing secret appears in a specification file.

Delivery is asynchronous by construction. `apply_action` runs inside the subscriber that is delivering the event, so waiting there for an SMTP conversation would put a relay's latency directly on the router's event path — the bridge hands the message to a [bounded worker pool](/router/reference/configuration/mail#mail.relay.$name.pool.size) and returns. A slow or dead relay fills its queue and starts refusing; publish and subscribe are untouched.

@[config](broker_bridge.smtp.enabled,on|off,off,v1.0.0-rc.60)

Enables the SMTP bridge.

::: warning Enable it on every node
A broker bridge subscriber handles only **locally-published** events. A node where this is off silently drops the events published to it, so an event's fate depends on which node its publisher happened to connect to.
:::

There is nothing else to configure here: relays are declared under `mail.*`. See the [Mail Configuration Reference](/router/reference/configuration/mail).

### Action

```json
{
    "bridge": "bondy_smtp_bridge",
    "match": {
        "realm": "com.example.realm",
        "topic": "com.example.user.registered",
        "options": {"match": "exact"}
    },
    "action": {
        "realm": "{{event.realm}}",
        "relay": "transactional",
        "to": "{{event.kwargs.email}}",
        "subject": "\"Welcome, {{event.kwargs.name}}\"",
        "text": "\"Your account is ready.\"",
        "html": "\"<h1>Welcome</h1><p>Your account is ready.</p>\"",
        "headers": {},
        "options": {}
    }
}
```

`realm` is required and decides which realm's authority the send is evaluated against — it must be a realm the named relay permits. Every other key is the [mail request object](/router/reference/wamp_api/mail): `id`, `relay`, `from`, `to`, `cc`, `bcc`, `reply_to`, `subject`, `text`, `html`, `headers`, `attachments`, `priority` and `timeout`. Unknown keys are rejected when the specification is loaded, not silently dropped.

::: info A missing template variable sends nothing
Evaluating `{{event.kwargs.email}}` against an event that has no such key is a hard error, not an empty string. The action fails and no message is sent — a half-rendered email is worse than none.
:::

## Mailgun
Sends email via the Mailgun API (`text/plain` and/or `text/html` body content; no template support). An action needs `email_address`, `sender`, `subject`, and `body`.

@[config](broker_bridge.mailgun.enabled,on|off,off,v0.8.8)

Enables the Mailgun bridge.

@[config](broker_bridge.mailgun.adapter,atom,mailgun2,v0.8.8)

The `email` library adapter used to talk to Mailgun. Leave at its default unless integrating a custom adapter.

@[config](broker_bridge.mailgun.domain,string,N/A,v0.8.8)

The Mailgun sending domain.

@[config](broker_bridge.mailgun.apiurl,string,N/A,v0.8.8)

@[config](broker_bridge.mailgun.apikey,string,N/A,v0.8.8)

The Mailgun API endpoint and key.

@[config](broker_bridge.mailgun.sender,string,N/A,v0.8.8)

The default sender address, injected into the Mops evaluation context as `{{email_sender}}` for action templates that reference it.

## SendGrid
Sends email via the SendGrid API. Supports both content-based (`text/plain` / `text/html`) and template-based (`template_id` + `template_data`) emails; a failed send retries up to 3 times with a 2-second backoff. An action needs `email_address`, `sender`, `subject`, and `body`.

@[config](broker_bridge.sendgrid.enabled,on|off,off,v0.8.8)

Enables the SendGrid bridge.

@[config](broker_bridge.sendgrid.adapter,atom,sendgrid,v0.8.8)

The `email` library adapter used to talk to SendGrid. Leave at its default unless integrating a custom adapter.

@[config](broker_bridge.sendgrid.apiurl,string,N/A,v0.8.8)

@[config](broker_bridge.sendgrid.apikey,string,N/A,v0.8.8)

The SendGrid API endpoint and key.

@[config](broker_bridge.sendgrid.sender,string,N/A,v0.8.8)

The default sender address, injected into the Mops evaluation context as `{{email_sender}}` for action templates that reference it.

## See also
- [Broker Bridge](/router/concepts/broker_bridge) — the concepts behind subscriptions, actions, and the five bridge modules.
- [Kafka Bridge Configuration Reference](/router/reference/configuration/kafka_bridge) — Kafka's client, producer, and topic-mapping keys.
- [Kafka Bridge Tutorial](/router/tutorials/kafka_bridge) — a worked example forwarding WAMP events to Kafka.
