---
outline: [2,3]
related:
    - text: MCP Gateway
      type: Concept
      link: /router/concepts/mcp_gateway
      description: The model behind these keys — eras, manifest, security, upstreams.
    - text: Exposing an MCP Endpoint
      type: How-to Guide
      link: /router/guides/administration/exposing_an_mcp_endpoint
      description: The operator task, end to end.
    - text: Network Listeners
      type: Configuration Reference
      link: /router/reference/configuration/listeners
      description: The listeners.$name.* surface the per-listener keys extend.
    - text: MCP Gateway WAMP API
      type: API Reference
      link: /router/reference/wamp_api/mcp
      description: The bondy.mcp.overlay.* procedures the manifest keys pair with.
    - text: HTTP Connector
      type: Configuration Reference
      link: /router/reference/configuration/http_connector
      description: The services mcp.upstreams.$name.service references.
---

# MCP Gateway Configuration Reference

The MCP Gateway is configured in two scopes. **Per-listener** keys
(`listeners.$name.mcp.*`) shape one endpoint's edge — accepted protocol
versions, origin policy, size and concurrency bounds — and follow the
[listener model](/router/reference/configuration/listeners): they apply to
the listener they are stated on and nothing else. **Node-global** keys
(`mcp.*`) govern what is node-scoped by nature: the per-realm manifest
cache (two listeners serving one realm serve the same catalogue), request
continuations, metrics labelling and upstream declarations.

There is no `mcp.enabled` key. An endpoint exists where a listener declares
the `mcp` service, and parking one is `listeners.$name.enabled = off`.

## Per-listener edge keys

None of these have a schema default; a key you do not set takes the
built-in default listed here.

@[config](listeners.$name.mcp.protocol_versions,string,,v1.0.0)

A comma separated, priority ordered list of the MCP protocol versions this
endpoint accepts; the default is `2026-07-28, 2025-11-25, 2025-06-18`. The effective set is this list intersected with what
Bondy implements, and version negotiation answers a supported requested
version or the latest configured one. List `2026-07-28` alone for a
modern-only (sessionless) endpoint; keep the handshake-era revisions while
your clients' SDKs still speak them.

@[config](listeners.$name.mcp.allowed_origins,string,local,v1.0.0)

DNS-rebinding protection: the `Origin` request header values this listener
serves, as a comma separated list. Each entry is either the word `local` —
any localhost origin, any scheme and port — or an explicit origin such as
`https://agents.example.com` (matched case-insensitively). The single word
`any` disables the check, and is refused beside other entries. Requests
carrying no `Origin` header are always served: only browsers send one, and
the browser is the rebinding vector. A request with a non-matching or
unparseable `Origin` is refused with 403.

@[config](listeners.$name.mcp.public_base_uri,string,,v1.0.0)

The public origin (scheme and host, e.g. `https://mcp.example.com`) this
endpoint publishes in documents that must carry one, such as the OAuth
protected-resource metadata document. Set it when the listener sits behind
a TLS-terminating proxy, where neither the listener's transport nor the
request reflects the public URL. Unset, the scheme is derived from the
listener's transport and the host from the request.

@[config](listeners.$name.mcp.max_body_size,bytesize,4MB,v1.0.0)

Maximum size of an MCP request body on this listener.

@[config](listeners.$name.mcp.max_inflight,integer,64,v1.0.0)

Has no effect. Bondy accepts the key but does not limit the number of
concurrent MCP calls per session.

@[config](listeners.$name.mcp.idle_timeout,duration,10m,v1.0.0)

