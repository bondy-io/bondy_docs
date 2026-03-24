---
outline: [2,3]
related:
    - text: OIDC HTTP API Reference
      type: HTTP API Reference
      link: /reference/http_api/oidc
      description: Detailed reference for the OIDC login, callback, and logout HTTP endpoints.
    - text: HTTP Transports (Longpoll & SSE)
      type: Concepts
      link: /concepts/http_transports
      description: Learn how to use cookie-based authentication with HTTP transports.
    - text: Realms
      type: Concepts
      link: /concepts/realms
      description: Realms are the administrative and security boundary in Bondy.
    - text: HTTP API Gateway Specification
      type: Reference
      link: /reference/api_gateway/specification
      description: Learn how to define API Gateway specifications that enable OIDC security schemes.
---
# OIDC Authentication

Bondy can act as an OpenID Connect (OIDC) Relying Party, allowing users to authenticate via external Identity Providers (IdPs) such as Azure AD, Google, Okta, or any OIDC-compliant provider.

## Overview

::: definition OpenID Connect Relying Party
An OIDC Relying Party (RP) is an application that delegates user authentication to an external Identity Provider (IdP) using the OpenID Connect protocol. Bondy implements the Authorization Code flow with PKCE, exchanging an authorization code for identity and access tokens.
:::

OIDC authentication in Bondy bridges the gap between web-based single sign-on and WAMP sessions. After a user authenticates with an external IdP, Bondy issues a **Bondy Ticket** (a signed JWT) and sets it as a browser cookie. This ticket can then be used to establish WAMP sessions over [HTTP transports](/concepts/http_transports) (Longpoll or SSE) without requiring the user to re-authenticate.

## How It Works

The following diagram shows the end-to-end flow from browser login to an authenticated WAMP session:

```
Browser              Bondy                    IdP
  │                    │                       │
  │  GET /oidc/login   │                       │
  │───────────────────>│                       │
  │                    │  (generate state,     │
  │                    │   nonce, PKCE)        │
  │  302 ──────────────│───────────────────────>│
  │                    │                       │
  │  (user authenticates at IdP)               │
  │                    │                       │
  │  GET /oidc/<provider>/callback?code=...    │
  │<───────────────────│<──────────────────────│
  │───────────────────>│                       │
  │                    │  exchange code for     │
  │                    │  tokens, fetch         │
  │                    │  userinfo              │
  │                    │                       │
  │                    │  issue bondy_ticket    │
  │  302 + Set-Cookie  │                       │
  │<───────────────────│                       │
  │  (bondy_ticket_<realm> cookie)             │
  │  (bondy_csrf_<realm> cookie)               │
  │                    │                       │
  │  POST /wamp/longpoll/open (with cookie)    │
  │───────────────────>│                       │
  │                    │  verify ticket,        │
  │                    │  open WAMP session     │
  │  200 {transport}   │                       │
  │<───────────────────│                       │
```

### Step-by-step

1. **Login redirect** — The SPA redirects the user to Bondy's `/oidc/login` endpoint. Bondy generates a cryptographic state token, nonce, and PKCE code verifier, stores them temporarily, and redirects the user to the IdP's authorization endpoint.

2. **IdP authentication** — The user authenticates at the IdP (e.g. enters credentials, completes MFA).

3. **Callback** — The IdP redirects back to Bondy's callback endpoint with an authorization code. Bondy:
   - Validates the state token (single-use, expires after 5 minutes)
   - Exchanges the code for tokens using PKCE
   - Fetches additional claims from the IdP's userinfo endpoint
   - Extracts the user's identity (`authid`) and roles from the claims
   - Optionally auto-provisions a local user record
   - Issues a signed Bondy Ticket (JWT)

4. **Cookie issuance** — Bondy sets two cookies and redirects the user back to the SPA:
   - `bondy_ticket_<realm_uri>` — The signed JWT ticket
   - `bondy_csrf_<realm_uri>` — A CSRF protection token

