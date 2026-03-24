---
outline: [2,3]
related:
    - text: RPC Gateway Configuration Reference
      type: Configuration Reference
      link: /reference/configuration/rpc_gateway
      description: Complete bondy.conf reference for all RPC Gateway service configuration keys.
    - text: RPC Gateway Guide
      type: How-to Guide
      link: /guides/programming/rpc_gateway
      description: Step-by-step guide to setting up the RPC Gateway with practical examples.
    - text: HTTP API Gateway Specification
      type: Reference
      link: /reference/api_gateway/specification
      description: The HTTP API Gateway translates incoming HTTP requests into WAMP calls — the inverse direction.
---
# RPC Gateway

The RPC Gateway bridges WAMP RPC procedures to upstream HTTP/REST services, allowing WAMP clients to call registered procedures that are transparently translated into HTTP requests.

## Overview

::: definition RPC Gateway
The RPC Gateway is a Bondy subsystem that registers WAMP procedures and, when called, translates the call arguments into an outgoing HTTP request to an upstream service. The HTTP response is then mapped back to a WAMP result or error. It enables WAMP clients to interact with external REST APIs without any HTTP-specific code.
:::

The RPC Gateway is the **inverse** of the [HTTP API Gateway](/reference/api_gateway/specification):

| | HTTP API Gateway | RPC Gateway |
|:---|:---|:---|
| **Direction** | HTTP → WAMP | WAMP → HTTP |
| **Input** | Incoming HTTP request | Incoming WAMP Call |
| **Output** | WAMP call result as HTTP response | Outgoing HTTP request result as WAMP response |
| **Use case** | Expose WAMP services as REST APIs | Consume REST APIs from WAMP clients |
| **Configuration** | JSON API Specification | `bondy.conf` service definitions |

## How It Works

```
WAMP Call(KWArgs)
  │
  ├─ 1. Extract custom headers from KWArgs["_headers"]
  ├─ 2. Interpolate path template variables (consumed from KWArgs)
  ├─ 3. Route remaining KWArgs by HTTP method:
  │       GET / DELETE / HEAD  → query parameters
  │       POST / PUT / PATCH   → JSON request body
  ├─ 4. Acquire auth token (via token cache)
  ├─ 5. Apply auth to headers/URL
  └─ 6. HTTP request (with retries + auth retry on 401/403)
          │
          └─ HTTP Response → WAMP Result / Error
```

### Step-by-step

1. **Custom headers** — If the call kwargs contain a `_headers` key, its value (a map of header name → value) is extracted and merged with the default `Content-Type` and `Accept` headers. The `_headers` key is removed before further processing.

2. **Path interpolation** — The procedure's path template (e.g. `/invoices/{{id}}`) is evaluated against the remaining kwargs. Matched keys are **consumed** — they are removed from kwargs after substitution. Missing template variables cause an immediate `wamp.error.invalid_argument` error.

3. **KWArgs routing** — The remaining kwargs (after path interpolation) are routed based on the HTTP method:
   - **GET, DELETE, HEAD** → URL query parameters (body is empty)
   - **POST, PUT, PATCH** → JSON request body (no query parameters)

4. **Authentication** — A token is acquired from the per-service token cache. If the cache is empty, the gateway fetches a token from the configured auth endpoint. Tokens are cached with preemptive refresh.

5. **HTTP request** — The request is sent to the upstream service with configurable retries and exponential backoff on connection failures.

6. **Response mapping** — The HTTP response is mapped back to a WAMP result (2xx) or error (non-2xx).


## Architecture

The RPC Gateway runs as a separate OTP application (`bondy_rpc_gateway`) started automatically by Bondy after the public listeners are ready. If no services are configured, the subsystem remains idle with no resource overhead.

Each configured service gets:

