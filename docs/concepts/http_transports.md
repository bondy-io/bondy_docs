---
outline: [2,3]
related:
    - text: OIDC Authentication
      type: Concepts
      link: /concepts/oidc_authentication
      description: Learn how to authenticate users via external Identity Providers using OpenID Connect.
    - text: OIDC HTTP API Reference
      type: HTTP API Reference
      link: /reference/http_api/oidc
      description: Detailed reference for the OIDC login, callback, and logout HTTP endpoints.
    - text: Realms
      type: Concepts
      link: /concepts/realms
      description: Realms are the administrative and security boundary in Bondy.
---
# HTTP Transports: Longpoll & SSE

Bondy provides two HTTP-based transports for WAMP sessions, enabling WAMP communication in environments where WebSocket connections are unavailable or impractical.

## Overview

::: definition HTTP Transports
HTTP transports allow clients to establish WAMP sessions using standard HTTP requests instead of WebSocket connections. They provide the same WAMP semantics (RPC and Pub/Sub) through a request/response interface combined with either long-polling or Server-Sent Events for server-to-client messaging.
:::

Both transports support **cookie-based authentication**, which is designed to work seamlessly with [OIDC authentication](/concepts/oidc_authentication). After a user authenticates via OIDC, the browser automatically sends the ticket cookie with every transport request, enabling a frictionless transition from web login to WAMP session.

### When to Use HTTP Transports

| Transport | Best For |
|:---|:---|
| **WebSocket** | Full-duplex, low-latency WAMP communication (preferred when available) |
| **Longpoll** | Environments that block WebSocket (corporate proxies, restrictive firewalls) |
| **SSE** | Browser-based apps that need efficient server push with HTTP/2 multiplexing |

## Long Polling

The Longpoll transport uses a request/response cycle to exchange WAMP messages. The client sends messages via `POST` and receives messages by issuing blocking `POST` requests that the server holds open until a message is available or a timeout occurs.

### Protocol

The Longpoll transport uses the `wamp.2.json` sub-protocol. All WAMP messages are JSON-encoded.

### Session Lifecycle

```
Client                          Bondy
  │                               │
  │  POST /wamp/longpoll/open     │
  │  {"protocols":["wamp.2.json"]}│
  │──────────────────────────────>│
  │  200 {"transport":"<id>"}     │
  │<──────────────────────────────│
  │                               │
  │  POST /<id>/send              │
  │  [HELLO, ...]                 │
  │──────────────────────────────>│
  │  202 Accepted                 │
  │<──────────────────────────────│
  │                               │
  │  POST /<id>/receive           │
  │  (blocks until message ready) │
  │──────────────────────────────>│
  │  200 [WELCOME, ...]           │
  │<──────────────────────────────│
  │                               │
  │  ... send/receive cycle ...   │
  │                               │
  │  POST /<id>/close             │
  │──────────────────────────────>│
  │  202 Accepted                 │
  │<──────────────────────────────│
```

### Endpoints

| Route | Method | Description |
|:---|:---|:---|
| `/wamp/longpoll/open` | POST | Create a new transport session |
| `/wamp/longpoll/:transport_id/send` | POST | Send a WAMP message |
| `/wamp/longpoll/:transport_id/receive` | POST | Long-poll for a WAMP message |
| `/wamp/longpoll/:transport_id/close` | POST | Terminate the transport session |

All endpoints also accept `OPTIONS` for CORS preflight.

#### Open

Creates a new transport session.

::: code-group
```bash [Request]
curl -X POST "https://api.example.com/wamp/longpoll/open" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <csrf_token>" \
  -b "bondy_ticket_com.example.myrealm=<jwt>; bondy_csrf_com.example.myrealm=<csrf_token>" \
  -d '{"protocols": ["wamp.2.json"]}'
```

```json [Response 200]
{
    "protocol": "wamp.2.json",
    "transport": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```
:::

