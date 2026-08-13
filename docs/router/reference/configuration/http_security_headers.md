---
draft: false
outline: [2,3]
related:
    - text: "Network Listeners"
      type: "Reference"
      link: "/router/reference/configuration/listeners"
      description: "Configure port, TLS, acceptors, and connection limits for each listener."
    - text: "Security"
      type: "Reference"
      link: "/router/reference/configuration/security"
      description: "Authentication methods, password options, and realm security settings."
    - text: "API Gateway Specification"
      type: "Reference"
      link: "/router/reference/api_gateway/specification"
      description: "Per-endpoint response headers can override listener-level CORS."
---

# HTTP Security Headers Configuration Reference

Configure CORS and HTTP security response headers for each Bondy listener. These settings cover the security findings most commonly flagged by scanners and penetration tests: cross-origin restrictions, clickjacking protection, MIME sniffing prevention, transport security, and content security policy.

Every key documented below is available for each of the four HTTP listeners:

| Listener prefix | Description |
|---|---|
| `admin_api.http` | Admin HTTP listener |
| `admin_api.https` | Admin HTTPS listener |
| `api_gateway.http` | Public HTTP listener |
| `api_gateway.https` | Public HTTPS listener |

The examples on this page use `api_gateway.http` but the same keys exist under all four prefixes.

## CORS

Cross-Origin Resource Sharing headers are set on every response from a listener, covering preflight (`OPTIONS`) and regular requests. This applies to all endpoints served by that listener: API Gateway routes, WAMP transports (SSE, long-poll), OIDC login/callback/logout, and OAuth2 token endpoints.

### Enabled

@[config](api_gateway.http.cors.enabled,on|off,on,v1.0.0-rc.59)

Enables or disables CORS headers on this listener. When `off`, no `Access-Control-*` headers are emitted.

### Allowed Origins

@[config](api_gateway.http.cors.allowed_origins,string,*,v1.0.0-rc.59)

Controls which origins are permitted to make cross-origin requests. Three modes are supported:

