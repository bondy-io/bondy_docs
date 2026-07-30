# Kafka Bridge Configuration Reference

The Kafka Broker Bridge forwards WAMP events to Kafka topics, using the same [Mops](/reference/api_gateway/expressions) expression language as the API Gateway for mapping between them. It only produces to Kafka — there is no consumer side that turns Kafka messages back into WAMP events.

## Enabling the bridge

@[config](broker_bridge.kafka.enabled,on|off,off,v0.8.8)

Enables or disables the Kafka Broker Bridge.

@[config](broker_bridge.config_file,path,'/platform_etc_dir/broker_bridge_config.json',v0.8.8)

Path to the Broker Bridge's JSON specification file, which declares the actual subscriptions and their Kafka mappings — see the [Broker Bridge Specification Object](/reference/configuration/broker_bridge#broker-bridge-specification-object) for its structure.

## Client connection

Each client is named (`$name`) and configured independently; a deployment forwarding to more than one Kafka cluster defines one client block per cluster.

@[config](broker_bridge.kafka.clients.$name.endpoints,list(string),See&nbsp;below,v0.8.8)

The Kafka broker endpoints for this client, e.g. `[{"127.0.0.1",9092}]`.

@[config](broker_bridge.kafka.clients.$name.auto_start_producers,on|off,on,v0.8.8)

Whether the client starts a producer for a topic automatically the first time an event is published to it, rather than requiring the producer to be started explicitly beforehand.

@[config](broker_bridge.kafka.clients.$name.allow_topic_auto_creation,on|off,on,v0.8.8)

By default, the Kafka client respects what is configured in the broker about topic auto-creation. i.e. whether `auto.create.topics.enable`
is set in the broker configuration. However, if this parameter is set
to `false`, the client will avoid sending metadata requests that may cause an auto-creation of the topic regardless of what the broker config is.

@[config](broker_bridge.kafka.clients.$name.max_metadata_sock_retry,integer,5,v0.8.8)

Number of times the client retries its socket connection when fetching topic metadata from the Kafka cluster, before giving up.

@[config](broker_bridge.kafka.clients.$name.reconnect_cool_down_seconds,time_duration_units,10s,v0.8.8)

Delay before retrying to establish a new connection to the Kafka partition leader after a connection attempt fails.

@[config](broker_bridge.kafka.clients.$name.restart_delay_seconds,time_duration_units,10s,v0.8.8)

How long to wait between attempts to restart the Kafka client process when it crashes.

@[config](broker_bridge.kafka.clients.$name.socket.recbuf,bytesize,-,v0.8.8)

Receive buffer size for the client's TCP socket to the Kafka broker, passed through to the underlying socket option. Leave unset to use the OS default.

@[config](broker_bridge.kafka.clients.$name.socket.sndbuf,bytesize,-,v0.8.8)

Send buffer size for the client's TCP socket to the Kafka broker, passed through to the underlying socket option. Leave unset to use the OS default.

## Producer behaviour

@[config](broker_bridge.kafka.clients.$name.producer.required_acks,integer,1,v0.8.8)

How many acknowledgements the Kafka broker should receive from the clustered replicas before acknowledging producer.

* `0` - the broker will not send any response (this is the only case where the broker will not reply to a request)
* `1` - The leader will wait the data is written to the local log before sending a response
* `-1` - The broker will block until the message is committed by all in sync replicas before acknowledging

@[config](broker_bridge.kafka.clients.$name.producer.partition_restart_delay_seconds,time_duration_units,10s,v0.8.8)

How long to wait before restarting a partition's producer process after it crashes — the per-partition analogue of `restart_delay_seconds` above.

@[config](broker_bridge.kafka.clients.$name.producer.topic_restart_delay_seconds,time_duration_units,10s,v0.8.8)

How long to wait before restarting a topic's producer process after it crashes — the per-topic analogue of `restart_delay_seconds` above.

## Topic mapping

@[config](broker_bridge.kafka.topics.$name,string,-,v0.8.8)

A mapping of a short name to a Kafka topic. The `broker_bridge.config_file` specification references this name (e.g. `broker_bridge.kafka.topics.important_events = "com.myapp.events.important"` lets the spec's Mops expressions read `{{"\{\{kafka.topics.important_events\}\}"}}` rather than hard-coding the Kafka topic string).
