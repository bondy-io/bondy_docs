---
outline: [2,3]
related:
    - text: Network Listeners Configuration Reference
      type: Configuration Reference
      link: /router/reference/configuration/listeners
      description: Every listeners.$name.* key, with types, defaults and the migration table.
    - text: Load Regulation and Rate Limiting
      type: Guide
      link: /router/guides/administration/load_regulation_and_rate_limiting
      description: The rate-limit classes and scopes a per-listener budget participates in.
    - text: Configuring CORS & HTTP Security Headers
      type: Guide
      link: /router/guides/security/configuring_cors
      description: The per-listener cors.* and security_headers.* blocks in practice.
    - text: Exposing an MCP Endpoint
      type: Guide
      link: /router/guides/administration/exposing_an_mcp_endpoint
      description: A worked example of a dedicated listener serving one service.
---

# Configuring Network Listeners

Every socket Bondy binds is a **listener**: a name of your choosing, a
transport (`tcp`, `tls` or `uds`), a protocol, and — for HTTP — the set of
services multiplexed onto it. This guide walks through the tasks an
operator actually performs with them: declaring an inventory, terminating
TLS, splitting audiences across sockets, budgeting an exposed listener,
and draining a node. Every key used here is specified in the
[configuration reference](/router/reference/configuration/listeners); this
guide shows how the pieces are meant to be combined.

## Before you declare anything

Two rules shape everything below.

**Declaring one listener declares them all.** A node with no `listeners.*`
key starts three built-in listeners. The moment your `bondy.conf` contains
even one `listeners.*` key, that file *is* the inventory — a listener you
do not restate does not exist. Converting a deployment therefore starts by
restating what you rely on, not by adding the one listener you came for.

**The inventory resolves as a unit.** One invalid listener — a missing
`transport`, a TLS listener without its certificate, two listeners
claiming one address and port — fails the whole boot, naming the listener,
rather than starting everything else without it. A configuration mistake
surfaces at boot on the machine you are editing, not as a missing socket
discovered from the outside later.

## Declare the inventory

This inventory is exactly what an undeclared node runs, written out:

```
listeners.admin.transport            = tcp
listeners.admin.protocol             = http
listeners.admin.port                 = 18081
listeners.admin.start_phase          = early
listeners.admin.services             = admin_api, wamp_ws, admin, metrics

listeners.api_gateway_http.transport = tcp
listeners.api_gateway_http.protocol  = http
listeners.api_gateway_http.port      = 18080
listeners.api_gateway_http.services  = api_gateway, wamp_ws, wamp_sse, wamp_longpoll

listeners.wamp_tcp.transport         = tcp
listeners.wamp_tcp.protocol          = wamp_rawsocket
listeners.wamp_tcp.port              = 18082
```

Start from this and edit, and the two rules above cannot bite you. Note
what each listener needs: `transport`, `protocol` and a bind target
(`port`, or `path` for `uds`) always; `services` exactly when
`protocol = http`. Everything else has a built-in default.

`admin` is a reserved name: the node injects this listener if you leave it
out, and refuses to let you disable it — you may override its settings,
not remove your only administrable endpoint. It binds loopback by default;
leave it that way unless you have a reason not to, and prefer reaching it
through a tunnel or sidecar over exposing it.

## Add an HTTPS listener

TLS is a transport, not a protocol: an HTTPS listener is `protocol = http`
over `transport = tls`, plus a `tls.*` block naming its material.

```
listeners.public_https.transport    = tls
listeners.public_https.protocol     = http
listeners.public_https.port         = 8443
listeners.public_https.services     = api_gateway, wamp_ws
listeners.public_https.tls.certfile = {{platform_etc_dir}}/cert.pem
listeners.public_https.tls.keyfile  = {{platform_etc_dir}}/key.pem
```

The certificate is checked at boot. If you want to declare the listener
before its certificate has been provisioned, park it:

```
listeners.public_https.enabled = off
```

