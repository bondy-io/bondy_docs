---
outline: [2,3]
related:
    - text: OIDC Authentication
      type: Concepts
      link: /connect/concepts/oidc_authentication
      description: Learn how OIDC authentication works in Bondy, including provider configuration and the end-to-end flow.
    - text: HTTP Transports (Longpoll & SSE)
      type: Concepts
      link: /connect/concepts/http_transports
      description: Learn how to use cookie-based authentication with HTTP transports.
    - text: HTTP API Gateway Specification
      type: Reference
      link: /connect/reference/api_gateway/specification
      description: Learn how to define API Gateway specifications that enable OIDC security schemes.
---
# OIDC HTTP API

The OIDC endpoints implement the OpenID Connect Authorization Code flow with PKCE. They are automatically registered when an API Gateway Specification includes an `oidc` security scheme.

## Prerequisites

Before using the OIDC endpoints:

1. Configure an OIDC provider in the realm's `info.oidc_providers` (see [OIDC Authentication](/connect/concepts/oidc_authentication#oidc-provider-configuration)).
2. Include `"oidcrp"` and `"cookie"` in the realm's `authmethods`.
3. Load an API Gateway Specification with an `oidc` security scheme.

## API

The following endpoints are registered under the API version's `base_path`:

| Name | Method | URL |
|:---|:---|:---|
| [Login](#login) | GET | `<base_path>/oidc/login` |
| [Callback](#callback) | GET | `<base_path>/oidc/<provider>/callback` |
| [Logout](#logout) | GET, POST | `<base_path>/oidc/logout` |
| Verify | GET, HEAD | `<base_path>/oidc/verify`, or the scheme's `verify_path` |

`<provider>` is the value of the security scheme's `provider` key. The verify endpoint checks a Bondy credential for a reverse proxy, for example an NGINX `auth_request`. It answers `200` with the identity when the credential is valid, and `401` otherwise. See the [HTTP API Gateway Specification](/connect/reference/api_gateway/specification).

The login, callback and logout endpoints support `OPTIONS` for CORS preflight. The `Access-Control-Allow-Origin` header is set to the request's `Origin` header value.

An error response from the login or callback endpoint has a JSON body. The body holds `error`, the error name that the examples below show. The body also holds the standard [error payload](/connect/reference/errors#the-error-payload). In that payload, `uri` is `bondy.error.<error>`, `code` is the error name, `handle` is `S002` and `nature` is `transient`. The `no_such_realm` error is the exception: it carries the payload of [`wamp.error.no_such_realm`](/connect/reference/wamp_api/errors/wamp_no_such_realm), with `handle` `W001`, `nature` `permanent` and the realm URI in `realm_uri`. The examples show only the `error` key.

The login and callback endpoints answer `404` with `unknown_provider` when the realm has no OIDC provider of that name. This includes a realm whose providers a realm update removed. They answer `404` with `no_such_realm` when the route's realm no longer exists. A method that an endpoint does not accept answers `405` with an empty body.


## Login

Initiates the OIDC Authorization Code flow by redirecting the user to the Identity Provider's authorization endpoint.

### Request

```
GET <base_path>/oidc/login
```

The route always uses the provider that the security scheme names in its `provider` key.

#### Query Parameters

| Parameter | Type | Default | Description |
|:---|:---|:---|:---|
| `redirect_uri` | string | `"/"` | The SPA URL to redirect to after successful authentication |
| `client_id` | string | `"all"` | Scopes the Bondy ticket to a specific client application |
| `device_id` | string | `"all"` | Scopes the Bondy ticket to a specific device |

### Responses

#### Success — 302 Found

Redirects to the IdP's authorization endpoint with `state`, `nonce`, PKCE `code_challenge`, configured `scopes`, and the `redirect_uri`.

#### Errors

::: code-group
```json [404 — unknown_provider]
{
    "error": "unknown_provider"
}
```

```json [404 — no_such_realm]
{
    "error": "no_such_realm"
}
```

```json [500 — authorization_url_failed]
{
    "error": "authorization_url_failed"
}
```

```json [500 — provider_unavailable]
{
    "error": "provider_unavailable"
}
```
:::

### Example

```bash
# Redirect user to login with the provider of the route's security scheme
# After authentication, redirect back to /app/dashboard
curl -v "https://api.example.com/v1.0/oidc/login?redirect_uri=/app/dashboard"

# Response:
# HTTP/2 302
# Location: https://login.microsoftonline.com/.../authorize?response_type=code&client_id=...&redirect_uri=...&state=...&nonce=...&code_challenge=...&scope=openid+profile+email
```


## Callback

Receives the authorization callback from the IdP, exchanges the authorization code for tokens, issues a Bondy ticket, and redirects to the SPA.

::: warning
This endpoint is called by the IdP, not directly by the SPA. The `redirect_uri` configured in the OIDC provider has to point to this endpoint.
:::

### Request

```
GET <base_path>/oidc/<provider>/callback
```

#### Query Parameters (set by the IdP)

| Parameter | Required | Description |
|:---|:---|:---|
| `code` | Yes | The authorization code from the IdP |
| `state` | Yes | The state token. It has to match the value generated during login. |

### Responses

#### Success — 302 Found

Sets two cookies and redirects to the SPA `redirect_uri` that was stored during the login step:

**Response Headers:**
```
HTTP/2 302
Location: /app/dashboard
Set-Cookie: bondy_ticket_com.example.myrealm=eyJhbG...; Path=/; Max-Age=2592000; SameSite=Lax; Secure; HttpOnly
Set-Cookie: bondy_csrf_com.example.myrealm=a1b2c3d4-...; Path=/; Max-Age=2592000; SameSite=Lax; Secure
```

#### Errors

::: code-group
```json [400 — missing_code_or_state]
{
    "error": "missing_code_or_state"
}
```

```json [400 — invalid_state]
{
    "error": "invalid_state"
}
```

```json [400 — state_expired]
{
    "error": "state_expired"
}
```

```json [400 — realm_mismatch]
{
    "error": "realm_mismatch"
}
```

```json [400 — token_exchange_failed]
{
    "error": "token_exchange_failed"
}
```

```json [400 — missing_authid_claim]
{
    "error": "missing_authid_claim"
}
```

```json [404 — unknown_provider]
{
    "error": "unknown_provider"
}
```

```json [404 — no_such_realm]
{
    "error": "no_such_realm"
}
```

```json [500 — provider_unavailable]
{
    "error": "provider_unavailable"
}
```

```json [500 — ticket_issue_failed]
{
    "error": "ticket_issue_failed"
}
```
:::


## Logout

Revokes the Bondy ticket, clears cookies, and optionally performs RP-Initiated Logout at the IdP.

### Request

```
GET <base_path>/oidc/logout
POST <base_path>/oidc/logout
```

#### Query Parameters

| Parameter | Type | Default | Description |
|:---|:---|:---|:---|
| `realm` | string | Route's `realm_uri` | The realm whose cookies should be cleared |
| `redirect_uri` | string | `"/"` | Where to redirect after logout |
| `cookie_domain` | string | From provider config | Override the cookie domain for clearing |
| `cookie_same_site` | string | From provider config, or `lax` | Override the `SameSite` attribute for clearing: `none`, `lax` or `strict` |

### Responses

#### Success — 302 Found

Always redirects. When the ticket names an OIDC provider and the IdP supports RP-Initiated Logout, the redirect goes to the IdP's `end_session_endpoint`. The redirect carries the ticket's ID token as `id_token_hint` when the ticket has one:

```
HTTP/2 302
Location: https://login.microsoftonline.com/.../logout?id_token_hint=eyJhbG...&post_logout_redirect_uri=/
Set-Cookie: bondy_ticket_com.example.myrealm=; Path=/; Max-Age=0; SameSite=Lax; Secure
Set-Cookie: bondy_csrf_com.example.myrealm=; Path=/; Max-Age=0; SameSite=Lax; Secure
```

Otherwise, redirects directly to `redirect_uri`.

::: info Resilient Logout
The logout handler is designed to never crash. If the realm or OIDC provider no longer exists on this Bondy node, it still clears the cookies and redirects. The same holds when the realm has no OIDC providers configured. Ticket revocation is best-effort.
:::

### Example

```bash
# Logout from the default realm, redirect to /login
curl -v "https://api.example.com/v1.0/oidc/logout?redirect_uri=/login"

# Logout from a specific realm
curl -v "https://api.example.com/v1.0/oidc/logout?realm=com.example.myrealm&redirect_uri=/login"
```


## Ticket Claims

The Bondy ticket issued during the callback is a signed JWT with the following claims:

| Claim | Type | Description |
|:---|:---|:---|
| `id` | string | Unique ticket identifier (UUID v4) |
| `authrealm` | string | The realm URI |
| `authid` | string | User identity extracted from the IdP claims |
| `authmethod` | string | Always `"oidcrp"` |
| `authroles` | list | Roles extracted from the IdP claims |
| `issued_by` | string | Same as `authid` |
| `issued_on` | string | Bondy node name |
| `issued_at` | integer | Unix timestamp (seconds) |
| `expires_at` | integer | Unix timestamp (seconds) |
| `scope` | object | `{"realm": "...", "client_id": "...", "device_id": "..."}` |
| `kid` | string | Key ID used for signing |
| `oidc_provider` | string | Provider name |
| `oidc_id_token` | string | Raw ID token JWT from the IdP (optional) |
| `oidc_refresh_token` | string | Refresh token from the IdP (optional) |
| `oidc_access_token_expires_in` | integer | Access token expiry, as the IdP token response gives it (optional) |