5. **WAMP session** — The SPA opens a WAMP session over [Longpoll or SSE](/concepts/http_transports). The browser automatically sends the ticket cookie. Bondy verifies the ticket and authenticates the WAMP session without requiring additional credentials.


## OIDC Provider Configuration

OIDC providers are configured per-realm in the realm's `info.oidc_providers` map. Each key is a provider name (e.g. `"azure"`, `"google"`, `"mock"`) and the value is a configuration object.

| Property | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `issuer` | string | Yes | — | The IdP's issuer URL (e.g. `https://accounts.google.com`). Used to discover the OpenID configuration. |
| `client_id` | string | Yes | — | The OAuth2 client ID registered with the IdP. |
| `client_secret` | string | Yes | — | The OAuth2 client secret. |
| `redirect_uri` | string | Yes | — | The callback URL registered with the IdP. Must match exactly. |
| `scopes` | list | Yes | `["openid","profile","email"]` | OAuth2 scopes to request during authorization. |
| `authid_claim` | string | Yes | `"preferred_username"` | The ID token or userinfo claim to use as the Bondy `authid`. Falls back to the `sub` claim if not present. |
| `auto_provision` | boolean | Yes | `true` | When `true`, Bondy automatically creates a local user record on first OIDC login. |
| `role_claim` | string | Yes | `"roles"` | The claim containing the user's roles. Supports dotted notation for nested claims (e.g. `"realm_access.roles"`). |
| `role_claim_fallback` | string | Yes | `"role"` | Fallback claim if the primary `role_claim` is absent. |
| `role_mapping` | map | No | `{}` | Maps IdP role names to Bondy group names. Unmapped roles pass through unchanged. |
| `ticket_expiry_secs` | integer | No | Global default | Per-provider override for ticket lifetime in seconds. |
| `allow_unsafe_http` | boolean | Yes | `false` | Allow plain HTTP issuer URLs. Only use for development or testing. |
| `cookie_domain` | string | No | — | The `Domain` attribute for cookies (e.g. `.example.com`). Enables cookie sharing across subdomains. |

::: warning Important
The `redirect_uri` must exactly match the redirect URI registered with the IdP. A mismatch will cause the IdP to reject the authorization request with an `invalid_request` error.
:::

### Example

```json
{
    "uri": "com.example.myrealm",
    "authmethods": ["cryptosign", "wampcra", "ticket", "oidcrp", "cookie"],
    "info": {
        "oidc_providers": {
            "azure": {
                "issuer": "https://login.microsoftonline.com/<tenant>/v2.0",
                "client_id": "your-client-id",
                "client_secret": "your-client-secret",
                "redirect_uri": "https://api.example.com/v1.0/oidc/azure/callback",
                "scopes": ["openid", "profile", "email", "roles"],
                "authid_claim": "preferred_username",
                "auto_provision": true,
                "role_claim": "roles",
                "role_mapping": {
                    "Azure_Admin": "administrators",
                    "Azure_User": "users"
                },
                "ticket_expiry_secs": 2592000,
                "cookie_domain": ".example.com"
            }
        }
    }
}
```


## API Gateway Security Scheme

To expose the OIDC endpoints, add an `oidc` security scheme to your [API Gateway Specification](/reference/api_gateway/specification):

```json
{
    "id": "my-api",
    "name": "My API",
    "host": "_",
    "realm_uri": "com.example.myrealm",
    "defaults": {
        "security": {
            "type": "oidc",
            "provider": "azure"
        }
    },
    "versions": {
        "1.0.0": {
            "base_path": "/api/[v1.0]",
            "paths": {}
        }
    }
}
```

This automatically registers three HTTP routes under the version's `base_path`:

