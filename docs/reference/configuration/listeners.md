# Network Listeners Configuration Reference


## Admin API HTTP Listener


@[config](admin_api.http.enabled,on|off,on,v0.8.8)

::: warning
We recommend disabling this listener for production and using the HTTS listener instead.
:::

@[config](admin_api.http.port,port_number,18081,v0.8.8)

http.port is the TCP port that Bondy uses for exposing the Admin Rest APIs.


@[config](admin_api.http.acceptors_pool_size,pos_integer,200,v0.8.8)

The number of acceptors for the Admin API http listener. It determines how many HTTP sockets can be accepted concurrently by Bondy.

@[config](admin_api.http.acceptors_pool_size,pos_integer,250000,v0.8.8)

The max number of connections for the Admin API https listener.

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

If `on`, option TCP_NODELAY is turned on for the socket, which
means that also small amounts of data are sent immediately.


## Admin API HTTPS Listener

@[config](admin_api.https.enabled,on|off,on,v0.8.8)

::: warning
We recommend disabling this listener for production and using the HTTS listener instead.
:::

@[config](admin_api.https.port,port_number,18081,v0.8.8)

The TCP port that Bondy uses for exposing the Admin APIs.


@[config](admin_api.https.acceptors_pool_size,pos_integer,200,v0.8.8)

The number of acceptors for the Admin API HTTPS listener. It determines how many HTTP sockets can be accepted concurrently by Bondy.

@[config](admin_api.https.acceptors_pool_size,pos_integer,250000,v0.8.8)

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

If `on`, option TCP_NODELAY is turned on for the socket, which
means that also small amounts of data are sent immediately.

@[config](admin_api.https.certfile,path,'$(platform_etc_dir)/keycert.pem',v0.8.8)

Default cert location.

@[config](admin_api.https.certfile,path,'$(platform_etc_dir)/key.pem',v0.8.8)

Default key location.

@[config](admin_api.https.certfile,cacertfile,'$(platform_etc_dir)/cacert.pem',v0.8.8)

Default signing authority location.

@[config](admin_api.https.versions,string,'$(platform_etc_dir)/cacert.pem',v0.8.8)

A comma separate list of TLS protocol versions that will be supported
At the moment Bondy only supports versions `1.2` and `1.3`.


## API Gateway HTTP Listener

@[config](api_gateway.http.enabled,on|off,on,v0.8.8)


@[config](api_gateway.http.port,integer,18080,v0.8.8)

The TCP port that Bondy uses for exposing the API Gateway managed APIs.


@[config](api_gateway.config_file,path,'$(platform_etc_dir)/api_gateway_config.json',v0.8.8)

The filename of a the API Gateway JSON configuration file,
which allows you to statically configure the API Gateway
with a list of API Specifications.


@[config](api_gateway.http.acceptors_pool_size,integer,200,v0.8.8)

@[config](api_gateway.http.max_connections,integer,500000,v0.8.8)

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



## API Gateway HTTPS Listener

@[config](api_gateway.https.enabled,on|off,on,v0.8.8)


@[config](api_gateway.https.port,integer,18080,v0.8.8)

The TCP port that Bondy uses for exposing the API Gateway managed APIs.


@[config](api_gateway.config_file,path,'$(platform_etc_dir)/api_gateway_config.json',v0.8.8)

The filename of a the API Gateway JSON configuration file,
which allows you to statically configure the API Gateway
with a list of API Specifications.


@[config](api_gateway.https.acceptors_pool_size,integer,200,v0.8.8)

@[config](api_gateway.https.max_connections,integer,500000,v0.8.8)

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

@[config](api_gateway.https.certfile,path,'$(platform_etc_dir)/key.pem',v0.8.8)

Default key location.

@[config](api_gateway.https.certfile,cacertfile,'$(platform_etc_dir)/cacert.pem',v0.8.8)

Default signing authority location.

@[config](api_gateway.https.versions,string,'$(platform_etc_dir)/cacert.pem',v0.8.8)

