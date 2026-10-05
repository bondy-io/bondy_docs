---
draft: false
outline: [2,3]
related:
    - text: Network Listeners
      type: Configuration Reference
      link: /router/reference/configuration/listeners#identity-and-mount
      description: Configure the network listeners for the HTTP API Gateway.
    - text: Security
      type: Configuration Reference
      link: /router/reference/configuration/security#authentication-oauth2
      description: Configure OAuth2 authentication for HTTP APIs
    - text: HTTP API Gateway
      type: HTTP API Reference
      link: /router/reference/http_api/api_gateway
      description: Load and manage API Gateway specifications.
    - text: Marketplace HTTP API Gateway
      type: Tutorial
      link: /router/tutorials/getting_started/marketplace_api_gateway
      description: A tutorial that demonstrates a simple marketplace with Python microservices and a VueJS Web App.
---
# HTTP API Gateway Specification
An API Gateway specification is a document that tells Bondy how to route incoming HTTP requests to your WAMP APIs or to external HTTP/REST APIs.

## Overview
An API Gateway Specification document is a JSON data structure that _declaratively_ defines an HTTP/REST API and how Bondy should handle each HTTP Request e.g. by converting it into a WAMP operation or forwarding it to an upstream (external) HTTP/REST API. This includes capabilities for data transformation.

