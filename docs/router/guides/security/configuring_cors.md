---
draft: false
outline: [2,3]
related:
    - text: "HTTP Security Headers Reference"
      type: "Reference"
      link: "/router/reference/configuration/http_security_headers"
      description: "Complete configuration key reference for CORS and security headers."
    - text: "API Gateway Specification"
      type: "Reference"
      link: "/router/reference/api_gateway/specification"
      description: "Per-endpoint response headers can override listener-level CORS."
---

# Configuring CORS and HTTP Security Headers

This guide walks through common CORS and HTTP security header configurations for different deployment scenarios.

## Background

When a browser-based application (SPA, mobile web, etc.) makes requests to Bondy from a different origin, the browser enforces the [CORS policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS). Without the right CORS headers, the browser blocks the response.

Bondy configures CORS and security headers at the **listener level** in `bondy.conf`. Every endpoint served by that listener (API Gateway routes, SSE/long-poll WAMP transports, OIDC login/callback, OAuth2 token endpoints) inherits the same CORS policy.

::: info
See the [HTTP Security Headers Reference](/router/reference/configuration/http_security_headers) for the complete list of configuration keys.
:::

## Scenario 1: Development (allow everything)

During development you typically want browsers to allow all cross-origin requests without friction. This is the default configuration:

```
api_gateway.http.cors.enabled = on
api_gateway.http.cors.allowed_origins = *
```

::: warning
Wildcard origin forces `Access-Control-Allow-Credentials` to `false`. If your frontend needs to send cookies or `Authorization` headers, switch to an explicit allowlist or `auto` mode.
:::

## Scenario 2: Single frontend origin

The most common production setup &mdash; one SPA served from a known domain:

```
api_gateway.https.cors.allowed_origins = https://app.example.com
```

With this configuration:
- Requests with `Origin: https://app.example.com` receive `Access-Control-Allow-Origin: https://app.example.com` and `Access-Control-Allow-Credentials: true`
- Requests from any other origin (or no origin) receive **no** CORS headers, causing the browser to block them
- A `Vary: Origin` header is added so caches distinguish between origins

## Scenario 3: Multiple frontend origins

When several frontends share the same Bondy cluster:

```
api_gateway.https.cors.allowed_origins = https://app.example.com, https://admin.example.com, https://partner.example.com
```

The incoming `Origin` header is matched against this list. Only exact matches are reflected back.

## Scenario 4: Wildcard subdomains

When you have many subdomains under the same base domain (e.g. per-tenant subdomains), use the `*.` prefix instead of listing every one:

```
api_gateway.https.cors.allowed_origins = *.example.com
```

This matches `https://app.example.com`, `https://tenant1.example.com`, etc. It does **not** match the bare domain `https://example.com` &mdash; add it explicitly if needed:

```
api_gateway.https.cors.allowed_origins = *.example.com, https://example.com
```

You can mix wildcard patterns with exact origins:

```
api_gateway.https.cors.allowed_origins = *.example.com, https://partner.other.com
```

The exact requesting origin is always reflected back in the `Access-Control-Allow-Origin` header. The `*.` pattern is purely a server-side config convenience.

## Scenario 5: Same-origin (auto mode)

If your frontend is served from the same domain as Bondy (e.g. via a reverse proxy), you can derive the origin automatically from the request:

```
api_gateway.https.cors.allowed_origins = auto
```

Bondy constructs the origin from `Scheme://Host[:Port]` of the incoming request (default ports 80 and 443 are omitted). This is equivalent to "same-origin only".

## Scenario 6: Per-endpoint overrides via API Gateway specs

When different API endpoints need different CORS policies, you can define CORS headers directly in the [API Gateway specification](/router/reference/api_gateway/specification) using MOPS expressions:

```json
{
  "variables": {
    "partner_cors": {
      "access-control-allow-origin": "https://partner.example.com",
      "access-control-allow-credentials": "true",
      "access-control-allow-methods": "GET,POST",
      "access-control-allow-headers": "content-type,authorization",
      "access-control-max-age": "3600"
    }
  },
  "versions": {
    "1.0.0": {
      "paths": {
        "/partner/data": {
          "get": {
            "response": {
              "on_result": {
                "headers": "{{variables.partner_cors}}",
                "body": "{{action.result}}"
              }
            }
          }
        }
      }
    }
  }
}
```

When an API spec defines an `access-control-allow-origin` header, it takes precedence over the listener-level configuration. Endpoints without spec-defined CORS headers fall back to the listener configuration.

## Hardening security headers

Beyond CORS, Bondy can set standard security response headers on every response. These are configured per-listener and address common findings from security scanners.

### Recommended production settings

```
## Enforce HTTPS via HSTS (HTTPS listener only)
api_gateway.https.security_headers.hsts = max-age=31536000; includeSubDomains

## Prevent clickjacking
api_gateway.https.security_headers.frame_options = DENY

## Prevent MIME sniffing
api_gateway.https.security_headers.content_type_options = nosniff

## Content Security Policy (tune to your application)
api_gateway.https.security_headers.content_security_policy = default-src 'self'; frame-ancestors 'none'

## Suppress server version disclosure
api_gateway.https.server_header =
```

### Disabling individual headers

Set any header value to an empty string to suppress it:

```
## No CSP (too complex for this deployment)
api_gateway.https.security_headers.content_security_policy =

## No HSTS (TLS terminated at load balancer)
api_gateway.https.security_headers.hsts =
```

### Disabling all security headers

```
api_gateway.http.security_headers.enabled = off
```

## Verifying your configuration

After configuring, verify with `curl`:

```bash
# Check CORS headers on a preflight request
curl -s -D - -o /dev/null \
  -X OPTIONS \
  -H "Origin: https://app.example.com" \
  https://your-bondy-host:18080/wamp/sse/open

# Check security headers on a regular request
curl -s -D - -o /dev/null \
  https://your-bondy-host:18081/ping
```

Look for:
- `access-control-allow-origin` matching your frontend origin (not `*`)
- `access-control-allow-credentials: true` (when using an allowlist)
- `x-frame-options: DENY` or `SAMEORIGIN`
- `x-content-type-options: nosniff`
- `strict-transport-security` (on HTTPS only)
- `server` header absent or generic
