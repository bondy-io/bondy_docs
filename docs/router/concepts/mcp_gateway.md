---
outline: [2,3]
related:
    - text: MCP Gateway Configuration Reference
      type: Configuration Reference
      link: /router/reference/configuration/mcp
      description: The per-listener mcp.* edge keys and the node-global mcp.* keys.
    - text: Exposing an MCP Endpoint
      type: How-to Guide
      link: /router/guides/administration/exposing_an_mcp_endpoint
      description: The operator task — declare the listener, publish interface metadata, connect a client.
    - text: Interface Metadata & Reflection API
      type: API Reference
      link: /router/reference/wamp_api/interface
      description: The bondy.interface.* procedures and WAMP Interface Reflection.
    - text: MCP Gateway WAMP API
      type: API Reference
      link: /router/reference/wamp_api/mcp
      description: Managing overlay documents over WAMP — the exposure act.
    - text: Marketplace for AI Agents (MCP)
      type: Tutorial
      link: /router/tutorials/getting_started/marketplace_mcp
      description: The whole model exercised against a real Autobahn Python microservice.
    - text: Network Listeners
      type: Configuration Reference
      link: /router/reference/configuration/listeners
      description: The listener model the mcp service mounts on.
---

# MCP Gateway

Bondy exposes the procedures and topics of a realm to AI agents as an **MCP
server** — a [Model Context Protocol](https://modelcontextprotocol.io)
endpoint where WAMP procedures appear as MCP *tools* and WAMP topics as MCP
*resources*. An MCP client calls a tool; Bondy authenticates and authorizes
the caller like any other client, routes the call to whatever callee is
registered for the procedure — on this node, another cluster node, or across
a bridge — and returns the result in MCP's shape. Nothing is special about
the callee: it is an ordinary WAMP microservice that does not know MCP
exists.

## An endpoint is a listener service

MCP is not a global toggle. It is a **service** a
[listener](/router/reference/configuration/listeners) declares:

```
listeners.agents.transport = tls
listeners.agents.protocol  = http
listeners.agents.port      = 8443
listeners.agents.services  = mcp
listeners.agents.tls.certfile = /path/to/keycert.pem
listeners.agents.tls.keyfile  = /path/to/key.pem
```

The endpoint mounts two paths on that listener, on every virtual host:

- `/mcp/realm/:realm` — the MCP endpoint itself. The realm is a path
  segment, not a listener property: one listener serves every realm, and
  which realm a request addresses is part of its URL.
- `/.well-known/oauth-protected-resource/realm/:realm` — the OAuth
  protected-resource metadata document for that realm.

A listener may combine `mcp` with other services (`api_gateway`, `wamp_ws`,
…) — with one exception: `mcp` together with `admin_api` is refused at boot.
An endpoint meant for external agents and the API that administers realms
and grants should never be one misconfiguration apart.

## Two protocol eras, one endpoint

The MCP specification changed shape in 2026: revision `2026-07-28` removed
protocol-level sessions, making every request self-contained, while the
earlier revisions (`2025-06-18`, `2025-11-25`) establish a session with an
`initialize` handshake and carry an `Mcp-Session-Id` header. Client SDKs
straddle that line, so Bondy serves **both eras on one endpoint** and
negotiates per client:

- A **modern** request (`2026-07-28`) is served statelessly: authenticate,
  authorize, route, answer — no server-side session exists. Modern clients
  discover the endpoint's capabilities through the `server/discover` probe.
- A **handshake-era** client gets a real session: `initialize` opens it,
  `Mcp-Session-Id` addresses it, a `GET` stream delivers server-to-client
  notifications, and `DELETE` closes it. In a Bondy cluster the session
  lives on the node that opened it; any node can serve the client's next
  request and forwards it to the owner, so the endpoint works behind a
  non-sticky load balancer.

Which versions an endpoint accepts is per listener
(`listeners.$name.mcp.protocol_versions`), so one node can expose a
modern-only endpoint on one port and a compatibility endpoint on another,
serving the same catalogue.

## The manifest: interface metadata joined with an overlay

What tools and resources an endpoint offers for a realm — its **manifest** —
is not configured in MCP terms. It is *derived* from two layers:

1. **Interface metadata** — documents describing WAMP procedures, topics
   and errors (descriptions and JSON Schemas), loaded through the
   [`bondy.interface.*` API](/router/reference/wamp_api/interface) at
   deploy time and replicated cluster-wide. This layer is a Bondy
   capability in its own right: the same store answers
   [WAMP Interface Reflection](/router/reference/wamp_api/interface#wamp-interface-reflection),
   and MCP is one consumer among others.
2. **An MCP overlay** — the operator-authored document that *exposes*:
   it names tools (an MCP tool name need not be a WAMP URI), names
   topic-backed *resources*, declares *resource templates* (RFC 6570 URI
   templates whose variables become arguments to a procedure), and adds
   MCP-only annotations. Overlays are managed over WAMP through the
   [`bondy.mcp.overlay.*` API](/router/reference/wamp_api/mcp), with the
   same document lifecycle as the interface layer.

Which layer *creates* entries is the
[`mcp.manifest.mode`](/router/reference/configuration/mcp#mcp.manifest.mode)
decision. Under **`curated`** — the default — only overlay-named tools and
resources exist: describing a procedure for reflection is not consent to
agent exposure, and the overlay is the explicit, auditable act of exposing
it (the same posture upstream tool projection has always had). Under
**`derived`** — the development-loop convenience — every exact-match
described procedure additionally becomes a tool named by its WAMP URI, and
every described topic a resource. In both modes an overlay entry that
claims a procedure **replaces** its URI-named entry — a rename is a
rename, not an alias — and two entries claiming one name with different
WAMP bindings are both skipped while a critical alarm names the collision,
so a broken catalogue is loud rather than quietly wrong.

The manifest is compiled per realm and cached; a change to either layer —
including one replicated from another node — rebuilds it within a debounce
window. Registration and deregistration deliberately do **not** rebuild it:
the manifest declares the surface, the registry decides liveness, and a tool
whose procedure currently has no callee fails at call time the same way any
WAMP call does.

Each compiled entry carries a SHA-256 **hash** over its normative content —
name, schemas, WAMP binding, annotations — so a security review can pin a
tool to the exact content it approved. Descriptions and versions sit outside
the hash: prose can be corrected without re-approving the tool.

## Security model

**Authentication and authorization are Bondy's, not MCP's.** A caller is
authenticated against the realm and every tool call is authorized as a WAMP
call on the underlying procedure.

What the `Authorization` header may carry follows the realm's configured
authentication methods:

- **`Bearer` with an OAuth2 JWT** — validated against the realm's OAuth2
  configuration; told apart from a ticket by its claims (`sub`).
- **`Bearer` with a [Bondy ticket](/router/reference/wamp_api/ticket)** —
  including a role-restricted delegation ticket (below).
- **`Basic`** — the realm's password authentication.
- **No header** — an anonymous principal, when the realm permits
  anonymous authentication; on a realm with security disabled every
  request is served anonymously.

Authentication is **per request in both eras** — a handshake-era
`Mcp-Session-Id` addresses a session but is never a credential — and it
ends in the same place either way: a role set that authorization is
computed from.

Listings are RBAC-projected: a tool whose procedure the caller may not
call is *absent* from `tools/list`, and asking for it by name answers
exactly as if it did not exist — the endpoint is not an existence oracle
for URIs the caller cannot reach.

Beyond that, the endpoint applies, in order:

- **Rate limiting** — MCP requests draw from the same per-source-IP `http`
  token bucket as the API Gateway (`security.rate_limit.*`, off by
  default), answering 429 when exhausted.
- **Origin validation** — DNS-rebinding protection, the transport
  specification's requirement. By default only localhost origins are
  served; a deployment names its real origins per listener
  (`listeners.$name.mcp.allowed_origins`). Requests without an `Origin`
  header are always served: only browsers send one, and the browser is the
  rebinding vector.
- **Body and concurrency bounds** — a per-listener request size limit and
  a per-session in-flight call limit.

When a tool needs more input mid-call (the specification's multi-round-trip
mechanism), the continuation state Bondy hands the client is sealed in a
JWE under the realm's encryption keys and bound to the calling principal,
the tool, and a hash of the arguments — a different caller, a different
tool, or altered arguments cannot replay it, and it expires
(`mcp.request_state.ttl`).

**Delegation: a user never hands an agent their own credential.** A logged-in
user calls
[`bondy.ticket.issue`](/router/reference/wamp_api/ticket) with `authroles` —
a subset of their own roles — and a short expiry, and gives the agent *that*
ticket. The agent authenticates as the user restricted to those roles,
non-negotiably: it may narrow further but can never widen, its `tools/list`
shrinks to what the restricted roles may call, every call is audited as the
user with the restricted role visible, and revocation is ordinary ticket
revocation. Combined with a group per capability tier ("this group may call
X, Y and Z"), this is also how one user gets different capability through
different channels: the web app session carries every role, the agent's
ticket carries one.

## Bondy as an MCP client: upstreams

The projection also runs the other way. An **upstream** declaration
(`mcp.upstreams.$name.*`) connects Bondy to a third-party MCP server and
registers each of its tools as a WAMP procedure under a per-upstream URI
prefix — so WAMP clients, and every MCP endpoint Bondy itself serves, can
call tools that live elsewhere, with Bondy's own RBAC in front of them.

Upstream tool definitions are pinned on first use: the hash of each tool's
definition is stored, and a definition that later *drifts* has its
procedure unregistered and blocked until an operator approves the new
content. A compromised or updated upstream cannot silently change what a
reviewed tool does. Upstream-supplied text is never merged into Bondy's own
served manifests — an upstream description is a prompt-injection channel,
and the operator overlay is the only path onto an endpoint's catalogue.

Calls to an upstream ride an
[HTTP Connector](/router/concepts/http_connector) service — its base URL,
TLS posture, pooling and credential acquisition — and carry the service's
own account: `identity = service` must be declared explicitly, so the fact
that every caller shares one upstream identity is a written decision, not a
default.

## Observability

Every tool call, resource read and upstream call emits telemetry: Prometheus
metric families under `bondy_mcp_*` (see the
[Metrics Reference](/router/reference/metrics)), an audit event per call on
the `[bondy, mcp, audit, record]` telemetry seam carrying digests rather
than payloads, and — when [distributed tracing](/router/concepts/telemetry)
is enabled — spans that join the caller's W3C trace context, carried in
`_meta` per the MCP specification.
