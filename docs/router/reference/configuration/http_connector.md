# HTTP Connector Configuration Reference

The HTTP Connector is configured in `bondy.conf` using keys prefixed with `http_connector.services.<service_name>`. Each service defines an upstream HTTP/REST API and the WAMP procedures that map to its endpoints.

::: info
If no `http_connector.services.*` keys are present, the HTTP Connector subsystem starts but remains idle with no resource overhead.
:::


## Service Settings

@[config](http_connector.services.$service.base_url,string,,v1.0.0-rc.50)

The upstream service base URL. All procedure paths are appended to this URL. Supports `{{var}}` interpolation from auth variables.

@[config](http_connector.services.$service.prefix,string,/,v1.0.0-rc.50)

Path prefix to strip from incoming request paths.

@[config](http_connector.services.$service.auth_mod,generic,generic,v1.0.0-rc.50)

The authentication module to use. Currently only `generic` is supported, which provides declarative OAuth2 and API key authentication.

@[config](http_connector.services.$service.timeout,duration,30s,v1.0.0-rc.50)

Upstream HTTP request timeout.

@[config](http_connector.services.$service.retries,integer,3,v1.0.0-rc.50)

Number of retry attempts on connection failures, using exponential backoff.


## Connection Pool

Each service gets a dedicated HTTP connection pool.

@[config](http_connector.services.$service.pool.size,integer,25,v1.0.0-rc.50)

Maximum number of connections in the pool.

@[config](http_connector.services.$service.pool.checkout_timeout,duration,5s,v1.0.0-rc.50)

Timeout for acquiring a connection from the pool.

@[config](http_connector.services.$service.pool.connect_timeout,duration,8s,v1.0.0-rc.50)

TCP connection timeout.

@[config](http_connector.services.$service.pool.idle_timeout,duration,5m,v1.0.0-rc.50)

How long idle connections are kept in the pool.

@[config](http_connector.services.$service.pool.recv_timeout,duration,60s,v1.0.0-rc.50)

Timeout for receiving a response from the upstream.

@[config](http_connector.services.$service.pool.follow_redirect,on|off,off,v1.0.0-rc.50)

Whether to follow HTTP redirects.

@[config](http_connector.services.$service.pool.max_redirect,integer,5,v1.0.0-rc.50)

Maximum number of redirects to follow (when enabled).


## Liveness Probe

While a service's pool is up, a self-rearming periodic probe checks the upstream and raises an alarm if it starts failing — catching a degrading service before a live WAMP call fails against it. This is separate from the one-shot startup/recovery health check (used while the pool is already down), which always runs regardless of this setting.

@[config](http_connector.services.$service.liveness.enabled,on|off,on,v1.0.0)

Enables the periodic up-state liveness probe for this service.

@[config](http_connector.services.$service.liveness.path,string,/,v1.0.0)

The path probed on the service's endpoint. The default `/` probes the bare `base_url`, identical to the startup health check.

@[config](http_connector.services.$service.liveness.method,get|head,head,v1.0.0)

The HTTP method used for the probe.

@[config](http_connector.services.$service.liveness.interval,duration,30s,v1.0.0)

How often the probe runs while the pool is up.

@[config](http_connector.services.$service.liveness.timeout,duration,5s,v1.0.0)

Connect/receive timeout for a single probe request.

@[config](http_connector.services.$service.liveness.failure_threshold,integer,3,v1.0.0)

Consecutive probe failures required before the pool is marked down and the service-down alarm is raised. Guards against flapping on a single transient blip.

@[config](http_connector.services.$service.liveness.success_threshold,integer,1,v1.0.0)

Consecutive successful probes required, once a service recovers, before the service-down alarm is cleared. The pool itself is marked up (and starts serving calls again) fail-open on the very first successful probe regardless of this setting — only alarm clearing is gated, so a flapping upstream doesn't flap the page while still resuming traffic as soon as it's reachable.

::: tip Alarms
After `failure_threshold` consecutive failures, Bondy raises an OTP alarm with id `{http_connector_service_down, ServiceName}`. It's counted by the existing `bondy_alarms` / `bondy_alarm_active{alarm_id}` Prometheus metrics and appears in the bundled Grafana dashboard's active-alarms panel — no separate exposition needed.
:::