If a `bondy_ticket_<realm>` cookie is present and valid, the ticket claims are stored in the transport session and used for [cookie-based authentication](#cookie-based-authentication).

#### Send

Sends a JSON-encoded WAMP message.

::: code-group
```bash [Request]
curl -X POST "https://api.example.com/wamp/longpoll/<transport_id>/send" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <csrf_token>" \
  -b "bondy_ticket_com.example.myrealm=<jwt>; bondy_csrf_com.example.myrealm=<csrf_token>" \
  -d '[1, "com.example.myrealm", {"authmethods": ["cookie"], "roles": {"caller": {}, "subscriber": {}}}]'
```
:::

Returns `202 Accepted` on success, `404` if the transport is not found.

#### Receive

Blocks until a WAMP message is available or the timeout expires.

Returns `200` with the JSON-encoded WAMP message, or `204 No Content` on timeout.

::: info
The receive timeout is configured by `wamp_longpoll.idle_timeout` and defaults to 30 seconds. The client should immediately issue a new receive request after each response to maintain the long-polling loop.
:::

#### Close

Terminates the transport session and the associated WAMP session.

Returns `202 Accepted`.


## Server-Sent Events (SSE)

The SSE transport uses POST endpoints for client-to-server messages (same as Longpoll) and a persistent SSE connection for server-to-client messages. This provides more efficient server push compared to long-polling.

### Protocol

The SSE transport uses the `wamp.2.json.sse` sub-protocol.

### Session Lifecycle

```
Client                          Bondy
  │                               │
  │  POST /wamp/sse/open          │
  │  {"protocols":["wamp.2.json.sse"]}
  │──────────────────────────────>│
  │  200 {"transport":"<id>"}     │
  │<──────────────────────────────│
  │                               │
  │  GET /<id>/receive            │
  │──────────────────────────────>│
  │  200 text/event-stream        │
  │<──────────── SSE stream ──────│
  │                               │
  │  POST /<id>/send              │
  │  [HELLO, ...]                 │
  │──────────────────────────────>│
  │  202 Accepted                 │
  │<──────────────────────────────│
  │                               │
  │  event: wamp                  │
  │  data: [WELCOME, ...]         │
  │<──────────────────────────────│
  │                               │
  │  ... send/receive cycle ...   │
  │                               │
  │  POST /<id>/close             │
  │──────────────────────────────>│
  │  202 Accepted                 │
  │<──────────────────────────────│
```

### Endpoints

| Route | Method | Description |
|:---|:---|:---|
| `/wamp/sse/open` | POST | Create a new transport session |
| `/wamp/sse/:transport_id/send` | POST | Send a WAMP message |
| `/wamp/sse/:transport_id/receive` | GET | Open an SSE event stream |
| `/wamp/sse/:transport_id/close` | POST | Terminate the transport session |

All endpoints also accept `OPTIONS` for CORS preflight.

#### Open

Identical to the Longpoll `/open` endpoint, but the protocol is `wamp.2.json.sse`:

::: code-group
```bash [Request]
curl -X POST "https://api.example.com/wamp/sse/open" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <csrf_token>" \
  -b "bondy_ticket_com.example.myrealm=<jwt>; bondy_csrf_com.example.myrealm=<csrf_token>" \
  -d '{"protocols": ["wamp.2.json.sse"]}'
```

```json [Response 200]
{
    "protocol": "wamp.2.json.sse",
    "transport": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```
:::

#### Send

Identical to the Longpoll `/send` endpoint.

#### Receive (SSE Stream)

Opens a persistent SSE connection. Unlike Longpoll, this is a `GET` request that returns a `text/event-stream` response.

```bash
curl -N "https://api.example.com/wamp/sse/<transport_id>/receive" \
  -H "Accept: text/event-stream" \
  -b "bondy_ticket_com.example.myrealm=<jwt>"
```

WAMP messages arrive as SSE events:
```
event: wamp
data: [2, 1, {}]

event: wamp
data: [36, 1234, 5678, {}, ["Hello, world!"]]
```

Special events:
- `event: transport_error` with `data: session_terminated` is sent when the transport session ends.
- Keepalive comments (`: keepalive`) are sent every 15 seconds to prevent connection timeout.

#### Close

Identical to the Longpoll `/close` endpoint.


## Cookie-Based Authentication

When a client opens a transport session (`/open`) and the request includes a valid `bondy_ticket_<realm>` cookie, Bondy uses **cookie-based authentication** to establish the WAMP session.

### How It Works

1. During `/open`, Bondy reads the `bondy_ticket_<realm>` cookie, verifies the JWT signature, and stores the ticket claims in the transport session.

2. The client sends a WAMP `HELLO` message with `authmethods: ["cookie"]`:
   ```json
   [1, "com.example.myrealm", {
       "authmethods": ["cookie"],
       "roles": {
           "caller": {},
           "subscriber": {}
       }
   }]
   ```

3. Bondy detects the stored auth claims and authenticates the session using the `cookie` auth method — no challenge is issued, and a `WELCOME` message is returned immediately.

4. On subsequent `/send` and `/receive` requests, Bondy re-validates the ticket cookie to ensure the session remains authorized.

::: warning Important
The realm's `authmethods` configuration must include both `"oidcrp"` and `"cookie"` for the OIDC-to-WAMP flow to work:

```json
{
    "uri": "com.example.myrealm",
    "authmethods": ["cryptosign", "wampcra", "ticket", "oidcrp", "cookie"]
}
```
:::


### CSRF Protection

[CSRF](/concepts/oidc_authentication#csrf-protection) validation is enforced on the following endpoints:

| Endpoint | CSRF Required |
|:---|:---|
| `/open` | Yes |
| `/send` | Yes |
| `/receive` | No |
| `/close` | Yes |

The `/receive` endpoint is exempt because it is either a blocking read (Longpoll) or a `GET` SSE stream, neither of which can be exploited via CSRF.

To pass CSRF validation, include the `X-CSRF-Token` header with the value of the `bondy_csrf_<realm>` cookie:

```javascript
const csrfToken = document.cookie
    .split('; ')
    .find(c => c.startsWith('bondy_csrf_com.example.myrealm='))
    ?.split('=')[1];

fetch('/wamp/longpoll/open', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
    },
    credentials: 'include',
    body: JSON.stringify({ protocols: ['wamp.2.json'] })
});
```


## Error Responses

All transport endpoints return JSON error bodies:

| Status | Error | Description |
|:---|:---|:---|
| 400 | `no_supported_protocol` | The `protocols` array in `/open` doesn't contain a supported protocol |
| 400 | `invalid_json` | The request body is not valid JSON |
| 401 | `unauthorized` | The ticket cookie is missing, invalid, or doesn't match the session |
| 403 | `csrf_validation_failed` | The `X-CSRF-Token` header is missing or doesn't match the CSRF cookie |
| 404 | — | The `transport_id` doesn't correspond to an active session |

::: code-group
```json [Error Response]
{
    "error": "csrf_validation_failed"
}
```
:::


## Transport Session Lifecycle

Each HTTP transport session is backed by a persistent server-side process that:

- Holds the WAMP protocol state (session, subscriptions, registrations)
- Buffers outbound WAMP messages until the client polls for them
- Times out after prolonged inactivity (default: 1 hour)
- Cleans up the WAMP session when the transport process terminates

::: info Inactivity Timeout
If no client requests arrive within the configured inactivity timeout, the transport session is terminated along with its WAMP session. The timeout is reset on each request. For SSE, an active SSE stream connection prevents the inactivity timeout from firing.
:::