A comma separate list of TLS protocol versions that will be supported
At the moment Bondy only supports versions `1.2` and `1.3`. Example: "1.2,1.3".



## WAMP WebSockets Listener

::: warning Listener
Listener configuration is currently shared with the API Gateway. See
:::

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
{mapping, "wamp.websocket.ping.enabled", "bondy.wamp_websocket.ping.enabled", [
  {default, on},
  {datatype, {flag, on, off}}
]}.

If wamp.websocket.ping.enabled is 'on', this parameter controls the
maximum time interval that is permitted to elapse between the point at which
the Client finishes transmitting a message and the point it starts sending
the next.
Notice this is not the same as wamp.websocket.idle_timeout.
{mapping, "wamp.websocket.ping.idle_timeout", "bondy.wamp_websocket.ping.idle_timeout", [
  {default, "20s"},
  {datatype, {duration, ms}}
]}.

If wamp.websocket.ping.enabled is 'on', this parameter controls the
amount of time Bondy waits for a ping response from the client.
Once that time has passed this counts as a fail attempt
(see wamp.websocket.ping.max_attempts).
{mapping, "wamp.websocket.ping.timeout", "bondy.wamp_websocket.ping.timeout", [
  {default, "10s"},
  {datatype, {duration, ms}}
]}.

If wamp.websocket.ping.enabled is 'on', this parameter controls how many
missed pings are allowed to timeout before Bondy closes the connection.
{mapping,
  "wamp.websocket.ping.max_attempts",
"bondy.wamp_websocket.ping.max_attempts",
  [
    {default, 2},
    {datatype, integer},
    {validators, ["pos_integer"]}
  ]
}.

Drops the connection after a period of inactivity. This option does not
take effect when wamp.websocket.ping.enabled is 'on' and wamp.websocket.ping.
interval times wamp.websocket.ping.max_attempts results in a value higher
than this option.
Notice that for some clients using this option alone is not enough to keep
a connection alive as the client will drop the connection due to inactivity.
If the client supports Websocket PING control messages, enabled them,
otherwise e.g. web browsers set wamp.websocket.ping.enabled to on.
{mapping, "wamp.websocket.idle_timeout", "bondy.wamp_websocket.idle_timeout", [
  {default, "8h"},
  {datatype, [{duration, ms}, {atom, infinity}]}
]}.


Maximum frame size allowed by this Websocket handler. Cowboy will close the
connection when a client attempts to send a frame that goes over this limit.
For fragmented frames this applies to the size of the reconstituted frame.
%%
A value of cero means un unbounded size (internally translated to 'infinity')
{mapping, "wamp.websocket.max_frame_size", "bondy.wamp_websocket.max_frame_size", [
  {default, infinity},
  {datatype, [{atom, infinity}, integer]}
]}.

% {translation, "bondy.wamp_websocket.max_frame_size",
%  fun(Conf) ->
%   TheLimit = cuttlefish:conf_get("wamp.websocket.max_frame_size", Conf),
%   case TheLimit of
%       0 -> infinite;
%       Int when is_integer(Int) andalso Int > 0 -> Int;
%       _ ->
%           This would have been caught earlier in datatype validation
%           cuttlefish:invalid("should be a non negative integer")
%   end
%  end
% }.


Defines if Websocket compression (permessage-deflate extension) is enabled
or not. If enabled it will be negotiated with supporting clients.
{mapping, "wamp.websocket.compression_enabled", "bondy.wamp_websocket.compress", [
  {default, off},
  {datatype, {flag, on, off}}
]}.


Compression level to use. A value between 0 and 9
* 0 (none), gives no compression
* 1 (best_speed) gives best speed
* 9 (best_compression) gives best compression
{mapping, "wamp.websocket.deflate.level", "bondy.wamp_websocket.deflate_opts.level", [
  {default, 5},
  {datatype, integer}
]}.

