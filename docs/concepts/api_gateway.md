---
outline: [2,3]
related:
    - text: HTTP API Gateway Specification
      type: Reference
      link: /reference/api_gateway/specification
      description: Detailed reference for the API Gateway Specification JSON format, expression language, and object tree.
    - text: HTTP API Gateway HTTP API
      type: HTTP API Reference
      link: /reference/http_api/api_gateway
      description: Load and manage API Gateway specifications via the Admin HTTP API.
    - text: Loading an API Gateway Specification
      type: How-to Guide
      link: /guides/programming/loading_api_spec
      description: Learn how to load an API Gateway Specification using the HTTP Admin API.
    - text: RPC Gateway
      type: Concepts
      link: /concepts/rpc_gateway
      description: The RPC Gateway works in the opposite direction — bridging WAMP calls to upstream HTTP services.
    - text: Network Listeners
      type: Configuration Reference
      link: /reference/configuration/listeners#api-gateway-http-listener
      description: Configure the network listeners for the HTTP API Gateway.
    - text: Marketplace HTTP API Gateway
      type: Tutorial
      link: /tutorials/getting_started/marketplace_api_gateway
      description: A tutorial that demonstrates a simple marketplace with Python microservices and a VueJS Web App.
---
# HTTP API Gateway

Bondy includes an embedded HTTP API Gateway that acts as a reverse proxy, routing incoming HTTP/REST requests to WAMP procedures or to external HTTP/REST APIs.

## Overview

::: definition HTTP API Gateway
The HTTP API Gateway is a Bondy subsystem that accepts incoming HTTP requests and translates them into WAMP operations (RPC calls or Pub/Sub events) or forwards them to upstream HTTP/REST APIs. It enables WAMP-based microservices to be exposed as standard REST APIs without any additional infrastructure.
:::

The API Gateway allows you to define a complete HTTP/REST API declaratively using a JSON specification document — no coding required. The specification describes how each HTTP endpoint maps to a WAMP procedure call or an external HTTP request, including data transformation using an embedded expression language.

### Two Gateways, Opposite Directions

Bondy provides two gateway subsystems that work in opposite directions:

```
                   HTTP API Gateway
External  ───HTTP Request──>  Bondy  ───WAMP Call──>  WAMP Service
Client    <──HTTP Response──         <──WAMP Result──

                    RPC Gateway
WAMP      ───WAMP Call──>     Bondy  ───HTTP Request──>  External
Client    <──WAMP Result──           <──HTTP Response──   REST API
```

| | HTTP API Gateway | [RPC Gateway](/concepts/rpc_gateway) |
|:---|:---|:---|
| **Direction** | HTTP → WAMP (or HTTP → HTTP) | WAMP → HTTP |
| **Use case** | Expose WAMP services as REST APIs | Consume REST APIs from WAMP clients |
| **Configuration** | JSON specification document | `bondy.conf` service definitions |
| **Data transformation** | Expression language (Mops) | KWArgs routing (path/query/body) |
| **Authentication** | OAuth2, OIDC, WAMP auth methods | Pluggable upstream auth (OAuth2, API keys) |


## Key Features