## Auth: Token Acquisition

Configure how the connector acquires authentication tokens for the upstream service.

@[config](http_connector.services.$service.auth.fetch.method,get|post,post,v1.0.0-rc.50)

HTTP method for the token request.

@[config](http_connector.services.$service.auth.fetch.url,string,,v1.0.0-rc.50)

Token endpoint URL. Supports `{{var}}` interpolation.

@[config](http_connector.services.$service.auth.fetch.body_encoding,form|json|none,none,v1.0.0-rc.50)

How to encode the token request body:
- `form` — URL-encoded form (`application/x-www-form-urlencoded`)
- `json` — JSON (`application/json`)
- `none` — No body

@[config](http_connector.services.$service.auth.fetch.body.$key,string,,v1.0.0-rc.50)

A key-value pair in the token request body. Supports `{{var}}` interpolation. Define one line per key.

@[config](http_connector.services.$service.auth.fetch.headers.$key,string,,v1.0.0-rc.50)

A custom header on the token request. Supports `{{var}}` interpolation.

@[config](http_connector.services.$service.auth.fetch.token_path,string,,v1.0.0-rc.50)

Dot-separated JSON path to the token in the response (e.g. `access_token` or `data.token`).

@[config](http_connector.services.$service.auth.fetch.error_path,string,,v1.0.0-rc.50)

Dot-separated JSON path to the error message in the response.

@[config](http_connector.services.$service.auth.fetch.expires_in_path,string,,v1.0.0-rc.50)

Dot-separated JSON path to the token TTL (in seconds) in the response.

@[config](http_connector.services.$service.auth.fetch.basic_auth.username,string,,v1.0.0-rc.50)

HTTP Basic authentication username for the token request. Supports `{{var}}` interpolation.

@[config](http_connector.services.$service.auth.fetch.basic_auth.password,string,,v1.0.0-rc.50)

HTTP Basic authentication password for the token request. Supports `{{var}}` interpolation.


## Auth: Token Placement

Configure how the acquired token is applied to upstream requests.

@[config](http_connector.services.$service.auth.apply.placement,header|query_param,header,v1.0.0-rc.50)

Where to place the token on upstream requests.

@[config](http_connector.services.$service.auth.apply.name,string,Authorization,v1.0.0-rc.50)

The header name or query parameter name.

@[config](http_connector.services.$service.auth.apply.format,string,,v1.0.0-rc.50)

Format template for the token value. Use `{{token}}` as a placeholder. For example, `Bearer {{token}}` produces the header `Authorization: Bearer <token>`.


## Auth: Variable Bindings

Define variables for `{{var}}` interpolation in all auth-related fields.

@[config](http_connector.services.$service.auth.vars.$var,string,,v1.0.0-rc.50)

A named variable binding. The variable name is the `$var` portion of the key. Referenced as `{{var}}` in auth URLs, headers, body values, and basic auth credentials.


## Auth: Token Cache

@[config](http_connector.services.$service.auth.cache.default_ttl,duration,1h,v1.0.0-rc.50)

Default token TTL when the token response does not include an `expires_in` value.

@[config](http_connector.services.$service.auth.cache.refresh_margin,duration,1m,v1.0.0-rc.50)

How many seconds before token expiry to trigger a background refresh. Set to `0` to disable preemptive refresh.


## Auth: External Secrets

Resolve credentials from an external secrets provider at startup. Resolved values override static auth variables.

@[config](http_connector.services.$service.auth.secrets.provider,aws_sm,,v1.0.0-rc.50)

The secrets provider. Currently only `aws_sm` (AWS Secrets Manager) is supported.

@[config](http_connector.services.$service.auth.secrets.secret_id,string,,v1.0.0-rc.50)

The secret identifier — an ARN or secret name.

@[config](http_connector.services.$service.auth.secrets.region,string,,v1.0.0-rc.50)

The AWS region where the secret is stored.

@[config](http_connector.services.$service.auth.secrets.vars.$var.field,string,,v1.0.0-rc.50)

The JSON field name in the secret to extract for this variable.

@[config](http_connector.services.$service.auth.secrets.vars.$var.transform,none|basic_username|basic_password,none,v1.0.0-rc.50)