{translation, "bondy.wamp_websocket.deflate_opts.level",
 fun(Conf) ->
  case cuttlefish:conf_get("wamp.websocket.deflate.level", Conf) of
      Int when is_integer(Int) andalso Int >= 0 andalso Int =< 9 -> Int;
      _ ->
          This would have been caught earlier in datatype validation
          cuttlefish:invalid(
            "should be an integer between 0 and 9")
  end
 end
}.

Specifies how much memory is to be allocated for the internal compression
state. An integer between 1 and 9, where 1 uses minimum memory but is slow
and reduces compression ratio while 9 uses maximum memory for optimal speed.
{mapping, "wamp.websocket.deflate.mem_level", "bondy.wamp_websocket.deflate_opts.mem_level", [
  {default, 8},
  {datatype, integer}
]}.

{translation, "bondy.wamp_websocket.deflate_opts.mem_level",
 fun(Conf) ->
  case cuttlefish:conf_get("wamp.websocket.deflate.mem_level", Conf) of
      Int when is_integer(Int) andalso Int >= 1 andalso Int =< 9 -> Int;
      _ ->
          This would have been caught earlier in datatype validation
          cuttlefish:invalid(
            "should be an integer between 1 and 9")
  end
 end
}.

Tunes the compression algorithm. Use the following values:
 -   default for normal data
 -   filtered for data produced by a filter (or predictor)
 -   huffman_only to force Huffman encoding only (no string match)
 -   rle to limit match distances to one (run-length encoding)
%%
Filtered data consists mostly of small values with a somewhat random
distribution. In this case, the compression algorithm is tuned to compress
them better. The effect of filtered is to force more Huffman coding and less
string matching; it is somewhat intermediate between default and
huffman_only. rle is designed to be almost as fast as huffman_only, but
gives better compression for PNG image data.
%%
Strategy affects only the compression ratio, but not the correctness of the
compressed output even if it is not set appropriately.
{mapping, "wamp.websocket.deflate.strategy", "bondy.wamp_websocket.deflate_opts.strategy", [
  {default, default},
  {datatype, {enum, [default, filtered, huffman_only, rle]}}
]}.

 Using no_takeover can severly limit the usefulness of compression.
{mapping, "wamp.websocket.deflate.server_context_takeover", "bondy.wamp_websocket.deflate_opts.server_context_takeover", [
  {default, takeover},
  {datatype, {enum, [takeover, no_takeover]}}
]}.

 Using no_takeover can severly limit the usefulness of compression.
{mapping, "wamp.websocket.deflate.client_context_takeover", "bondy.wamp_websocket.deflate_opts.client_context_takeover", [
  {default, takeover},
  {datatype, {enum, [takeover, no_takeover]}}
]}.

The base two logarithm of the window size (the size of the history buffer).
It is to be in the range 8 through 15. Larger values result in better
compression at the expense of memory usage.
{mapping, "wamp.websocket.deflate.server_max_window_bits", "bondy.wamp_websocket.deflate_opts.server_max_window_bits", [
  {default, 11},
  {datatype, integer}
]}.

{translation, "bondy.wamp_websocket.deflate_opts.server_max_window_bits",
 fun(Conf) ->
  case cuttlefish:conf_get("wamp.websocket.deflate.server_max_window_bits", Conf) of
      Int when is_integer(Int) andalso Int >= 8 andalso Int =< 15 -> Int;
      _ ->
          cuttlefish:invalid(
            "should be an integer between 8 and 15")
  end
 end
}.

The base two logarithm of the window size (the size of the history buffer).
It is to be in the range 8 through 15. Larger values result in better
compression at the expense of memory usage.
{mapping, "wamp.websocket.deflate.client_max_window_bits", "bondy.wamp_websocket.deflate_opts.client_max_window_bits", [
  {default, 11},
  {datatype, integer}
]}.

