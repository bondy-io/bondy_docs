---
related:
    - text: Broker Bridge
      type: Concept
      link: /concepts/broker_bridge
      description: What the broker bridge is for, how a subscription becomes an external action, and how to pick a sink.
    - text: Kafka Bridge Configuration Reference
      type: Configuration Reference
      link: /reference/configuration/kafka_bridge
      description: The Kafka-specific client, producer, and topic-mapping keys.
    - text: Kafka Bridge Tutorial
      type: Tutorial
      link: /tutorials/kafka_bridge
      description: A worked example forwarding WAMP events to Kafka.
---
# Broker Bridge Configuration Reference
The Broker Bridge subsystem runs a set of supervised, embedded WAMP subscribers that re-publish matching events to an external system — a message broker, an SMS gateway, or an email service — using the [Mops](/reference/api_gateway/expressions) expression language to map a WAMP event onto that system's own action shape. See [Broker Bridge](/concepts/broker_bridge) for the concepts behind the specification file and how a bridge module plugs into it.

Four bridges ship with Bondy: [Kafka](#kafka), [AWS SNS](#aws-sns-sms) (SMS), [Mailgun](#mailgun) (email), and [SendGrid](#sendgrid) (email). Each is enabled independently and can be mixed within the same specification file — one subscription might forward to Kafka while another sends an SMS, both driven by the same running bridge.

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
Forwards WAMP events to Apache Kafka, and is by far the most configurable of the four — see the [Kafka Bridge Configuration Reference](/reference/configuration/kafka_bridge) for its clients, producer tuning, and topic mapping, and the [Kafka Bridge Tutorial](/tutorials/kafka_bridge) for a worked example.

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
- [Broker Bridge](/concepts/broker_bridge) — the concepts behind subscriptions, actions, and the four bridge modules.
- [Kafka Bridge Configuration Reference](/reference/configuration/kafka_bridge) — Kafka's client, producer, and topic-mapping keys.
- [Kafka Bridge Tutorial](/tutorials/kafka_bridge) — a worked example forwarding WAMP events to Kafka.
