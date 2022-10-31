

# Kafka Bridge Tutorial

To enable the Kafka Bridge modify the `broker_bridge.kafka.enabled` option in the `bondy.conf` file as shown below:

```shell
broker_bridge.kafka.enabled = on
```

A subscription can be dynamically created and removed at runtime using the HTTP and WAMP APIs or it can be created at Bondy initialisation time through a configuration file.

## Statically configuring subscriptions

To configure one or more subscriptions you need to define a specification file using the [Bridge Subscription Specification Format]() and modify the `bondy.conf` to tell Bondy where to find it.

The following snippet provides an example subscriptions specification file.

```json
{
    "id":"subscribers_1",
    "meta":{},
    "subscriptions" : [
        {
            "bridge": "bondy_kafka_bridge",
            "match": {
                "realm": "com.example.realm",
                "topic" : "com.example.user.created",
                "options": {"match": "exact"}
            },
            "action": {
                "type": "produce_sync",
                "topic": "{{kafka.topics |> get(com.magenta.wamp_events)}}",
                "key": "\"{{event.topic}}/{{event.publication_id}}\"",
                "value": "{{event}}",
                "options" : {
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

The following snippet shows how to modify the `bondy.conf` file to tell Bondy where to locate the file and how to configure the bridge (this is particular to the Kafka Bridge).

```shell
broker_bridge.config_file = $(platform_etc_dir)/broker_bridge_config.json
broker_bridge.kafka.enabled = on
broker_bridge.kafka.clients.default.allow_topic_auto_creation = off
broker_bridge.kafka.clients.default.auto_start_producers = on
broker_bridge.kafka.clients.default.endpoints = [{"127.0.0.1", 9092}]
broker_bridge.kafka.clients.default.max_metadata_sock_retry = 5
broker_bridge.kafka.clients.default.producer.partition_restart_delay_seconds = 2s
broker_bridge.kafka.clients.default.producer.required_acks = 1
broker_bridge.kafka.clients.default.producer.topic_restart_delay_seconds = 10s
broker_bridge.kafka.clients.default.reconnect_cool_down_seconds = 10s
broker_bridge.kafka.clients.default.restart_delay_seconds = 10s
broker_bridge.kafka.topics.account_events = ${ACCOUNT_EVENTS_TOPIC}
broker_bridge.kafka.topics.user_events = ${USER_EVENTS_TOPIC}
```


## Event Object

```jsx
#{
    <<"realm">> => RealmUri,
    <<"topic">> => Topic,
    <<"subscription_id">> => Event#event.subscription_id,
    <<"publication_id">> => Event#event.publication_id,
    <<"details">> => Event#event.details,
    <<"arguments">> => Event#event.arguments,
    <<"arguments_kw">> => Event#event.arguments_kw,
    <<"ingestion_timestamp">> => erlang:system_time(millisecond)
}.
```

## Dynamically configuring subscriptions

TBD