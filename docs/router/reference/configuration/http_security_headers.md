---
outline: [2,3]
related:
    - text: Network Listeners
      type: Configuration Reference
      link: /router/reference/configuration/listeners
      description: The listeners.$name.* surface these blocks belong to.
    - text: Configuring CORS
      type: How-to Guide
      link: /router/guides/security/configuring_cors
      description: Choosing an origin policy for browser-facing deployments.
    - text: Same Sign-on
      type: Concept
      link: /router/concepts/same_sign_on
      description: The cross-subdomain OIDC deployments where the allowlist mode matters.
---

# HTTP Security Headers Configuration Reference

Bondy provides **per-listener** configuration for CORS (Cross-Origin
Resource Sharing) and standard HTTP security response headers. Every key
documented below exists for any listener whose `protocol` is `http`, under
that listener's own name — `listeners.$name.cors.*` and
`listeners.$name.security_headers.*`. The examples use a listener named
`public_http`; substitute your own name. There is no fixed set of listeners
and **no global block to fall back to** — see
[Network Listeners](/router/reference/configuration/listeners).

::: warning The pre-1.0 keys are gone
These settings used to live per fixed listener
(`api_gateway.http.cors.*`, `api_gateway.https.security_headers.*`, …).
Those keys have been removed and nothing reads them — restate any
deliberate policy under `listeners.<name>.*`, or the listener runs on the
defaults below.
:::

A listener that sets none of these does **not** come up closed: the
defaults fill in **per key**, so declaring a listener with no `cors.*`
emits wildcard CORS, and restricting `allowed_origins` leaves
`allowed_methods` and `allowed_headers` at their defaults unless those are
stated too.

## CORS

CORS headers are set on every response from a listener (not just `OPTIONS`
preflight requests), so browsers can make cross-origin requests to
Bondy-managed APIs, the WAMP HTTP transports (SSE, long-poll), OIDC
endpoints and OAuth2 token endpoints.

@[config](listeners.$name.cors.enabled,on|off,on,v1.0.0)

Enables or disables CORS headers on this listener. When `off`, no
`Access-Control-*` headers are emitted.

@[config](listeners.$name.cors.allowed_origins,string,*,v1.0.0)

Which origins are permitted to make cross-origin requests. Three modes:

**Wildcard** (the default) allows any origin. It forces
`Access-Control-Allow-Credentials` to `false` — per the Fetch
specification, credentials cannot be used with a wildcard origin:

```
listeners.public_http.cors.allowed_origins = *
```

**Explicit allowlist** — a comma-separated list of origins. Only requests
whose `Origin` header matches one of these values receive CORS headers;
requests from unlisted origins receive no `Access-Control-Allow-Origin`
header at all, which makes the browser block the response. On a match,
`Access-Control-Allow-Credentials` is set to `true` and a `Vary: Origin`
header is added. Entries can be exact origins or wildcard subdomain
patterns using the `*.` prefix:

```
listeners.public_http.cors.allowed_origins = https://app.example.com, https://admin.example.com
listeners.public_http.cors.allowed_origins = *.example.com, https://other.com
```

A pattern like `*.example.com` matches any subdomain
(`https://app.example.com`, `https://staging.example.com`) but does
**not** match the bare domain `https://example.com` itself. The exact
requesting origin is always reflected back in
`Access-Control-Allow-Origin` — the `*.` is purely a server-side
configuration convenience.

::: tip Cross-subdomain OIDC deployments
When the SPA and Bondy are on different subdomains, use an explicit
allowlist (or a wildcard subdomain pattern) so that
`Access-Control-Allow-Credentials` is `true`. The cookies also need to be
scoped to the shared parent domain and sent on cross-site requests, which
is `cookie_domain` and `cookie_same_site` in the OIDC provider
configuration.
:::

**Auto** derives the allowed origin from the incoming request's own
scheme, host and port — effectively "same-origin only", useful when the
frontend application is served from the same domain as the API. Default
ports (80 for HTTP, 443 for HTTPS) are omitted:

```
listeners.public_http.cors.allowed_origins = auto
```

@[config](listeners.$name.cors.allowed_methods,string,,v1.0.0)

The value for the `Access-Control-Allow-Methods` response header, as a
comma-separated list of HTTP methods. The default is
`GET,HEAD,OPTIONS,POST,PUT,PATCH,DELETE`.

