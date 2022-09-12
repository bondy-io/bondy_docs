# Cluster Configuration Reference
> Bondy configuration options controlling the cluster.{.definition}


## Listener options

@[config](cluster.peer_port,integer, 18086, v0.8.8)

Defines the IP Port number to use for the cluster TCP connection.
The default value is `18086`.

@[config](cluster.parallelism,integer, 1, v0.8.8)

Defines the number of TCP connections for the cluster TCP stack. If a value higher than `1` is used, then the cluster connection will use a pool with size equal to the defined value for every named channel.

::: warning
At the moment there are 3 named channels so defining a value of `4` will create a pool of 12 connections. We recommend using a value of `1` until Bondy allows to selectively assign parallelism for each named channel.
:::

@[config](cluster.tls.enabled, on | off, off, v0.8.8)

If enabled then the cluster connection will be established over TLS (making the remaining TLS options mandatory). Otherwise, it will be established over TCP/IP.
The default value is `off`.

::: tip
We recommend enabling this option for production use.
:::

@[config](cluster.tls.cacertfile, path, '$(platform_etc_dir)/cacert.pem',v0.8.8)

Default signing authority location for cluster TLS connection.

@[config](cluster.tls.certfile,path, '$(platform_etc_dir)/cert.pem',v0.8.8)

Default cert location for cluster TLS connection.
The default value is `$(platform_etc_dir)/cert.pem`.


@[config](cluster.tls.keyfile, path, '$(platform_etc_dir)/key.pem')

Default key location for cluster TLS connection.



## Peer Discovery

@[config](cluster.peer_discovery.enabled, on | off, off)

Defines whether Bondy should actively search for peer nodes using a defined strategy.

@[config](cluster.peer_discovery.type, string)

Defines the module responsible for implementing the node discovery strategy. At the moment only options is `bondy_peer_discovery_dns_agent`.


@[config](cluster.peer_discovery.automatic_join, on | off, off)

Defines whether Bondy will automatically join a discovered node forming a cluster.

@[config](cluster.peer_discovery.join_retry_interval, time_duration_units, 5s)

Defines the time duration Bondy will wait between automatic join attempts.

@[config](cluster.peer_discovery.polling_interval, time_duration_units, 10s)

Defines the time duration Bondy will wait between polling attempts.

@[config](cluster.peer_discovery.timeout, time_duration_units, 5s)

Defines the time duration Bondy will wait for a response for a polling attempt.





# foo

