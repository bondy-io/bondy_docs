---
outline: [2,3]
related:
    - text: OIDC Authentication
      type: Concepts
      link: /concepts/oidc_authentication
      description: Learn how OIDC authentication works in Bondy, including provider configuration and the end-to-end flow.
    - text: HTTP Transports (Longpoll & SSE)
      type: Concepts
      link: /concepts/http_transports
      description: Learn how to use cookie-based authentication with HTTP transports.
    - text: HTTP API Gateway Specification
      type: Reference
      link: /reference/api_gateway/specification
      description: Learn how to define API Gateway specifications that enable OIDC security schemes.
---
# OIDC HTTP API

The OIDC endpoints implement the OpenID Connect Authorization Code flow with PKCE. They are automatically registered when an API Gateway Specification includes an `oidc` security scheme.

## Prerequisites

Before using the OIDC endpoints:

1. Configure an OIDC provider in the realm's `info.oidc_providers` (see [OIDC Authentication](/concepts/oidc_authentication#oidc-provider-configuration)).
2. Include `"oidcrp"` and `"cookie"` in the realm's `authmethods`.
3. Load an API Gateway Specification with an `oidc` security scheme.

## API

The following endpoints are registered under the API version's `base_path`:

| Name | Method | URL |
|:---|:---|:---|
| [Login](#login) | GET | `<base_path>/oidc/login` |
| [Callback](#callback) | GET | `<base_path>/oidc/<provider>/callback` |
| [Logout](#logout) | GET, POST | `<base_path>/oidc/logout` |

All endpoints support `OPTIONS` for CORS preflight. The `Access-Control-Allow-Origin` header is set to the request's `Origin` header value.


## Login

Initiates the OIDC Authorization Code flow by redirecting the user to the Identity Provider's authorization endpoint.

### Request

```
GET <base_path>/oidc/login
```

#### Query Parameters

| Parameter | Type | Default | Description |
|:---|:---|:---|:---|
| `provider` | string | Route's configured provider, or `"default"` | The OIDC provider name (must match a key in the realm's `oidc_providers`) |
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
# Redirect user to login with the "azure" provider
# After authentication, redirect back to /app/dashboard
curl -v "https://api.example.com/v1.0/oidc/login?provider=azure&redirect_uri=/app/dashboard"

# Response:
# HTTP/2 302
# Location: https://login.microsoftonline.com/.../authorize?response_type=code&client_id=...&redirect_uri=...&state=...&nonce=...&code_challenge=...&scope=openid+profile+email
```


## Callback

Receives the authorization callback from the IdP, exchanges the authorization code for tokens, issues a Bondy ticket, and redirects to the SPA.

::: warning
This endpoint is called by the IdP, not directly by the SPA. The `redirect_uri` configured in the OIDC provider must point to this endpoint.
:::

### Request

```
GET <base_path>/oidc/<provider>/callback
```

#### Query Parameters (set by the IdP)

| Parameter | Required | Description |
|:---|:---|:---|
| `code` | Yes | The authorization code from the IdP |
| `state` | Yes | The state token (must match the value generated during login) |

### Responses

#### Success — 302 Found

Sets two cookies and redirects to the SPA `redirect_uri` that was stored during the login step:

**Response Headers:**
```
HTTP/2 302
Location: /app/dashboard
Set-Cookie: bondy_ticket_com.example.myrealm=eyJhbG...; Path=/; Max-Age=2592000; SameSite=Lax; Secure
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

### Responses

#### Success — 302 Found

Always redirects. If the IdP supports RP-Initiated Logout and the ticket contains OIDC claims (provider name and ID token), the redirect goes to the IdP's `end_session_endpoint`:

```
HTTP/2 302
Location: https://login.microsoftonline.com/.../logout?id_token_hint=eyJhbG...&post_logout_redirect_uri=/
Set-Cookie: bondy_ticket_com.example.myrealm=; Path=/; Max-Age=0; SameSite=Lax; Secure
Set-Cookie: bondy_csrf_com.example.myrealm=; Path=/; Max-Age=0; SameSite=Lax; Secure
```

Otherwise, redirects directly to `redirect_uri`.

::: info Resilient Logout
The logout handler is designed to never crash. If the realm or OIDC provider no longer exists on this Bondy node, it will still clear the cookies and redirect. Ticket revocation is best-effort.
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
| `oidc_access_token_expires_at` | integer | Access token expiry timestamp (optional) |
