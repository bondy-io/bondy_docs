# MCP Compliance

Which parts of the [Model Context Protocol](https://modelcontextprotocol.io) Bondy Connect implements as an MCP server and as an MCP client, and where it departs from the specification.

The MCP endpoint is a listener service. For the model behind it (the manifest, overlays, the security posture) see [MCP Gateway](/router/concepts/mcp_gateway). For its configuration keys see [MCP Gateway Configuration Reference](/router/reference/configuration/mcp). To set one up, see [Exposing an MCP Endpoint](/router/guides/administration/exposing_an_mcp_endpoint).

## Transport

Bondy implements the Streamable HTTP transport. It does not implement the stdio transport.

### Paths

A listener that declares the `mcp` service mounts two paths, on every virtual host it serves.

|Path|Implemented|Notes|
|---|---|---|
|`/mcp/realm/:realm`|Yes|The MCP endpoint. An unknown realm answers `404` with JSON-RPC code `-32000` and message `no_such_realm`.|
|`/.well-known/oauth-protected-resource/realm/:realm`|No|Mounted, but answers `501` with the body `{"error":"mcp_not_implemented"}`. See [D1](#d1).|

### Protocol revisions

Bondy implements three revisions, in two eras. The **modern era** is revision `2026-07-28`, in which every request is self-contained. The **handshake era** is the two earlier revisions, in which an `initialize` request opens a session that later requests address with the `Mcp-Session-Id` header.

|Revision|Era|Accepted by default|
|---|---|---|
|`2026-07-28`|Modern|Yes|
|`2025-11-25`|Handshake|Yes|
|`2025-06-18`|Handshake|Yes|

An endpoint accepts the intersection of this table with its [`listeners.$name.mcp.protocol_versions`](/router/reference/configuration/mcp#listeners.$name.mcp.protocol_versions). An endpoint configured with no handshake-era revision is modern-only.

Bondy chooses the era per request, not per endpoint:

- An `initialize` request selects the handshake era. Bondy echoes the requested `protocolVersion` when the endpoint accepts it, and otherwise answers the latest handshake-era revision the endpoint accepts. An endpoint with no handshake-era revision answers `initialize` with JSON-RPC code `-32602`, whose `data` carries `supported` and `requested`.
- A `POST` that carries `Mcp-Session-Id` is a request inside an established handshake-era session.
- A `POST` without `Mcp-Session-Id` whose `MCP-Protocol-Version` header names a handshake-era revision is refused with `400`, code `-32600`, message `Mcp-Session-Id header required`.
- Every other `POST` is a modern-era request.

### HTTP methods

|Method|Modern era|Handshake era|Notes|
|---|---|---|---|
|`POST`|Yes|Yes|One JSON-RPC message per request.|
|`GET`|No|Yes|Opens the session's notification stream (`text/event-stream`). One stream per session; a second answers `409`.|
|`DELETE`|No|Yes|Closes the session and cancels its in-flight calls. Answers `204`.|

An endpoint that accepts no handshake-era revision answers `GET` and `DELETE` with `405` and `Allow: POST`. Otherwise any other method answers `405` with `Allow: POST, GET, DELETE`.

### JSON-RPC framing

|Feature|Implemented|Notes|
|---|---|---|
|One request or notification per `POST`|Yes||
|Batches (a JSON array)|No|Refused with `400`, code `-32600`, message `Invalid request`, and no `id`.|
|By-position (array) `params`|No|Refused with `400`, code `-32600`. Every MCP method takes an object.|
|Request `id` as string or integer|Yes|A fractional, boolean or `null` `id` is refused with `400`, code `-32600`.|
|Client notifications|Yes|Answered `202` with no body. Inside a handshake-era session, `notifications/cancelled` cancels the named in-flight call; Bondy acts on no other client notification.|
|Response framing|JSON|Every `POST` response is a single `application/json` body, except `subscriptions/listen`, which answers with an event stream.|

### Request headers

|Header|Era|Contract|
|---|---|---|
|`MCP-Protocol-Version`|Modern|Required. Must equal the body's `params._meta."io.modelcontextprotocol/protocolVersion"`; otherwise `400`, code `-32020`. A revision the endpoint does not accept answers `400`, code `-32022`, whose `data` carries `supported` and `requested`.|
|`MCP-Protocol-Version`|Handshake|Optional after `initialize`. When present it must be a handshake-era revision the endpoint accepts; otherwise `400`, code `-32600`.|
|`Mcp-Method`|Modern|Required on every request. Must equal the body's `method`; otherwise `400`, code `-32020`.|
|`Mcp-Name`|Modern|Required on `tools/call` (equal to `params.name`) and `resources/read` (equal to `params.uri`). A `=?base64?…?=` value is decoded before comparison.|
|`Mcp-Param-{Name}`|Modern|Required on `tools/call` for each `inputSchema` property that carries `x-mcp-header` and is present in `arguments`; must be absent when the argument is absent. A mismatch answers `400`, code `-32020`.|
|`Mcp-Session-Id`|Handshake|Returned on the `initialize` response; addresses the session on every later request. It is never a credential: each request is authenticated on its own. An unknown, closed, or foreign session answers `404`, code `-32001`, and the client re-initializes.|
|`Origin`|Both|Checked against [`listeners.$name.mcp.allowed_origins`](/router/reference/configuration/mcp#listeners.$name.mcp.allowed_origins). A request without `Origin` is served.|

## Methods

|Method|Modern era|Handshake era|Notes|
|---|---|---|---|
|`initialize`|—|Yes|Selects the handshake era. A repeat `initialize` that carries `Mcp-Session-Id` answers code `-32600`.|
|`server/discover`|Yes|No|Returns `supportedVersions` (the modern-era revisions the endpoint accepts), `capabilities`, and `_meta."io.modelcontextprotocol/serverInfo"`.|
|`ping`|No|Yes|Returns an empty result.|
|`tools/list`|Yes|Yes|Paginated. See [Tools](#tools).|
|`tools/call`|Yes|Yes|See [Tools](#tools).|
|`resources/list`|No|Yes|Lists topic-backed resources.|
|`resources/templates/list`|No|Yes|Lists resource templates.|
|`resources/read`|Yes|Yes|Resolves resource templates only. See [Resources](#resources).|
|`resources/subscribe`|No|Yes|Notifications arrive on the session's `GET` stream.|
|`resources/unsubscribe`|No|Yes||
|`subscriptions/listen`|Yes|No|Answers with an event stream. See [Notifications](#notifications).|
|`prompts/list`, `prompts/get`|No|No|See [Prompts](#prompts).|
|`completion/complete`, `logging/setLevel`|No|No||

A method Bondy does not implement for the request's era answers code `-32601`, message `Method not found: <method>`: with HTTP `404` in the modern era, and with HTTP `200` inside a handshake-era session.

## Capabilities

`initialize` (as `capabilities`) and `server/discover` announce the same set:

```json
{
  "tools": {"listChanged": true},
  "resources": {"subscribe": true, "listChanged": true}
}
```

The server name in `serverInfo` is `Bondy`; the version is the router's release version.

### Tools

A tool is a manifest entry of kind `tool`, backed by one exact-match WAMP procedure. Calling the tool is a WAMP call to that procedure, authorized as `wamp.call` on the procedure.

|Feature|Implemented|Notes|
|---|---|---|
|`tools/list` pagination|Yes|Keyset cursor over tool names, page size [`listeners.$name.mcp.list.default_page_size`](/router/reference/configuration/mcp#listeners.$name.mcp.list.default_page_size). An invalid cursor answers code `-32602`.|
|RBAC projection|Yes|A tool whose procedure the caller may not call is absent from `tools/list`, and calling it answers exactly as for a tool that does not exist.|
|Tool `name`, `description`, `inputSchema`, `outputSchema`, `annotations`|Yes|A tool with no input schema advertises `{"type": "object"}`.|
|Tool `title`, `icons`|No||
|Content hash|Yes|Bondy-specific. Each tool carries `_meta."bondy:hash"`, the SHA-256 of its normative content.|
|`structuredContent` and `content`|Yes|A result carries both: `structuredContent` holds the WAMP result, and `content` holds one `text` item with the same value as JSON.|
|Tool errors as results|Yes|A WAMP error becomes a result with `isError: true`. See [Tool results](#tool-results).|
|Trace context in `_meta`|Yes|`traceparent`, `tracestate` and `baggage` in `params._meta` are forwarded to the WAMP call unchanged.|
|Cancellation|Handshake era|`notifications/cancelled` cancels the WAMP call, with the cancel mode in the entry's `wamp_options.cancel_mode` (`killnowait` by default).|

The modern-era `tools/list` result carries three fields beyond `tools` and `nextCursor`:

|Field|Value|
|---|---|
|`resultType`|`complete`|
|`ttlMs`|The value of [`mcp.manifest.cache_ttl`](/router/reference/configuration/mcp#mcp.manifest.cache_ttl), in milliseconds (`60000` by default).|
|`cacheScope`|Always `private`. The list is projected per principal, so a shared cache would expose one principal's tools to another.|

The handshake-era `tools/list` result carries `tools` and `nextCursor` only.

#### Arguments

MCP `arguments` is one object; a WAMP call carries positional and keyword arguments. Bondy maps between them through the reserved key `@args`:

- `arguments."@args"`, which must be an array, becomes the positional arguments. Every other key becomes a keyword argument.
- A WAMP result maps back the same way: keyword results become the keys of `structuredContent`, and positional results, when present, ride under `@args`.
- Argument names beginning with `_mcp` are reserved for Bondy's channel to the callee. A request that uses one answers `400`, code `-32602`.

Of the entry's `wamp_options`, Bondy applies `timeout` and `disclose_me` to the WAMP call, and `cancel_mode` to handshake-era cancellation.

#### Tool results

|Outcome|Result|
|---|---|
|The callee returns a result|`resultType: "complete"`, `isError: false`, `structuredContent`, `content`.|
|The call fails with a WAMP error|`resultType: "complete"`, `isError: true`. `structuredContent` holds the error payload plus `retryable`, and `_meta."bondy:error_uri"` holds the WAMP error URI.|
|The callee needs more input (modern era)|`resultType: "input_required"`. See [Input requests from a callee](#input-requests-from-a-callee).|

`retryable` is `true` for `wamp.error.no_such_procedure`, `wamp.error.no_available_callee` and `wamp.error.timeout`, and `false` for every other URI. A declared tool whose procedure has no callee at the moment is a transient gap, not an absent tool.

### Resources

Bondy serves two kinds of resource entry.

|Entry kind|Backed by|URI|Read|Subscribe|
|---|---|---|---|---|
|`resource`|An exact-match WAMP topic|`wamp:<realm>:<topic>`|No|Yes|
|`resource_template`|An exact-match WAMP procedure|An RFC 6570 `uri_template`|Yes|When the entry declares `update_topic`|

`resources/read` matches the URI against the realm's resource templates, binds the template variables (validated against the entry's `uri_vars_schema`) into the entry's `wamp_args` and `wamp_kwargs`, and calls the procedure. The result is one `contents` item with `mimeType: "application/json"` and the WAMP result as JSON `text`, plus `ttlMs: 0` and `cacheScope: "private"`. A topic-backed `resource` has no value to read; reading its URI answers as an unknown resource.

The modern era implements no resource listing: a modern-era client reaches a resource or template only through a URI it already knows.

Visibility follows the backing WAMP action: a template is listed and read under `wamp.call` on its procedure, a topic-backed resource under `wamp.subscribe` on its topic. A subscription is authorized as `wamp.subscribe` on the update topic. A hidden entry answers as an absent one.

|Failure|Modern era|Handshake era|
|---|---|---|
|Unknown or hidden resource|`400`, code `-32602`, `Unknown resource`|`200`, code `-32002`, `Resource not found`|
|A template variable fails its schema|`400`, code `-32602`|`200`, code `-32602`|
|The procedure fails|`500`, code `-32603`, `Resource read failed`, `data."bondy:error_uri"`|Same|

### Notifications

|Notification|Modern era|Handshake era|Notes|
|---|---|---|---|
|`notifications/tools/list_changed`|Yes|Yes|Sent when a manifest rebuild changes the realm's tools.|
|`notifications/resources/list_changed`|Yes|Yes|Sent when a manifest rebuild changes the realm's resources.|
|`notifications/resources/updated`|Yes|Yes|Sent when an event is published on a subscribed resource's topic. Carries only `uri`; the client reads the resource again.|
|`notifications/prompts/list_changed`|No|No||
|`notifications/subscriptions/acknowledged`|Yes|—|The first message of a `subscriptions/listen` stream.|

In the modern era, `subscriptions/listen` takes a `notifications` filter with `toolsListChanged`, `resourcesListChanged`, `promptsListChanged` (booleans) and `resourceSubscriptions` (a list of resource URIs). The acknowledgment names only what Bondy honours. A URI that does not resolve to an update topic, or whose topic the caller may not subscribe to, is left out of the acknowledgment without an error. `promptsListChanged` is accepted and never honoured. A server-initiated close sends `notifications/cancelled` naming the `subscriptions/listen` request, then a final result with `resultType: "complete"`.

In the handshake era, notifications queue on the session and are delivered on its `GET` stream; a backlog that builds while no stream is open is delivered when one opens.

### Prompts

Bondy implements no prompts. It announces no `prompts` capability, answers `prompts/list` and `prompts/get` with code `-32601`, and never honours `promptsListChanged`.

## Input requests from a callee

The modern era implements the multi-round-trip mechanism: a tool call can answer that it needs more input, and the client retries with that input. The callee is an ordinary WAMP callee; it signals the need through a WAMP error.

**The callee's signal.** The callee answers the invocation with the error URI `bondy.error.mcp.input_required` and these keyword arguments:

|Keyword argument|Contract|
|---|---|
|`input_requests`|An object. Each key is a name the callee chooses; each value is an object with `method` and `params` (an object). `method` must be `elicitation/create`, `roots/list` or `sampling/createMessage`.|
|`state`|Any value. The callee's own continuation, returned to it on the retry.|

At least one of the two must be present, and `input_requests`, when present alone, must be non-empty. A signal that breaks this contract, or whose sealed `state` exceeds [`mcp.request_state.max_size`](/router/reference/configuration/mcp#mcp.request_state.max_size), is a callee defect: the client receives `500`, code `-32603`, and the signal is logged.

**What the client receives.** A result with `resultType: "input_required"`, `inputRequests` (the callee's `input_requests`, unchanged) and `requestState` (the callee's `state`, sealed as a JWE under the realm's encryption keys). Bondy omits whichever of the two the callee did not supply.

**The retry.** The client repeats `tools/call` with the same `name` and `arguments`, adding `inputResponses` (an object) and `requestState`. Bondy opens `requestState` only for the same principal, tool and arguments, and only before [`mcp.request_state.ttl`](/router/reference/configuration/mcp#mcp.request_state.ttl) expires; any failure answers `400`, code `-32602`, message `invalid, expired or mismatched requestState`. The callee then receives two extra keyword arguments:

|Keyword argument|Value|
|---|---|
|`_mcp_input_responses`|The client's `inputResponses` object, unchanged.|
|`_mcp_state`|The `state` the callee returned on the previous round.|

The callee may answer the retry with a result, an error, or another `bondy.error.mcp.input_required`.

**Handshake era.** These revisions have no `input_required` result. A callee's `bondy.error.mcp.input_required` reaches a handshake-era client as an ordinary tool error: `isError: true`, `retryable: false`, and `_meta."bondy:error_uri"` set to `bondy.error.mcp.input_required`.

## Overlay field names

[Overlay documents](/router/reference/wamp_api/mcp) are written in snake case. Bondy maps them to the MCP wire names.

|Overlay field|MCP field|Notes|
|---|---|---|
|`args_schema`, `kwargs_schema`|`inputSchema`|Keyword schema only: used as is. Positional schema only: wrapped as an object with the required property `@args`. Both: `@args` is added to the keyword schema's `properties`.|
|`result_args_schema`, `result_kwargs_schema`|`outputSchema`|Combined the same way. A `resource_template` entry must declare at least one of them.|
|`annotations.read_only_hint`|`annotations.readOnlyHint`||
|`annotations.destructive_hint`|`annotations.destructiveHint`||
|`annotations.idempotent_hint`|`annotations.idempotentHint`||
|`annotations.open_world_hint`|`annotations.openWorldHint`||

Any other annotation key passes through unchanged. Each overlay field left out falls through to the [interface metadata](/router/reference/wamp_api/interface) of the entry's procedure or topic, which uses the same schema field names.

## Authentication and admission

Authentication is Bondy's own and runs on every request, in both eras. On a realm with security disabled every request is anonymous.

|`Authorization` header|Method|
|---|---|
|`Bearer` with a JWT that carries `sub`|OAuth2, validated against the realm's OAuth2 configuration.|
|`Bearer` with any other token|A [Bondy ticket](/router/reference/wamp_api/ticket).|
|`Basic`|The realm's password authentication.|
|Absent|Anonymous, where the realm admits anonymous authentication.|
|Any other scheme|Refused with `401`.|

|Status|When|Body|
|---|---|---|
|`401`|Authentication fails.|Empty. The response carries `WWW-Authenticate: Bearer`.|
|`403`|The request carries an `Origin` that the listener does not allow.|Code `-32600`, `Origin not allowed`.|
|`413`|The body exceeds [`listeners.$name.mcp.max_body_size`](/router/reference/configuration/mcp#listeners.$name.mcp.max_body_size).|Code `-32600`.|
|`429`|The source IP has exhausted the `http` rate-limit bucket (`security.rate_limit.*`).|Code `-32000`, `Too many requests`. The response carries `Retry-After: 1`.|

Bondy answers no `403` for authorization. A caller without permission on a tool or resource gets the answer for an absent one.

## Status codes inside a handshake-era session

The transport reserves `404` for an unknown or terminated session, and a client re-initializes on it. Inside an established session, Bondy therefore answers JSON-RPC errors that the modern era sends with `400` or `404` with HTTP `200` instead. `401`, `403`, `413`, `429` and `500` keep their status in both eras.

## Upstream MCP servers

Bondy is also an MCP client. Each enabled [`mcp.upstreams.$upstream`](/router/reference/configuration/mcp#upstream-mcp-servers) declaration connects to one upstream MCP server and registers each of its tools as a WAMP procedure in the declared realm.

|Feature|Implemented|Notes|
|---|---|---|
|Protocol revisions as a client|`2025-11-25`, `2025-06-18`|Handshake era only: `initialize`, `Mcp-Session-Id`, `MCP-Protocol-Version`.|
|JSON and event-stream responses|Yes||
|Upstream `ping` inside a response stream|Yes|Answered with an empty result; any other server request is answered `-32601`.|
|Expired upstream session|Yes|On `404`, Bondy re-initializes once and retries the call once.|
|Upstream resources and prompts|No|Only tools are projected.|

**Procedure URIs.** A tool registers as `<prefix>.<name>`, where `<name>` is the tool name lowercased with every character outside `a`–`z`, `0`–`9` and `_` replaced by `_`. When two tools map to one URI, the first by original name wins and the other is skipped with an error log. Callers pass keyword arguments only, using `@args` for positional ones, matching the tool's `inputSchema`.

**Errors.**

|WAMP error URI|When|
|---|---|
|`bondy.error.mcp.upstream_tool_error`|The upstream result has `isError: true`. The upstream's own error URI is not used: upstream output is untrusted.|
|`bondy.error.mcp.upstream_error`|The upstream answered with a JSON-RPC error. The `error` keyword argument carries the upstream error object.|
|`bondy.error.bad_gateway`|No upstream session is available.|

**Pinning and drift.** The first time Bondy sees an upstream tool, it stores a SHA-256 hash of the tool's `name`, `title`, `description`, `inputSchema`, `outputSchema` and `annotations`. When a later listing returns a different definition, Bondy unregisters the tool's procedure and blocks it until an operator approves the new definition.

**Operator controls.** Approving drift, forcing a refresh, and inspecting an upstream are available only as Erlang functions, called from an Erlang shell attached to the node that runs the upstream. No WAMP procedure or HTTP API exposes them.

|Function|Effect|
|---|---|
|`bondy_mcp_upstream:approve(Upstream, Tool)`|Pins a blocked tool at its current upstream definition and registers it. One tool per call; there is no bulk form.|
|`bondy_mcp_upstream:refresh(Upstream)`|Lists the upstream's tools again: registers new tools, unregisters removed ones, and blocks drifted ones.|
|`bondy_mcp_upstream:info(Upstream)`|Returns `{ok, #{connected => boolean(), registered => #{Tool => Uri}, blocked => [Tool]}}`.|

`Upstream` and `Tool` are binaries: the declaration's name and the upstream's original tool name. An unknown upstream returns `{error, {unknown_upstream, Upstream}}`.

## Departures from the specification

### D1

**Requirement — protected-resource metadata.** An MCP server that uses OAuth publishes an OAuth 2.0 Protected Resource Metadata document (RFC 9728) and names it in the `WWW-Authenticate` header of a `401`, so a client can discover the authorization server.

**Behaviour.** The metadata path is mounted and answers `501`. A `401` carries `WWW-Authenticate: Bearer` with no `resource_metadata` parameter. A client must be configured with its credentials, or with the authorization server, out of band.

### D2

**Requirement — unknown tool.** A `tools/call` naming an unknown tool is a protocol error with code `-32602` (Invalid params).

**Behaviour.** Bondy answers code `-32601` with message `Method not found: <tool name>`, and in the modern era HTTP `404`. A tool hidden from the caller by RBAC gets the same answer.
