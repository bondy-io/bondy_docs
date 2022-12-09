---
draft: false
outline: [2,3]
related:
    - text: Network Listeners
      type: Configuration Reference
      link: /reference/configuration/listeners#api-gateway-http-listener
      description: Configure the network listeners for the HTTP API Gateway.
    - text: Security
      type: Configuration Reference
      link: /reference/configuration/security#authentication-oauth2
      description: Configure OAuth2 authentication for HTTP APIs
    - text: HTTP API Gateway
      type: HTTP API Reference
      link: /reference/http_api/api_gateway
      description: Load and manage API Gateway specifications.
    - text: Marketplace HTTP API Gateway
      type: Tutorial
      link: /tutorials/getting_started/marketplace_api_gateway
      description: A tutorial that demonstrates a simple marketplace with Python microservices and a VueJS Web App.
---
# HTTP API Gateway Specification
An API Gateway specification is a document that tells Bondy how to route incoming HTTP requests to your WAMP APIs or to external HTTP APIs.

## Overview
An API Gateway Specification document, a JSON data structure that _declaratively_ defines an HTTP API and how Bondy should handle each HTTP Request e.g. by converting it into a WAMP operation or forwarding it to an upstream (external) HTTP API. This includes capabilities for data transformation.

::: definition A declarative Finite State Machine (FSM)
In effect, an API Gateway Specification is a declarative definition of an API Gateway Finite State Machine that exposes an HTTP (REST) API and converts its nouns and verbs to either WAMP or HTTP [actions](#action-object).
:::

With this approach you can create a whole REST HTTP API from scratch without any coding.

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

::: tip
You key to the definition of an API Gateway Specification is understanting the [API Context](#api-context), since defining a specification implies writing expressions that target (read and/or update) the context.
:::


## API Context

The API context is map data structure, created by the API Gateway, that
at runtime contains the HTTP Request data and the results of parsing and evaluating the definitions and expressions defined in an API Gateway Specification.

The context contains the following keys:

<DataTreeView :data="context" :maxDepth="10" />


### Request Object

The object represents the contents (data and metadata) of an HTTP request.  At runtime the API Gateway writes this object in the [API Context](#api-context) `request` property.


<DataTreeView :data="request" :maxDepth="10" />

You access the values in this object by writing expressions using the [API Specification expression language](#expression-language).

### Result Object

#### WAMP Result
The result for a [WAMP Action](#wamp-action).

This object will be accesible with the expression `{{"\{\{action.result\}\}"}}`.

<DataTreeView :data="wampResult" :maxDepth="10" />

#### HTTP Forward Result

### Error Object
::: warning TBD
:::

## Expression Language

Most API Specification object properties support expressions using an embedded logic-less domain-specific language (internally called _"Mops"_) for data transformation and dynamic configuration.

This same language is also used by the [Broker Bridge Specification](/reference/configuration/broker_bridge).

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
|`{{"\{\{request.method\}\}"}}`|`POST`|
|`{{"\{\{request.body\}\}"}}`|`{"id": 12345, "bill_to":...}`|
|`{{"\{\{request.body.sku\}\}"}}`|`"ZPK1972"`|
|`{{"The sku number is \{\{request.body.sku\}\}"}}`|`"The sku number is ZPK1972"`|
|`{{"\{\{request.body.price\}\}"}}`|`13.99`|
|`{{"\{\{request.body.price \|> integer\}\}"}}`|`13`|
|`{{"\{\{request.body.price \|> string\}\}"}}`|`"13.99"`|
|`{{"\{\{request.body.customer.first_name\}\}"}}`|`"John"`|
|`{{"\{\{request.body.customer.first_name\}\}"}} {{"\{\{request.body.customer.last_name\}\}"}}`|`"John Doe"`|
|`{{"\{\{variables.foo\}\}"}}`|Returns the value of the `foo` variable|
|`{{"\{\{defaults.status_codes\}\}"}}`|Returns the status codes map|

::: info Learn more
Expressions also allow to set values in the context and use functions to manipulate the request data. Learn more about expressions in the [API Specification Expressions](/reference/api_gateway/expressions) reference section.
:::

## Specification Evaluation

### Incremental Evaluation

The API Specification evaluation performed incrementally in two stages:

1. **_During loading, validation and parsing_**. All API Specification expressions will be evaluated to either a (final) value or a `promise`. Promises occur when an expression dependes directly or indirectly (transitive closure) on HTTP request data. This results in a context object.
1. **_During HTTP request handling at runtime_**. The context created in the first stage is updated with the HTTP request data and the API Specification is evaluated again using the updated context, yielding the actions to be performed with all promises evaluated to values (grounded).

### Recursive Evaluation
The evaluation of the expressions in the API Gateway Specification is done by passing the [API Context](#api-context) recursively throughout the specification object tree.

At each level of the tree children nodes can
can use the values of the certain properties defined in the ancestor node (through expressions), override them and/or update the [API Context](#api-context).



## API Object
The API object is the root of an API Specification. It contains one or more [API Version](#version-object) objects.

<DataTreeView :data="api" :maxDepth="10" />

::: details API Object example

```javascript
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
```javascript
TBD
```
:::

## Path Object

A path specification to be used as a value to a key in the `paths` property of a [Version Object](#version-object).

<DataTreeView :data="path" :maxDepth="10" />

::: details Path Object example

```javascript
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
```javascript
TBD
```
:::

## Action Object

The API Gateway currently supports 3 types of actions.

### Static Action
An action that returns a static response.


<DataTreeView :data="staticAction" :maxDepth="10" />

::: details Action Object example
```javascript
TBD
```
:::



### Forward Action
An action that forwards the incoming HTTP request to an upstream HTTP endpoint.

<DataTreeView :data="fwdAction" :maxDepth="10" />

::: details Forward Action Object example
```javascript
TBD
```
:::

### WAMP Action
An action that transforms an incoming HTTP request to a WAMP operation.

<DataTreeView :data="wampAction" :maxDepth="10" />

::: details WAMP Action example

```javascript 6-12
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

## Response Object
The response object defines what the API Gateway should respond in case of a successful result or error. The purpose of this declaration is to be able to customise the outcome of the action performed according to the [Action Object](#action-object) declaration.

The outcome is obtained from the [API Context](#api-context) `action` property by using an expression such as `{{"\{\{action.result.PROP\}\}"}}` (in case of a successful result) and `{{"\{\{action.error.PROP\}\}"}}` (in case of an error) where `PROP` will depend on the type of action performed.


<DataTreeView :data="response" :maxDepth="10" />

::: details WAMP Response Object Example
```javascript 10-27
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
The Security Object defines the authentication method to be used for an API Version. The supported authentication methods are:

* Basic Authentication
* API Key
* OAuth2
    * Client Credentials
    * Resource Owner Password


### Basic Authentication

<DataTreeView :data="basicSecurity" :maxDepth="10" />


### API Key Authentication

<DataTreeView :data="apiKeySecurity" :maxDepth="10" />
::: warning
CURRENTLY NOT IMPLEMENTED
:::


### OAuth2 AUthentication

<DataTreeView :data="oauth2" :maxDepth="10" />

## Default Values

### Status Codes
The following are the default values used to initialise the [API Context](#api-context).

```javascript
{
    "bondy.error.already_exists": 400, // BAD REQUEST
    "bondy.error.not_found": 404, // NOT FOUND
    "bondy.error.bad_gateway": 504, // SERVICE UNAVAILABLE
    "bondy.error.http_gateway.invalid_expression": 500, // INTERNAL SERVER ERROR,
    "bondy.error.timeout": 504, // GATEWAY TIMEOUT
    "wamp.error.authorization_failed": 500, // INTERNAL SERVER ERROR,
    "wamp.error.canceled": 400, // BAD REQUEST
    "wamp.error.close_realm": 500, // INTERNAL SERVER ERROR,
    "wamp.error.disclose_me_not_allowed": 400, // BAD REQUEST
    "wamp.error.goodbye_and_out": 500, // INTERNAL SERVER ERROR,
    "wamp.error.invalid_argument": 400, // BAD REQUEST
    "wamp.error.invalid_uri": 400, // BAD REQUEST
    "wamp.error.net_failure": 502, // BAD GATEWAY
    "wamp.error.not_authorized": 403, // FORBIDDEN
    "wamp.error.no_eligible_callee": 502, // BAD GATEWAY
    "wamp.error.no_such_procedure": 501, // NOT IMPLEMENTED
    "wamp.error.no_such_realm": 502, // BAD GATEWAY
    "wamp.error.no_such_registration": 502, // BAD GATEWAY
    "wamp.error.no_such_role": 400, // BAD REQUEST
    "wamp.error.no_such_session": 500, // INTERNAL SERVER ERROR,
    "wamp.error.no_such_subscription": 502, // BAD GATEWAY
    "wamp.error.option_disallowed_disclose_me": 400, // BAD REQUEST
    "wamp.error.option_not_allowed": 400, // BAD REQUEST
    "wamp.error.procedure_already_exists": 400, // BAD REQUEST
    "wamp.error.system_shutdown": 500 // INTERNAL SERVER ERROR
}
```

<!--@include: specification_data.md-->
