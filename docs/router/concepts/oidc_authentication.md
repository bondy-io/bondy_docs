---
outline: [2,3]
related:
    - text: OIDC HTTP API Reference
      type: HTTP API Reference
      link: /router/reference/http_api/oidc
      description: Detailed reference for the OIDC login, callback, and logout HTTP endpoints.
    - text: HTTP Transports (Longpoll & SSE)
      type: Concepts
      link: /router/concepts/http_transports
      description: Learn how to use cookie-based authentication with HTTP transports.
    - text: Realms
      type: Concepts
      link: /router/concepts/realms
      description: Realms are the administrative and security boundary in Bondy.
    - text: HTTP API Gateway Specification
      type: Reference
      link: /router/reference/api_gateway/specification
      description: Learn how to define API Gateway specifications that enable OIDC security schemes.
---
# OIDC Authentication

Bondy can act as an OpenID Connect (OIDC) Relying Party, allowing users to authenticate via external Identity Providers (IdPs) such as Azure AD, Google, Okta, or any OIDC-compliant provider.

## Overview

::: definition OpenID Connect Relying Party
An OIDC Relying Party (RP) is an application that delegates user authentication to an external Identity Provider (IdP) using the OpenID Connect protocol. Bondy implements the Authorization Code flow with PKCE, exchanging an authorization code for identity and access tokens.
:::

OIDC authentication in Bondy bridges the gap between web-based single sign-on and WAMP sessions. After a user authenticates with an external IdP, Bondy issues a **Bondy Ticket** (a signed JWT) and sets it as a browser cookie. This ticket can then be used to establish WAMP sessions over [HTTP transports](/router/concepts/http_transports) (Longpoll or SSE) without requiring the user to re-authenticate.

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

5. **WAMP session** — The SPA opens a WAMP session over [Longpoll or SSE](/router/concepts/http_transports). The browser automatically sends the ticket cookie. Bondy verifies the ticket and authenticates the WAMP session without requiring additional credentials.


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
| `auto_provision` | boolean | Yes | `false` | When `true`, Bondy automatically creates a local user record on first OIDC login. |
| `role_claim` | string | Yes | `"roles"` | The claim containing the user's roles. Supports dotted notation for nested claims (e.g. `"realm_access.roles"`). |
| `role_claim_fallback` | string | Yes | `"role"` | Fallback claim if the primary `role_claim` is absent. |
| `role_mapping` | map | No | `{}` | Maps IdP role names to Bondy group names. Unmapped roles pass through unchanged. |
| `ticket_expiry_secs` | integer | No | Global default | Per-provider override for ticket lifetime in seconds. |
| `allow_unsafe_http` | boolean | Yes | `false` | Allow plain HTTP issuer URLs. Only use for development or testing. |
| `cookie_domain` | string | No | — | The `Domain` attribute for cookies (e.g. `.example.com`). Enables cookie sharing across subdomains. |
| `cookie_same_site` | string | Yes | `"lax"` | The `SameSite` attribute for both cookies: `"lax"`, `"strict"` or `"none"`. |