- **A dedicated connection pool** — A [hackney](https://github.com/benoitc/hackney) HTTP connection pool with configurable size, timeouts, and health checks.
- **A token cache** — Per-service token caching with preemptive refresh and thundering herd protection. The cache uses a lock-free ETS read path for the hot path and serializes fetches through a gen_server to prevent concurrent duplicate token requests.
- **One or more WAMP callees** — Each service/realm pair spawns a process that registers the configured procedures with the Bondy Dealer.

::: info Lazy Startup
The RPC Gateway only starts supervision tree children when services are configured. An empty configuration results in zero overhead.
:::


## Request Routing

### Path Template Variables

Path templates use `{{var}}` placeholders that are filled from the call kwargs. Matched keys are consumed — they do not appear in the query string or request body.

```
Template:  /orgs/{{org}}/invoices/{{id}}
KWArgs:    {"org": "acme", "id": "42", "status": "paid"}

Result:    /orgs/acme/invoices/42
Remaining: {"status": "paid"}
```

### GET, DELETE, HEAD

Remaining kwargs become **URL query parameters**. The request body is always empty.

```
Procedure: com.billing.get_invoice (GET /invoices/{{id}})
KWArgs:    {"id": "INV-001", "expand": "lines"}

→ GET /invoices/INV-001?expand=lines
```

### POST, PUT, PATCH

Remaining kwargs become the **JSON request body**. No query parameters are appended.

```
Procedure: com.billing.create_invoice (POST /invoices)
KWArgs:    {"customer": "cust-42", "amount": 2500}

→ POST /invoices
  Content-Type: application/json
  {"customer":"cust-42","amount":2500}
```

### Custom Headers

Pass a `_headers` key in kwargs to inject custom HTTP headers:

```json
{
    "_headers": {"X-Request-ID": "req-42", "X-Tenant": "acme"},
    "id": "INV-001"
}
```

The `_headers` map is extracted first and merged with the default headers. It does not appear in query params or the request body.


## Authentication

The RPC Gateway supports pluggable authentication for upstream services. The built-in `generic` module provides a declarative configuration for common patterns.

### Token Acquisition

The gateway can acquire tokens from an OAuth2 token endpoint (or any HTTP endpoint that returns a token). You configure:

- The HTTP method and URL for the token request
- Request body key-value pairs (supports `form`, `json`, or `none` encoding)
- Optional HTTP Basic authentication on the token request itself
- The JSON path to extract the token from the response
- The JSON path to extract the token TTL

### Token Placement

Once acquired, the token is applied to each upstream request using one of:

- **Header** (default) — e.g. `Authorization: Bearer <token>`
- **Query parameter** — e.g. `?api_key=<token>`

The format is configurable with a `{{token}}` placeholder.

### Variable Interpolation

All auth-related URLs, headers, body values, and basic auth credentials support `{{var}}` interpolation from a configurable variable map. This allows you to keep credentials in one place and reference them throughout the auth configuration.

### Token Cache

Tokens are cached per-service with:

- **Configurable TTL** — Defaults to 1 hour, or uses the `expires_in` value from the token response.
- **Preemptive refresh** — Tokens are refreshed in the background before they expire (default: 1 minute before expiry).
- **Thundering herd protection** — Concurrent token requests from multiple callers are serialized; only one fetch is performed, and all callers receive the result.
- **Auth rejection retry** — If an upstream returns 401 or 403, the cached token is invalidated, a fresh token is fetched, and the request is retried once.


## Secret Management

For production deployments, you can store credentials in an external secrets provider instead of the `bondy.conf` file. The RPC Gateway currently supports **AWS Secrets Manager**.

Secrets are resolved at startup and mapped into the auth variable bindings (`auth.vars`), overriding any static values. Each secret variable specifies:

- The JSON field name in the secret
- An optional transform: `none` (raw value), `basic_username` (extract username from `Basic base64(user:pass)`), or `basic_password` (extract password)

::: info Resilient Startup
If secret resolution fails at startup (e.g. AWS is unreachable), the service is registered immediately but marked as "not ready". WAMP calls receive a `bondy.error.bad_gateway` (503) error. Secret resolution is retried in the background with exponential backoff until it succeeds.
:::


## Error Handling

### HTTP Status to WAMP Error Mapping

| HTTP Status | WAMP Error URI |
|:---|:---|
| 400 | `wamp.error.invalid_argument` |
| 401 | `wamp.error.not_authorized` |
| 403 | `wamp.error.not_authorized` |
| 404 | `wamp.error.not_found` |
| 408 | `wamp.error.timeout` |
| 422 | `wamp.error.invalid_argument` |
| 429 | `bondy.error.too_many_requests` |
| 4xx (other) | `bondy.error.invalid_argument` |
| 502 | `bondy.error.bad_gateway` |
| 503 | `bondy.error.bad_gateway` |
| 504 | `wamp.error.timeout` |
| 5xx (other) | `bondy.error.bad_gateway` |

### WAMP Return Format

**Success (2xx):**
```json
{
    "status": 200,
    "body": {"id": "INV-001", "amount": 1500}
}
```

**Error (non-2xx):**

The WAMP error kwargs contain the HTTP status and response body:
```json
{
    "status": 404,
    "body": {"error": "not found"}
}
```

### Retries

HTTP requests are retried on connection failures with exponential backoff:

| Attempt | Backoff |
|:---|:---|
| 1 | 0 ms (immediate) |
| 2 | 300 ms |
| 3 | 600 ms |
| 4 | 1200 ms |

Default: 3 retries, 30 second timeout. Both are configurable per service.

### Auth Rejection Auto-Retry

When the upstream returns 401 or 403, the gateway automatically:

1. Invalidates the cached auth token
2. Fetches a fresh token from the auth provider
3. Retries the request once with the new token

If the retry also fails, the error response is returned normally.