{translation, "bondy.wamp_websocket.deflate_opts.client_max_window_bits",
 fun(Conf) ->
  case cuttlefish:conf_get("wamp.websocket.deflate.client_max_window_bits", Conf) of
      Int when is_integer(Int) andalso Int >= 8 andalso Int =< 15 -> Int;
      _ ->
          cuttlefish:invalid(
            "should be an integer between 8 and 15")
  end
 end
}.








## WAMP Rawsocket TCP Listener



{mapping, "wamp.tcp.enabled", "bondy.wamp_tcp.enabled", [
  {default, on},
  {datatype, {flag, on, off}}
]}.

api_gateway.ssl.port is the TCP port that Bondy uses for
exposing the WAMP raw socket transport
{mapping, "wamp.tcp.port", "bondy.wamp_tcp.port", [
  {default, 18082},
  {datatype, integer}
]}.


The ranch acceptors_pool_size for the WAMP raw socket tcp listener
{mapping, "wamp.tcp.acceptors_pool_size", "bondy.wamp_tcp.acceptors_pool_size", [
  {datatype, integer},
  {default, 200}
]}.

The ranch max number of connections for the WAMP raw socket tcp listener
{mapping, "wamp.tcp.max_connections", "bondy.wamp_tcp.max_connections", [
  {datatype, integer},
  {default, 100000}
]}.

The maximum length that the queue of pending connections can grow to.
{mapping, "wamp.tcp.backlog", "bondy.wamp_tcp.backlog", [
  {datatype, integer},
  {default, 1024}
]}.

TCP SOCKET OPTS

Enables/disables periodic transmission on a connected socket when no other
data is exchanged. If the other end does not respond, the connection is
considered broken and an error message is sent to the controlling process.
{mapping, "wamp.tcp.keepalive", "bondy.wamp_tcp.socket_opts.keepalive", [
  {datatype, {flag, on, off}},
  {default, on}
]}.

The minimum size of the send buffer to use for the socket.
{mapping, "wamp.tcp.sndbuf", "bondy.wamp_tcp.socket_opts.sndbuf", [
  {datatype, bytesize}
]}.

The minimum size of the receive buffer to use for the socket.
{mapping, "wamp.tcp.recbuf", "bondy.wamp_tcp.socket_opts.recbuf", [
  {datatype, bytesize}
]}.

The size of the user-level software buffer used by the driver.
Not to be confused with options sndbuf and recbuf, which correspond to the
Kernel socket buffers.
It is recommended to have val(buffer) >= max(val(sndbuf),val(recbuf)) to
avoid performance issues because of unnecessary copying.
val(buffer) is automatically set to the above maximum when values sndbuf or
recbuf are set.
{mapping, "wamp.tcp.buffer", "bondy.wamp_tcp.socket_opts.buffer", [
  {datatype, bytesize}
]}.

If Boolean == true, option TCP_NODELAY is turned on for the socket, which
means that also small amounts of data are sent immediately.
{mapping, "wamp.tcp.nodelay", "bondy.wamp_tcp.socket_opts.nodelay", [
  {datatype, {flag, on, off}},
  {default, on}
]}.


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
{mapping, "wamp.tcp.ping.enabled", "bondy.wamp_tcp.ping.enabled", [
{default, on},
{datatype, {flag, on, off}}
]}.

If wamp.tcp.ping.enabled is 'on', this parameter controls the
maximum time interval that is permitted to elapse between the point at which
the Client finishes transmitting a message and the point it starts sending
the next.
Notice this is not the same as wamp.tcp.idle_timeout.
{mapping, "wamp.tcp.ping.idle_timeout", "bondy.wamp_tcp.ping.idle_timeout", [
{default, "20s"},
{datatype, {duration, ms}}
]}.

If wamp.tcp.ping.enabled is 'on', this parameter controls the
amount of time Bondy waits for a ping response from the client.
Once that time has passed this counts as a fail attempt
(see wamp.tcp.ping.max_attempts).
{mapping, "wamp.tcp.ping.timeout", "bondy.wamp_tcp.ping.timeout", [
{default, "10s"},
{datatype, {duration, ms}}
]}.

