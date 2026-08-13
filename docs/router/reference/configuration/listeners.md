# Network Listeners Configuration Reference
Configure the network listeners for the different protocols and gateways.

## Admin API HTTP Listener


@[config](admin_api.http.enabled,on|off,on,v0.8.8)

::: warning
Disable this listener for production; use the HTTPS listener instead.
:::

@[config](admin_api.http.port,port_number,18081,v0.8.8)

http.port is the TCP port that Bondy uses for exposing the Admin Rest APIs.


@[config](admin_api.http.acceptors_pool_size,pos_integer,100,v0.8.8)

The number of acceptors for the Admin API http listener. It determines how many HTTP sockets can be accepted concurrently by Bondy.

@[config](admin_api.http.max_connections,pos_integer,10000,v0.8.8)

The max number of connections for the Admin API http listener.

@[config](admin_api.http.backlog,pos_integer,1024,v0.8.8)

The maximum length that the queue of pending connections can grow to.

@[config](admin_api.http.keepalive,on|off,off,v0.8.8)

Enables/disables periodic transmission on a connected socket when no other
data is exchanged. If the other end does not respond, the connection is
considered broken and an error message is sent to the controlling process.

@[config](admin_api.http.sndbuf,bytesize,N/A,v0.8.8)

The minimum size of the send buffer to use for the socket.

@[config](admin_api.http.recbuf,bytesize,N/A,v0.8.8)

The minimum size of the receive buffer to use for the socket.

@[config](admin_api.http.buffer,bytesize,N/A,v0.8.8)

The size of the user-level software buffer used by the driver.
Not to be confused with options `sndbuf` and `recbuf`, which correspond to the
Kernel socket buffers.

It is recommended to have `val(buffer) >= max(val(sndbuf),val(recbuf))` to
avoid performance issues because of unnecessary copying.

`val(buffer)` is automatically set to the above maximum when values `sndbuf` or
`recbuf` are set.

@[config](admin_api.http.nodelay,on|off,on,v0.8.8)

If enabled, option TCP_NODELAY is turned on for the socket, which
means that also small amounts of data are sent immediately.

### HTTP/2

HTTP/2 is served on this listener via the `h2c` upgrade or prior-knowledge preface (cleartext; TLS listeners negotiate it via ALPN instead — see the HTTPS listener below).

@[config](admin_api.http.max_concurrent_streams,pos_integer,100,v1.0.0)

Maximum number of concurrent streams (in-flight requests) a single HTTP/2 client connection may have open. Unbounded concurrency lets one connection exhaust the node. Raise it only for trusted, heavily multiplexing clients.

::: warning Capacity planning
One HTTP/2 connection can carry up to `max_concurrent_streams` in-flight requests, so `max_connections`-based alarms undercount request-level load on this listener.
:::

@[config](admin_api.http.max_authorization_header_value_length,pos_integer,N/A,v1.0.0)

Maximum length of the `Authorization` header value, in bytes. Authorization headers routinely carry bearer tokens (JWTs) larger than typical header values, so this can be raised independently of the listener's general header-value limit, which applies when this option is not set.

@[config](admin_api.http.max_cookie_header_value_length,pos_integer,N/A,v1.0.0)

Maximum length of the `Cookie` header value, in bytes, independent of the general header-value limit.

@[config](admin_api.http.max_authority_length,pos_integer,255,v1.0.0)

Maximum length of the authority component of the request URI (the `host[:port]` part), in bytes. Requests exceeding it are rejected. Defaults to 255, the DNS name length limit.

@[config](admin_api.http.invalid_response_headers,error_terminate|ignore,error_terminate,v1.0.0)

