---
outline: [2,3]
related:
    - text: Configuring Network Listeners
      type: How-to Guide
      link: /router/guides/administration/configuring_listeners
      description: The common listener tasks worked through, from declaring an inventory to draining a node.
    - text: HTTP Transports
      type: Concept
      link: /router/concepts/http_transports
      description: The WebSocket, SSE and long-poll carriers a listener can serve.
    - text: Upgrading to 1.0.0
      type: How-to Guide
      link: /router/guides/deployment/upgrading_to_1_0_0
      description: Migrating a pre-1.0 configuration file, including the removed listener keys.
    - text: HTTP Security Headers
      type: Configuration Reference
      link: /router/reference/configuration/http_security_headers
      description: The security_headers.* block in detail.
    - text: MCP Gateway Configuration
      type: Configuration Reference
      link: /router/reference/configuration/mcp
      description: The mcp service's per-listener and node-global keys.
---

# Network Listeners Configuration Reference

A **listener** is one socket Bondy binds — a TCP port, a TLS port, or a Unix
domain socket — together with the protocol it speaks and, for HTTP, the set
of services it exposes on that socket. Every listener an operator declares
lives under `listeners.$name.*` in `bondy.conf`, where `$name` is a name of
the operator's choosing, e.g. `listeners.public_http.transport = tcp`.

A node with no `listeners.*` key at all starts three listeners, all
plaintext:

| Name | Transport | Protocol | Port | Services |
|------|-----------|----------|------|----------|
| `admin` | `tcp` | `http` | 18081 | `admin_api, wamp_ws, admin, metrics` (`start_phase = early`) |
| `api_gateway_http` | `tcp` | `http` | 18080 | `api_gateway, wamp_ws, wamp_sse, wamp_longpoll` |
| `wamp_tcp` | `tcp` | `wamp_rawsocket` | 18082 | — |