If wamp.tcp.ping.enabled is 'on', this parameter controls how many
missed pings are considered a timeout. Thus, after this number of attempts
Bondy will drop the connection.
{mapping, "wamp.tcp.ping.max_attempts", "bondy.wamp_tcp.ping.max_attempts",
[
  {default, 2},
  {datatype, integer},
  {validators, ["pos_integer"]}
]
}.

Drops the connection after a period of inactivity. This option does not
take effect when wamp.tcp.ping.enabled is 'on' and wamp.tcp.ping.
interval times wamp.tcp.ping.max_attempts results in a value higher
than this option.
Notice that for some clients using this option alone is not enough to keep
a connection alive as the client will drop the connection due to inactivity.
If the client supports tcp PING control messages, enabled them,
otherwise e.g. web browsers set wamp.tcp.ping.enabled to on.
{mapping, "wamp.tcp.idle_timeout", "bondy.wamp_tcp.idle_timeout", [
{default, "8h"},
{datatype, [{duration, ms}, {atom, infinity}]}
]}.


## WAMP Rawsocket TLS Listener



{mapping, "wamp.tls.enabled", "bondy.wamp_tls.enabled", [
  {default, off},
  {datatype, {flag, on, off}}
]}.


api_gateway.ssl.port is the TCP port that Bondy uses for
exposing the WAMP raw socket transport
{mapping, "wamp.tls.port", "bondy.wamp_tls.port", [
  {default, 18085},
  {datatype, integer}
]}.

The ranch acceptors_pool_size for the WAMP raw socket tcp listener
{mapping, "wamp.tls.acceptors_pool_size", "bondy.wamp_tls.acceptors_pool_size", [
  {datatype, integer},
  {default, 200}
]}.

The ranch max number of connections for the WAMP raw socket tcp listener
{mapping, "wamp.tls.max_connections", "bondy.wamp_tls.max_connections", [
  {datatype, integer},
  {default, 100000}
]}.

The maximum length that the queue of pending connections can grow to.
{mapping, "wamp.tls.backlog", "bondy.wamp_tls.backlog", [
  {datatype, integer},
  {default, 1024}
]}.



Enables/disables periodic transmission on a connected socket when no other
data is exchanged. If the other end does not respond, the connection is
considered broken and an error message is sent to the controlling process.
{mapping, "wamp.tls.keepalive", "bondy.wamp_tls.socket_opts.keepalive", [
  {datatype, {flag, on, off}},
  {default, on}
]}.

The minimum size of the send buffer to use for the socket.
{mapping, "wamp.tls.sndbuf", "bondy.wamp_tls.socket_opts.sndbuf", [
  {datatype, bytesize}
]}.

The minimum size of the receive buffer to use for the socket.
{mapping, "wamp.tls.recbuf", "bondy.wamp_tls.socket_opts.recbuf", [
  {datatype, bytesize}
]}.

The size of the user-level software buffer used by the driver.
Not to be confused with options sndbuf and recbuf, which correspond to the
Kernel socket buffers.
It is recommended to have val(buffer) >= max(val(sndbuf),val(recbuf)) to
avoid performance issues because of unnecessary copying.
val(buffer) is automatically set to the above maximum when values sndbuf or
recbuf are set.
{mapping, "wamp.tls.buffer", "bondy.wamp_tls.socket_opts.buffer", [
  {datatype, bytesize}
]}.

If Boolean == true, option TCP_NODELAY is turned on for the socket, which
means that also small amounts of data are sent immediately.
{mapping, "wamp.tls.nodelay", "bondy.wamp_tls.socket_opts.nodelay", [
  {datatype, {flag, on, off}},
  {default, on}
]}.