**Wildcard** (default) &mdash; allows any origin. Forces `Access-Control-Allow-Credentials` to `false` per the [Fetch specification](https://fetch.spec.whatwg.org/#http-access-control-allow-credentials), which prohibits credentials with a wildcard origin.

```
api_gateway.http.cors.allowed_origins = *
```

**Explicit allowlist** &mdash; a comma-separated list of origins. Only requests whose `Origin` header matches one of these values receive CORS headers. Non-matching requests receive no `Access-Control-Allow-Origin` header, causing the browser to block the response. When a match is found, `Access-Control-Allow-Credentials` is set to `true` and a `Vary: Origin` header is added.

Entries can be exact origins or wildcard subdomain patterns using the `*.` prefix:

```
api_gateway.http.cors.allowed_origins = https://app.example.com, https://admin.example.com
```

```
api_gateway.http.cors.allowed_origins = *.example.com, https://other.com
```

A wildcard pattern like `*.example.com` matches any subdomain (e.g. `https://app.example.com`, `https://staging.example.com`) but does **not** match the bare domain `https://example.com` itself. The exact requesting origin is always reflected back in the `Access-Control-Allow-Origin` header &mdash; the `*.` is purely a server-side config convenience.

**Auto** &mdash; derives the allowed origin from the request's own scheme, host, and port. This is effectively "same-origin only" and is useful when the frontend is served from the same domain as the API. Default ports (80 for HTTP, 443 for HTTPS) are omitted from the origin string.

```
api_gateway.http.cors.allowed_origins = auto
```

::: warning Production deployments
Using `*` in production means any website can make cross-origin requests to your API. We strongly recommend switching to an explicit allowlist or `auto` before deploying to production.
:::

### Allowed Methods

@[config](api_gateway.http.cors.allowed_methods,string,"GET,HEAD,OPTIONS,POST,PUT,PATCH,DELETE",v1.0.0-rc.59)

The value for the `Access-Control-Allow-Methods` response header. A comma-separated list of HTTP methods the client is allowed to use.

### Allowed Headers

@[config](api_gateway.http.cors.allowed_headers,string,"origin,x-requested-with,content-type,accept,authorization,accept-language,x-csrf-token",v1.0.0-rc.59)

The value for the `Access-Control-Allow-Headers` response header. A comma-separated list of header names the client is allowed to send.

### Max Age

@[config](api_gateway.http.cors.max_age,integer,86400,v1.0.0-rc.59)

The value (in seconds) for the `Access-Control-Max-Age` response header. Tells the browser how long to cache the preflight response.

### API Gateway Spec Override

When using the [API Gateway](/router/reference/api_gateway/specification) with JSON specification files, CORS headers defined in the spec's `response.on_result.headers` or `response.on_error.headers` (via MOPS expressions) take precedence over the listener-level CORS configuration. If the spec does not define an `access-control-allow-origin` header, the listener configuration is used as a fallback.

This lets you use the listener configuration as a project-wide default while overriding it per-endpoint in specific API specs when needed.


## Security Response Headers

Static security headers are computed once at listener startup and set on every HTTP response. They protect against common web vulnerabilities.

### Enabled

@[config](api_gateway.http.security_headers.enabled,on|off,on,v1.0.0-rc.59)

Enables or disables all security response headers on this listener. When `off`, none of the headers below are emitted.

### HSTS (Strict-Transport-Security)

@[config](api_gateway.http.security_headers.hsts,string,"",v1.0.0-rc.59)

The value for the `Strict-Transport-Security` header. Tells browsers to only access the server over HTTPS, preventing protocol downgrade and man-in-the-middle attacks.

Set to an empty string to disable.

::: code-group
```[HTTPS listener (default)]
api_gateway.https.security_headers.hsts = max-age=31536000; includeSubDomains
```
```[HTTP listener (default)]
api_gateway.http.security_headers.hsts =
```
:::

Default: `max-age=31536000; includeSubDomains` for HTTPS listeners, empty (disabled) for HTTP listeners.

::: info
HSTS is only meaningful on HTTPS listeners. Browsers ignore the header when received over a plain HTTP connection.
:::

### X-Frame-Options

@[config](api_gateway.http.security_headers.frame_options,string,SAMEORIGIN,v1.0.0-rc.59)

The value for the `X-Frame-Options` header. Prevents the page from being rendered in a frame, iframe, or object, mitigating clickjacking attacks.

Common values:

| Value | Meaning |
|---|---|
| `DENY` | The page cannot be displayed in a frame at all |
| `SAMEORIGIN` | The page can only be displayed in a frame on the same origin |

Set to an empty string to disable.


### X-Content-Type-Options

@[config](api_gateway.http.security_headers.content_type_options,string,nosniff,v1.0.0-rc.59)

The value for the `X-Content-Type-Options` header. Setting this to `nosniff` prevents browsers from MIME-sniffing the response content type, which can prevent certain XSS attacks where a JSON response is interpreted as a script.

Set to an empty string to disable.


### Content-Security-Policy

@[config](api_gateway.http.security_headers.content_security_policy,string,"",v1.0.0-rc.59)

The value for the `Content-Security-Policy` (CSP) header. CSP provides a defence-in-depth mechanism against XSS and data injection attacks by declaring which content sources the browser should trust.

Set to an empty string to disable (default).

```
api_gateway.http.security_headers.content_security_policy = default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'
```

::: warning
CSP policies are highly application-specific. Audit your application's actual asset sources (CDNs, fonts, third-party scripts, API endpoints) before enabling this in production to avoid breaking functionality.
:::


## Server Header

@[config](api_gateway.http.server_header,string,bondy,v1.0.0-rc.59)

Controls the `Server` response header. Suppressing or customising this header can reduce information disclosure about your infrastructure.

| Value | Emitted header |
|---|---|
| `bondy` | `Server: bondy/<version>` (default) |
| *(empty string)* | Header is suppressed entirely |
| *any other value* | Emitted verbatim |

```
api_gateway.http.server_header =
```

::: info
If Bondy is behind a load balancer (e.g. AWS ALB), the load balancer may add its own `Server` header. Suppressing it at the Bondy level does not affect the load balancer's header &mdash; configure that separately via load balancer response header rules.
:::


## Full Example

A production-ready configuration for a public HTTPS listener:

```
## CORS -- restrict to known frontend origins
api_gateway.https.cors.enabled = on
api_gateway.https.cors.allowed_origins = https://app.example.com
api_gateway.https.cors.allowed_methods = GET,HEAD,OPTIONS,POST,PUT,PATCH,DELETE
api_gateway.https.cors.allowed_headers = origin,x-requested-with,content-type,accept,authorization
api_gateway.https.cors.max_age = 86400

## Security headers
api_gateway.https.security_headers.enabled = on
api_gateway.https.security_headers.hsts = max-age=31536000; includeSubDomains
api_gateway.https.security_headers.frame_options = DENY
api_gateway.https.security_headers.content_type_options = nosniff
api_gateway.https.security_headers.content_security_policy = default-src 'self'; frame-ancestors 'none'

## Suppress server version
api_gateway.https.server_header =
```

## Generating Defaults

To generate a complete `bondy.conf` file with all settings and their defaults:

```bash
make conf
```

This creates `config/bondy.conf.defaults` which can be used as a starting point.