Declaring even one `listeners.*` key replaces that set: the node then
starts the declared listeners and the reserved
[`admin` listener](#the-reserved-admin-listener), and nothing else. A
template being converted needs every listener it wants restated here, not
just the one being changed.

::: warning The pre-1.0 keys are gone
The per-scheme keys that configured Bondy's fixed listeners —
`admin_api.{http,https}.*`, `api_gateway.{http,https}.*`, `wamp.{tcp,tls}.*`,
`bridge.listener.{tcp,tls}.*` and the global `wamp.{websocket,sse,longpoll}.*`
carrier keys — have been **removed**. Nothing reads them, and a file that
still sets them loses every one of those settings silently. See
[Migrating from the pre-1.0 keys](#migrating-from-the-pre-1-0-keys) below.
:::

**None of the `listeners.$name.*` keys has a schema-supplied default.** A
key you do not set falls back to a built-in default that depends on the
listener's transport and protocol; the values below marked as defaults are
those built-ins, and they are documented here because they are deliberately
not written into the generated `etc/bondy.conf`.

## Identity and mount

Every listener needs `transport`, `protocol` and a bind target (`port` or
`path`); an HTTP listener additionally needs `services`.

```
listeners.public_wamp.transport = tcp
listeners.public_wamp.protocol  = wamp_rawsocket
listeners.public_wamp.port      = 18082
```

@[config](listeners.$name.transport,tcp|tls|uds,,v1.0.0)

The socket driver. TLS is a *transport*, not a protocol: an HTTPS listener
is `protocol = http` with `transport = tls`, not a distinct HTTP variant.

@[config](listeners.$name.protocol,http|wamp_rawsocket|bridge_relay,,v1.0.0)

What frames the wire: `http` (multiplexing several services by path), or a
raw-socket protocol carrying exactly one thing — `wamp_rawsocket` for WAMP
clients, `bridge_relay` for the socket a peer router's bridge connects to.
A protocol Bondy has no handler for is refused at boot, naming the
listener, rather than accepted and crashing at start.

@[config](listeners.$name.port,integer,,v1.0.0)

The bind port, for a `tcp` or `tls` listener. There is no default — a
default would let two listeners collide silently — so every listener must
state one. `port = 0` asks the operating system to choose, which is the
only value two listeners may share.

@[config](listeners.$name.path,file,,v1.0.0)

The socket file path, for a `uds` listener; the `uds` counterpart of
`port`.

@[config](listeners.$name.services,string,,v1.0.0)

A comma-separated list of the services this listener exposes. Required when
`protocol = http` and rejected for every other protocol: a raw socket
carries one thing by construction, so a list of services on one would be
ambiguous. `services` is what lets an HTTP listener multiplex several
things onto one socket — the default `api_gateway_http` listener serves the
API Gateway, WAMP-over-WebSocket, SSE and long-poll all on port 18080.

| Service        | Carrier    | Protocol | Notes |
|----------------|------------|----------|-------|
| `api_gateway`  | `api_gateway` | —     | Stored API Gateway specifications. |
| `admin_api`    | `admin_api` | —       | The built-in Admin API (realms, users, grants). |
| `admin`        | —          | —        | Liveness/readiness endpoints (`/ping`, `/ready`). |
| `metrics`      | —          | —        | Prometheus scrape endpoint. |
| `wamp_ws`      | WebSocket  | WAMP     | |
| `bamp_ws`      | WebSocket  | BAMP     | Mounts `/ws` restricted to the `bamp` subprotocol. BAMP's wire implementation has not shipped, so a session cannot yet be carried over it. |
| `wamp_sse`     | SSE        | WAMP     | |
| `wamp_longpoll`| Long-poll  | WAMP     | |
| `mcp`          | MCP        | MCP      | The [MCP Gateway](/router/concepts/mcp_gateway) endpoint. Mounts `/mcp/realm/:realm` and `/.well-known/oauth-protected-resource/realm/:realm`. Cannot share a listener with `admin_api`. |

**An HTTP listener must declare at least one service.** Both a missing
`services` key and an empty one are refused at boot, naming the listener.
Such a listener would bind its socket and answer 404 to everything, with
nothing reported anywhere. Note that `listeners.<name>.services =` with no
value after it renders as an empty list, so it produces this error rather
than a listener with some default set of services.

A listener can declare several services that share a carrier — `wamp_ws`
and `bamp_ws` both mount on `/ws` — and they resolve to one route carrying
both protocols rather than two routes competing for the same path.
Declaring only one of them restricts that path to that subprotocol: a WAMP
client offering `wamp.2.json` to a `bamp_ws`-only listener is refused with
400.

`admin_api` and `api_gateway` deliberately never share a listener in
Bondy's own defaults: mounting a customer's stored API specification on the
same socket that administers realms and grants would put it one
misconfiguration away from being reachable by the wrong audience. Keep that
split when declaring your own listeners. Declaring `mcp` and `admin_api`
together on one listener is a boot error for the same reason.

Two services on one carrier do not collide, they *shadow*. A path claimed
by two different **carriers** fails the dispatch build with
`route_collision` — but only when both route sets are static. Once either
side comes from an API Gateway specification it cannot: a specification
arrives by replication after boot, so refusing it would take this node's
dispatch table down over a document another node accepted. There the first
route assembled answers the path, the other becomes unreachable on that
listener, and a warning naming the path and host is logged. Bondy's own
route sets are assembled first, so a specification cannot take over `/ws`,
`/ping`, `/ready` or `/metrics`.

@[config](listeners.$name.enabled,on|off,on,v1.0.0)

Whether the listener starts. A disabled listener is fully resolved and kept
in the inventory — turning it on later runs the checks (TLS material
included) that were deferred while it was off.

@[config](listeners.$name.start_phase,early|normal,normal,v1.0.0)

`early` binds the listener as soon as configuration is loaded, before the
storage layer opens. Until the node's services start, an early listener
mounts only the liveness (`/ping`) and readiness (`/ready`) routes, and only
when it declares the `admin` service. Every other route on it, `/metrics`
and `/ws` among them, answers `404` until the node's services start, when
the full route set is mounted. An early listener without the `admin`
service answers `404` to every path until then. The full route set is
mounted before any `normal` listener binds, so the metrics scrape answers
before the node serves WAMP sessions. Reaching `ready` means the normal
phase finished binding, not that no client has connected yet — nothing
gates connection acceptance on the node's readiness status.

| Path | Answers |
|------|---------|
| `/ping` | `204` whenever the listener is bound, including while storage is opening. |
| `/ready` | `204` when the node is ready, `503` otherwise. `GET` only; any other method answers `405`. |

[Answer probes before the node is ready](/router/guides/administration/configuring_listeners#answer-probes-before-the-node-is-ready)
shows which probe uses each path.

### Virtual hosts

An API Gateway specification's `host` field is honoured: a specification
declaring `"host": "api.example.com"` answers only requests carrying that
`Host` header, and `"host": "_"` answers on every host. Two specifications
may declare the same path for different hosts.

Bondy's own paths — `/ws`, the SSE and long-poll endpoints, `/ping`,
`/ready`, `/cluster/topology`, `/metrics` — are served on *every* host,
including one a specification names. That is not automatic in Cowboy: its
router commits to the first host entry whose host matches and never falls
through to a later one, so a route mounted only on the wildcard host would
be unreachable on any named host. Bondy copies its listener-wide routes
into each named host to prevent that. If a specification declares one of
those paths for its own host, the specification's route answers there and a
warning is logged, because one of Bondy's endpoints is then not reachable
on that host.

### Taking a node out of rotation

Two WAMP procedures suspend and resume a phase at runtime, so a node can
leave rotation without a restart or a configuration change:

```
bondy.listener.suspend("normal")
bondy.listener.resume("normal")
```

The argument is a phase — `early`, `normal` or `all` — and both procedures
are callable only from the master realm, because whether this node accepts
connections is not a per-realm decision. Any other value is refused.

Suspending stops a listener accepting *new* connections and leaves
established ones running, which is what makes this a drain: suspend, let
the in-flight sessions finish, and the node has left rotation without
dropping work. Nothing here stops a listener or closes a connection.

Suspending `all` includes the `early` phase, which carries `/ping`,
`/ready` and `/metrics` — an orchestrator watching those will see the node
as dead and may kill it. That is why the shutdown path suspends `normal`
only. Resuming a phase that is already accepting is not an error.

Both procedures take a `dry_run` keyword argument. With `dry_run = true`,
the procedure validates the phase and suspends or resumes nothing. The
result carries `dry_run: true`, the `phase`, the `listeners` that the phase
names, and a `would` sentence that describes the effect. No other procedure
reports listener state, so a dry run is the way to see which listeners a
phase covers before you act on it.

```
bondy.listener.suspend("normal", dry_run=true)
```

### The reserved `admin` listener

`admin` is a name, not a keyword, but it is reserved: the listener manager
always includes one, either the operator's own `listeners.admin.*` block or
its own default (`tcp`, port `18081`, `start_phase = early`, services
`admin_api, wamp_ws, admin, metrics`, bound to loopback). Declaring it
overrides the default in place; an operator does not have to declare it at
all. What cannot be done is disabling or removing it — a node that could
lose its only administrable listener to a configuration mistake would be
harder to recover than one that refuses that mistake outright.

A second, internal listener — a Unix domain socket at
`<platform_runtime_dir>/bondy_admin.sock` — is injected unconditionally and
is not configurable through `bondy.conf` at all. It exists so the node
stays administrable even if every TCP listener fails to bind. Its socket
file is the only access control it has — there is no peer address to filter
on — so Bondy narrows that one file to mode `0600` after binding it, and
refuses to serve on it if that fails. This applies to the internal socket
alone: a `uds` listener an operator declares keeps the mode the process
umask gives it, so a sidecar running under a different uid can reach it.

The socket lives under `platform_runtime_dir`, which is deliberately not
`platform_tmp_dir`: it has to be on a filesystem that supports Unix domain
sockets, and it must not be shared with another node. The defaults satisfy
both. A container image must provide that directory: the node refuses to
boot when the internal socket cannot bind, so an image built from a custom
Dockerfile needs the runtime directory created and owned by the `bondy`
user, the way the official images do.

### UDS listeners

A connection over a Unix domain socket has no network peer to log, embed in
events, or match against an RBAC Source rule. Every listener that binds
over `uds` — the internal admin socket and any operator-declared one —
represents such a connection as loopback, `127.0.0.1`, with port `0`. A
Source rule scoped to `127.0.0.1/32` therefore also matches a client
arriving over a `uds` listener, which is consistent with what the rule
already expresses: a Unix socket is reachable only by local processes, a
subset of what a loopback TCP listener admits.

`bridge_relay` is not available over `uds`: a bridge relay is a network
link between Bondy nodes, and there is no driver for one over a local
socket. `listeners.$name.transport = uds` combined with
`listeners.$name.protocol = bridge_relay` is refused at boot, naming the
listener.

## Bind address and IP version

@[config](listeners.$name.ip,string,,v1.0.0)

Narrows the listener to one interface. Takes an address **literal**, v4 or
v6 — it is parsed while the file is read, so a hostname is refused there
and then.

A listener that sets no `ip` and serves the `admin` or `metrics` service
binds loopback, `127.0.0.1`. Every other listener without an `ip` binds the
wildcard of its family. An explicit `ip` overrides the loopback rule, on
any listener.

@[config](listeners.$name.ip_version,string,,v1.0.0)

`4` or `6`; selects the socket family — the thing that decides whether
Bondy opens an IPv4 or an IPv6 socket.

Apart from that loopback rule, neither key has a default, so a
disagreement between them is always two explicit statements rather than one
of them being supplied for you.

**An address, where one is given, determines the family by itself.** An
address carries its own version and cannot be bound on a socket of the
other one, so `ip_version` decides the family only for a listener that
configures no address — there it chooses which wildcard is bound, `0.0.0.0`
for `4` and `::` for `6`. Where both keys are set and disagree, the address
wins and `ip_version` has no effect: `ip = 127.0.0.1` with
`ip_version = 6` binds IPv4.

**Two listeners may share a port when they bind different addresses.** A
socket is identified by its address and port together, so `10.0.0.1:443`
and `10.0.0.2:443` are two sockets and Bondy starts both — one certificate
per interface on a single port is the case this exists for. A listener that
configures no `ip` binds the wildcard, which covers every address on its
port and so excludes every other listener there; Bondy refuses that at
startup, naming both listeners, rather than letting the second one fail its
bind.

Addresses of different families count as overlapping whenever either is a
wildcard, so `::` and `127.0.0.1` on one port are refused together. Whether
they truly collide depends on the host's `bindv6only` setting, and Bondy
does not consult it — the refusal is deliberately the conservative answer.

## Connection and socket tuning

@[config](listeners.$name.acceptors_pool_size,integer,10,v1.0.0)

The number of acceptor processes for the listener's socket.

@[config](listeners.$name.max_connections,integer,infinity,v1.0.0)

The maximum number of concurrent connections on this listener.

@[config](listeners.$name.backlog,integer,,v1.0.0)

The maximum length that the queue of pending connections can grow to.
Unset, the OS default applies.

@[config](listeners.$name.keepalive,on|off,,v1.0.0)

Enables periodic TCP-level keepalive transmission on a connected socket
when no other data is exchanged.

@[config](listeners.$name.nodelay,on|off,,v1.0.0)

Turns on `TCP_NODELAY`, so small amounts of data are sent immediately.

@[config](listeners.$name.reuseport,on|off,off,v1.0.0)

Sets `SO_REUSEPORT` on the listening socket.

@[config](listeners.$name.sndbuf,bytesize,,v1.0.0)

The minimum size of the socket's kernel send buffer.

@[config](listeners.$name.recbuf,bytesize,,v1.0.0)

The minimum size of the socket's kernel receive buffer.

@[config](listeners.$name.buffer,bytesize,,v1.0.0)

The size of the user-level software buffer used by the driver — not to be
confused with `sndbuf` and `recbuf`, which are the kernel buffers. It is
recommended to keep `buffer >= max(sndbuf, recbuf)` to avoid unnecessary
copying; the driver raises it to that maximum automatically when `sndbuf`
or `recbuf` are set.

@[config](listeners.$name.handshake_timeout,duration,,v1.0.0)

How long a `tls` listener allows the TLS handshake to take.

@[config](listeners.$name.hibernate,never|idle|always,,v1.0.0)

When a raw-socket connection process hibernates to reclaim memory.

@[config](listeners.$name.server_header,string,,v1.0.0)

Overrides the value of the `server` header an HTTP listener sends.

@[config](listeners.$name.auth_timeout,duration|infinity,5s,v1.0.0)

`bridge_relay` listeners only: how long a connected peer router has to
authenticate before the connection is dropped. Other protocols ignore it.

### Proxy protocol and forwarded headers {#trusted-proxies}

These keys decide the source IP that Bondy logs, rate-limits by and matches
against RBAC Source rules. When `proxy_protocol` is off, the source IP is
the socket peer.

```
listeners.public_http.proxy_protocol                 = on
listeners.public_http.proxy_protocol.mode            = strict
listeners.public_http.proxy_protocol.trusted_proxies = 10.0.0.0/8, 192.168.1.10/32
```

@[config](listeners.$name.proxy_protocol,on|off,off,v1.0.0)

The meaning depends on the listener's protocol:

- On a `wamp_rawsocket` or `bridge_relay` listener, Bondy reads a PROXY
  protocol header from each connection and takes the source address from
  it. Bondy waits up to 15 seconds for the header. `trusted_proxies` is not
  consulted.
- On an `http` listener, Bondy reads the forwarding headers instead, and
  believes them only when the socket peer is inside one of the
  `trusted_proxies` ranges.

@[config](listeners.$name.proxy_protocol.mode,strict|relaxed,relaxed,v1.0.0)

The mode decides what Bondy does when it cannot establish a source
address. On an HTTP listener, that happens when the headers of a trusted
peer yield no address. On a raw socket, it happens when the PROXY header is
missing or malformed. `relaxed` falls back to the socket peer. `strict`
refuses the connection or the request. The API Gateway
answers a refused request with `403` and `bondy.error.proxy_protocol_error`.

@[config](listeners.$name.proxy_protocol.trusted_proxies,string,,v1.0.0)

A comma-separated list of CIDR ranges, e.g. `10.0.0.0/8, 172.16.0.0/12`.
It applies to `http` listeners only. The default is **empty**: no proxy is trusted, so
with `proxy_protocol = on` and no `trusted_proxies` every peer is untrusted
and the source IP is the socket peer. When an untrusted peer sends
forwarding headers, Bondy ignores them and logs a warning. An IPv4 range
never matches an IPv6 peer. When an entry is not a valid CIDR range, the
node does not start and reports `{invalid_trusted_proxies, Entries}`, so a
typo cannot leave a proxy untrusted without notice.

From a trusted peer, Bondy tries the headers in this order, and the first
that yields an address wins:

1. `Forwarded` — the `for=` values.
2. `X-Forwarded-For`.
3. `X-Real-IP`.

For the first two, Bondy reads the chain from the right and takes the first
address that is *not* inside a trusted range. A client behind a trusted
proxy therefore cannot shift its apparent source IP by prepending hops of
its own. Bondy skips a chain entry that is not an IP address.

### Keepalive and idle timeouts (raw-socket protocols)

`idle_timeout` and the `ping.*` block apply to `wamp_rawsocket` and
`bridge_relay` listeners; an HTTP listener ignores them — a WebSocket
connection's keepalive is configured under its carrier
(`listeners.$name.websocket.ping.*`), and Cowboy owns the idle timeout for
a plain request.

@[config](listeners.$name.idle_timeout,duration|infinity,8h,v1.0.0)

The reap deadline: how long a connection may be silent before Bondy closes
it. Only data from the peer restarts this timer, and a pong counts as data,
so Bondy never reaps a peer that answers probes.

@[config](listeners.$name.ping.enabled,on|off,on,v1.0.0)

Whether Bondy probes a silent connection with protocol-level PING messages.
This affects server-initiated pings only; Bondy always answers a client's
pings regardless.

@[config](listeners.$name.ping.idle_timeout,duration,20s,v1.0.0)

How long a connection may be silent before Bondy *probes* it. This is a
different and much shorter thing than the listener's `idle_timeout`, and
keeping them apart is the point: a probe is only useful if it comes due
well before the reap, and a keepalive whose interval equalled the reap
deadline could neither hold a NAT binding open nor detect a dead peer any
sooner than the reap already did.

@[config](listeners.$name.ping.timeout,duration,10s,v1.0.0)

How long a probe waits for its answer before counting as a failed attempt.

@[config](listeners.$name.ping.max_attempts,integer,3,v1.0.0)

How many unanswered probes mean a dead peer. A peer that stops responding
is dropped after `ping.idle_timeout + max_attempts × ping.timeout`. The
transport does not change that judgement: `tcp` and `tls` listeners take
the same defaults, and the WebSocket carrier's own ping defaults are the
same numbers, so `max_attempts` means one thing across every protocol.

### `linger.timeout` is in seconds

@[config](listeners.$name.linger.timeout,duration|integer,1s,v1.0.0)

How long `close` blocks waiting for unsent data to be acknowledged, on a
raw-socket or bridge-relay listener. It is the one duration in `bondy.conf`
expressed in **seconds** rather than milliseconds, because the value
becomes the OS socket option `{linger, {true, N}}` and that component is
seconds. A value written as a bare integer also means seconds. A sub-second
value rounds **up** to one second: `{linger, {true, 0}}` does not mean
"linger briefly", it means abort the connection on close and discard
whatever is unsent, so rounding down would silently turn a graceful close
into a reset.

`-1` disables lingering, which is the OS default behaviour — `close`
returns immediately and the kernel finishes sending in the background. `0`
requests the abort described above.

`listeners.$name.http.linger.timeout` is a **different setting**: it is
Cowboy's, it governs how long the HTTP server waits before closing to avoid
the TCP reset problem in RFC 7230 §6.6, and it is in milliseconds. The two
are unrelated despite the near-identical spelling.

## HTTP protocol options

For an HTTP listener, protocol-level settings — timeouts, header limits,
the dynamic receive buffer — carry an `http.` prefix
(`listeners.$name.http.idle_timeout`, not `listeners.$name.idle_timeout`),
because the bare name already means something different on a raw socket and
a setting whose meaning depended on a sibling `protocol` value would be
worse than a longer one. They apply to everything the listener serves,
whichever services are mounted on it.

@[config](listeners.$name.http.versions,string,,v1.0.0)

A comma separated, priority ordered list of the HTTP protocol versions the
listener offers; the default is `2, 1.1`. On a TLS listener the order is
the server's ALPN preference; HTTP/2 is served only to a client that
negotiates `h2` via ALPN (RFC 7540 requires that), so a client that
negotiates `http/1.1` or sends no ALPN is served HTTP/1.1 whenever `1.1`
is listed. On a plaintext listener, listing `2` enables the HTTP/2
prior-knowledge and Upgrade paths. Set `1.1` alone to switch HTTP/2 off for
a listener.

@[config](listeners.$name.http.idle_timeout,duration,15s,v1.0.0)

How long a connection with no incoming traffic is kept before Cowboy closes
it. On a listener serving held streams the default changes — see
[Held streams](#held-streams-and-the-connection-idle-timeout).

@[config](listeners.$name.http.reset_idle_timeout_on_send,on|off,off,v1.0.0)

Whether data *sent* by the server also resets the idle timer (received
bytes always do). On a listener serving held streams the default changes —
see [Held streams](#held-streams-and-the-connection-idle-timeout).

@[config](listeners.$name.http.inactivity_timeout,duration,,v1.0.0)

@[config](listeners.$name.http.request_timeout,duration,,v1.0.0)

How long to wait for a request to arrive on a keep-alive connection.

@[config](listeners.$name.http.active_n,integer,100,v1.0.0)

The number of packets requested from the socket at once.

@[config](listeners.$name.http.buffer.min,bytesize,,v1.0.0)

@[config](listeners.$name.http.buffer.max,bytesize,,v1.0.0)

The bounds between which Cowboy resizes a connection's socket receive
buffer. Bondy checks these rules at boot:

- Set both keys or neither. One without the other refuses the boot.
- Each value is within 1KB..128KB, and `min` is at most `max`.
- Either key set to `0` disables dynamic buffering for the listener,
  whatever the other key is.

Unset, Cowboy's own default applies: an adaptive buffer between 512 bytes
and 128KB, unless the socket [`buffer`](#listeners.$name.buffer) size is
set, in which case there is no dynamic buffering. A WebSocket connection
uses the buffer of the listener it arrived on; there is no
WebSocket-specific buffer setting.

@[config](listeners.$name.http.linger.timeout,duration,,v1.0.0)

Cowboy's linger timeout, in milliseconds — see the note under the
raw-socket [`linger.timeout`](#listeners.$name.linger.timeout).

@[config](listeners.$name.http.max_concurrent_streams,integer,,v1.0.0)

Maximum number of concurrent streams (in-flight requests) a single HTTP/2
client connection may have open. Bondy sets no default: unset, Cowboy
advertises `100`.

One HTTP/2 connection carries many requests. Anything that counts
connections — `max_connections`, a connection-count alarm, a load
balancer's connection metric — therefore undercounts the request load of an
HTTP/2 client by up to a factor of `max_concurrent_streams`.

Cowboy also caps, per connection, the rate of received frames, of stream
resets and of cancelled streams. Bondy neither sets nor exposes these caps,
so Cowboy's defaults apply:

| Cap | Cowboy default |
|-----|----------------|
| Received frames | 10000 per 10s |
| Stream resets | 10 per 10s |
| Cancelled streams | 500 per 10s |

@[config](listeners.$name.http.initial_stream_flow_size,bytesize,,v1.0.0)

The amount of HTTP/2 flow-control credit a new stream starts with.

@[config](listeners.$name.http.max_authority_length,integer,,v1.0.0)

Maximum length, in bytes, of the request authority (`Host` or
`:authority`). Unset, Cowboy applies `255`. Over the limit, HTTP/1.1
answers `414` and HTTP/2 resets the stream.

@[config](listeners.$name.http.max_authorization_header_value_length,integer,,v1.0.0)

Maximum length of the `Authorization` header value, in bytes, independent
of the general header-value limit — Authorization headers routinely carry
bearer tokens (JWTs) larger than typical header values. Unset,
`max_header_value_length` applies to it. Cowboy enforces it on HTTP/1.1 and
answers `431`.

@[config](listeners.$name.http.max_cookie_header_value_length,integer,,v1.0.0)

Maximum **size**, in bytes, of the `Cookie` header value, independent of
the general header-value limit. Unset, `max_header_value_length` applies to
it. Cowboy enforces it on HTTP/1.1 and answers `431`.

@[config](listeners.$name.http.max_cookies,integer,100,v1.0.0)

Maximum **number** of cookies parsed out of the `Cookie` header. The two
cookie limits are not interchangeable: a single header of legal length can
still hold thousands of tiny cookies, and it is the count that decides how
much parsing one request can cost. Both matter on the endpoints that read
cookies — the OIDC flow, the ticket and CSRF cookies, and the SSE and
long-poll carriers. A request over `max_cookies` is answered with a 400.

One endpoint is an exception to the count limit. An API Gateway
`/oidc/verify` endpoint treats a request over `max_cookies` as carrying no
cookies at all, the same as a malformed `Cookie` header, and does not refuse
it. Its credential can then come only from a bearer token or the
`x-bondy-ticket` header, so an over-limit request without one is
unauthenticated rather than rejected.

@[config](listeners.$name.http.max_empty_lines,integer,,v1.0.0)

@[config](listeners.$name.http.max_header_name_length,integer,,v1.0.0)

@[config](listeners.$name.http.max_header_value_length,integer,,v1.0.0)

@[config](listeners.$name.http.max_headers,integer,,v1.0.0)

@[config](listeners.$name.http.max_keepalive,integer,,v1.0.0)

The maximum number of requests served on one keep-alive connection.

@[config](listeners.$name.http.max_method_length,integer,,v1.0.0)

@[config](listeners.$name.http.max_request_line_length,integer,,v1.0.0)

@[config](listeners.$name.http.max_skip_body_length,integer,,v1.0.0)

@[config](listeners.$name.http.invalid_response_headers,error_terminate|ignore,error_terminate,v1.0.0)

What to do with a response whose header values contain a CR or LF.
`error_terminate` terminates the stream instead of sending the response,
which prevents header injection and response splitting. `ignore` sends the
response unchanged. Keep the default unless a legacy upstream behind the
API Gateway requires relaying such headers.

@[config](listeners.$name.http.sendfile,on|off,,v1.0.0)

Whether the `sendfile` syscall may be used.

### Fixed request limits and validation

A query string or an `application/x-www-form-urlencoded` body carries at
most 100 fields. A request with more is refused. The limit is Cowboy's
default and Bondy does not expose it.

Bondy inherits these checks from Cowboy. They are not configurable:

- **Fragments.** An HTTP/1.1 request-target that contains a fragment
  (`#…`) is rejected with `400` (RFC 9110 §4.1).
- **Authority and `Host` agree.** An HTTP/1.1 request whose absolute-form
  authority differs from its `Host` header is rejected with `400`. An
  HTTP/2 request whose `host` header differs from its `:authority` has its
  stream reset (RFC 9113 §8.3.1).
- **Pipelining.** Cowboy reads pipelined HTTP/1.1 requests one at a time:
  it does not parse the next request on a connection until the current
  stream has finished.

### Held streams and the connection idle timeout

On a listener whose services include `wamp_sse`, `wamp_longpoll` or `mcp`,
the defaults for `http.idle_timeout` and `http.reset_idle_timeout_on_send`
change: the idle timeout is taken from the largest held-stream
`idle_timeout` in play (10m if unstated) and reset-on-send is switched on,
so a stream that is sending — events, keepalives, poll replies — keeps its
connection alive, and a fully quiet one is closed after the carrier's idle
timeout. This applies to every service sharing that listener: idle
keep-alive API connections on a mixed listener are retained for the same
window. An explicit `http.idle_timeout` or `http.reset_idle_timeout_on_send`
on the listener overrides both. The behaviour is identical over HTTP/1.1
and HTTP/2.

## CORS

The `cors.*` block is per-listener and meaningful only for
`protocol = http`. A listener that sets none of it does **not** come up
closed: the settings it did not state are taken from Bondy's own defaults —
`enabled = on`, `allowed_origins = *` — so declaring a listener with no
`cors.*` emits **wildcard CORS**, not none. The defaults fill in per key:
restricting `allowed_origins` leaves `allowed_methods` and
`allowed_headers` at their defaults unless those are stated too. There is
no global block to inherit from, so an HTTPS listener that has to restrict
CORS origins to an allowlist needs that allowlist stated here; without it
the listener is open to any origin.

@[config](listeners.$name.cors.enabled,on|off,on,v1.0.0)

@[config](listeners.$name.cors.allowed_origins,string,*,v1.0.0)

@[config](listeners.$name.cors.allowed_methods,string,,v1.0.0)

@[config](listeners.$name.cors.allowed_headers,string,,v1.0.0)

@[config](listeners.$name.cors.max_age,integer,,v1.0.0)

## Security headers

Per-listener, HTTP only; documented in detail in the
[HTTP Security Headers](/router/reference/configuration/http_security_headers)
reference. Defaults fill in per key: unset, the listener sends `SAMEORIGIN`
and `nosniff`, and a TLS listener additionally sends HSTS.

@[config](listeners.$name.security_headers.enabled,on|off,on,v1.0.0)

The all-or-nothing switch: `off` drops every security header.

@[config](listeners.$name.security_headers.hsts,off|string,,v1.0.0)

@[config](listeners.$name.security_headers.frame_options,off|string,SAMEORIGIN,v1.0.0)

@[config](listeners.$name.security_headers.content_type_options,off|string,nosniff,v1.0.0)

@[config](listeners.$name.security_headers.content_security_policy,off|string,,v1.0.0)

**To drop one security header, give it the value `off`.**

```
listeners.public_http.security_headers.hsts = off
```

That suppresses just that header and leaves the rest, including the default
HSTS a TLS listener would otherwise send. `off` is the only word treated
this way — every other value is the header's content, so
`frame_options = office` sends `office`. Note there is no "empty value"
spelling: `security_headers.hsts =` with nothing after it is a *syntax
error* in `bondy.conf`, not an empty setting.

## Rate limiting

Per-listener budgets for the same token-bucket classes as the node-wide
[`security.rate_limit.*`](/router/reference/configuration/security#rate-limiting)
keys. A request is admitted only when the node scope, this listener's scope
and — where the request addresses one — the realm's own budgets **all**
admit it, so a listener budget can only narrow what the node allows. The
model is described in
[Understanding Load Regulation and Rate Limiting](/router/guides/administration/load_regulation_and_rate_limiting#rate-limiting-inbound-traffic).

These keys have **no defaults**: a class block's presence enables that
class's budget on this listener (independently of the node-scope master
switch), and each budget requires both its `rate` (tokens per second) and
`capacity` (burst size). The `enabled` key exists to park a configured
budget without deleting its numbers. The checks are cheap enough to leave
enabled everywhere — one lock-free atomic operation per configured scope
per message, with no measurable effect on throughput or latency; see
[Checking is cheap — refusing is not](/router/guides/administration/load_regulation_and_rate_limiting#scopes-node-listener-realm).

```
listeners.public_ws.rate_limit.connection.rate = 30
listeners.public_ws.rate_limit.connection.capacity = 60
```

@[config](listeners.$name.rate_limit.connection.enabled,on|off,,v1.0.0)

@[config](listeners.$name.rate_limit.connection.rate,integer,,v1.0.0)

Maximum sustained new-connection rate per source IP on this listener, in
connections per second.

@[config](listeners.$name.rate_limit.connection.capacity,integer,,v1.0.0)

@[config](listeners.$name.rate_limit.handshake.enabled,on|off,,v1.0.0)

@[config](listeners.$name.rate_limit.handshake.rate,integer,,v1.0.0)

Maximum sustained WAMP `HELLO` rate per source IP on this listener, per
second.

@[config](listeners.$name.rate_limit.handshake.capacity,integer,,v1.0.0)

@[config](listeners.$name.rate_limit.auth.enabled,on|off,,v1.0.0)

@[config](listeners.$name.rate_limit.auth.rate,integer,,v1.0.0)

Maximum sustained authentication-attempt rate per source IP on this
listener, per second.

@[config](listeners.$name.rate_limit.auth.capacity,integer,,v1.0.0)

@[config](listeners.$name.rate_limit.http.enabled,on|off,,v1.0.0)

@[config](listeners.$name.rate_limit.http.rate,integer,,v1.0.0)

Maximum sustained HTTP request rate per source IP on this listener, in
requests per second (requests, not connections). Throttled requests answer
`429` with a `retry-after` header.

@[config](listeners.$name.rate_limit.http.capacity,integer,,v1.0.0)

@[config](listeners.$name.rate_limit.message.enabled,on|off,,v1.0.0)

@[config](listeners.$name.rate_limit.message.rate,integer,,v1.0.0)

Maximum sustained WAMP message rate (`CALL`/`PUBLISH`/`SUBSCRIBE`/`REGISTER`)
per session established through this listener, in messages per second. The
budget is resolved once at session open, like the node-scope message class.

@[config](listeners.$name.rate_limit.message.capacity,integer,,v1.0.0)

## Carrier settings

`websocket.*`, `sse.*`, `longpoll.*` and `mcp.*` configure the connections
a listener serves — one connection style each; the listener's HTTP itself
is the `http.*` block above. They belong to the listener the connection
arrived on: setting one on `listeners.public_http` says nothing about
`listeners.admin`, and there is **no global block** covering all listeners
at once. A setting stated on the listener wins **key by key**, not block by
block: a listener that sets only `websocket.ping.idle_timeout` keeps the
defaults for `ping.enabled`, `ping.timeout` and `ping.max_attempts`.

The `mcp.*` carrier keys are documented in the
[MCP Gateway Configuration Reference](/router/reference/configuration/mcp).

### WebSocket

@[config](listeners.$name.websocket.ping.enabled,on|off,on,v1.0.0)

Whether Bondy probes a silent WebSocket connection with PING control
frames. Server-initiated pings only; Bondy always answers a client's pings
regardless. Note that web browsers typically do not initiate WebSocket
pings and kill quiet connections, which is why this is on by default.

@[config](listeners.$name.websocket.ping.idle_timeout,duration,20s,v1.0.0)

How long the connection may be silent before Bondy probes it.

@[config](listeners.$name.websocket.ping.timeout,duration,10s,v1.0.0)

How long a probe waits for its answer before counting as a failed attempt.

@[config](listeners.$name.websocket.ping.max_attempts,integer,3,v1.0.0)

How many unanswered probes mean a dead peer.

@[config](listeners.$name.websocket.idle_timeout,duration|infinity,8h,v1.0.0)

Drops the connection after this period of inactivity.

@[config](listeners.$name.websocket.max_frame_size,bytesize,4MB,v1.0.0)

Maximum frame size accepted. The connection is closed when a client
attempts to send a frame over this limit; for fragmented frames it applies
to the reconstituted frame.

@[config](listeners.$name.websocket.hibernate,never|idle|always,idle,v1.0.0)

When the connection process hibernates: `idle` hibernates between periods
of activity, `always` after every message, `never` not at all.

@[config](listeners.$name.websocket.compression_enabled,on|off,off,v1.0.0)

Whether WebSocket compression (the permessage-deflate extension) is
negotiated with supporting clients. The `deflate.*` block only takes effect
when this is on.

@[config](listeners.$name.websocket.deflate.level,0..9,5,v1.0.0)

Compression level: 0 gives no compression, 1 best speed, 9 best
compression.

@[config](listeners.$name.websocket.deflate.mem_level,1..9,8,v1.0.0)

How much memory is allocated for the internal compression state: 1 uses
minimum memory but is slow and reduces the compression ratio, 9 uses
maximum memory for optimal speed.

@[config](listeners.$name.websocket.deflate.strategy,enum,default,v1.0.0)

Tunes the compression algorithm: `default` for normal data, `filtered` for
data produced by a filter or predictor, `huffman_only` to force Huffman
encoding only, `rle` to limit match distances to one (run-length encoding).
Strategy affects only the compression ratio, not the correctness of the
output.

@[config](listeners.$name.websocket.deflate.server_context_takeover,takeover|no_takeover,takeover,v1.0.0)

@[config](listeners.$name.websocket.deflate.client_context_takeover,takeover|no_takeover,takeover,v1.0.0)

Using `no_takeover` can severely limit the usefulness of compression.

@[config](listeners.$name.websocket.deflate.server_max_window_bits,8..15,11,v1.0.0)

@[config](listeners.$name.websocket.deflate.client_max_window_bits,8..15,11,v1.0.0)

The base-two logarithm of the compression window size. Larger values give
better compression at the expense of memory.

### SSE

@[config](listeners.$name.sse.ping.enabled,on|off,on,v1.0.0)

Whether the SSE stream carries periodic keepalive comments.

@[config](listeners.$name.sse.ping.interval,duration,20s,v1.0.0)

How often the stream sends a `: keepalive` comment while
`sse.ping.enabled` is on.

@[config](listeners.$name.sse.idle_timeout,duration,10m,v1.0.0)

How long a fully quiet SSE stream is kept. Feeds the listener's
**connection** idle-timeout default — see
[Held streams](#held-streams-and-the-connection-idle-timeout).

### Long-poll

@[config](listeners.$name.longpoll.poll_timeout,duration,30s,v1.0.0)

How long a poll request is held open waiting for messages. Must stay
strictly below `longpoll.idle_timeout`, or the connection can be torn down
for inactivity before the long-poll reply is sent.

@[config](listeners.$name.longpoll.idle_timeout,duration,10m,v1.0.0)

How long an idle connection between polls is kept. Feeds the listener's
**connection** idle-timeout default — see
[Held streams](#held-streams-and-the-connection-idle-timeout).

## TLS material

A `tls`-transport listener needs a certificate and key, and is checked for
them at boot. The check applies only to a listener that will start:
`enabled = off` skips it, so you can declare a TLS listener and provision
its certificate later. The check is deferred, not dropped — turning it on
runs it, and a listener that is still missing its certificate is refused
then. That refusal fails the **whole** boot, not just that listener: the
inventory is resolved as a unit, so one unusable entry stops every other
listener starting too.

The `tls.*` block is the only place a listener's certificate is read from —
the reserved `admin` listener can be given one here directly, like any
other.

@[config](listeners.$name.tls.certfile,file,,v1.0.0)

The PEM certificate (or chain) file.

@[config](listeners.$name.tls.keyfile,file,,v1.0.0)

The PEM private key file.

@[config](listeners.$name.tls.cacertfile,file,,v1.0.0)

The CA certificate file, needed when requesting client certificates.

@[config](listeners.$name.tls.versions,string,,v1.0.0)

Comma-separated TLS protocol versions, of `1.2` and `1.3`.

@[config](listeners.$name.tls.verify,verify_peer|verify_none,,v1.0.0)

For mTLS, `verify_peer` on its own only *requests* a client certificate — a
client presenting none still connects. Requiring one takes
`fail_if_no_peer_cert` too:

```
listeners.public_wamp_tls.tls.verify               = verify_peer
listeners.public_wamp_tls.tls.cacertfile           = /path/to/cacert.pem
listeners.public_wamp_tls.tls.fail_if_no_peer_cert = on
```

@[config](listeners.$name.tls.fail_if_no_peer_cert,on|off,off,v1.0.0)

Bondy sets neither `supported_groups` nor `signature_algs` on a listener, so
the key-exchange groups and signature algorithms on offer are the OTP `ssl`
defaults for the negotiated TLS version.

## Boot-time validation

Bondy resolves the listener inventory as a unit at boot. It logs the first
invalid entry as `Invalid listener configuration`, with reason
`{invalid_listener, Name, Reason}`, and the node does not start: one bad
listener refuses the whole node, not just itself. `Reason` is one of:

| Reason | Cause |
|--------|-------|
| `{missing, transport}`, `{missing, protocol}` | The key is absent. |
| `{unknown_transport, T}` | `transport` is not `tcp`, `tls` or `uds`. |
| `{unknown_protocol, P}` | `protocol` is not `http`, `wamp_rawsocket` or `bridge_relay`. |
| `{unsupported_combination, uds, bridge_relay}` | A bridge relay over a Unix domain socket. |
| `{missing, port}`, `{missing, path}` | No bind target: `path` for `uds`, `port` otherwise. |
| `duplicate_name` | Two listeners share a name. |
| `{port_in_use_by, Other}`, `{path_in_use_by, Other}` | The bind target overlaps the bind target of listener `Other`. See [Bind address and IP version](#bind-address-and-ip-version). |
| `{invalid_ip, Ip}`, `{unresolvable_ip, Ip, Reason}` | `ip` is not a valid address. Only an inventory in `sys.config`, which can name a host, reaches the second. |
| `{invalid_trusted_proxies, Entries}` | `proxy_protocol.trusted_proxies` holds entries that are not valid CIDR ranges. |
| `{missing, services}` | An `http` listener with no `services`, or an empty list. |
| `{services_not_supported, P}` | `services` on a `wamp_rawsocket` or `bridge_relay` listener. |
| `{unknown_service, S}` | `S` is not a service this node knows. |
| `{unknown_carrier, Carrier, Service}` | An extension registered `Service` with a carrier that no module serves. |
| `{incompatible_services, mcp, admin_api}` | One listener declares both. |
| `{missing, [tls, certfile]}`, `{missing, [tls, keyfile]}` | A `tls` listener without its certificate or key. |
| `{tls_not_supported, T}` | A `tls.*` key on a `tcp` or `uds` listener. |
| `reserved_name` | The name is `admin_local`, which the node injects itself. |
| `reserved_cannot_be_disabled` | `listeners.admin.enabled = off`. |
| `{invalid_ping_enabled, Label, V}`, `{incomplete_ping, Label, Keys}` | A malformed `ping` block. Only `sys.config` can express one; `bondy.conf` cannot. |

A listener with `enabled = off` skips the TLS checks, as
[TLS material](#tls-material) describes. Every other check applies to a
disabled listener too.

## Migrating from the pre-1.0 keys

The per-scheme keys that configured Bondy's fixed listeners **have been
removed**. Nothing reads them: a file that still sets them loses every one
of those settings silently, because an unknown key is dropped rather than
refused. The global carrier keys `wamp.websocket.*`, `wamp.sse.*` and
`wamp.longpoll.*` are removed for the same reason; a single global key
covered every listener at once, so moving one means choosing **which**
listeners it applies to — restate it under
`listeners.<name>.<carrier>.*` for each listener that serves the carrier,
or drop it if it only restated the default (the defaults are unchanged).

@[configDeprecated](admin_api.http.*,listeners.admin.*,v1.0.0)

@[configDeprecated](admin_api.https.*,listeners.admin_api_https.*,v1.0.0)

@[configDeprecated](api_gateway.http.*,listeners.api_gateway_http.*,v1.0.0)

@[configDeprecated](api_gateway.https.*,listeners.api_gateway_https.*,v1.0.0)

@[configDeprecated](wamp.tcp.*,listeners.wamp_tcp.*,v1.0.0)

@[configDeprecated](wamp.tls.*,listeners.wamp_tls.*,v1.0.0)

@[configDeprecated](bridge.listener.tcp.*,listeners.bridge_relay_tcp.*,v1.0.0)

@[configDeprecated](bridge.listener.tls.*,listeners.bridge_relay_tls.*,v1.0.0)

@[configDeprecated](wamp.websocket.*,listeners.$name.websocket.*,v1.0.0)

@[configDeprecated](wamp.sse.*,listeners.$name.sse.*,v1.0.0)

@[configDeprecated](wamp.longpoll.*,listeners.$name.longpoll.*,v1.0.0)

Only the first rename is forced: `admin` is the reserved name for the
administrable listener — the manager always provides one, so declaring the
same listener under any other name gives you two listeners competing for
one port. The other names are the ones
`scripts/migrate_conf.escript` (shipped with the Bondy source) rewrites to;
it reports every affected key and listener, and also catches the two
mistakes a hand migration makes:

- A listener you do not declare **does not exist**. A file with no
  `listeners.*` key at all starts the three built-in defaults (`admin`,
  `api_gateway_http`, `wamp_tcp`) and nothing else — every TLS listener
  and every bridge-relay listener is gone.
- Renaming the option keys is not enough. A `listeners.<name>.*` block
  that carries options but no `transport`, `protocol` and bind target is
  refused at boot with `{invalid_listener, <name>, {missing, transport}}`,
  which aborts the whole node rather than skipping that listener.

The tails move too, and three groups do not keep their spelling:

- TLS material (`certfile`, `keyfile`, `cacertfile`, `versions`, `verify`,
  `fail_if_no_peer_cert`) moves under `listeners.<name>.tls.*`.
- Cowboy protocol options on an HTTP listener (`idle_timeout`,
  `max_headers`, `active_n`, `linger.timeout` and the rest) move under
  `listeners.<name>.http.*`. Note that `idle_timeout` and `linger.timeout`
  exist in both places: on an HTTP listener they are Cowboy's, on a
  raw-socket or bridge-relay listener they are the listener's own and stay
  at the top level.
- `bridge.listener.<t>` alone was that listener's `enabled` flag, and
  `bridge.listener.<t>.ping` alone was `ping.enabled`.

Two keys have no destination: `bridge.listener.{tcp,tls}.max_frame_size`
was never read by anything, and `admin_api.*.dynamic_buffer.*` was the
internal name of `buffer.min`/`buffer.max`.

Some keys change name as they move, and some have no destination.
`scripts/migrate_conf.escript` applies the same table:

| Key | Destination |
|-----|-------------|
| `wamp.websocket.ping.interval` | `listeners.<name>.websocket.ping.idle_timeout` |
| `wamp.websocket.ping.max_retries` | `listeners.<name>.websocket.ping.max_attempts` |
| `wamp.websocket.buffer.min`, `.max` | None. A WebSocket connection uses the buffer of its listener; set `listeners.<name>.http.buffer.min` and `.max`. |
| `wamp.sse.reset_idle_timeout_on_send`, `wamp.longpoll.reset_idle_timeout_on_send` | None. The working control is `listeners.<name>.http.reset_idle_timeout_on_send`, which covers every service on the listener. |
| `wamp.transport_queue.transport_ttl` | [`wamp.http_transport.idle_timeout`](/router/reference/configuration/wamp#wamp.http_transport.idle_timeout) |
| `wamp.transport_queue.overflow_strategy` | None. Eviction of the oldest entry is the only policy. |
| `wamp.transport_queue.*` (the rest) | `wamp.http_transport.queue.*` |

On the keys of a raw-socket or bridge-relay listener, `ping.interval`
becomes `ping.idle_timeout` and `ping.max_retries` becomes
`ping.max_attempts`.

`listeners.$name.ip` takes a literal address, while the removed `*.ip`
keys accepted any resolvable hostname. An inventory supplied through
`sys.config` is still resolved by name.