@[config](listeners.$name.cors.allowed_headers,string,,v1.0.0)

The value for the `Access-Control-Allow-Headers` response header — the
header names a client is allowed to send. The default is
`origin,x-requested-with,content-type,accept,authorization,accept-language,x-csrf-token`.

@[config](listeners.$name.cors.max_age,integer,86400,v1.0.0)

The value (in seconds) for the `Access-Control-Max-Age` response header:
how long the browser may cache the preflight response. The default is 24
hours.

### API Gateway spec override

When using the API Gateway with JSON specification files, CORS headers
defined in a spec's `response.on_result.headers` or
`response.on_error.headers` (via MOPS expressions) take precedence over
the listener-level CORS configuration. If the spec does not define an
`access-control-allow-origin` header, the listener configuration is used
as the fallback — so the listener block is the project-wide default and a
spec can override it per endpoint.

## Security headers

Static security headers are computed once at listener startup and set on
every HTTP response.

@[config](listeners.$name.security_headers.enabled,on|off,on,v1.0.0)

The all-or-nothing switch: `off` emits none of the headers below.

@[config](listeners.$name.security_headers.hsts,off|string,,v1.0.0)

The value for the `Strict-Transport-Security` header, which tells
browsers to only access the server over HTTPS, preventing protocol
downgrade attacks. The default is
`max-age=31536000; includeSubDomains` on a **TLS** HTTP listener and
nothing on a plaintext one — HSTS is only meaningful over TLS, and a
plaintext listener sending it would direct clients at a port that does
not speak TLS.

@[config](listeners.$name.security_headers.frame_options,off|string,SAMEORIGIN,v1.0.0)

The value for the `X-Frame-Options` header, which prevents the page from
being rendered in a frame, iframe or object, mitigating clickjacking.
Common values: `DENY` (never framed) and `SAMEORIGIN` (framed only on the
same origin).

@[config](listeners.$name.security_headers.content_type_options,off|string,nosniff,v1.0.0)

The value for the `X-Content-Type-Options` header. `nosniff` prevents
browsers from MIME-sniffing the response content type, which can prevent
certain XSS attacks.

@[config](listeners.$name.security_headers.content_security_policy,off|string,,v1.0.0)

The value for the `Content-Security-Policy` header — a defence-in-depth
mechanism against XSS and data injection that declares which content
sources the browser should trust. Not emitted by default.

```
listeners.public_http.security_headers.content_security_policy = default-src 'self'; script-src 'self'; frame-ancestors 'none'
```

::: warning CSP is application-specific
Audit your application's actual asset sources (CDNs, fonts, third-party
scripts, API endpoints) before enabling this in production, or it will
break functionality.
:::

### Dropping one header

Give a header the value `off` to suppress just that header and keep the
rest — including the default HSTS a TLS listener would otherwise send:

```
listeners.public_http.security_headers.hsts = off
```

`off` is the only word treated this way; every other value is the header's
content, so `frame_options = office` sends `office`. There is no "empty
value" spelling — `security_headers.hsts =` with nothing after it is a
*syntax error* in `bondy.conf`, not an empty setting.

## Server header

@[config](listeners.$name.server_header,string,bondy,v1.0.0)

Controls the `Server` response header, usable to suppress infrastructure
information disclosure: `bondy` emits `bondy/<version>` (the default), an
empty value suppresses the header entirely, and any other value is
emitted verbatim.

## Migrating from the pre-1.0 keys

@[configDeprecated](api_gateway.$scheme.cors.*,listeners.$name.cors.*,v1.0.0)

@[configDeprecated](api_gateway.$scheme.security_headers.*,listeners.$name.security_headers.*,v1.0.0)

@[configDeprecated](api_gateway.$scheme.server_header,listeners.$name.server_header,v1.0.0)

The same applies to the `admin_api.{http,https}.*` spellings of these
blocks. An HTTPS listener whose CORS previously restricted origins to an
allowlist needs that allowlist restated under its `listeners.<name>.*`
block; without it the listener is not "closed by default", it is open to
any origin. See
[Migrating from the pre-1.0 keys](/router/reference/configuration/listeners#migrating-from-the-pre-1-0-keys)
for the full rename table and the migration tool.