Transform to apply to the extracted value:
- `none` — Use the raw value
- `basic_username` — Decode a `Basic base64(user:pass)` value and extract the username
- `basic_password` — Decode a `Basic base64(user:pass)` value and extract the password


## Procedure Mappings

Map WAMP procedure URIs to upstream HTTP endpoints. Each procedure is identified by a short name (`$proc`) used only as a configuration key.

@[config](http_connector.services.$service.procedures.$proc.uri,string,,v1.0.0-rc.50)

The WAMP procedure URI to register (e.g. `com.billing.get_invoice`). **Required.**

@[config](http_connector.services.$service.procedures.$proc.realm,string,,v1.0.0-rc.50)

The Bondy realm to register the procedure in. **Required.**

@[config](http_connector.services.$service.procedures.$proc.method,get|post|put|patch|delete|head,get,v1.0.0-rc.50)

The HTTP method for the upstream request.

@[config](http_connector.services.$service.procedures.$proc.path,string,/,v1.0.0-rc.50)

The URL path template. Use `{{var}}` placeholders for path variables filled from the call kwargs.


## Complete Example

```ini
## ---------------------------------------------------------------
## Service: billing
## ---------------------------------------------------------------

http_connector.services.billing.base_url = https://billing.example.com/api
http_connector.services.billing.timeout = 15s
http_connector.services.billing.retries = 2

## Connection pool
http_connector.services.billing.pool.size = 25
http_connector.services.billing.pool.checkout_timeout = 5s
http_connector.services.billing.pool.connect_timeout = 8s

## Liveness probe
http_connector.services.billing.liveness.enabled = on
http_connector.services.billing.liveness.path = /
http_connector.services.billing.liveness.method = head
http_connector.services.billing.liveness.interval = 30s
http_connector.services.billing.liveness.timeout = 5s
http_connector.services.billing.liveness.failure_threshold = 3
http_connector.services.billing.liveness.success_threshold = 1

## Auth: token acquisition (OAuth2 client credentials)
http_connector.services.billing.auth.fetch.method = post
http_connector.services.billing.auth.fetch.url = https://idp.example.com/token
http_connector.services.billing.auth.fetch.body_encoding = form
http_connector.services.billing.auth.fetch.body.grant_type = client_credentials
http_connector.services.billing.auth.fetch.body.client_id = {{client_id}}
http_connector.services.billing.auth.fetch.body.client_secret = {{client_secret}}
http_connector.services.billing.auth.fetch.token_path = access_token
http_connector.services.billing.auth.fetch.expires_in_path = expires_in

## Auth: token placement
http_connector.services.billing.auth.apply.placement = header
http_connector.services.billing.auth.apply.name = Authorization
http_connector.services.billing.auth.apply.format = Bearer {{token}}

## Auth: variable bindings
http_connector.services.billing.auth.vars.client_id = my-app
http_connector.services.billing.auth.vars.client_secret = s3cret

## Auth: token cache
http_connector.services.billing.auth.cache.default_ttl = 1h
http_connector.services.billing.auth.cache.refresh_margin = 2m

## WAMP procedure mappings
http_connector.services.billing.procedures.get_invoice.uri = com.billing.get_invoice
http_connector.services.billing.procedures.get_invoice.realm = com.example.myrealm
http_connector.services.billing.procedures.get_invoice.method = get
http_connector.services.billing.procedures.get_invoice.path = /invoices/{{id}}

http_connector.services.billing.procedures.create_invoice.uri = com.billing.create_invoice
http_connector.services.billing.procedures.create_invoice.realm = com.example.myrealm
http_connector.services.billing.procedures.create_invoice.method = post
http_connector.services.billing.procedures.create_invoice.path = /invoices

http_connector.services.billing.procedures.update_invoice.uri = com.billing.update_invoice
http_connector.services.billing.procedures.update_invoice.realm = com.example.myrealm
http_connector.services.billing.procedures.update_invoice.method = patch
http_connector.services.billing.procedures.update_invoice.path = /invoices/{{id}}

http_connector.services.billing.procedures.delete_invoice.uri = com.billing.delete_invoice
http_connector.services.billing.procedures.delete_invoice.realm = com.example.myrealm
http_connector.services.billing.procedures.delete_invoice.method = delete
http_connector.services.billing.procedures.delete_invoice.path = /invoices/{{id}}
```
