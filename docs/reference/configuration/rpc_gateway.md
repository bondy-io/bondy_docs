# RPC Gateway Configuration Reference

The RPC Gateway is configured in `bondy.conf` using keys prefixed with `rpc_gateway.services.<service_name>`. Each service defines an upstream HTTP/REST API and the WAMP procedures that map to its endpoints.

::: info
If no `rpc_gateway.services.*` keys are present, the RPC Gateway subsystem starts but remains idle with no resource overhead.
:::


## Service Settings

@[config](rpc_gateway.services.$service.base_url,string,,v1.0.0-rc.50)

The upstream service base URL. All procedure paths are appended to this URL. Supports `{{var}}` interpolation from auth variables.

@[config](rpc_gateway.services.$service.prefix,string,/,v1.0.0-rc.50)

Path prefix to strip from incoming request paths.

@[config](rpc_gateway.services.$service.auth_mod,generic,generic,v1.0.0-rc.50)

The authentication module to use. Currently only `generic` is supported, which provides declarative OAuth2 and API key authentication.

@[config](rpc_gateway.services.$service.timeout,duration,30s,v1.0.0-rc.50)

Upstream HTTP request timeout.

@[config](rpc_gateway.services.$service.retries,integer,3,v1.0.0-rc.50)

Number of retry attempts on connection failures, using exponential backoff.


## Connection Pool

Each service gets a dedicated HTTP connection pool.

@[config](rpc_gateway.services.$service.pool.size,integer,25,v1.0.0-rc.50)

Maximum number of connections in the pool.

@[config](rpc_gateway.services.$service.pool.checkout_timeout,duration,5s,v1.0.0-rc.50)

Timeout for acquiring a connection from the pool.

@[config](rpc_gateway.services.$service.pool.connect_timeout,duration,8s,v1.0.0-rc.50)

TCP connection timeout.

@[config](rpc_gateway.services.$service.pool.idle_timeout,duration,5m,v1.0.0-rc.50)

How long idle connections are kept in the pool.

@[config](rpc_gateway.services.$service.pool.recv_timeout,duration,60s,v1.0.0-rc.50)

Timeout for receiving a response from the upstream.

@[config](rpc_gateway.services.$service.pool.follow_redirect,on|off,off,v1.0.0-rc.50)

Whether to follow HTTP redirects.

@[config](rpc_gateway.services.$service.pool.max_redirect,integer,5,v1.0.0-rc.50)

Maximum number of redirects to follow (when enabled).


## Auth: Token Acquisition

Configure how the gateway acquires authentication tokens for the upstream service.

@[config](rpc_gateway.services.$service.auth.fetch.method,get|post,post,v1.0.0-rc.50)

HTTP method for the token request.

@[config](rpc_gateway.services.$service.auth.fetch.url,string,,v1.0.0-rc.50)

Token endpoint URL. Supports `{{var}}` interpolation.

@[config](rpc_gateway.services.$service.auth.fetch.body_encoding,form|json|none,none,v1.0.0-rc.50)

How to encode the token request body:
- `form` — URL-encoded form (`application/x-www-form-urlencoded`)
- `json` — JSON (`application/json`)
- `none` — No body

@[config](rpc_gateway.services.$service.auth.fetch.body.$key,string,,v1.0.0-rc.50)

A key-value pair in the token request body. Supports `{{var}}` interpolation. Define one line per key.

@[config](rpc_gateway.services.$service.auth.fetch.headers.$key,string,,v1.0.0-rc.50)

A custom header on the token request. Supports `{{var}}` interpolation.

@[config](rpc_gateway.services.$service.auth.fetch.token_path,string,,v1.0.0-rc.50)

Dot-separated JSON path to the token in the response (e.g. `access_token` or `data.token`).

@[config](rpc_gateway.services.$service.auth.fetch.error_path,string,,v1.0.0-rc.50)

Dot-separated JSON path to the error message in the response.

@[config](rpc_gateway.services.$service.auth.fetch.expires_in_path,string,,v1.0.0-rc.50)

Dot-separated JSON path to the token TTL (in seconds) in the response.

@[config](rpc_gateway.services.$service.auth.fetch.basic_auth.username,string,,v1.0.0-rc.50)

HTTP Basic authentication username for the token request. Supports `{{var}}` interpolation.

@[config](rpc_gateway.services.$service.auth.fetch.basic_auth.password,string,,v1.0.0-rc.50)

HTTP Basic authentication password for the token request. Supports `{{var}}` interpolation.


## Auth: Token Placement

Configure how the acquired token is applied to upstream requests.

@[config](rpc_gateway.services.$service.auth.apply.placement,header|query_param,header,v1.0.0-rc.50)

Where to place the token on upstream requests.

@[config](rpc_gateway.services.$service.auth.apply.name,string,Authorization,v1.0.0-rc.50)

The header name or query parameter name.

@[config](rpc_gateway.services.$service.auth.apply.format,string,,v1.0.0-rc.50)

Format template for the token value. Use `{{token}}` as a placeholder. For example, `Bearer {{token}}` produces the header `Authorization: Bearer <token>`.


## Auth: Variable Bindings

Define variables for `{{var}}` interpolation in all auth-related fields.

@[config](rpc_gateway.services.$service.auth.vars.$var,string,,v1.0.0-rc.50)

A named variable binding. The variable name is the `$var` portion of the key. Referenced as `{{var}}` in auth URLs, headers, body values, and basic auth credentials.


## Auth: Token Cache

