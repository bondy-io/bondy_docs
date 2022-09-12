# Kafka Bridge Configuration Reference


| broker_bridge.config_file | The configuration filename for the Broker Bridge.
Read the Broker Bridge Settings section on the specification file format. | path to a file | $(platform_etc_dir)/
broker_bridge_config.json | Broker Bridge |
| broker_bridge.kafka.enabled | on \| off | off | Broker Bridge |
| broker_bridge.kafka.clients.$name.allow_topic_auto_creation | By default, the Kafka client respects what is configured in the brokerabout topic auto-creation. i.e. whether `auto.create.topics.enable&#x27;
is set in the broker configuration. However if this parameter is set
to false, the client will avoid sending metadata requests thatmay cause an auto-creation of the topic regardless of what the broker config is. | on \| off | on | Kafka Bridge |
| broker_bridge.kafka.clients.$name.endpoints | a list of erlang tuples | [{&quot;127.0.0.1&quot;, 9092}] | Kafka Bridge |
| broker_bridge.kafka.clients.$name.max_metadata_sock_retry | integer | 5 | Kafka Bridge |
| broker_bridge.kafka.clients.$name.producer.partition_restart_delay_seconds | a time duration with units, e.g. `10s` for 10 seconds | 10s | Kafka Bridge |
| broker_bridge.kafka.clients.$name.producer.required_acks | How many acknowledgements the Kafka broker should receive from the clustered replicas before acknowledging producer.

0: the broker will not send any response (this is the only case where the broker will not reply to a request)

1: The leader will wait the data is written to the local log before sending a response.

-1: If it is -1 the broker will block until the message is committed by all in sync replicas before acknowledging. | integer | 1 | Kafka Bridge |
| broker_bridge.kafka.clients.$name.producer.topic_restart_delay_seconds | a time duration with units, e.g. `10s` for 10 seconds | 10s | Kafka Bridge |
| broker_bridge.kafka.clients.$name.reconnect_cool_down_seconds | Delay this configured number of seconds before retrying toestabilish a new connection to the kafka partition leader. | a time duration with units, e.g. `10s` for 10 seconds | 10s | Kafka Bridge |
| broker_bridge.kafka.clients.$name.restart_delay_seconds | How long to wait between attempts to restart the Kafka client process when it crashes. | a time duration with units, e.g. `10s` for 10 seconds | 10s | Kafka Bridge |
| broker_bridge.kafka.clients.$name.socket.recbuf | bytesize | ​Content | Kafka Bridge |
| broker_bridge.kafka.clients.$name.socket.sndbuf | bytesize | ​Content | Kafka Bridge |
| broker_bridge.kafka.topics.$name | A mapping of Clients to Kafka topics.
This mapping is used by the JSON
broker_bridge.config_file which defines the
subscribers for each bridge. | topic name | Kafka Bridge |