| distributed_cookie | Cookie for distributed node communication.
All nodes in the same cluster should use the
same cookie or they will not be able to
communicate. | text | bondy | Erlang VM | All |
| erlang.async_threads | Sets the number of threads in async thread pool. If thread support is available, the default is 64. More information at: http://erlang.org/doc/man/erl.html | integer
between 0 and 1024 | 64 | Erlang VM |
| erlang.K | Erlang VM |
| erlang.max_ports | The number of concurrent ports/sockets. | integer between 1024 and 134217727 | 65536 | Erlang VM |
| erlang.sbwt | Erlang VM |
| erlang.schedulers.compaction_of_load | Erlang VM |
| erlang.schedulers.online | Erlang VM |
| erlang.schedulers.total | Erlang VM |
| erlang.schedulers.utilization_balancing | Erlang VM |
| erlang.smp | Erlang VM |
| erlang.W | Erlang VM |
| nodename | Name of the Erlang node. | text | bondy@127.0.0.1 | Erlang VM | All |
| admin_api.http.acceptors_pool_size | integer | 200 | Admin REST API |
| admin_api.http.backlog | integer | 1024 | Admin REST API |
| admin_api.http.enabled | on \| off | on | Admin REST API |
| admin_api.http.keepalive | on \| off | off | Admin REST API |
| admin_api.http.max_connections | integer | 250000 | Admin REST API |
| admin_api.http.nodelay | on \| off | on | Admin REST API |
| admin_api.https.acceptors_pool_size | integer | 200 | Admin REST API |
| admin_api.https.backlog | integer | 4096 | Admin REST API |
| admin_api.https.cacertfile | the path to a file | $(platform_etc_dir)/cacert.pem | Admin REST API |
| admin_api.https.certfile | the path to a file | $(platform_etc_dir)/cert.pem | Admin REST API |
| admin_api.https.enabled | on \| off | off | Admin REST API |
| admin_api.https.keepalive | on \| off | off | Admin REST API |
| admin_api.https.keyfile | the path to a file | $(platform_etc_dir)/key.pem | Admin REST API |
| admin_api.https.max_connections | integer | 250000 | Admin REST API |
| admin_api.https.nodelay | on \| off | on | Admin REST API |
| wamp.message_retention.default_ttl | integer or a time duration with units, e.g. `10s` for 10 seconds | 0 | WAMP |
| wamp.message_retention.enabled | on \| off | on | WAMP |
| wamp.message_retention.max_memory | a byte size with units, e.g. 10GB | 1GB | WAMP |
| wamp.message_retention.max_message_size | a byte size with units, e.g. 10GB | 64KB | WAMP |
| wamp.message_retention.max_messages | integer | 1000000 | WAMP |
| wamp.message_retention.storage_type | ram | disk | ram_disk | ram | WAMP |
| wamp.tcp.acceptors_pool_size | integer | 200 | WAMP |
| wamp.tcp.enabled | on \| off | on | WAMP |
| wamp.tcp.keepalive | on \| off | on | WAMP |
| wamp.tcp.max_connections | integer | 100000 | WAMP |
| wamp.tcp.nodelay | on \| off | on | WAMP |
| wamp.tcp.port | integer | 18082 | WAMP |
| wamp.tcp.serializers.bert | 4..15 | 4 | WAMP |
| wamp.tcp.serializers.erl | 4..15 | 15 | WAMP |
| wamp.tls.acceptors_pool_size | integer | 200 | WAMP |
| wamp.tls.backlog | integer | 1024 | WAMP |
| wamp.tls.cacertfile | path to a file | $(platform_etc_dir)/cacert.pem | WAMP |
| wamp.tls.certfile | path to a file | $(platform_etc_dir)/cert.pem | WAMP |
| wamp.tls.enabled | on \| off | off | WAMP |
| wamp.tls.keepalive | on \| off | on | WAMP |
| wamp.tls.keyfile | path to a file | $(platform_etc_dir)/key.pem | WAMP |
| wamp.tls.max_connections | integer | 100000 | WAMP |
| wamp.tls.nodelay | on \| off | on | WAMP |
| wamp.tls.port | integer | 18085 | WAMP |
| wamp.websocket.compression_enabled | on \| off | off | WAMP | 0.9.0 |
| wamp.websocket.deflate.level | integer | 5 | WAMP | 0.9.0 |
| wamp.websocket.deflate.mem_level | integer | 8 | WAMP | 0.9.0 |
| wamp.websocket.deflate.server_context_takeover | one of: takeover, no_takeover | takover | WAMP | 0.9.0 |
| wamp.websocket.deflate.server_max_window_bits | integer | 11 | WAMP | 0.9.0 |
| wamp.websocket.deflate.strategy | one of: default, filtered, huffman_only, rle | default | WAMP | 0.9.0 |
| wamp.websocket.idle_timeout | Drops the connection after a period of inactivity. This option does not take effect when wamp.websocket.ping.enabled is &#x27;on&#x27; and wamp.websocket.ping.interval times wamp.websocket.ping.max_attempts results in a value higher
than this option.
Notice that for some clients using this option alone is not enough to keep a connection alive as the client will drop the connection due to inactivity.
If the client supports Websocket PING control messages, enabled them, otherwise e.g. web browsers set wamp.websocket.ping.enabled to on. | a time duration with units, e.g. `10s` for 10 seconds; or the text &quot;infinity&quot; | 8h | WAMP | 0.9.0 |
| wamp.websocket.max_frame_size | integer or the text &quot;infinity&quot; | infinity | WAMP | 0.9.0 |
| wamp.websocket.ping.enabled | Defines if Websockets PING control message functionality is enabled or not. This option affects server (Bondy) initiated pings only. Some clients might also initiate ping requests and Bondy will always respond to those even if this option is turned off.
This feature is useful to keep a connection alive and validate the connection is healthy. For example, Browsers will typically kill websocket connections after 60s and will not initiate PINGs. | on \| off | on | WAMP | 0.9.0 |
| wamp.websocket.ping.interval | If wamp.websocket.ping.enabled is &#x27;on&#x27;, this value controls the interval in which Bondy sends WebSockets PING control messages. | a time duration with units, e.g. `10s` for 10 seconds | 30s | WAMP | 0.9.0 |
| wamp.websocket.ping.max_attempts | If wamp.websocket.ping.enabled is &#x27;on&#x27;, this value controls how many missed pings are considered a timeout. Thus, after this number of attempts Bondy will drop the connection.
If the value is &#x27;infinity&#x27; Bondy will never timeout based on missed pings. | an integer or the text &quot;infinity&quot; | 3 | WAMP | 0.9.0 |
| api_gateway.config_file | The filename of a the API Gateway JSON configuration file,
which allows you to statically configure the API Gateway
with a list of API Specifications. | path to a file | $(platform_etc_dir)/
api_gateway_config.json | API Gateway |
| api_gateway.http.acceptors_pool_size | integer | 200 | API Gateway |
| api_gateway.http.backlog | integer | 4096 | API Gateway |
| api_gateway.http.keepalive | Enables/disables periodic transmission on a connected socket when no other data is exchanged. If the other end does not respond, the connection is considered broken and an error message is sent to the controlling process. | on \| off | off | API Gateway |
| api_gateway.http.max_connections | integer | 500000 | API Gateway |
| api_gateway.http.nodelay | on \| off | on | API Gateway |
| api_gateway.https.acceptors_pool_size | integer | 200 | API Gateway |
| api_gateway.https.cacertfile | path to a file | $(platform_etc_dir)/
cacert.pem | API Gateway |
| api_gateway.https.certfile | path to a file | $(platform_etc_dir)/
cert.pem | API Gateway |
| api_gateway.https.keepalive | on \| off | off | API Gateway |
| api_gateway.https.keyfile | path to a file | $(platform_etc_dir)/
key.pem | API Gateway |
| api_gateway.https.max_connections | integer | 500000 | API Gateway |
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
| oauth2.client_credentials_grant.duration | Security |
| oauth2.code_grant.duration | Security |
| oauth2.config_file | Security |
| oauth2.password_grant.duration | Security |
| oauth2.refresh_token.duration | Security |
| oauth2.refresh_token.length | Security |
| security.allow_anonymous_user | Defines whether Bondy allows the &quot;anonymous&quot; user | on \| off | on | Security |
| security.automatically_create_realms | Defines whether Bondy create&#x27;s a new realm or not when a session wants to connect a non existing realm. | on \| off | off | Security |
| security.config_file | The filename of a security JSON configuration file, which allows you to statically configure realms and its users, groups, sources and permissions. Bondy Security can be completely configured dynamically via API, read more about this in the Security section. This file is for those cases when you want to ensure a given configuration is applied every time Bondy restarts. | the path to a file | {{platform_etc_dir}}/
security_config.json | Security |

| aae.data_exchange_timeout | time duration with units,
e.g. `10s` for 10 seconds | 1m | Active Anti-Entropy |
| aae.enabled | Controls whether the active anti-entropy subsystem is enabled. | on \| off | on | Active Anti-Entropy |
| aae.exchange_on_cluster_join | on \| off | on | Active Anti-Entropy |
| aae.exchange_timer | Controls when will the AAE system will trigger the next data exchange | time duration with units,
e.g. `10s` for 10 seconds | 1m | Active Anti-Entropy |
| aae.hashtree_timer | time duration with units,
e.g. `10s` for 10 seconds | 10s | Active Anti-Entropy |
| aae.hashtree_ttl | time duration with units,
e.g. `10s` for 10 seconds | 1w | Active Anti-Entropy |
| store.data_dir | Store |
| store.open_retries_delay | Store |
| store.open_retry_Limit | Store |
| store.partitions | Store |
| store.shard_by | Store |
| platform_data_dir | General |
| platform_etc_dir | General |
| platform_log_dir | General |
| platform_tmp_dir | General |

