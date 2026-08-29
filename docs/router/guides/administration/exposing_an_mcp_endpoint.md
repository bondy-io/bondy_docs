---
outline: [2,3]
related:
    - text: MCP Gateway
      type: Concept
      link: /router/concepts/mcp_gateway
      description: What the endpoint serves, the two protocol eras, and where the catalogue comes from.
    - text: MCP Gateway Configuration Reference
      type: Configuration Reference
      link: /router/reference/configuration/mcp
      description: Every mcp.* key — the per-listener edge and the node-global settings.
    - text: Interface Metadata & Reflection API
      type: API Reference
      link: /router/reference/wamp_api/interface
      description: The bondy.interface.* procedures used in step 3.
    - text: Network Listeners
      type: Configuration Reference
      link: /router/reference/configuration/listeners
      description: The listener surface the mcp service mounts on.
    - text: Marketplace for AI Agents (MCP)
      type: Tutorial
      link: /router/tutorials/getting_started/marketplace_mcp
      description: The same steps end to end, against the marketplace demo's Autobahn Python microservice.
---

# Exposing an MCP Endpoint

This guide takes a realm whose procedures are served by ordinary WAMP
callees and exposes them to MCP clients — AI agents, IDE integrations,
anything speaking the Model Context Protocol. Read the
[MCP Gateway](/router/concepts/mcp_gateway) concept page first: it explains
the model this guide only exercises.

## 1. Declare the listener

The endpoint is a [listener service](/router/reference/configuration/listeners).
Add a listener whose `services` include `mcp`:

```
listeners.agents.transport = tls
listeners.agents.protocol  = http
listeners.agents.port      = 8443
listeners.agents.services  = mcp
listeners.agents.tls.certfile = {{platform_etc_dir}}/keycert.pem
listeners.agents.tls.keyfile  = {{platform_etc_dir}}/key.pem
```

Remember that declaring any `listeners.*` key switches the node onto the
declared inventory — restate every other listener the node needs.

Two settings deserve a decision now rather than after the first confused
client:

```
listeners.agents.mcp.allowed_origins = https://agents.example.com
listeners.agents.mcp.public_base_uri = https://mcp.example.com
```

`allowed_origins` is DNS-rebinding protection and defaults to
**localhost origins only** — a browser-based client on another origin is
refused with 403 until its origin is listed (`any` disables the check;
non-browser clients send no `Origin` header and are unaffected).
`public_base_uri` matters when the listener sits behind a TLS-terminating
proxy: it is the origin published in the OAuth protected-resource metadata
document, where neither the listener's transport nor the request reflects
the public URL.

The endpoint answers at `/mcp/realm/<realm>` on that listener — the realm
is part of the URL, so this one listener serves every realm the node hosts.

## 2. Prepare the realm

MCP callers are WAMP callers: they authenticate against the realm and every
tool call is authorized as a `wamp.call` on the underlying procedure. So
the realm needs what any client-facing realm needs — users or an anonymous
grant, a source rule admitting the callers' network, and grants covering
exactly the procedures that should be callable. A tool whose procedure the
caller may not call is simply absent from the client's `tools/list`.

Nothing MCP-specific happens here; see
[Security](/router/reference/configuration/security) and the RBAC
references.

## 3. Publish interface metadata