A disabled listener skips the TLS check but stays in the inventory —
turning it on later runs the deferred check then, and a certificate that
is still missing is refused at that boot.

The same pattern serves WAMP raw socket and the bridge relay over TLS:
`protocol = wamp_rawsocket` or `protocol = bridge_relay` with
`transport = tls` and the same `tls.*` block, no `services`.

### Require client certificates (mTLS)

`verify_peer` alone only *requests* a certificate — a client presenting
none still connects. Requiring one takes the pair:

```
listeners.public_https.tls.cacertfile           = {{platform_etc_dir}}/cacert.pem
listeners.public_https.tls.verify               = verify_peer
listeners.public_https.tls.fail_if_no_peer_cert = on
```

## Split audiences across listeners

`services` is the tool for deciding *what* answers on *which* socket, and
the built-in inventory demonstrates the one split you should preserve: the
Admin API (`admin_api` — realms, users, grants) never shares a listener
with a customer-facing service like `api_gateway`. Mounting a stored API
specification on the socket that administers realms would put it one
misconfiguration away from the wrong audience. Declaring `mcp` together
with `admin_api` on one listener is refused at boot for the same reason.

The same mechanism isolates a new surface onto its own port entirely — a
dedicated listener for AI agents, say, with nothing else reachable there:

```
listeners.agents.transport    = tls
listeners.agents.protocol     = http
listeners.agents.port         = 9443
listeners.agents.services     = mcp
listeners.agents.tls.certfile = {{platform_etc_dir}}/cert.pem
listeners.agents.tls.keyfile  = {{platform_etc_dir}}/key.pem
```

Services choose subprotocols too: `wamp_ws` and `bamp_ws` both mount
`/ws`, so a listener declaring only one of them restricts that path to
that subprotocol — a WAMP client offered to a `bamp_ws`-only listener is
refused with 400 rather than silently served.

## Serve one port on several interfaces

A socket is identified by address *and* port, so two listeners may share a
port when each binds its own address — one certificate per interface on
port 443 is the case this exists for:

```
listeners.tenant_a.transport    = tls
listeners.tenant_a.protocol     = http
listeners.tenant_a.ip           = 10.0.0.1
listeners.tenant_a.port         = 443
listeners.tenant_a.services     = api_gateway
listeners.tenant_a.tls.certfile = {{platform_etc_dir}}/tenant_a.pem
listeners.tenant_a.tls.keyfile  = {{platform_etc_dir}}/tenant_a_key.pem

listeners.tenant_b.transport    = tls
listeners.tenant_b.protocol     = http
listeners.tenant_b.ip           = 10.0.0.2
listeners.tenant_b.port         = 443
listeners.tenant_b.services     = api_gateway
listeners.tenant_b.tls.certfile = {{platform_etc_dir}}/tenant_b.pem
listeners.tenant_b.tls.keyfile  = {{platform_etc_dir}}/tenant_b_key.pem
```

`ip` takes an address literal, not a hostname. A listener that states no
`ip` binds the wildcard, which covers every address on its port — so a
wildcard listener and *any* other listener on the same port are refused
together at boot, naming both, rather than letting the second one lose the
race at bind time.

## Admit only local processes over a Unix socket

A `uds` listener trades a port for a socket file, which makes the
filesystem the perimeter — useful for a sidecar or a co-located proxy
that should reach Bondy without the node opening a network port for it:

```
listeners.sidecar.transport = uds
listeners.sidecar.protocol  = http
listeners.sidecar.path      = /var/run/bondy/sidecar.sock
listeners.sidecar.services  = api_gateway
```

A connection arriving over `uds` has no network peer; Bondy represents it
as loopback (`127.0.0.1`), so an RBAC Source rule scoped to
`127.0.0.1/32` also admits it — consistent with what the rule expresses,
since a Unix socket is reachable only by local processes. The one
protocol unavailable over `uds` is `bridge_relay`: a bridge is a network
link between nodes, and declaring one over a local socket is refused at
boot.

## Give an exposed listener its own budget