Defines if PING control message functionality is enabled or
not. This option affects server (Bondy) initiated pings only. Some clients
might also initiate ping requests and Bondy will always respond to those
even if this option is turned off.
This feature is useful to keep a connection alive and validate the
connection is healthy.
Enabling this feature implies having an additional timer per connection and
this can be a considerable cost for servers that need to handle large
numbers of connections. A better solution in most cases is to let the client
handle pings.
{mapping, "wamp.tls.ping.enabled", "bondy.wamp_tls.ping.enabled", [
{default, on},
{datatype, {flag, on, off}}
]}.

If wamp.tls.ping.enabled is 'on', this parameter controls the interval
in which Bondy sends WebSockets PING control messages.
{mapping, "wamp.tls.ping.interval", "bondy.wamp_tls.ping.interval", [
{default, "30s"},
{datatype, {duration, ms}}
]}.

If wamp.tls.ping.enabled is 'on', this parameter controls the time
Bondy will wait for a ping response. Once that time has passed this counts
as a fail attempt (see max_attempts).
{mapping, "wamp.tls.ping.timeout", "bondy.wamp_tls.ping.timeout", [
{default, "10s"},
{datatype, {duration, ms}}
]}.

If wamp.tls.ping.enabled is 'on', this parameter controls how many
missed pings are considered a timeout. Thus, after this number of attempts
Bondy will drop the connection.
If the value is 'infinity' Bondy will never timeout based on missed pings.
{mapping,
"wamp.tls.ping.max_attempts",
"bondy.wamp_tls.ping.max_attempts",
[
  {default, 3},
  {datatype, [integer, {atom, infinity}]}
]
}.

Drops the connection after a period of inactivity. This option does not
take effect when wamp.tls.ping.enabled is 'on' and wamp.tls.ping.
interval times wamp.tls.ping.max_attempts results in a value higher
than this option.
Notice that for some clients using this option alone is not enough to keep
a connection alive as the client will drop the connection due to inactivity.
If the client supports tls PING control messages, enabled them,
otherwise e.g. web browsers set wamp.tls.ping.enabled to on.
{mapping, "wamp.tls.idle_timeout", "bondy.wamp_tls.idle_timeout", [
{default, "8h"},
{datatype, [{duration, ms}, {atom, infinity}]}
]}.

Default cert location for https can be overridden
with the wamp.tls config variable, for example:
{mapping, "wamp.tls.certfile", "bondy.wamp_tls.tls_opts.certfile", [
  {datatype, file},
  {default, "{{platform_etc_dir}}/keycert.pem"}
]}.

Default key location for https can be overridden with the
%%wamp.tls config variable, for example:
{mapping, "wamp.tls.keyfile", "bondy.wamp_tls.tls_opts.keyfile", [
  {datatype, file},
  {default, "{{platform_etc_dir}}/key.pem"}
]}.

Default signing authority location for https can be overridden
with the wamp.tls config variable, for example:
{mapping, "wamp.tls.cacertfile", "bondy.wamp_tls.tls_opts.cacertfile", [
  {datatype, file},
  {default, "{{platform_etc_dir}}/cacert.pem"}
]}.

A comma separate list of TLS protocol versions that will be supported
At the moment Bondy only supports versions 1.2 and 1.3
{mapping, "wamp.tls.versions", "bondy.wamp_tls.tls_opts.versions", [
  {datatype, string},
  {default, "1.3"}
]}.


{translation, "bondy.wamp_tls.tls_opts.versions",
  fun(Conf) ->
    case cuttlefish:conf_get("wamp.tls.versions", Conf) of
        Value when is_list(Value) ->
          try
            [
              begin
                case string:strip(Version) of
                  "1.2" -> 'tlsv1.2';
                  "1.3" -> 'tlsv1.3';
                  _ -> throw({invalid_version, Version})
                end
              end || Version <- string:split(Value, ",")
            ]
          catch
            throw:{invalid_version, Version} ->
              cuttlefish:invalid("invalid TLS version " ++ Version)
          end;
        _ ->
            cuttlefish:invalid(
              "value should be string containing valid comma separated version numbers e.g. \"1.2, 1.3\""
            )
    end
  end
}.