The catalogue is built from **interface metadata** — documents describing
procedures and topics, loaded once per release through the
[`bondy.interface.load`](/router/reference/wamp_api/interface) procedure.
Both this call and step 4's are ordinary WAMP calls made from an admin
session on the **master realm** — from CI, an ops script, or any WAMP
client; the
[tutorial](/router/tutorials/getting_started/marketplace_mcp#_2-describe-and-load-the-market-s-interface)
shows a complete Autobahn|Python loader. Describing is not exposing: under
the default
[`mcp.manifest.mode = curated`](/router/reference/configuration/mcp#mcp.manifest.mode),
these documents supply descriptions and schemas, and step 4's overlay is
what makes something a tool. (`derived` mode, the development
convenience, additionally turns every described exact-match procedure into
a URI-named tool.)

A minimal document describing one procedure:

```json
{
  "id": "com.example.vehicle_api",
  "version": "1.4.0",
  "entries": [
    {
      "realm": "com.example.fleet",
      "kind": "procedure",
      "uri": "com.example.vehicle.locate",
      "description": "Returns the last known position of a vehicle.",
      "kwargs_schema": {
        "type": "object",
        "properties": { "vehicle_id": { "type": "string" } },
        "required": ["vehicle_id"]
      },
      "result_kwargs_schema": {
        "type": "object",
        "properties": {
          "lat": { "type": "number" },
          "lon": { "type": "number" }
        }
      }
    }
  ]
}
```

Loading the same `id` again **replaces** the previous version — entries the
new version no longer declares are removed — and one entry belongs to
exactly one document: a document claiming a `(realm, kind, uri)` another
document owns is rejected whole, so two teams cannot silently fight over
one procedure's description. Validation is atomic: one invalid entry
rejects the whole document.

The document replicates cluster-wide; every node's manifests rebuild from
it within about a second of the change arriving.

## 4. Expose tools with an overlay

The **overlay** is the explicit act of exposing to agents: under the
default curated mode, exactly the entries it names exist. It is also where
tools get agent-friendly names (an MCP name need not be a WAMP URI),
where described topics become resources (`kind: "resource"` with
`wamp_topic`), and where MCP-only annotations and RFC 6570 **resource
templates** live. Load it the same way as step 3, through
[`bondy.mcp.overlay.load`](/router/reference/wamp_api/mcp) on the master
realm:

```json
{
  "id": "com.example.vehicle_mcp",
  "entries": [
    {
      "realm": "com.example.fleet",
      "kind": "tool",
      "name": "locate_vehicle",
      "wamp_procedure": "com.example.vehicle.locate"
    }
  ]
}
```

Re-loading the same `id` replaces the overlay, exactly like an interface
document.

An overlay entry that claims a procedure *replaces* its URI-named tool — a
rename, not an alias. Two entries claiming one name with different bindings
are both skipped and a critical alarm names the collision.

## 5. Verify

First verify the metadata layer through WAMP Interface Reflection, from any
WAMP client on the realm:

```
wamp.reflection.procedure.list("com.example.fleet")
```

answers the URIs the *calling* principal is authorized to see — which also
checks the grants from step 2, since an empty list with metadata loaded
means the caller lacks `wamp.call` on those procedures.

Then connect a real MCP client to
`https://<host>:8443/mcp/realm/com.example.fleet`. Both generations of the
official TypeScript SDK work against the endpoint — the current
(`2026-07-28`, sessionless) client and the v1.x (`initialize`-handshake)
client — as do clients pinned to `2025-06-18`/`2025-11-25`; the endpoint
negotiates per client. `tools/list` should show your tools, and calling one
routes to whatever callee is registered for the procedure, wherever in the
cluster it lives. If a tool call answers a "no such procedure" error, the
manifest is fine and no callee is currently registered — the catalogue
declares the surface, the registry decides liveness.

## Credentials for agents

Never let a user hand an agent their own token. The delegation flow:

1. The operator defines a group per agent capability tier — say
   `mcp_tools`, granted `wamp.call` on exactly the procedures agents may
   use — and adds the relevant users to it.
2. From their own authenticated session (the web app), a user calls
   [`bondy.ticket.issue`](/router/reference/wamp_api/ticket) with
   `{"authroles": ["mcp_tools"], "expiry_time_secs": 3600}` and passes the
   returned ticket to the agent.
3. The agent authenticates at the MCP endpoint with that ticket as a
   Bearer credential. Its session carries exactly the `mcp_tools` role —
   the restriction is inside the signed ticket and cannot be widened by
   the bearer — so its `tools/list` and every call are bounded by that
   group's grants, while the user's own sessions keep their full roles.

Requesting `authroles` outside the issuing session's own roles refuses the
issue, so a restricted session can never mint a wider ticket than itself.

## Production notes

- **Manifest mode**: keep the default
  [`mcp.manifest.mode = curated`](/router/reference/configuration/mcp#mcp.manifest.mode)
  in production — exposure stays an explicit overlay act. `derived` (every
  described procedure surfaces URI-named, no overlay needed) is the
  development-loop convenience.
- **Versions**: restrict `listeners.$name.mcp.protocol_versions` when you
  want a modern-only endpoint; the default serves `2026-07-28`,
  `2025-11-25` and `2025-06-18`.
- **Rate limiting**: MCP requests draw from the per-source-IP `http`
  class, which can be budgeted at three scopes that all must admit a
  request: node-wide
  ([`security.rate_limit.http.*`](/router/reference/configuration/security#rate-limiting)),
  per listener
  ([`listeners.$name.rate_limit.http.*`](/router/reference/configuration/listeners#rate-limiting) —
  hold the Internet-facing MCP listener to a tighter budget than your
  internal ones), and per realm (the realm's `rate_limit` property,
  whose `total` kind is a per-node tenant quota — see the
  [rate limiting guide](/router/guides/administration/load_regulation_and_rate_limiting#scopes-node-listener-realm)).
- **Bounds**: `mcp.max_body_size` (4MB) and `mcp.max_inflight` (64 per
  session) have per-listener spellings; raise them deliberately.
- **Metrics**: watch the `bondy_mcp_*` families — in particular
  `bondy_mcp_manifest_collisions_total`, which counts catalogue entries
  skipped over a name collision, each of which also raises an alarm.