@[config](rpc_gateway.services.$service.auth.cache.default_ttl,duration,1h,v1.0.0-rc.50)

Default token TTL when the token response does not include an `expires_in` value.

@[config](rpc_gateway.services.$service.auth.cache.refresh_margin,duration,1m,v1.0.0-rc.50)

How many seconds before token expiry to trigger a background refresh. Set to `0` to disable preemptive refresh.


## Auth: External Secrets

Resolve credentials from an external secrets provider at startup. Resolved values override static auth variables.

@[config](rpc_gateway.services.$service.auth.secrets.provider,aws_sm,,v1.0.0-rc.50)

The secrets provider. Currently only `aws_sm` (AWS Secrets Manager) is supported.

@[config](rpc_gateway.services.$service.auth.secrets.secret_id,string,,v1.0.0-rc.50)

The secret identifier — an ARN or secret name.

@[config](rpc_gateway.services.$service.auth.secrets.region,string,,v1.0.0-rc.50)

The AWS region where the secret is stored.

@[config](rpc_gateway.services.$service.auth.secrets.vars.$var.field,string,,v1.0.0-rc.50)

The JSON field name in the secret to extract for this variable.

@[config](rpc_gateway.services.$service.auth.secrets.vars.$var.transform,none|basic_username|basic_password,none,v1.0.0-rc.50)

Transform to apply to the extracted value:
- `none` — Use the raw value
- `basic_username` — Decode a `Basic base64(user:pass)` value and extract the username
- `basic_password` — Decode a `Basic base64(user:pass)` value and extract the password


## Procedure Mappings

Map WAMP procedure URIs to upstream HTTP endpoints. Each procedure is identified by a short name (`$proc`) used only as a configuration key.

@[config](rpc_gateway.services.$service.procedures.$proc.uri,string,,v1.0.0-rc.50)

The WAMP procedure URI to register (e.g. `com.billing.get_invoice`). **Required.**

@[config](rpc_gateway.services.$service.procedures.$proc.realm,string,,v1.0.0-rc.50)

The Bondy realm to register the procedure in. **Required.**

@[config](rpc_gateway.services.$service.procedures.$proc.method,get|post|put|patch|delete|head,get,v1.0.0-rc.50)

The HTTP method for the upstream request.

@[config](rpc_gateway.services.$service.procedures.$proc.path,string,/,v1.0.0-rc.50)

The URL path template. Use `{{var}}` placeholders for path variables filled from the call kwargs.


## Complete Example

```ini
## ---------------------------------------------------------------
## Service: billing
## ---------------------------------------------------------------

rpc_gateway.services.billing.base_url = https://billing.example.com/api
rpc_gateway.services.billing.timeout = 15s
rpc_gateway.services.billing.retries = 2

## Connection pool
rpc_gateway.services.billing.pool.size = 25
rpc_gateway.services.billing.pool.checkout_timeout = 5s
rpc_gateway.services.billing.pool.connect_timeout = 8s

## Auth: token acquisition (OAuth2 client credentials)
rpc_gateway.services.billing.auth.fetch.method = post
rpc_gateway.services.billing.auth.fetch.url = https://idp.example.com/token
rpc_gateway.services.billing.auth.fetch.body_encoding = form
rpc_gateway.services.billing.auth.fetch.body.grant_type = client_credentials
rpc_gateway.services.billing.auth.fetch.body.client_id = {{client_id}}
rpc_gateway.services.billing.auth.fetch.body.client_secret = {{client_secret}}
rpc_gateway.services.billing.auth.fetch.token_path = access_token
rpc_gateway.services.billing.auth.fetch.expires_in_path = expires_in

## Auth: token placement
rpc_gateway.services.billing.auth.apply.placement = header
rpc_gateway.services.billing.auth.apply.name = Authorization
rpc_gateway.services.billing.auth.apply.format = Bearer {{token}}

## Auth: variable bindings
rpc_gateway.services.billing.auth.vars.client_id = my-app
rpc_gateway.services.billing.auth.vars.client_secret = s3cret

## Auth: token cache
rpc_gateway.services.billing.auth.cache.default_ttl = 1h
rpc_gateway.services.billing.auth.cache.refresh_margin = 2m

## WAMP procedure mappings
rpc_gateway.services.billing.procedures.get_invoice.uri = com.billing.get_invoice
rpc_gateway.services.billing.procedures.get_invoice.realm = com.example.myrealm
rpc_gateway.services.billing.procedures.get_invoice.method = get
rpc_gateway.services.billing.procedures.get_invoice.path = /invoices/{{id}}

rpc_gateway.services.billing.procedures.create_invoice.uri = com.billing.create_invoice
rpc_gateway.services.billing.procedures.create_invoice.realm = com.example.myrealm
rpc_gateway.services.billing.procedures.create_invoice.method = post
rpc_gateway.services.billing.procedures.create_invoice.path = /invoices

rpc_gateway.services.billing.procedures.update_invoice.uri = com.billing.update_invoice
rpc_gateway.services.billing.procedures.update_invoice.realm = com.example.myrealm
rpc_gateway.services.billing.procedures.update_invoice.method = patch
rpc_gateway.services.billing.procedures.update_invoice.path = /invoices/{{id}}

rpc_gateway.services.billing.procedures.delete_invoice.uri = com.billing.delete_invoice
rpc_gateway.services.billing.procedures.delete_invoice.realm = com.example.myrealm
rpc_gateway.services.billing.procedures.delete_invoice.method = delete
rpc_gateway.services.billing.procedures.delete_invoice.path = /invoices/{{id}}
```