What to do when a response contains invalid header names or values (e.g. control characters). `error_terminate` replies with a 500 and terminates the stream, preventing header injection and response splitting. `ignore` relays the response unchanged (Cowboy's behaviour before 2.16) — keep the default unless a legacy upstream behind the API gateway requires relaying such headers.

### Trusted Proxies (X-Forwarded-For)

@[config](admin_api.http.proxy_protocol,on|off,off,v0.8.8)

Enables checking the `X-Forwarded-For`/`X-Real-IP`/`Forwarded` headers to determine a request's source IP, used for matching against RBAC Source assignments.

@[config](admin_api.http.proxy_protocol.mode,strict|relaxed,relaxed,v0.8.8)

When proxy protocol checking is enabled: `strict` drops a connection that doesn't send a forwarding header or sends an invalid one; `relaxed` always accepts the connection and logs when the header is missing or invalid.

@[config](admin_api.http.proxy_protocol.trusted_proxies,string,N/A,v1.0.0)

Comma-separated CIDR list of trusted reverse proxies, e.g. `10.0.0.0/8,172.16.0.0/12,192.168.0.0/16`. The forwarding headers are only believed when the immediate socket peer's address is within one of these ranges; otherwise the socket peer's own address is used as the source IP. The default is **empty**, meaning no proxy is trusted, so a spoofed forwarding header can never influence source-IP-based authorization — this is what closes the header-spoofing path when Bondy sits behind an untrusted or misconfigured proxy.

When more than one hop is present in `X-Forwarded-For`, Bondy walks the chain from the right and takes the first address that is *not* inside a trusted range, so a client behind a trusted proxy cannot shift its apparent source IP by prepending spoofed hops of its own.

## Admin API HTTPS Listener

@[config](admin_api.https.enabled,on|off,on,v0.8.8)

::: warning
Disable this listener for production; use the HTTPS listener instead.
:::

@[config](admin_api.https.port,port_number,18081,v0.8.8)

The TCP port that Bondy uses for exposing the Admin APIs.


@[config](admin_api.https.acceptors_pool_size,pos_integer,200,v0.8.8)

The number of acceptors for the Admin API HTTPS listener. It determines how many HTTP sockets can be accepted concurrently by Bondy.

@[config](admin_api.https.max_connections,pos_integer,10000,v0.8.8)

The max number of connections for the Admin API https listener.

@[config](admin_api.https.backlog,pos_integer,1024,v0.8.8)

The maximum length that the queue of pending connections can grow to.

@[config](admin_api.https.keepalive,on|off,off,v0.8.8)

Enables/disables periodic transmission on a connected socket when no other
data is exchanged. If the other end does not respond, the connection is
considered broken and an error message is sent to the controlling process.

@[config](admin_api.https.sndbuf,bytesize,N/A,v0.8.8)

The minimum size of the send buffer to use for the socket.

@[config](admin_api.https.recbuf,bytesize,N/A,v0.8.8)

The minimum size of the receive buffer to use for the socket.

@[config](admin_api.https.buffer,bytesize,N/A,v0.8.8)

The size of the user-level software buffer used by the driver.
Not to be confused with options `sndbuf` and `recbuf`, which correspond to the
Kernel socket buffers.

It is recommended to have `val(buffer) >= max(val(sndbuf),val(recbuf))` to
avoid performance issues because of unnecessary copying.

`val(buffer)` is automatically set to the above maximum when values `sndbuf` or
`recbuf` are set.

@[config](admin_api.https.nodelay,on|off,on,v0.8.8)

If enabled, option TCP_NODELAY is turned on for the socket, which
means that also small amounts of data are sent immediately.

@[config](admin_api.https.certfile,path,'$(platform_etc_dir)/keycert.pem',v0.8.8)

Default cert location.

@[config](admin_api.https.keyfile,path,'$(platform_etc_dir)/key.pem',v0.8.8)

Default key location.

@[config](admin_api.https.cacertfile,path,'$(platform_etc_dir)/cacert.pem',v0.8.8)

Default signing authority location.

@[config](admin_api.https.versions,string,1.3,v0.8.8)

A comma separate list of TLS protocol versions that will be supported
At the moment Bondy only supports versions `1.2` and `1.3`.

### HTTP/2

HTTP/2 is served on this listener, negotiated via ALPN during the TLS handshake.

@[config](admin_api.https.max_concurrent_streams,pos_integer,100,v1.0.0)

Maximum number of concurrent streams (in-flight requests) a single HTTP/2 client connection may have open. Unbounded concurrency lets one connection exhaust the node. Raise it only for trusted, heavily multiplexing clients.

::: warning Capacity planning
One HTTP/2 connection can carry up to `max_concurrent_streams` in-flight requests, so `max_connections`-based alarms undercount request-level load on this listener.
:::

@[config](admin_api.https.max_authorization_header_value_length,pos_integer,N/A,v1.0.0)

Maximum length of the `Authorization` header value, in bytes, independently of the listener's general header-value limit — useful for large bearer tokens (JWTs).

@[config](admin_api.https.max_cookie_header_value_length,pos_integer,N/A,v1.0.0)

Maximum length of the `Cookie` header value, in bytes, independent of the general header-value limit.

@[config](admin_api.https.max_authority_length,pos_integer,255,v1.0.0)

Maximum length of the authority component of the request URI (the `host[:port]` part), in bytes. Requests exceeding it are rejected. Defaults to 255, the DNS name length limit.

@[config](admin_api.https.invalid_response_headers,error_terminate|ignore,error_terminate,v1.0.0)

What to do when a response contains invalid header names or values (e.g. control characters). `error_terminate` replies with a 500 and terminates the stream, preventing header injection and response splitting. `ignore` relays the response unchanged (Cowboy's behaviour before 2.16).

### Trusted Proxies (X-Forwarded-For)

@[config](admin_api.https.proxy_protocol,on|off,off,v0.8.8)

Enables checking the `X-Forwarded-For`/`X-Real-IP`/`Forwarded` headers to determine a request's source IP, used for matching against RBAC Source assignments.

@[config](admin_api.https.proxy_protocol.mode,strict|relaxed,relaxed,v0.8.8)

When proxy protocol checking is enabled: `strict` drops a connection that doesn't send a forwarding header or sends an invalid one; `relaxed` always accepts the connection and logs when the header is missing or invalid.

@[config](admin_api.https.proxy_protocol.trusted_proxies,string,N/A,v1.0.0)

Comma-separated CIDR list of trusted reverse proxies, e.g. `10.0.0.0/8,172.16.0.0/12,192.168.0.0/16`. The forwarding headers are only believed when the immediate socket peer's address is within one of these ranges; otherwise the socket peer's own address is used as the source IP. The default is **empty**, meaning no proxy is trusted, so a spoofed forwarding header can never influence source-IP-based authorization. When more than one hop is present, Bondy walks the `X-Forwarded-For` chain from the right and takes the first address that is *not* inside a trusted range.

## API Gateway HTTP Listener

@[config](api_gateway.http.enabled,on|off,on,v0.8.8)


@[config](api_gateway.http.port,integer,18080,v0.8.8)

The TCP port that Bondy uses for exposing the API Gateway managed APIs.


@[config](api_gateway.config_file,path,'$(platform_etc_dir)/api_gateway_config.json',v0.8.8)

The filename of a the API Gateway JSON configuration file,
which allows you to statically configure the API Gateway
with a list of API Specifications.


@[config](api_gateway.http.acceptors_pool_size,integer,200,v0.8.8)

@[config](api_gateway.http.max_connections,integer,100000,v0.8.8)

Lowered from 500000 in 1.0.0 — a per-listener cap this high invites file-descriptor and memory exhaustion. Match it to host capacity and raise deliberately rather than relying on the old default.

@[config](api_gateway.http.backlog,integer,4096,v0.8.8)

The maximum length that the queue of pending connections can grow to

@[config](api_gateway.http.keepalive,on|off,off,v0.8.8)

Enables/disables periodic transmission on a connected socket when no other
data is exchanged. If the other end does not respond, the connection is
considered broken and an error message is sent to the controlling process.

@[config](api_gateway.http.sndbuf,bytesize,N/A,v0.8.8)

The minimum size of the send buffer to use for the socket.

@[config](api_gateway.http.recbuf,bytesize,N/A,v0.8.8)

The minimum size of the receive buffer to use for the socket.

@[config](api_gateway.http.buffer,bytesize,N/A,v0.8.8)

The size of the user-level software buffer used by the driver.
Not to be confused with options `sndbuf` and `recbuf`, which correspond to the
Kernel socket buffers.

It is recommended to have `val(buffer) >= max(val(sndbuf),val(recbuf))` to
avoid performance issues because of unnecessary copying.

`val(buffer)` is automatically set to the above maximum when values `sndbuf` or
`recbuf` are set.

@[config](api_gateway.http.nodelay,on|off,off,v0.8.8)

### HTTP/2

HTTP/2 is served on this listener via the `h2c` upgrade or prior-knowledge preface (cleartext; TLS listeners negotiate it via ALPN instead — see the HTTPS listener below).

@[config](api_gateway.http.max_concurrent_streams,pos_integer,100,v1.0.0)

Maximum number of concurrent streams (in-flight requests) a single HTTP/2 client connection may have open.

::: warning Capacity planning
One HTTP/2 connection can carry up to `max_concurrent_streams` in-flight requests, so `max_connections`-based alarms undercount request-level load on this listener.
:::

@[config](api_gateway.http.max_authorization_header_value_length,pos_integer,N/A,v1.0.0)

Maximum length of the `Authorization` header value, in bytes, independently of the listener's general header-value limit — useful for large bearer tokens (JWTs).

@[config](api_gateway.http.max_cookie_header_value_length,pos_integer,N/A,v1.0.0)

Maximum length of the `Cookie` header value, in bytes, independent of the general header-value limit.

@[config](api_gateway.http.max_authority_length,pos_integer,255,v1.0.0)

Maximum length of the authority component of the request URI (the `host[:port]` part), in bytes. Defaults to 255, the DNS name length limit.

@[config](api_gateway.http.invalid_response_headers,error_terminate|ignore,error_terminate,v1.0.0)

What to do when a response contains invalid header names or values. `error_terminate` replies with a 500 and terminates the stream, preventing header injection and response splitting; `ignore` relays the response unchanged (Cowboy's behaviour before 2.16).

### Trusted Proxies (X-Forwarded-For)

@[config](api_gateway.http.proxy_protocol,on|off,off,v0.8.8)

Enables checking the `X-Forwarded-For`/`X-Real-IP`/`Forwarded` headers to determine a request's source IP, used for matching against RBAC Source assignments.

@[config](api_gateway.http.proxy_protocol.mode,strict|relaxed,relaxed,v0.8.8)

When proxy protocol checking is enabled: `strict` drops a connection that doesn't send a forwarding header or sends an invalid one; `relaxed` always accepts the connection and logs when the header is missing or invalid.

@[config](api_gateway.http.proxy_protocol.trusted_proxies,string,N/A,v1.0.0)

Comma-separated CIDR list of trusted reverse proxies, e.g. `10.0.0.0/8,172.16.0.0/12,192.168.0.0/16`. The default is **empty**, meaning no proxy is trusted, so a spoofed forwarding header can never influence source-IP-based authorization. When more than one hop is present, Bondy walks the `X-Forwarded-For` chain from the right and takes the first address that is *not* inside a trusted range, so a client behind a trusted proxy cannot shift its apparent source IP by prepending spoofed hops of its own.

## API Gateway HTTPS Listener

@[config](api_gateway.https.enabled,on|off,on,v0.8.8)


@[config](api_gateway.https.port,integer,18080,v0.8.8)

The TCP port that Bondy uses for exposing the API Gateway managed APIs.


@[config](api_gateway.config_file,path,'$(platform_etc_dir)/api_gateway_config.json',v0.8.8)

The filename of a the API Gateway JSON configuration file,
which allows you to statically configure the API Gateway
with a list of API Specifications.


@[config](api_gateway.https.acceptors_pool_size,integer,200,v0.8.8)

@[config](api_gateway.https.max_connections,integer,100000,v0.8.8)

Lowered from 500000 in 1.0.0 — a per-listener cap this high invites file-descriptor and memory exhaustion. Match it to host capacity and raise deliberately rather than relying on the old default.

@[config](api_gateway.https.backlog,integer,4096,v0.8.8)

The maximum length that the queue of pending connections can grow to

@[config](api_gateway.https.keepalive,on|off,off,v0.8.8)

Enables/disables periodic transmission on a connected socket when no other
data is exchanged. If the other end does not respond, the connection is
considered broken and an error message is sent to the controlling process.

@[config](api_gateway.https.sndbuf,bytesize,N/A,v0.8.8)

The minimum size of the send buffer to use for the socket.

@[config](api_gateway.https.recbuf,bytesize,N/A,v0.8.8)

The minimum size of the receive buffer to use for the socket.

@[config](api_gateway.https.buffer,bytesize,N/A,v0.8.8)

The size of the user-level software buffer used by the driver.
Not to be confused with options `sndbuf` and `recbuf`, which correspond to the
Kernel socket buffers.

It is recommended to have `val(buffer) >= max(val(sndbuf),val(recbuf))` to
avoid performance issues because of unnecessary copying.

`val(buffer)` is automatically set to the above maximum when values `sndbuf` or
`recbuf` are set.

@[config](api_gateway.https.nodelay,on|off,off,v0.8.8)


@[config](api_gateway.https.certfile,path,'$(platform_etc_dir)/keycert.pem',v0.8.8)

Default cert location.

@[config](api_gateway.https.keyfile,path,'$(platform_etc_dir)/key.pem',v0.8.8)

Default key location.

@[config](api_gateway.https.cacertfile,path,'$(platform_etc_dir)/cacert.pem',v0.8.8)

Default signing authority location.

@[config](api_gateway.https.versions,string,1.3,v0.8.8)

A comma separate list of TLS protocol versions that will be supported
At the moment Bondy only supports versions `1.2` and `1.3`. Example: "1.2,1.3".

### HTTP/2

HTTP/2 is served on this listener, negotiated via ALPN during the TLS handshake.

@[config](api_gateway.https.max_concurrent_streams,pos_integer,100,v1.0.0)

Maximum number of concurrent streams (in-flight requests) a single HTTP/2 client connection may have open.

::: warning Capacity planning
One HTTP/2 connection can carry up to `max_concurrent_streams` in-flight requests, so `max_connections`-based alarms undercount request-level load on this listener.
:::

@[config](api_gateway.https.max_authorization_header_value_length,pos_integer,N/A,v1.0.0)

Maximum length of the `Authorization` header value, in bytes, independently of the listener's general header-value limit — useful for large bearer tokens (JWTs).

@[config](api_gateway.https.max_cookie_header_value_length,pos_integer,N/A,v1.0.0)

Maximum length of the `Cookie` header value, in bytes, independent of the general header-value limit.

@[config](api_gateway.https.max_authority_length,pos_integer,255,v1.0.0)

Maximum length of the authority component of the request URI (the `host[:port]` part), in bytes. Defaults to 255, the DNS name length limit.

@[config](api_gateway.https.invalid_response_headers,error_terminate|ignore,error_terminate,v1.0.0)

What to do when a response contains invalid header names or values. `error_terminate` replies with a 500 and terminates the stream, preventing header injection and response splitting; `ignore` relays the response unchanged (Cowboy's behaviour before 2.16).

### Trusted Proxies (X-Forwarded-For)

@[config](api_gateway.https.proxy_protocol,on|off,off,v0.8.8)

Enables checking the `X-Forwarded-For`/`X-Real-IP`/`Forwarded` headers to determine a request's source IP, used for matching against RBAC Source assignments.

@[config](api_gateway.https.proxy_protocol.mode,strict|relaxed,relaxed,v0.8.8)

When proxy protocol checking is enabled: `strict` drops a connection that doesn't send a forwarding header or sends an invalid one; `relaxed` always accepts the connection and logs when the header is missing or invalid.

@[config](api_gateway.https.proxy_protocol.trusted_proxies,string,N/A,v1.0.0)

Comma-separated CIDR list of trusted reverse proxies, e.g. `10.0.0.0/8,172.16.0.0/12,192.168.0.0/16`. The default is **empty**, meaning no proxy is trusted, so a spoofed forwarding header can never influence source-IP-based authorization. When more than one hop is present, Bondy walks the `X-Forwarded-For` chain from the right and takes the first address that is *not* inside a trusted range.



## WAMP WebSockets Listener

::: warning Listener
Listener configuration is currently shared with the API Gateway. See
:::

@[config](wamp.websocket.ping.enabled, on|off,on,v1.0.0)


Defines if Websockets PING control message functionality is
enabled or not.

This option affects server (Bondy) initiated pings only. Some clients
might also initiate ping requests and Bondy will always respond to those
even if this option is turned off.

This feature is useful to keep a connection alive and validate the
connection is healthy.

Enabling this feature implies having an additional timer per connection and
this can be a considerable cost for servers that need to handle large
numbers of connections. A better solution in most cases is to let the client
handle pings. However, notice web browsers will typically kill websocket
connections after 60s and will not initiate PINGs.

@[config](wamp.websocket.ping.idle_timeout,time_duration_units,20s,v1.0.0)

If `wamp.websocket.ping.enabled` is enabled, this parameter controls the
maximum time interval that is permitted to elapse between the point at which
the Client finishes transmitting a message and the point it starts sending
the next.
Notice this is not the same as wamp.websocket.idle_timeout.


@[config](wamp.websocket.ping.timeout,time_duration_units,10s,v1.0.0)

If wamp.websocket.ping.enabled is 'on', this parameter controls the
amount of time Bondy waits for a ping response from the client.
Once that time has passed this counts as a fail attempt
(see `wamp.websocket.ping.max_attempts`).

@[config](wamp.websocket.ping.enabled,integer,2,v1.0.0)

If `wamp.websocket.ping.enabled` is enabled, this parameter controls how many
missed pings are allowed to timeout before Bondy closes the connection.

@[config](wamp.websocket.idle_timeout,time_duration_units,8h,v1.0.0)

Drops the connection after a period of inactivity. This option does not
take effect when `wamp.websocket.ping.enabled` is enabled and `wamp.websocket.ping.interval` times `wamp.websocket.ping.max_attempts` results in a value higher than this option.

::: warning Notice
For some clients using this option alone is not enough to keep
a connection alive as the client will drop the connection due to inactivity.
If the client supports Websocket PING control messages, enabled them,
otherwise set `wamp.websocket.ping.enabled` to on.

Web browsers don't typically support Websocket PING control messages.
:::

@[config](wamp.websocket.ping.enabled,'infinity'|integer,'infinity',v1.0.0)

Maximum frame size allowed by this Websocket handler. Cowboy will close the
connection when a client attempts to send a frame that goes over this limit.
For fragmented frames this applies to the size of the reconstituted frame.

A value of zero means un unbounded size (internally translated to 'infinity').

@[config](wamp.websocket.compression_enabled,on|off,off,v1.0.0)

Defines if Websocket compression (permessage-deflate extension) is enabled
or not. If enabled it will be negotiated with supporting clients.

@[config](wamp.websocket.deflate_opts.level,0..9,5,v1.0.0)

Compression level to use. A value between 0 and 9.

* 0 (none), gives no compression
* 1 gives best speed
* 9 gives best compression

@[config](wamp.websocket.deflate.mem_level,1..9,8,v1.0.0)

Specifies how much memory is to be allocated for the internal compression
state. An integer between 1 and 9, where 1 uses minimum memory but is slow
and reduces compression ratio while 9 uses maximum memory for optimal speed.

@[config](wamp.websocket.deflate.strategy,enum,default,v1.0.0)

Tunes the compression algorithm. Use the following values:
 -   `default` for normal data
 -   `filtered` for data produced by a filter (or predictor)
 -   `huffman_only` to force Huffman encoding only (no string match)
 -   `rle` to limit match distances to one (run-length encoding)

Filtered data consists mostly of small values with a somewhat random
distribution. In this case, the compression algorithm is tuned to compress
them better. The effect of filtered is to force more Huffman coding and less
string matching; it is somewhat intermediate between default and
huffman_only. rle is designed to be almost as fast as huffman_only, but
gives better compression for PNG image data.

Strategy affects only the compression ratio, but not the correctness of the
compressed output even if it is not set appropriately.

@[config](wamp.websocket.deflate.server_context_takeover,takeover|no_takeover,takeover,v1.0.0)

Using `no_takeover` can severely limit the usefulness of compression.

@[config](wamp.websocket.deflate.client_context_takeover,takeover|no_takeover,takeover,v1.0.0)

Using no_takeover can severely limit the usefulness of compression.

@[config](wamp.websocket.deflate.server_max_window_bits,8..15,11,v1.0.0)

The base two logarithm of the window size (the size of the history buffer).
It is to be in the range 8 through 15. Larger values result in better
compression at the expense of memory usage.


@[config](wamp.websocket.deflate.client_max_window_bits,8..15,11,v1.0.0)

The base two logarithm of the window size (the size of the history buffer).
It is to be in the range 8 through 15. Larger values result in better
compression at the expense of memory usage.


## WAMP Rawsocket TCP Listener

@[config](wamp.tcp.enabled,on|off,on,v0.8.0)

@[config](wamp.tcp.port,integer,18082,v0.8.0)

TCP port that Bondy uses for exposing the WAMP raw socket transport.

@[config](wamp.tcp.acceptors_pool_size,integer,200,v0.8.0)

The ranch acceptors_pool_size for the WAMP raw socket listener.

@[config](wamp.tcp.max_connections,integer,100000,v0.8.0)

The max number of concurrent connections for the WAMP raw socket.


@[config](wamp.tcp.backlog,pos_integer,1024,v0.8.8)

The maximum length that the queue of pending connections can grow to.

@[config](wamp.tcp.keepalive,on|off,off,v0.8.8)

Enables/disables periodic transmission on a connected socket when no other
data is exchanged. If the other end does not respond, the connection is
considered broken and an error message is sent to the controlling process.

@[config](wamp.tcp.sndbuf,bytesize,N/A,v0.8.8)

The minimum size of the send buffer to use for the socket.

@[config](wamp.tcp.recbuf,bytesize,N/A,v0.8.8)

The minimum size of the receive buffer to use for the socket.

@[config](wamp.tcp.buffer,bytesize,N/A,v0.8.8)

The size of the user-level software buffer used by the driver.
Not to be confused with options `sndbuf` and `recbuf`, which correspond to the
Kernel socket buffers.

It is recommended to have `val(buffer) >= max(val(sndbuf),val(recbuf))` to
avoid performance issues because of unnecessary copying.

`val(buffer)` is automatically set to the above maximum when values `sndbuf` or
`recbuf` are set.

@[config](wamp.tcp.http.nodelay,on|off,on,v0.8.8)

If enabled, option TCP_NODELAY is turned on for the socket, which
means that also small amounts of data are sent immediately.

@[config](wamp.tcp.ping.enabled,on|off,on,v1.0.0)

Defines if PING control message functionality is enabled or
not.

This option affects server (Bondy) initiated pings only. Some clients
might also initiate ping requests and Bondy will always respond to those
even if this option is turned off.

This feature is useful to keep a connection alive and validate the
connection is healthy.

Enabling this feature implies having an additional timer per connection and
this can be a considerable cost for servers that need to handle large
numbers of connections. A better solution in most cases is to let the client
handle pings.

@[config](wamp.tcp.ping.idle_timeout,time_duration_units,20s,v1.0.0)

If `wamp.tcp.ping.enabled` is enabled, this parameter controls the
maximum time interval that is permitted to elapse between the point at which
the Client finishes transmitting a message and the point it starts sending
the next.
Notice this is not the same as `wamp.tcp.idle_timeout`.

@[config](wamp.tcp.ping.timeout,time_duration_units,10s,v1.0.0)

If `wamp.tcp.ping.enabled` is enabled, this parameter controls the
amount of time Bondy waits for a ping response from the client.
Once that time has passed this counts as a fail attempt
(see `wamp.tcp.ping.max_attempts`)

@[config](wamp.tcp.ping.max_attempts,integer,2,v1.0.0)

If `wamp.tcp.ping.enabled` is enabled, this parameter controls how many
missed pings are considered a timeout. Thus, after this number of attempts
Bondy will drop the connection.

@[config](wamp.tcp.idle_timeout,infinity|time_duration_units,8h,v1.0.0)

Drops the connection after a period of inactivity. This option does not
take effect when `wamp.tcp.ping.enabled` is `on` and `wamp.tcp.ping.
interval` times `wamp.tcp.ping.max_attempts` results in a value higher
than this option.

Notice that for some clients using this option alone is not enough to keep
a connection alive as the client will drop the connection due to inactivity.
If the client supports tcp PING control messages, enabled them,
otherwise e.g. web browsers set `wamp.tcp.ping.enabled` to on.


## WAMP Rawsocket TLS Listener


@[config](wamp.tls.enabled,on|off,on,v0.8.0)

@[config](wamp.tls.port,integer,18082,v0.8.0)

TCP port that Bondy uses for exposing the WAMP raw socket transport.

@[config](wamp.tls.acceptors_pool_size,integer,200,v0.8.0)

The ranch acceptors_pool_size for the WAMP raw socket listener.

@[config](wamp.tls.max_connections,integer,100000,v0.8.0)

The max number of concurrent connections for the WAMP raw socket.


@[config](wamp.tls.backlog,pos_integer,1024,v0.8.8)

The maximum length that the queue of pending connections can grow to.

@[config](wamp.tls.keepalive,on|off,off,v0.8.8)

Enables/disables periodic transmission on a connected socket when no other
data is exchanged. If the other end does not respond, the connection is
considered broken and an error message is sent to the controlling process.

@[config](wamp.tls.sndbuf,bytesize,N/A,v0.8.8)

The minimum size of the send buffer to use for the socket.

@[config](wamp.tls.recbuf,bytesize,N/A,v0.8.8)

The minimum size of the receive buffer to use for the socket.

@[config](wamp.tls.buffer,bytesize,N/A,v0.8.8)

The size of the user-level software buffer used by the driver.
Not to be confused with options `sndbuf` and `recbuf`, which correspond to the
Kernel socket buffers.

It is recommended to have `val(buffer) >= max(val(sndbuf),val(recbuf))` to
avoid performance issues because of unnecessary copying.

`val(buffer)` is automatically set to the above maximum when values `sndbuf` or
`recbuf` are set.

@[config](wamp.tls.http.nodelay,on|off,on,v0.8.8)

If enabled, option TCP_NODELAY is turned on for the socket, which
means that also small amounts of data are sent immediately.

@[config](wamp.tls.ping.enabled,on|off,on,v1.0.0)

Defines if PING control message functionality is enabled or
not.

This option affects server (Bondy) initiated pings only. Some clients
might also initiate ping requests and Bondy will always respond to those
even if this option is turned off.

This feature is useful to keep a connection alive and validate the
connection is healthy.

Enabling this feature implies having an additional timer per connection and
this can be a considerable cost for servers that need to handle large
numbers of connections. A better solution in most cases is to let the client
handle pings.

@[config](wamp.tls.ping.idle_timeout,time_duration_units,20s,v1.0.0)

If `wamp.tls.ping.enabled` is enabled, this parameter controls the
maximum time interval that is permitted to elapse between the point at which
the Client finishes transmitting a message and the point it starts sending
the next.
Notice this is not the same as `wamp.tls.idle_timeout`.

@[config](wamp.tls.ping.timeout,time_duration_units,10s,v1.0.0)

If `wamp.tls.ping.enabled` is enabled, this parameter controls the
amount of time Bondy waits for a ping response from the client.
Once that time has passed this counts as a fail attempt
(see `wamp.tls.ping.max_attempts`)

@[config](wamp.tls.ping.max_attempts,integer,2,v1.0.0)

If `wamp.tls.ping.enabled` is enabled, this parameter controls how many
missed pings are considered a timeout. Thus, after this number of attempts
Bondy will drop the connection.

@[config](wamp.tls.idle_timeout,infinity|time_duration_units,8h,v1.0.0)

Drops the connection after a period of inactivity. This option does not
take effect when `wamp.tls.ping.enabled` is `on` and `wamp.tls.ping.
interval` times `wamp.tls.ping.max_attempts` results in a value higher
than this option.

Notice that for some clients using this option alone is not enough to keep
a connection alive as the client will drop the connection due to inactivity.
If the client supports tcp PING control messages, enabled them,
otherwise e.g. web browsers set `wamp.tls.ping.enabled` to on.


@[config](wamp.tls.certfile,path,'$(platform_etc_dir)/keycert.pem',v0.8.8)

Default cert location.

@[config](wamp.tls.certfile,path,'$(platform_etc_dir)/key.pem',v0.8.8)

Default key location.

@[config](wamp.tls.certfile,cacertfile,'$(platform_etc_dir)/cacert.pem',v0.8.8)

Default signing authority location.

@[config](wamp.tls.versions,string,'$(platform_etc_dir)/cacert.pem',v0.8.8)

A comma separate list of TLS protocol versions that will be supported
At the moment Bondy only supports versions `1.2` and `1.3`.

