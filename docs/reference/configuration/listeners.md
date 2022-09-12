# Listeners Configuration Reference


## Admin API HTTP Listener

| admin_api.http.acceptors_pool_size | integer | 200 | Admin REST API |
| admin_api.http.backlog | integer | 1024 | Admin REST API |
| admin_api.http.enabled | on \| off | on | Admin REST API |
| admin_api.http.keepalive | on \| off | off | Admin REST API |
| admin_api.http.max_connections | integer | 250000 | Admin REST API |
| admin_api.http.nodelay | on \| off | on | Admin REST API |

## Admin API HTTPS Listener

| admin_api.https.acceptors_pool_size | integer | 200 | Admin REST API |
| admin_api.https.backlog | integer | 4096 | Admin REST API |
| admin_api.https.cacertfile | the path to a file | $(platform_etc_dir)/cacert.pem | Admin REST API |
| admin_api.https.certfile | the path to a file | $(platform_etc_dir)/cert.pem | Admin REST API |
| admin_api.https.enabled | on \| off | off | Admin REST API |
| admin_api.https.keepalive | on \| off | off | Admin REST API |
| admin_api.https.keyfile | the path to a file | $(platform_etc_dir)/key.pem | Admin REST API |
| admin_api.https.max_connections | integer | 250000 | Admin REST API |
| admin_api.https.nodelay | on \| off | on | Admin REST API |

## API Gateway HTTP Listener
| api_gateway.config_file | The filename of a the API Gateway JSON configuration file,
which allows you to statically configure the API Gateway
with a list of API Specifications. | path to a file | $(platform_etc_dir)/
api_gateway_config.json | API Gateway |
| api_gateway.http.acceptors_pool_size | integer | 200 | API Gateway |
| api_gateway.http.backlog | integer | 4096 | API Gateway |
| api_gateway.http.keepalive | Enables/disables periodic transmission on a connected socket when no other data is exchanged. If the other end does not respond, the connection is considered broken and an error message is sent to the controlling process. | on \| off | off | API Gateway |
| api_gateway.http.max_connections | integer | 500000 | API Gateway |
| api_gateway.http.nodelay | on \| off | on | API Gateway |

## API Gateway HTTPS Listener

| api_gateway.https.acceptors_pool_size | integer | 200 | API Gateway |
| api_gateway.https.cacertfile | path to a file | $(platform_etc_dir)/
cacert.pem | API Gateway |
| api_gateway.https.certfile | path to a file | $(platform_etc_dir)/
cert.pem | API Gateway |
| api_gateway.https.keepalive | on \| off | off | API Gateway |
| api_gateway.https.keyfile | path to a file | $(platform_etc_dir)/
key.pem | API Gateway |
| api_gateway.https.max_connections | integer | 500000 | API Gateway |


## WAMP WebSockets Listener

::: warning Listener
Listener configuration is currently shared with the API Gateway. See
:::

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


## WAMP Rawsocket TCP Listener

| wamp.tcp.acceptors_pool_size | integer | 200 | WAMP |
| wamp.tcp.enabled | on \| off | on | WAMP |
| wamp.tcp.keepalive | on \| off | on | WAMP |
| wamp.tcp.max_connections | integer | 100000 | WAMP |
| wamp.tcp.nodelay | on \| off | on | WAMP |
| wamp.tcp.port | integer | 18082 | WAMP |
| wamp.tcp.serializers.bert | 4..15 | 4 | WAMP |
| wamp.tcp.serializers.erl | 4..15 | 15 | WAMP |

## WAMP Rawsocket TLS Listener

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