How long a fully quiet held MCP response stream is kept before its
connection is closed. Like the SSE and long-poll carriers, this feeds the
listener's **connection** idle-timeout default — the largest held-stream
value in play wins, identically over HTTP/1.1 and HTTP/2; see
[Held streams](/router/reference/configuration/listeners#held-streams-and-the-connection-idle-timeout).

@[config](listeners.$name.mcp.list.default_page_size,integer,200,v1.0.0)

Page size used for MCP list results when the client does not name one.

@[config](listeners.$name.mcp.schema.max_depth,integer,32,v1.0.0)

Has no effect. Bondy accepts the key, but does not validate the arguments
of an MCP request against a tool's input schema.

@[config](listeners.$name.mcp.schema.max_validation_ms,duration,50ms,v1.0.0)

Has no effect, for the same reason as
[`listeners.$name.mcp.schema.max_depth`](#listeners.$name.mcp.schema.max_depth).

## Manifest

The manifest — the per-realm catalogue of tools and resources compiled from
the interface metadata store and the MCP overlay — is cached per realm on
each node.

@[config](mcp.manifest.mode,curated|derived,curated,v1.0.0)

What a realm's manifest is derived from. **`curated`** (the default): only
tools and resources **named by an overlay document** exist — interface
metadata contributes descriptions and schemas to those entries but creates
nothing by itself, so describing a procedure for
[reflection](/router/reference/wamp_api/interface) is not consent to agent
exposure. **`derived`**: every exact-match described procedure additionally
becomes a tool named by its WAMP URI, and every exact-match described topic
a resource — the development-loop convenience. In both modes an overlay
entry joins the interface entry of its WAMP binding (the procedure of a
`tool` or template, the topic of a `resource`) field by field, so
descriptions and schemas are written once.

@[config](mcp.manifest.cache_ttl,duration,60s,v1.0.0)

How long a compiled manifest may be served before it is rebuilt on the next
read. This is a backstop: rebuilds are driven by change events from the
interface and overlay stores (local writes and replicated peer writes
alike), so under normal operation a manifest is rebuilt within the debounce
window of the change and this bound never triggers.

@[config](mcp.manifest.rebuild_debounce,duration,1s,v1.0.0)

How long the cache waits after a change event before rebuilding, so a burst
of writes (a document load, an anti-entropy sync) collapses into a single
rebuild per realm.

## Request continuations

When a tool answers that it needs more input (the specification's
multi-round-trip mechanism), Bondy seals the continuation into a
`requestState` envelope — encrypted under the realm's keys and bound to the
principal, the tool and the arguments.

@[config](mcp.request_state.ttl,duration,5m,v1.0.0)

How long a continuation stays valid: the retry must arrive within this
window or it is rejected. This bounds the replay window — keep it short.

@[config](mcp.request_state.max_size,bytesize,64KB,v1.0.0)

The size bound on a `requestState` envelope, in both directions: a callee
continuation that seals beyond it fails the tool call, and an inbound
request state beyond it is rejected before any cryptography is attempted.

## Metrics

@[config](mcp.metrics.label_by_name,on|off,off,v1.0.0)

Whether the per-tool `name` label rides the MCP call/read **duration
histograms**. Off, durations aggregate to realm level, keeping the
histogram series count independent of the manifest size. The call/read
counters always carry the name.

## Upstream MCP servers

An upstream declaration connects Bondy, as an MCP *client*, to a
third-party MCP server and registers each of its tools as a WAMP procedure
— see [the concept page](/router/concepts/mcp_gateway#bondy-as-an-mcp-client-upstreams)
for the trust model (definition pinning, drift blocking). Replace
`$upstream` with a name of your choosing.

Projected upstream procedures never enter Bondy's **own** served manifests
by themselves — upstream-supplied definitions are a prompt-injection
channel and are never written to the interface store — so re-exposing one
to agents takes an explicit overlay entry naming it, in either manifest
mode.

@[config](mcp.upstreams.$upstream.service,string,,v1.0.0)

**Required.** The [HTTP Connector](/router/reference/configuration/http_connector)
service this upstream rides: its `base_url`, TLS verification, connection
pool, timeouts and token-acquisition auth all come from
`http_connector.services.<name>.*`. The service's credential is a shared
service account applied to every projected call, which is why `identity`
below must be declared explicitly.

@[config](mcp.upstreams.$upstream.realm,string,,v1.0.0)

**Required.** The realm the upstream's tools are projected into: each
upstream tool becomes a WAMP procedure registered in this realm.

@[config](mcp.upstreams.$upstream.prefix,string,,v1.0.0)

**Required.** The WAMP URI prefix projected procedures are registered
under: tool `t` becomes `<prefix>.<t>` (tool names are lowercased and
characters outside `[a-z0-9_]` replaced with `_`). Must be unique per realm
across upstreams — startup refuses a duplicate — so no upstream can shadow
another's tool names.

@[config](mcp.upstreams.$upstream.identity,enum,,v1.0.0)

**Required, no default.** The identity every projected call carries
upstream. The only supported value is `service`: the shared service account
configured on the `http_connector` service, applied regardless of which
WAMP caller invoked the projected procedure. That is permitted only where
explicitly declared — which is what this key is; an upstream without it
refuses to start. Per-caller identities (token exchange) are a planned
extension, not a configuration today.

@[config](mcp.upstreams.$upstream.path,string,"",v1.0.0)

The MCP endpoint path, appended to the service's `base_url`.

@[config](mcp.upstreams.$upstream.enabled,on|off,on,v1.0.0)

Whether this upstream is projected. `off` parks the declaration without
deleting it — the pinned tool definitions are kept.

@[config](mcp.upstreams.$upstream.timeout,duration,,v1.0.0)

Per-call timeout for upstream MCP requests. Defaults to the
`http_connector` service's own `timeout`.