- **Declarative configuration** — Define your entire REST API in a JSON document. No custom handler code needed.
- **WAMP integration** — Map HTTP verbs and paths to WAMP procedure calls. The API Gateway handles serialization, error mapping, and response formatting.
- **HTTP forwarding** — Forward requests to external HTTP/REST APIs, acting as a traditional reverse proxy.
- **Expression language** — Transform request and response data using Mops, an embedded logic-less expression language for dynamic value interpolation.
- **Versioned APIs** — Support multiple API versions under different base paths within a single specification.
- **Security schemes** — Built-in support for [OAuth2](/reference/configuration/security#authentication-oauth2) and [OIDC](/concepts/oidc_authentication) security schemes.
- **Cluster-wide replication** — API specifications are automatically replicated and activated across all nodes in the cluster.


## How It Works

An API Gateway Specification is a JSON document that describes:

1. **An API** — Identified by a unique ID and bound to a single [Realm](/concepts/realms).
2. **Versions** — Each version has a `base_path` and a set of path definitions.
3. **Paths** — Each path maps HTTP methods to operations.
4. **Operations** — Each operation defines an action (WAMP call, HTTP forward, or static response) and a response transformation.

::: definition A Declarative Finite State Machine
An API Gateway Specification is effectively a declarative Finite State Machine (FSM) definition. It exposes an HTTP/REST API and converts HTTP nouns and verbs into WAMP or HTTP actions. The FSM state — the [API Context](/reference/api_gateway/specification#api-context) — is incrementally and recursively constructed as the specification is evaluated.
:::

### Object Tree

```
API Object
 └── Version Object(s)
      └── Path Object(s)
           └── HTTP Method (GET, POST, PUT, ...)
                └── Operation Object
                     ├── Action Object (wamp_call | static | http_forward)
                     └── Response Object
```

### Request Flow

```
HTTP Client                     Bondy API Gateway                    WAMP Service
    │                                 │                                   │
    │  GET /v1.0/invoices/42          │                                   │
    │────────────────────────────────>│                                   │
    │                                 │  Match path + method              │
    │                                 │  Evaluate expressions             │
    │                                 │  Build API Context                │
    │                                 │                                   │
    │                                 │  WAMP Call: com.billing.get(42)   │
    │                                 │──────────────────────────────────>│
    │                                 │  WAMP Result: {id: 42, ...}      │
    │                                 │<──────────────────────────────────│
    │                                 │                                   │
    │                                 │  Apply response transformation    │
    │  200 {"id": 42, ...}            │                                   │
    │<────────────────────────────────│                                   │
```


## Action Types

The API Gateway supports three types of actions:

### WAMP Action

Translates the HTTP request into a WAMP procedure call. The procedure URI, arguments, and kwargs are defined using expressions that can reference the HTTP request data.

```json
{
    "type": "wamp_call",
    "procedure": "com.billing.get_invoice",
    "options": {},
    "args": ["{{"\{\{request.path_params.id\}\}"}}"],
    "kwargs": "{{"\{\{request.body\}\}"}}"
}
```

### Static Action

Returns a static response without making any backend call. Useful for health checks, documentation endpoints, or mock APIs.

```json
{
    "type": "static",
    "body": {"status": "ok", "version": "1.0.0"}
}
```

### HTTP Forward Action

Forwards the HTTP request to an external upstream API. Bondy acts as a traditional reverse proxy.

```json
{
    "type": "forward",
    "http_method": "{{"\{\{request.method\}\}"}}",
    "host": "billing.internal",
    "port": 8080,
    "path": "/api{{"\{\{request.path\}\}"}}",
    "headers": "{{"\{\{request.headers\}\}"}}",
    "body": "{{"\{\{request.body\}\}"}}"
}
```


## Expression Language

Most properties in an API Gateway Specification support expressions using an embedded logic-less domain-specific language called **Mops**. Expressions are enclosed in double curly braces: `\{\{expression\}\}`.

Expressions operate on the [API Context](/reference/api_gateway/specification#api-context) — a map that contains the HTTP request data, variables, defaults, and action results.

| Expression | Evaluates To |
|:---|:---|
| `{{"\{\{request.method\}\}"}}` | `POST` |
| `{{"\{\{request.body.sku\}\}"}}` | `"ZPK1972"` |
| `{{"\{\{request.body.price \\|> integer\}\}"}}` | `13` |
| `{{"\{\{request.body.customer.first_name\}\}"}}` | `"John"` |
| `{{"\{\{variables.foo\}\}"}}` | Value of the `foo` variable |

::: info Learn More
See the full [Expression Language Reference](/reference/api_gateway/expressions) for details on pipes, type conversions, and context manipulation.
:::


## Security Schemes

The API Gateway supports pluggable security schemes:

### OAuth2

Provides OAuth2 token endpoints (token issuance and revocation) and protects API routes with bearer token authentication.

```json
{
    "security": {
        "type": "oauth2",
        "flow": "resource_owner_password_credentials",
        "token_path": "/oauth/token",
        "revoke_token_path": "/oauth/revoke"
    }
}
```

### OIDC

Integrates with external Identity Providers via [OpenID Connect](/concepts/oidc_authentication). Automatically registers login, callback, and logout endpoints.

```json
{
    "security": {
        "type": "oidc",
        "provider": "azure"
    }
}
```

See [OIDC Authentication](/concepts/oidc_authentication) for the complete setup guide.


## Loading and Managing APIs

API specifications are loaded, inspected, and deleted via the [Admin HTTP API](/reference/http_api/api_gateway):

| Action | Method | URL |
|:---|:---|:---|
| Load a spec | POST | `/api_specs` |
| List all specs | GET | `/api_specs` |
| Get a spec | GET | `/api_specs/:id` |

::: tip Cluster Deployments
APIs are replicated, synchronised, and activated across the cluster automatically, so that each node serves all the defined APIs.
:::

## Next Steps

- [API Gateway Specification Reference](/reference/api_gateway/specification) — Full reference for the JSON specification format.
- [Expression Language Reference](/reference/api_gateway/expressions) — Details on the Mops expression language.
- [Loading an API Gateway Specification](/guides/programming/loading_api_spec) — Step-by-step guide to loading specs via the Admin API.
- [Marketplace Tutorial](/tutorials/getting_started/marketplace_api_gateway) — A hands-on tutorial with Python microservices and a VueJS web app.
