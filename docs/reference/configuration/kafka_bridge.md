# Kafka Bridge Configuration Reference



@[config](broker_bridge.config_file,path,'/platform_etc_dir/broker_bridge_config.json',v0.8.8)

The configuration filename for the Broker Bridge.
Read the Broker Bridge Settings section on the specification file format.

@[config](broker_bridge.kafka.enabled,on|off,off,v0.8.8)

Enables or disables the Kafka Broker Bridge


@[config](broker_bridge.kafka.clients.$name.allow_topic_auto_creation,on|off,on,v0.8.8)

By default, the Kafka client respects what is configured in the broker about topic auto-creation. i.e. whether `auto.create.topics.enable`
is set in the broker configuration. However, if this parameter is set
to `false`, the client will avoid sending metadata requests that may cause an auto-creation of the topic regardless of what the broker config is.


@[config](broker_bridge.kafka.clients.$name.endpoints,list(string),See&nbsp;below,v0.8.8)

The Kafka Broker endpoints e.g. `[{"127.0.0.1",9092}]`


@[config](broker_bridge.kafka.clients.$name.max_metadata_sock_retry,integer,5,v0.8.8)

@[config](broker_bridge.kafka.clients.$name.producer.partition_restart_delay_seconds,time_duration_units,10s,v0.8.8)

@[config](broker_bridge.kafka.clients.$name.producer.required_acks,integer,1,v0.8.8)

How many acknowledgements the Kafka broker should receive from the clustered replicas before acknowledging producer.

* `0` - the broker will not send any response (this is the only case where the broker will not reply to a request)
* `1` - The leader will wait the data is written to the local log before sending a response
* `-1` - The broker will block until the message is committed by all in sync replicas before acknowledging

@[config](broker_bridge.kafka.clients.$name.producer.topic_restart_delay_seconds,time_duration_units,10s,v0.8.8)


@[config](broker_bridge.kafka.clients.$name.reconnect_cool_down_seconds,time_duration_units,10s,v0.8.8)

Delay this configured number of seconds before retrying toestabilish a new connection to the kafka partition leader. 


@[config](broker_bridge.kafka.clients.$name.restart_delay_seconds,time_duration_units,10s,v0.8.8)

How long to wait between attempts to restart the Kafka client process when it crashes.


@[config](broker_bridge.kafka.clients.$name.socket.recbuf,bytesize,-,v0.8.8)

@[config](broker_bridge.kafka.clients.$name.socket.sndbuf,bytesize,-,v0.8.8)

@[config](broker_bridge.kafka.topics.$name,string,-,v0.8.8)

A mapping of Clients to Kafka topics. This mapping is used by the JSON
`broker_bridge.config_file` which defines the
subscribers for each bridge.




