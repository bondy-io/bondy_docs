---
outline: [2,3]
related:
    - text: HTTP API Gateway Specification
      type: Reference
      link: /router/reference/api_gateway/specification#security-object
      description: The Security Object fields, which schemes Bondy enforces, and the verify route.
    - text: OAuth2 Administration
      type: WAMP API Reference
      link: /router/reference/wamp_api/oauth2
      description: Add, update and delete API clients and resource owners, and revoke their refresh tokens.
    - text: Security Configuration
      type: Configuration Reference
      link: /router/reference/configuration/security#authentication-oauth2
      description: Access and refresh token lifetimes.
    - text: HTTP API Gateway
      type: Concepts
      link: /router/concepts/api_gateway
      description: How the gateway turns HTTP requests into WAMP calls.
    - text: Loading an API Gateway Specification
      type: How-to Guide
      link: /router/guides/programming/loading_api_spec
      description: Load and check a specification through the Admin API.
---

# Protecting an HTTP API with OAuth2

Make every route of an API Gateway specification require a Bondy OAuth2 access token, issue tokens to an application, and revoke them.

The `oauth2` scheme is the only one in a Security Object that protects a route. Bondy refuses every request to a route whose scheme is `basic`, `api_key` or `oidc`; see the [Security Object](/router/reference/api_gateway/specification#security-object).

## Before you start

You need:

- A realm, `com.example.realm` in this guide, whose `authmethods` include `password` and `oauth2`. A realm that does not set `authmethods` includes both.
- A WAMP procedure for the gateway to call. This guide uses `com.example.order.get`, registered by a callee on that realm.
- The Admin API on port `18081` and the API Gateway on port `18080`, which are the defaults. See [Network Listeners](/router/reference/configuration/listeners).

The steps use two identities:

- An **API client**, `orders-web`: the application that asks for tokens. It authenticates with a client ID and a client secret.
- A **resource owner**, `alice`: the user a token is issued for, under the `resource_owner_password_credentials` flow.

## 1. Add the `oauth2` scheme to the specification

Put the Security Object in the API's `defaults`, so every version and path inherits it:

```json
{
    "id": "com.example.orders_api",
    "name": "Orders API",
    "host": "_",
    "realm_uri": "com.example.realm",
    "defaults": {
        "schemes": ["http"],
        "security": {
            "type": "oauth2",
            "flow": "resource_owner_password_credentials",
            "token_path": "/oauth/token",
            "revoke_token_path": "/oauth/revoke"
        }
    },
    "versions": {
        "1.0.0": {
            "base_path": "/[v1.0]",
            "paths": {
                "/orders/:id": {
                    "get": {
                        "action": {
                            "type": "wamp_call",
                            "procedure": "com.example.order.get",
                            "options": {},
                            "args": ["{{request.bindings.id}}"],
                            "kwargs": {}
                        },
                        "response": {
                            "on_error": {
                                "status_code": "{{status_codes |> get({{action.error.error_uri}}, 500) |> integer}}",
                                "body": "{{action.error.kwargs |> put(code, {{action.error.error_uri}})}}"
                            },
                            "on_result": {
                                "body": "{{action.result.args |> head}}"
                            }
                        }
                    }
                }
            }
        }
    }
}
```

`type` and `flow` are required. `flow` takes one of `client_credentials`, `resource_owner_password_credentials`, `authorization_code` or `implicit`. Bondy validates the value but does not restrict the token path to that grant: the token path serves both the `password` and the `client_credentials` grant whatever `flow` says, and refuses `authorization_code`. `token_path` and `revoke_token_path` default to `/oauth/token` and `/oauth/revoke`.

The scheme adds four routes to the version, each under its `base_path`: the token path, the revoke path, `/oauth/jwks`, and the [verify route](/router/reference/api_gateway/specification#verify-route) at `/oauth/verify`.

::: warning Make the base path optional
The token and revoke routes answer only when the request path begins with `token_path` or `revoke_token_path` itself. A request to `/v1.0/oauth/token` reaches the route but fails. Declare `base_path` with an optional segment, `/[v1.0]`, and call these two paths without the prefix: `/oauth/token` and `/oauth/revoke`. The protected routes and the verify route answer with or without the prefix.
:::

## 2. Load the specification

```bash
curl -X POST "http://localhost:18081/services/load_api_spec" \
  -H 'Content-Type: application/json; charset=utf-8' \
  --data-binary "@orders_api.json"
```

Loading a specification also creates the `api_clients` and `resource_owners` groups in the realm when they do not exist. The next step adds users to them, so load the specification first.

## 3. Create the API client and the resource owner

```bash
curl -X POST "http://localhost:18081/realms/com.example.realm/clients" \
  -H 'Content-Type: application/json' \
  -d '{"client_id": "orders-web", "client_secret": "Cl1ent-Secret"}'

curl -X POST "http://localhost:18081/realms/com.example.realm/resource_owners" \
  -H 'Content-Type: application/json' \
  -d '{"username": "alice", "password": "Al1ce-Passw0rd"}'
```

Bondy adds `orders-web` to `api_clients` and `alice` to `resource_owners`. The token path requires both memberships: it refuses a client outside `api_clients` and a resource owner outside `resource_owners`.

## 4. Allow the authentication methods

Bondy authenticates the client and the resource owner at the token path with the `password` method, and the bearer of an access token with the `oauth2` method. Each identity needs a [source](/router/reference/wamp_api/source) for the methods it uses:

```bash
curl -X POST "http://localhost:18081/realms/com.example.realm/sources" \
  -H 'Content-Type: application/json' \
  -d '{"usernames": ["orders-web", "alice"], "authmethod": "password", "cidr": "0.0.0.0/0"}'

curl -X POST "http://localhost:18081/realms/com.example.realm/sources" \
  -H 'Content-Type: application/json' \
  -d '{"usernames": ["alice"], "authmethod": "oauth2", "cidr": "0.0.0.0/0"}'
```

Narrow `cidr` to the networks your clients connect from.

## 5. Grant the call

The gateway calls `com.example.order.get` as the token's subject, so the subject needs a `wamp.call` [grant](/router/reference/wamp_api/grant):

```bash
curl -X POST "http://localhost:18081/realms/com.example.realm/grants" \
  -H 'Content-Type: application/json' \
  -d '{"permissions": ["wamp.call"], "uri": "com.example.order.", "match": "prefix", "roles": ["resource_owners"]}'
```

Skip this step if the realm has security disabled.

## 6. Obtain a token

`POST` to the token path. The client authenticates with HTTP Basic, client ID as user and client secret as password. The body is `application/x-www-form-urlencoded`:

```bash
curl -X POST "http://localhost:18080/oauth/token" \
  --user 'orders-web:Cl1ent-Secret' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=password' \
  --data-urlencode 'username=alice' \
  --data-urlencode 'password=Al1ce-Passw0rd'
```

```json
{
    "token_type": "bearer",
    "access_token": "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 900,
    "refresh_token": "tlI4SzKqVsjcUsXYCXXmA2JkjAKZ1T7QSX5GB5Or",
    "scope": "resource_owners"
}
```

`expires_in` is in seconds. `scope` lists the subject's roles, comma-separated. The form also accepts an optional `client_device_id`, which scopes the token to one device of the user.

**For a client acting on its own behalf**, send `grant_type=client_credentials` and nothing else in the body. The client is then the token's subject, so give `orders-web` the `oauth2` source and the grant instead of `alice`. The response has no `refresh_token`.

**To renew an expired access token**, send `grant_type=refresh_token` and `refresh_token=<refresh_token>`, with the same Basic credentials.

The token and refresh-token lifetimes are set in the [security configuration](/router/reference/configuration/security#authentication-oauth2).

## 7. Call a protected route

```bash
curl "http://localhost:18080/orders/1234" \
  -H 'Authorization: Bearer <access_token>'
```

A request without a valid token gets `401` and a `WWW-Authenticate: Bearer realm="com.example.realm", error="..."` header naming the cause.

## 8. Revoke the refresh token

```bash
curl -X POST "http://localhost:18080/oauth/revoke" \
  --user 'orders-web:Cl1ent-Secret' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'token=<refresh_token>' \
  --data-urlencode 'token_type_hint=refresh_token'
```

Bondy answers `200` whether or not the token existed, as RFC 7009 requires. Include `token_type_hint=refresh_token`; a request without the hint fails.

Revocation applies to refresh tokens only. A request with `token_type_hint=access_token` answers `200` and changes nothing. Access tokens already issued stay valid until `expires_in` runs out; keep their lifetime short. To revoke every refresh token a user holds, call [`bondy.oauth2.token.revoke_all`](/router/reference/wamp_api/oauth2).

## 9. Optional: gate another service through NGINX

The verify route lets NGINX accept or refuse a request to a service that is not behind the gateway, using the same tokens. NGINX's `auth_request` sends a subrequest to the route, which answers `200` for a valid credential and `401` otherwise:

```nginx
location /reports/ {
    auth_request /_bondy_verify;
    auth_request_set $bondy_authid $upstream_http_x_bondy_authid;
    proxy_set_header X-Authid $bondy_authid;
    proxy_pass http://reports_backend;
}

location = /_bondy_verify {
    internal;
    proxy_method GET;
    proxy_pass_request_body off;
    proxy_set_header Content-Length "";
    proxy_pass http://bondy:18080/oauth/verify;
}
```

The verify route reads the token from the `Authorization: Bearer` header, which NGINX passes on to the subrequest. It accepts only `GET` and `HEAD`, hence `proxy_method GET`. A `200` carries the identity in `x-bondy-authid`, `x-bondy-authroles` and the other headers listed under [Verify route](/router/reference/api_gateway/specification#verify-route); `auth_request_set` copies them for the upstream.

The verify route answers *who* the caller is, not what the caller may do. Decide access to `/reports/` from those headers. If the specification's `host` is not `_`, set `proxy_set_header Host` in `/_bondy_verify` to a name it matches.

## Result

Every route of the specification now requires a Bondy access token. To confirm:

1. `curl -i http://localhost:18080/orders/1234` answers `401` with a `WWW-Authenticate: Bearer` header.
2. The same request with `Authorization: Bearer <access_token>` reaches `com.example.order.get`.
3. After step 8, a `grant_type=refresh_token` request with the revoked refresh token fails.

## See also

- [Security Object](/router/reference/api_gateway/specification#security-object): every field of the `oauth2` scheme.
- [OAuth2 Administration](/router/reference/wamp_api/oauth2): manage clients, resource owners and their refresh tokens over WAMP.
- [Source](/router/reference/wamp_api/source) and [Grant](/router/reference/wamp_api/grant): the authentication and authorization rules this guide adds.