Each node fetches a provider's OpenID configuration and signing keys the first time the provider is used, and keeps them refreshed. A change to the provider's `issuer` or `allow_unsafe_http` takes effect on each node at its next use of the provider. Deleting the realm stops this work on every node.

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
    },
    "sources": [
        {"usernames": "all", "authmethod": "cookie", "cidr": "0.0.0.0/0"}
    ]
}
```

The `sources` entry lets OIDC users authenticate with the ticket cookie from any address. Narrow its `cidr` to restrict where they may connect from.

### Sources

Bondy applies the realm's [sources](/router/reference/wamp_api/source) to an OIDC user as it does to any other user. The OIDC ticket authenticates only when the realm admits the `oidcrp` method from the client's address, in its `authmethods` and a source. When the ticket arrives in the cookie, the realm must also admit `cookie`, the method for credentials carried in a cookie. This holds for a WAMP session opened with the cookie, for a path the `oidc` scheme protects, for the Admin API, and for the [verify route](/router/reference/api_gateway/specification#verify-route).

The login applies the same check. After the provider authenticates the user, the callback issues the ticket only when the realm admits `oidcrp` for that user from the client's address, and otherwise answers `403` with `no_authmethod`. With `auto_provision`, a refused login creates no user record.

::: warning Deprecated
A realm that admits `cookie` but not `oidcrp` still accepts the OIDC ticket, and Bondy logs a warning once per realm on each node. A later release removes this. Add `oidcrp` to the realm's `authmethods` and a source that allows it.
:::

It holds whether or not Bondy keeps a user record for the subject. Without `auto_provision` there is no record, so only sources assigned to `all` can match: a source that names users requires those users to exist.


## API Gateway Security Scheme

To expose the OIDC endpoints, add an `oidc` security scheme to your [API Gateway Specification](/router/reference/api_gateway/specification):

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

This automatically registers four HTTP routes under the version's `base_path`:

| Route | Method | Description |
|:---|:---|:---|
| `<base_path>/oidc/login` | GET | Initiates the OIDC flow |
| `<base_path>/oidc/<provider>/callback` | GET | Receives the IdP callback |
| `<base_path>/oidc/logout` | GET, POST | Terminates the session |
| `<base_path>/oidc/verify` | GET, HEAD | Tells a reverse proxy whether a request carries a valid ticket. See [Verify route](/router/reference/api_gateway/specification#verify-route). |

The version's own paths require the ticket cookie. The realm's `authmethods` must include `oidcrp` and `cookie`, and [sources](#sources) must allow both from the client's address. See [CSRF Protection](#csrf-protection) for requests that change state.


## Cookies

Bondy sets two cookies after a successful OIDC callback:

### Ticket Cookie

| Attribute | Value |
|:---|:---|
| **Name** | `bondy_ticket_<realm_uri>` |
| **Value** | Signed JWT |
| **HttpOnly** | `true` |
| **SameSite** | Value of `cookie_same_site` config, `Lax` by default |
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
| **SameSite** | Value of `cookie_same_site` config, `Lax` by default |
| **Secure** | `true` when served over HTTPS |
| **Path** | `/` |
| **Domain** | Value of `cookie_domain` config, or omitted |
| **Max-Age** | Same as ticket expiry |

::: info Cookie Domain
If your SPA and Bondy are served from different subdomains of the same parent domain (e.g. `app.example.com` and `api.example.com`), set `cookie_domain` to `.example.com` so both subdomains can access the cookies.

If the SPA and Bondy share the same origin, you do not need to set `cookie_domain`.
:::


## CSRF Protection

Bondy uses the **double-submit cookie** pattern for CSRF protection on [HTTP transport](/router/concepts/http_transports) endpoints.

The SPA has to:

1. Read the `bondy_csrf_<realm_uri>` cookie value from `document.cookie`.
2. Include it as the `X-CSRF-Token` header on every `POST` request to the Longpoll and SSE transport endpoints, and on every request other than `GET`, `HEAD` or `OPTIONS` to a path the `oidc` scheme protects.

Bondy validates that the header value matches the CSRF cookie of the realm whose ticket cookie authenticated the request. A browser signed in to several realms holds one pair per realm. Requests without a matching header receive a `403 Forbidden` response.

::: tip
The CSRF cookie has `HttpOnly` set to `false` so that JavaScript can read it. The ticket cookie has `HttpOnly` set to `true`, so JavaScript cannot read the ticket. An SPA that needs the session's details calls `bondy.session.self` over the WAMP session.
:::


## Token Refresh

When a Bondy ticket is issued from an OIDC flow that includes a refresh token, Bondy automatically refreshes the underlying OIDC access token before it expires. This happens transparently in the background.

- A pool of refresh workers periodically scans for sessions with expiring access tokens.
- Each worker calls the IdP's token endpoint using `oidcc_token:refresh/3`.
- On success, the updated tokens are stored in the ticket's replicated record.
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
| `cookie_same_site` | From provider config | Override the cookies' `SameSite` attribute for clearing |

::: warning Important
The logout handler is designed to be resilient. If the realm or provider no longer exists on this Bondy node, or the realm has no OIDC providers configured, it still clears the cookies and redirects. Ticket revocation is best-effort.
:::