| Route | Method | Description |
|:---|:---|:---|
| `<base_path>/oidc/login` | GET | Initiates the OIDC flow |
| `<base_path>/oidc/<provider>/callback` | GET | Receives the IdP callback |
| `<base_path>/oidc/logout` | GET, POST | Terminates the session |


## Cookies

Bondy sets two cookies after a successful OIDC callback:

### Ticket Cookie

| Attribute | Value |
|:---|:---|
| **Name** | `bondy_ticket_<realm_uri>` |
| **Value** | Signed JWT |
| **HttpOnly** | `false` |
| **SameSite** | `Lax` |
| **Secure** | `true` when served over HTTPS |
| **Path** | `/` |
| **Domain** | Value of `cookie_domain` config, or omitted |
| **Max-Age** | Ticket expiry in seconds |

### CSRF Cookie

| Attribute | Value |
|:---|:---|
| **Name** | `bondy_csrf_<realm_uri>` |
| **Value** | UUID v4 |
| **HttpOnly** | `false` |
| **SameSite** | `Lax` |
| **Secure** | `true` when served over HTTPS |
| **Path** | `/` |
| **Domain** | Value of `cookie_domain` config, or omitted |
| **Max-Age** | Same as ticket expiry |

::: info Cookie Domain
If your SPA and Bondy are served from different subdomains of the same parent domain (e.g. `app.example.com` and `api.example.com`), set `cookie_domain` to `.example.com` so both subdomains can access the cookies.

If the SPA and Bondy share the same origin, you do not need to set `cookie_domain`.
:::


## CSRF Protection

Bondy uses the **double-submit cookie** pattern for CSRF protection on [HTTP transport](/concepts/http_transports) endpoints.

The SPA must:

1. Read the `bondy_csrf_<realm_uri>` cookie value from `document.cookie`.
2. Include it as the `X-CSRF-Token` header on every `POST` request to the Longpoll and SSE transport endpoints.

Bondy validates that the header value matches the cookie value. Requests without a matching header receive a `403 Forbidden` response.

::: tip
The CSRF cookie has `HttpOnly` set to `false` specifically so that JavaScript can read it. The ticket cookie also has `HttpOnly` set to `false` to allow the SPA to check for the presence of a session.
:::


## Token Refresh

When a Bondy ticket is issued from an OIDC flow that includes a refresh token, Bondy automatically refreshes the underlying OIDC access token before it expires. This happens transparently in the background.

- A pool of refresh workers periodically scans for sessions with expiring access tokens.
- Each worker calls the IdP's token endpoint using `oidcc_token:refresh/3`.
- On success, the updated tokens are stored in the ticket's PlumDB record.
- If refresh fails (e.g. the refresh token has been revoked), the ticket remains valid until its own expiry but the OIDC tokens become stale.

::: info
The ticket's `expires_at` is set to the greater of the configured `ticket_expiry_secs` and the refresh token's remaining TTL. This ensures the Bondy session lasts as long as the IdP session can be renewed.
:::


## Logout

The logout endpoint (`GET` or `POST <base_path>/oidc/logout`) performs the following:

1. Reads and revokes the Bondy ticket from the `bondy_ticket_<realm_uri>` cookie.
2. Clears both the ticket and CSRF cookies.
3. If the IdP supports [RP-Initiated Logout](https://openid.net/specs/openid-connect-rpinitiated-1_0.html), redirects the user to the IdP's `end_session_endpoint` with the `id_token_hint` and `post_logout_redirect_uri`.
4. Otherwise, redirects directly to the SPA.

| Parameter | Default | Description |
|:---|:---|:---|
| `realm` | Route's realm | Override which realm's cookies to clear |
| `redirect_uri` | `/` | Where to redirect after logout |
| `cookie_domain` | From provider config | Override cookie domain for clearing |

::: warning Important
The logout handler is designed to be resilient. If the realm or provider no longer exists on this Bondy node, it will still clear the cookies and redirect. Ticket revocation is best-effort.
:::