Rate limiting composes across three scopes — node, listener, realm — and
a request is admitted only when every configured scope admits it, so a
listener budget can only narrow what the node allows. That makes the
per-listener budget the tool for one specific judgement: *this socket
faces a harsher network than the others*. An Internet-facing listener can
be held to a tighter budget than the internal ones without touching the
node-wide settings:

```
listeners.agents.rate_limit.connection.rate     = 10
listeners.agents.rate_limit.connection.capacity = 30
listeners.agents.rate_limit.http.rate           = 50
listeners.agents.rate_limit.http.capacity       = 200
listeners.agents.rate_limit.message.rate        = 500
listeners.agents.rate_limit.message.capacity    = 1000
```

Stating a class's block is what enables it on this listener — there are
no defaults to inherit, and the listener scope does not need the
node-scope switch to be on. `rate` is the sustained tokens per second,
`capacity` the burst; `connection`, `handshake`, `auth` and `http` are
budgeted per source IP, `message` per session established through this
listener, whichever transport carried it — WebSocket, raw socket, SSE or
long-poll. A throttled HTTP request answers `429` with a `retry-after`
header; a throttled WAMP verb answers a `wamp.error.unavailable` ERROR
(an unacknowledged publish, which expects no reply, is dropped).
Denials are visible as
`bondy_rate_limited_total{scope="listener"}` in the
[metrics](/router/reference/metrics).

When and how to reach for each class — and how the realm scope's tenant
quotas compose with this — is the subject of the
[rate limiting guide](/router/guides/administration/load_regulation_and_rate_limiting#rate-limiting-inbound-traffic).

## Answer probes before the node is ready

An orchestrator's liveness probe and the metrics scrape are useful
precisely while the node is still starting. `start_phase = early` binds a
listener before the storage layer opens, which on a node with enough data can
take minutes: `/ping` answers throughout, so a liveness probe does not kill a
node that is still opening its store, and `/ready` answers `503` until the node
is ready. The rest of an early listener's routes, `/metrics` included, answer
`404` until the node's services start, which is still before every `normal`
listener binds. That is why the built-in `admin` listener (carrying `/ping`,
`/ready` and `/metrics`) is declared early. If you move probes or
metrics onto a listener of your own, carry the phase over:

```
listeners.probes.transport   = tcp
listeners.probes.protocol    = http
listeners.probes.port        = 9090
listeners.probes.start_phase = early
listeners.probes.services    = admin, metrics
```

Point a liveness probe at `/ping` and a readiness probe at `/ready`. `/ready`
answering `200` means the normal phase finished binding — use it, not `/ping`,
as the signal to route traffic to the node.

## Take the node out of rotation without a restart

Two WAMP procedures, callable from the master realm only, suspend and
resume listeners at runtime by phase (`early`, `normal` or `all`):

```
bondy.listener.suspend("normal")
bondy.listener.resume("normal")
```

Suspending stops a listener accepting *new* connections and leaves
established ones running — which is what makes it a drain: suspend
`normal`, let in-flight sessions finish, and the node has left rotation
without dropping work.

::: warning Suspending `all` includes your probes
The `early` phase carries `/ping`, `/ready` and `/metrics`. Suspend `all`
and an orchestrator watching those endpoints sees a dead node and may
kill it mid-drain. Drain with `normal`.
:::

## Migrating a pre-1.0 configuration

The fixed per-scheme keys (`api_gateway.http.*`, `wamp.tcp.*`, the global
`wamp.websocket.*` carrier keys, and the rest) are gone, and a file still
setting them loses those settings silently. The
[migration table](/router/reference/configuration/listeners#migrating-from-the-pre-1-0-keys)
maps every removed key to its `listeners.$name.*` spelling, and
`scripts/migrate_conf.escript` (shipped with the Bondy source) rewrites a
file and reports what it changed — including the two mistakes a hand
migration tends to make: forgetting to restate a listener at all, and
renaming option keys without giving the listener its `transport`,
`protocol` and bind target.