::: definition A declarative Finite State Machine (FSM)
In effect, an API Gateway Specification is a declarative definition of an API Gateway Finite State Machine that exposes an HTTP/REST API and converts its nouns and verbs to either WAMP or other HTTP/REST [actions](#action-object).
:::

With this approach you can create a whole HTTP/REST API from scratch without any coding.

The API Gateway Specification document has a structure represented by the following object tree:

- [API Object](#api-object)
    - [Version Object 1](#version-object)
        - [Path Object 1](#path-object)
            - `HTTP METHOD`
                - [Operation Object](#operation-object)
                    - [Action Object](#action-object)
                    - [Response Object](#response-object)
            - ... other HTTP methods
        - ... other path objects
    - ... other version objects

The following diagram shows the object tree in detail, including all properties and types.

<ZoomImg src="/assets/api_gateway_spec.png"/>

The properties of the objects in the object tree can contain static values and/or dynamically evaluated values via [expressions](#expression-language) that are resolved against the HTTP request data at runtime.

::: definition FSM State
The [API Context](#api-context) is the state of the API Gateway FSM. It is is [incrementally](#incremental-evaluation) an [recursively](#recursive-evaluation) constructed.
:::

So an API Gateway Specification is the basis of an [API Context](#api-context) but also it is evaluated against it, primarily because the context will contain the [Request Object](#request-object) at runtime.

The key to the definition of an API Gateway Specification is understanting the [API Context](#api-context), since defining a specification implies writing expressions that target (read and/or update) the context.

::: info On the Open API standard
[Open API (formerly Swagger)](https://www.openapis.org) defines a standard on how HTTP APIs are described, not its implementation. An API Gateway Specification describes and API and the behaviour of the Gateway, that is, it also defines its implementation in terms of the actions that the Gateway need to perform.

A Future version of the API Gateway will aligning with Open API. In addition, the API Gateway implementation will be able to produce and serve an Open API specification of the APIs defined in Bondy.
:::


## API Context

The API context is a map data structure created by the API Gateway. At runtime, it contains the HTTP Request data as well as the results of parsing and evaluating the definitions and expressions defined in an API Gateway Specification.

The context contains the following keys:

<DataTreeView :data="context" :maxDepth="10" />


### Request Object

The object represents the contents (data and metadata) of an HTTP request.  At runtime, the API Gateway writes this object in the [API Context](#api-context) `request` property.


<DataTreeView :data="request" :maxDepth="10" />

You access the values in this object by writing expressions using the [API Specification expression language](#expression-language).

### Result Object

#### WAMP Result
The result for a [WAMP Action](#wamp-action).

This object will be accessible with the expression `{{action.result}}`.

<DataTreeView :data="wampResult" :maxDepth="10" />

#### HTTP Forward Result
The result of a [Forward Action](#forward-action) whose upstream responded with a status code below `400`.

This object will be accessible with the expression `{{action.result}}`.

```json
{
    "status_code": 200,
    "headers": { "content-type": "application/json" },
    "body": "...",
    "uri": ""
}
```

`uri` is the upstream response's `Location` header, if it sent one, or an empty string otherwise.

### Error Object
The shape of `{{action.error}}` when an action fails, for either a [WAMP Action](#wamp-action) or a [Forward Action](#forward-action).

For a WAMP action, the error is the called procedure's own WAMP `ERROR` message, with an added `status_code` (derived from `error_uri` via the API's [`status_codes`](#api-object) map):

```json
{
    "error_uri": "com.example.error.not_found",
    "args": ["The requested resource was not found."],
    "kwargs": {},
    "details": {},
    "status_code": 404
}
```

For a Forward Action whose upstream responded with a status code of `400` or above, the error is the raw upstream response:

```json
{
    "status_code": 404,
    "headers": { "content-type": "application/json" },
    "body": "..."
}
```

## Expression Language

Most API Specification object properties support expressions using an embedded logic-less domain-specific language (internally called _"Mops"_) for data transformation and dynamic configuration.

This same language is also used by the [Broker Bridge Specification](/router/reference/configuration/broker_bridge).

The expression language operates on the [API Context](#api-context) and it works by expanding keys (or key paths) provided in a context object and adding or updating keys in the same context object.

Let's assume that we receive the following HTTP request:

```bash
curl -X "POST" "http://localhost:18081/accounts/" \
-H 'Content-Type: application/json; charset=utf-8' \
-H 'Accept: application/json; charset=utf-8' \
--data-binary '{
    "id" : 12345
    "sku" : "ZPK1972",
    "price" : 13.99,
    "customer": {
        "first_name": "John",
        "last_name": "Doe",
        "email" : "john.doe@foo.com"
    },
    "ship_to": {
        "first_name": "May",
        "last_name": "Poppins",
        "address" : "3 High Street",
        "town" : "Guildford",
        "county" : "Surrey",
        "zip"   : "GU1 1AF"
    },
    "bill_to": {
        "first_name": "John",
        "last_name": "Doe",
        "address" : "13 Sandy Lane",
        "town" : "Esher",
        "county" : "Surrey",
        "zip"   : "KT11 2PQ"
    }
}'
```

Let's explore a some example to demonstrate how you can use expression in Bondy's configuration objects to read data from the HTTP Request.

The following table shows some example expressions being evaluated against the API Context for the above HTTP Request.

|Expression String|Evaluates To|
|---|---|
|`{{request.method}}`|`POST`|
|`{{request.body}}`|`{"id": 12345, "bill_to":...}`|
|`{{request.body.sku}}`|`"ZPK1972"`|
|`"The sku number is {{request.body.sku}}"`|`"The sku number is ZPK1972"`|
|`{{request.body.price}}`|`13.99`|
|`{{request.body.price \|> integer}}`|`13`|
|`{{request.body.customer.first_name}}`|`"John"`|
|`"{{request.body.customer.first_name}} {{request.body.customer.last_name}}"`|`"John Doe"`|
|`{{variables.foo}}`|Returns the value of the `foo` variable|
|`{{status_codes}}`|Returns the status codes map|

::: info Learn more
Expressions also allow to set values in the context and use functions to manipulate the request data. Learn more about expressions in the [API Specification Expressions](/router/reference/api_gateway/expressions) reference section.
:::

## Specification Evaluation

### Incremental Evaluation

The API Specification evaluation performed incrementally in two stages:

1. **_During loading, validation and parsing_**. All API Specification expressions will be evaluated to either a (final) value or a `promise`. Promises occur when an expression depends directly or indirectly (transitive closure) on HTTP request data. This results in a context object.
1. **_During HTTP request handling at runtime_**. The context created in the first stage is updated with the HTTP request data and the API Specification is evaluated again using the updated context, yielding the actions to be performed with all promises evaluated to values (grounded).

### Recursive Evaluation
The evaluation of the expressions in the API Gateway Specification is done by passing the [API Context](#api-context) recursively throughout the specification object tree.

At each level of the tree children nodes can
can use the values of the certain properties defined in the ancestor node (through expressions), override them and/or update the [API Context](#api-context).



## API Object
The API object is the root of an API Specification. It contains one or more [API Version](#version-object) objects.

<DataTreeView :data="api" :maxDepth="10" />

::: details API Object example

```json
{
  "id": "example-api",
  "name" : "Bonding in HTTP",
  "host" : "_",
  "realm_uri" : "com.example.public",
  "meta": {"foo" : "bar"}
  "variables" : {
     "cors_headers": {
        "access-control-allow-origin": "*",
        "access-control-allow-credentials": "true",
        "access-control-allow-methods": "GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE",
        "access-control-allow-headers": "origin,x-requested-with,content-type,accept,authorization,accept-language",
        "access-control-max-age": "86400"
    }
  },
  "defaults" : {
    "schemes" : ["http"]
  },
  "status_codes": {
    "com.example.error.not_found": 404,
    "com.example.error.unknown_error": 500,
    "com.example.error.internal_error": 500
  },
  "versions" : [
    ...
  ]
}
```
:::


## Version Object
The Version Object represents a particular API version.

<DataTreeView :data="version" :maxDepth="10" />

::: details Version Object example
```json
{
    "base_path": "/[v1.0]",
    "is_active": true,
    "is_deprecated": false,
    "languages": ["en"],
    "info": {
        "title": "Marketplace API v1.0",
        "description": "Version 1.0 of the Marketplace demo API."
    },
    "defaults": {
        "timeout": 20000
    },
    "status_codes": {
        "com.example.error.not_found": 404,
        "com.example.error.internal_error": 500
    },
    "paths": {
        "/services/echo": {
            "get": { }
        }
    }
}
```
:::

## Path Object

A path specification to be used as a value to a key in the `paths` property of a [Version Object](#version-object).

<DataTreeView :data="path" :maxDepth="10" />

::: details Path Object example

```json
{
    "id": "example-api",
    ...,
    "versions" : {
        "base_path": "v1.0",
        ...,
        "paths" : {
            "/path/to/resource" : {
                "get" : {
                    ...
                },
                "post" : {
                    ...
                }
            },
            "/path/to/:resourceId" : {
                "get" : {
                    ...
                },
                "post" : {
                    ...
                }
            },
            "/path/to/other/resource" : {
                "get" : {
                    ...
                },
                "post" : {
                    ...
                }
            }
        }
    }
}
```
:::

## Operation Object

<DataTreeView :data="operation" :maxDepth="10" />

::: details Operation Object example
```json
{
    "info": "Echoes the request body back to the caller.",
    "body_max_bytes": 1048576,
    "action": {
        "type": "static",
        "body": "{{request.body}}"
    },
    "response": {
        "on_result": {
            "body": "{{action.result}}"
        }
    }
}
```
:::

## Action Object

The API Gateway supports four types of action: `static`, `forward`, `wamp_call` and `wamp_publish`.

### Static Action
An action that returns a static response.


<DataTreeView :data="staticAction" :maxDepth="10" />

::: details Static Action example
```json
{
    "type": "static",
    "headers": {
        "content-type": "application/json"
    },
    "body": {
        "status": "operational",
        "version": "1.0.0"
    }
}
```
:::



### Forward Action
An action that forwards the incoming HTTP request to an upstream HTTP endpoint.

<DataTreeView :data="fwdAction" :maxDepth="10" />

::: details Forward Action Object example
```json
{
    "type": "forward",
    "http_method": "{{request.method}}",
    "host": "upstream.example.com",
    "path": "{{request.path}}",
    "query_string": "{{request.query_string}}",
    "headers": "{{request.headers}}",
    "body": "{{request.body}}",
    "timeout": 5000,
    "connect_timeout": 5000,
    "retries": 0
}
```
:::

### WAMP Action
An action that transforms an incoming HTTP request to a WAMP operation.

<DataTreeView :data="wampAction" :maxDepth="10" />

::: details WAMP Action example

```json 6-12
{
    ...
    "paths": {
        "/accounts" : {
            "post": {
                "action": {
                    "type": "wamp_call",
                    "procedure": "com.example.account",
                    "options": {"timeout": 15000},
                    "args" : ["{{request.body}}"],
                    "kwargs" : {}
                },
                "response": {,
                    ...
                }
            }
        }
    }
}
```
:::

### WAMP Publish Action
An action that publishes an event to a WAMP topic, with `type` set to `wamp_publish`. Its fields are those of the WAMP call action, with `topic` in place of `procedure`: `topic`, `options`, `args` and `kwargs`. The parser also requires `timeout` and `retries`. Every field can be an expression evaluated against the [API Context](#api-context).

On success, `action.result` is `{"publication_id": <id>}`.

::: details WAMP Publish Action example

```json
{
    "type": "wamp_publish",
    "topic": "com.example.account.created",
    "options": {},
    "args": ["{{request.body}}"],
    "kwargs": {},
    "timeout": 15000,
    "retries": 0
}
```
:::

## Response Object
The response object defines what the API Gateway should respond in case of a successful result or error. The purpose of this declaration is to be able to customise the outcome of the action performed according to the [Action Object](#action-object) declaration.

The outcome is obtained from the [API Context](#api-context) `action` property by using an expression such as `{{action.result.PROP}}` (in case of a successful result) and `{{action.error.PROP}}` (in case of an error) where `PROP` will depend on the type of action performed.


<DataTreeView :data="response" :maxDepth="10" />

::: details WAMP Response Object Example
```json 10-27
{
    ...
    "paths": {
        "/accounts" : {
            "post": {
                "action": {
                    "type": "wamp_call",
                    ...
                },
                "response": {,
                    "on_result": {
                        "body": "{{action.result.args |> head}}"
                    },
                    "on_error": {
                        "status_code": "{{status_codes |> get({{action.error.error_uri}}, 500) |> integer}}",
                        "body": {
                            "error_uri": "{{action.error.error_uri}}",
                            "args": "{{action.error.args}}",
                            "kwargs": "{{action.error.kwargs}}",
                            "details": "{{action.error.details}}"
                        }
                    }
                }
            }
        }
    }
}
```
:::

## Defaults Object
The defaults object is used to define default values for the API specification objects properties.

The API Specification parser will use this object to find a default value for the following keys when evaluating the different objects:


<DataTreeView :data="defaults" :maxDepth="10" />

## Security Object
The Security Object defines how requests to an API version authenticate. The router enforces only two of the schemes the parser accepts:

| `type` | Requests to the version's paths | Routes Bondy adds under the version's `base_path` |
|---|---|---|
| (empty object) | Served without authentication. | None. |
| `oauth2` | Require a valid Bondy OAuth2 access token. | The token and revoke paths, `/oauth/jwks`, and a [verify route](#verify-route). |
| `oidc` | **Refused.** | `/oidc/login`, `/oidc/<provider>/callback`, `/oidc/logout`, and a [verify route](#verify-route). See [OIDC Authentication](/router/concepts/oidc_authentication). |
| `basic` | **Refused.** | None. |
| `api_key` | **Refused.** | None. |

::: danger `basic`, `api_key` and `oidc` do not protect a path
A specification using one of these schemes loads, but Bondy refuses every request to the version's own paths and logs a warning. It never serves them without authentication. Use `oauth2` to protect an HTTP API. The `oidc` scheme exists to run the browser login flow, whose ticket cookie then authenticates WAMP sessions over the [HTTP transports](/router/concepts/http_transports), or a reverse proxy through the verify route.
:::

### OAuth2 Authentication

<DataTreeView :data="oauth2" :maxDepth="10" />

### Basic Authentication

<DataTreeView :data="basicSecurity" :maxDepth="10" />

### API Key Authentication

<DataTreeView :data="apiKeySecurity" :maxDepth="10" />

### Verify route

The `oauth2` and `oidc` schemes add a route that lets a reverse proxy, such as NGINX with `auth_request`, ask whether a request carries a valid Bondy credential. It is mounted at `<base_path>/oauth/verify` for `oauth2` and `<base_path>/oidc/verify` for `oidc`; set `verify_path` in the Security Object to change it. It verifies against the realm the specification is bound to.

The route accepts `GET` and `HEAD`. It reads the credential from the first of these that is present, and does not fall back to a later one if that credential fails:

1. `Authorization: Bearer <credential>`
2. `X-Bondy-Ticket: <ticket>`
3. The `bondy_ticket_<realm_uri>` cookie set by the OIDC login flow

It checks the credential's signature, expiry and revocation; that its scope covers the realm and its issuer is trusted by the realm; that the user is enabled and still exists; and that the realm still allows connections. A credential issued by the OIDC login flow for an identity Bondy does not store locally passes without a local user.

| Outcome | Status | Response |
|---|---|---|
| Valid credential | `200` | A JSON body with `active`, `authid`, `authrealm`, `realm`, `authroles`, `authmethod`, `scope`, `issued_at`, `expires_at` and `expires_in`, and the headers `x-bondy-authid`, `x-bondy-authrealm`, `x-bondy-realm`, `x-bondy-authroles` (comma-separated), `x-bondy-authmethod` and `x-bondy-expires-at`. |
| Anything else | `401` | A JSON error body with `active: false`. |

Every failure answers `401`, including server-side ones, because NGINX turns any other non-2xx status from `auth_request` into a `500`. The route answers *who* the caller is, not what they may do.

## Loading Specifications at Startup

Specifications are usually loaded at runtime through the [HTTP API](/router/reference/http_api/api_gateway). A node can also load them from a file on every boot.

@[config](api_gateway.config_file,path,none,v0.8.8)

The path of a JSON file holding one specification object or an array of them. When the key is unset, no file is loaded.

Each node reads the file on every boot, before its listeners start, and stores each valid specification in the replicated store, from where it reaches the other nodes. A specification identical to the stored one is not written again, so an unchanged file produces no replicated writes on reboot.

The file only adds and updates specifications. Removing a specification from the file does not delete it from the store; delete it with the `bondy.http_gateway.api.delete` WAMP procedure.

Bondy does not stop the boot over a bad file:

- A missing file logs a warning.
- A file that is not valid JSON logs an error, and nothing from it is loaded.
- A specification that fails validation logs an error. In an array, the specifications before it are loaded and the ones after it are not.

## Default Values

### Status Codes
Every error URI in Bondy's catalogue has a default HTTP status, listed in the `HTTP` column of the [Error Reference](/router/reference/errors). Bondy initialises the [API Context](#api-context) `status_codes` map from that catalogue. Any URI not in the catalogue, including your own application's error URIs, maps to `500` unless the specification maps it.

Override or extend the defaults with the specification's `status_codes` key:

```json
{
    "status_codes": {
        "com.example.error.not_found": 404,
        "bondy.error.timeout": 503
    }
}
```

<!--@include: specification_data.md-->
