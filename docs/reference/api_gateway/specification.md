---
draft: false
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
    - text: Marketplace
      type: Tutorial
      link: /tutorials/getting_started/marketplace
      description: A tutorial that demonstrates a simple marketplace with Python microservices and a VueJS Web App.
---
# HTTP API Gateway Specification Reference
Bondy API Gateway is a reverse proxy that lets you manage, configure, and route requests to your WAMP APIs and also to external HTTP APIs. It Bondy to be integrated into an existing HTTP/REST API ecosystem.

## Overview
The API Gateway can hosts one or more APIs and runs on top of your WAMP API and also in front of any external HTTP API.

Each API is defined _declaratively_ using an API Gateway Specification document, a JSON data structure that defines how for each incoming request, Bondy will determine which action to perform e.g. make a WAMP operation or forward the request to an external HTTP API, and how to transform the input data based on this specification.

::: info Declarative programming
As you might have noticed, APIs are developed declaratively by using the API Gateway Specification document. With this approach you can create a whole REST HTTP API from scratch without any coding.


:::

The API Gateway Specification document has a structure represented by the following object tree:

- [API Object](#api-object)
    - [Version Object 1](#version-object)
        - [Path Object 1](#path-object)
            - An [Operation Object](#operation-object) per HTTP verb
                - [Action Object](#action-object)
                - [Response Object](#response-object)
        - ... path objects
    - ... version objects

The following diagram shows the object structure in detail, including all properties and types.

<ZoomImg src="/assets/api_gateway_spec.png"/>

The properties of the objects in the object tree can contain static values and/or dynamically evaluated values via [expressions](#expression-language) that are resolved against the HTTP request data at runtime.

More specifically, an API Gateway Specification is the basis for, and is evaluated against, an [API Context](#api-context).

## API Context

The API context is map data structure that
at runtime contains the HTTP Request data and the results of parsing and evaluating the definitions and expressions defined in an API Gateway Specification.

It is used by the API Gateway to evaluate an API Gateway Specification.

The context [incrementally](#incremental-evaluation) an [recursively](#recursive-evaluation) constructed.

<DataTreeView :data="context" :maxDepth="10" />


## Specification Evaluation

### Incremental Evaluation

This  evaluation performed in two stages.

The first stage happens during validation and parsing. All API specification expressions will be evaluated to either a (final) value or a `future`. Futures occur when an expression dependes directly or indirectly (transitive closure) on HTTP request data. This results in a context object.

The second stage occurs in runtime, during HTTP request handling. The context created in the first stage is updated with the HTTP request data and the API Specification is evaluated again using the updated context, yielding the actions to be performed with all futures evaluated to values.

### Recursive Evaluation
We say it is constructed recursively as the evaluation of the expressions in the API Gateway Specification is done by passing the context recursively throughout the specification object tree and at each stage the evaluation can result in updating the context itself.

At each level of the tree expression children nodes can
can use the values of the certain properties defined in the ancestor node, override them and/or add updated the context.


### Expression Language

Most API Specification object properties support expressions using an embedded logic-less domain-specific language (internally called "mops") for data transformation and dynamic configuration.

This same language is also used by the [Broker Bridge Specification](/reference/configuration/broker_bridge).

The expression language operates on the [API Context](#api-context) and it works by expanding keys (or key paths) provided in a context object and adding or updating keys in the same context object.


####  Accessing Context properties
These properties are addressable by the expression language using the key `request` e.g. the following expression will evaluate to the contents of the request body.

```
{{request.body}}
```


::: info Usage Example
To understand how expressions are used let's first explore a very simple and non-Bondy related example.

For the sake of simplicity (and because Bondy configuration files use JSON) we will use JSON to represent our data structures in the example.

Let's say we have a Customer Order object we want to transform in a number of ways before we send it to someone else.

```javascript
{
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
}
```

Let's explore a some example mops expressions to demonstrate how you can use mops in Bondy's configuration objects. Given the previous object, evaluating the expression on the "Expression" column will return the value in the "Evaluates To" column.

|Expression|Evaluates To|
|---|---|
|`{{"\{\{sku\}\}"}}`|"ZPK1972"|
|`{{"\{\{customer.first_name\}\}"}}`|"John"|
|`{{"\{\{customer.first_name\}\} \{\{customer.last_name\}\}"}}`|"John Doe"|
|`{{"The sku number is \{\{sku\}\}"}}`|"The sku number is ZPK1972"|

:::

### Reading values

### Setting Values

## Request object

The object represents the contents (data and metadata) for each HTTP request that will be can be accessed by an [API Specification Object](#api-specification-object).

<DataTreeView :data="request" :maxDepth="10" />



## API Object
The API object is the root of an API Specification. It contains one or more [API Version](#version-object) objects.

<DataTreeView :data="api" :maxDepth="10" />

### Example

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


## Version Object
The Version Object represents a particular API version.

<DataTreeView :data="version" :maxDepth="10" />

### Example

```javascript
TBD
```

## Path Object

A path specification to be used as a value to a key in the `paths` property of a [Version Object](#version-object).

<DataTreeView :data="path" :maxDepth="10" />

### Path Patterns and Bindings
TBD

### Example

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

## Operation Object

<DataTreeView :data="operation" :maxDepth="10" />

## Action Object

The API Gateway currently supports 3 types of actions.

### Static Action
An action that returns a static response.


<DataTreeView :data="staticAction" :maxDepth="10" />

#### Example

```javascript
TBD
```

### Forward Action
An action that forwards the incoming HTTP request to an upstream HTTP endpoint.

<DataTreeView :data="fwdAction" :maxDepth="10" />

#### Example

```javascript
TBD
```

### WAMP Action
An action that transforms an incoming HTTP request to a WAMP operation.

<DataTreeView :data="wampAction" :maxDepth="10" />

::: details WAMP Action Example

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

::: details WAMP Response Example
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

* `schemes`
* `accepts`
* `provides`
* `headers`
* `security`
* `body_max_byte`
* `body_read_bytes`
* `body_read_seconds`
* `timeout`
* `connect_timeout`
* `retries`
* `retry_timeout`


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

::: warning
NOT IMPLEMENTED
:::

<!-- - type = api_key string
- schemes SCHEME[]
- header_name string -->

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

<script>

const schemes = {
    "type": "array",
    "required": false,
    "mutable": false,
    "items": {
        "type": "string"
    },
    "default": '["http"]',
    "description": "An array of strings where values can be: `http` or `https`."
};

const headers = {
    "type": "map",
    "required": false,
    "mutable": false,
    "description": "A mapping of HTTP headers to their corresponding values."
};

const accepts = {
    "type": "array",
    "required": false,
    "mutable": false,
    "items": {
        "type": "string"
    },
    "description": "An array of content types. The supported content types are:\n* `application/json`\n* `application/json; charset=utf-8`\n* `application/msgpack` \n* `application/msgpack; charset=utf-8`\n* `application/x-www-form-urlencoded`"
};

const provides = {
    "type": "array",
    "required": false,
    "mutable": false,
    "items": {
        "type": "string"
    },
    "description": "An array of content types. The supported content types are:\n* `application/json`\n* `application/json; charset=utf-8`\n* `application/msgpack` \n* `application/msgpack; charset=utf-8`"
};

const request = {
    "type": "object",
    "required": false,
    "mutable": false,
    "description": "The contents (data and metadata) for each HTTP request.",
    "properties": {
        "id": {
            "type": "string",
            "required": false,
            "mutable": false,
            "description": "A unique tracing identifier for the request"
        },
        "method": {
            "type": "string",
            "required": false,
            "mutable": false,
            "description": "The HTTP method of the request. One of the following values:\n- `delete`\n- `get`\n- `head`\n- `options`\n- `patch`\n- `post`\n- `put`"
        },
        "scheme": schemes,
        "peername": {
            "type": "string",
            "required": false,
            "mutable": false,
            "description": "A string representation of the requester IP address and port number e.g. `127.0.0.1:54678`."
        },
        "path": {
            "type": "string",
            "required": false,
            "mutable": false,
            "description": "The relative path of the request."
        },
        "host": {
            "type": "string",
            "required": false,
            "mutable": false,
            "description": "The hostname of the request."
        },
        "port": {
            "type": "string",
            "required": false,
            "mutable": false,
            "description": "The port number the request."
        },
        "headers": headers,
        "language": {
            "type": "string",
            "required": false,
            "mutable": false,
            "description": "The requested language.",
            "default": '"en"'
        },
        "query_string": {
            "type": "string",
            "required": false,
            "mutable": false,
            "description": "The HTTP query string. See `query_params`."
        },
        "query_params": {
            "type": "map",
            "required": false,
            "mutable": false,
            "description": "A map of query params to values. This is the result of parsing the request's `query_string`.\n\nExamples:\n|Request|Property Value|\n|---|---|\n|`GET /users?region=us&type=individual`|`{\"region\": \"us\", \"type\": \"individual\"}`|\n|`GET /users?x=100&y=200`|`{\"x\": \"100\", \"y\": \"200\"}`|\n"
        },
        "bindings": {
            "type": "map",
            "required": false,
            "mutable": false,
            "description": "A map of path variable bindings. Bindings occur when the [Path Object](3path-object) contains patterns.\n\nExamples: For the path specification `/accounts/:acc_id/users/:user_id`\n|Request|Property Value|\n|---|---|\n|`GET /accounts/001/users/002`|`{\"acc_id\": \"001\", \"user_id\": \"002\"}`|\n"
        },
        "body": {
            "type": "any",
            "required": false,
            "mutable": false,
            "description": "The body of the request. This is the result of decoding the HTTP body using the encoding determined by the [Path Object](#path-object) `accepts` property which defines the content-types allowed for `POST`, `PUT` and `PATCH`."
        },
        "body_length": {
            "type": "integer",
            "required": false,
            "mutable": false,
            "description": "The length of the body in bytes."
        }
    }
};

const context = {
    "request": {
        "type": "RequestObject",
        "required": false,
        "mutable": true,
        "description": "The contents (data and metadata) of the HTTP request being evaluated. The request data is available at runtime, so any expression defined during design time will result in a `future` that will be evaluated to a value when handling the HTTP request."
    },
    "security": {
        "type": "SecurityObject",
        "required": false,
        "mutable": true,
        "description": "An instance of the [Security Object](#security-object). Its initial value comes from the [API Object](#api-object) `defaults.security` or `variables.security` property. It is then possibly overriden recursively during evaluation by each [Path Object]#(path-object) definition."
    },
    "action": {
        "type": "ActionObject",
        "required": false,
        "mutable": true,
        "description": "At runtime it will contain the result or error of the action performed by the API Gateway during the handling of an HTTP request."
    },
    "variables": {
        "type": "map",
        "required": false,
        "mutable": true,
        "description": "A mapping of arbitrary variable names to values or expressions. Each entry in this map is obtained during the parsing of the [API Object](#api-object) tree. At each level of the tree this property will merge in the values of the target object's `variables` property, so children nodes can access the entries defined in the ancestors, override them and/or add new variables to the context."
    },
    "defaults": {
        "type": "map",
        "required": false,
        "mutable": true,
        "description": "A mapping of object properties to their default values. Each entry in this map is obtained during the parsing of the [API Object](#api-object) tree. At each level of the tree this property will merge in the values of the target object's `defaults` property, so children nodes can access the entries defined in the ancestors, override them and/or add new defaults to the context. Expressions in the defaults mapping can reference variables in the `variables` property."
    },
    "status_codes": {
        "type": "map",
        "required": false,
        "mutable": true,
        "description": "A mapping of WAMP Error URIs to HTTP Status Codes, to be used when the [Operation Object](#operation-object) is a WAMP Action. The entries of this map are [recursively updated](#recursive-evaluation) during evaluation. At each level of the tree this property will merge in the values of the target object's `status_codes` property, so children nodes can access the entries defined in the ancestors, override them and/or add new status codes to the context.",
        "default":"The value of the [API Object](#api-object) `defaults` property."
    }
};

const api = {
    "id": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "A global unique identifier for this API."
    },

    "host": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "A string used for matching the incoming HTTP request HOST header value. Hosts with and without a trailing dot are equivalent for routing. Similarly, hosts with and without a leading dot are also equivalent e.g. `cowboy.example.org`, `cowboy.example.org.` and `.cowboy.example.org` are equivalent. A pattern using the keyword `:` and wildcard `_` can be used to match multiple domains e.g. `mydomain.:_` will match `mydomain.foo` and `mydomain.bar` but not `mydomain.foo.baz`."
    },
    "realm_uri": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "The realm this API will target. An API can only target a single realm."
    },
    "name": {
        "type": "string",
        "required": false,
        "mutable": false,
        "description": "A display name for the API."
    },
    "meta": {
        "type": "map",
        "required": false,
        "mutable": false,
        "description": "A mapping of metadata keys to values."
    },
    "variables": {
        "type": "map",
        "required": false,
        "mutable": false,
        "description": "A mapping of arbitrary variable names to values or MOPS expressions. This variables can be referenced by MOPS expressions in the children objects of this object."
    },
    "defaults": {
        "type": "map",
        "required": false,
        "mutable": false,
        "description": "A mapping of attributes to their default values. This values are inherited by children objects as defaults when their value is unset.",
        "default": "Check the [default values below](#status-codes)."
    },
    "status_codes": {
        "type": "map",
        "required": false,
        "mutable": false,
        "description": "A mapping of WAMP Error URIs to HTTP Status Codes."
    },
    "versions": {
        "type": "array",
        "required": true,
        "mutable": false,
        "items": {
            "type": "VersionObject"
        },
        "description": "An array of Version Object instances."
    },
};

const version = {
    "base_path": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "The base path for this version of the API. This value will be used by the API Gateway to match incoming requests e.g. `/v1.0` will match `/v1.0/foo` but not `/foo`. It is possible to have optional segments, anything between brackets is optional e.g. `/[v1.0]` will match `/v1.0/foo` and also `/foo`."
    },
    "paths": {
        "type": "map",
        "required": true,
        "mutable": false,
        "description": "A mapping of paths to Path Objects. Paths are relative URL paths and can contain patterns and optional segments. The path `/` is invalid while the path `/ws` is reserved (used by Bondy for requesting Websocket connections)."
    },
    "is_active": {
        "type": "boolean",
        "required": false,
        "mutable": false,
        "default": "`true`",
        "description": "Whether the path is active."
    },
    "is_deprecated": {
        "type": "boolean",
        "required": false,
        "mutable": false,
        "default": "`false`",
        "description": "Whether the path is deprecated i.e. the path will be removed in future versions of the API."
    },
    "pool_size": {
        "type": "integer",
        "required": false,
        "mutable": false,
        "default": '`200`',
        "description": ""
    },
    "info": {
        "type": "object",
        "required": false,
        "properties": {
            "title" : {
                "type": "string",
                "required": true,
                "mutable": false,
                "description": "The title of the API."
            },
            "description" : {
                "type": "string",
                "required": true,
                "mutable": false,
                "description": "A description of the API."
            },
        }
    },
    "variables": {
        "type": "map",
        "required": false,
        "mutable": false,
        "description": "A mapping of arbitrary variable names to values or MOPS expressions. This variables can be referenced by MOPS expressions in the children objects of this object. These values are merged with and thus override the ones inherited from the API Object variables property."
    },
    "defaults": {
        "type": "map",
        "required": false,
        "mutable": false,
        "description": "A mapping of attributes to their default values. This values are inherited by children objects as defaults when their value is unset. These values are merged with and thus override the ones inherited from the API Object default property."
    },
    "status_codes": {
        "type": "map",
        "required": false,
        "mutable": false,
        "description": "A mapping of WAMP Error URIs to HTTP Status Codes."
    },
    "languages": {
        "type": "array",
        "required": false,
        "mutable": false,
        "items": {
            "type": "string"
        },
        "default": '["en"]',
        "description": "An array of language code string."
    }
};


const path = {
    "summary": {
        "type": "string",
        "required": false,
        "mutable": false,
        "description": "A short summary of the API."
    },
    "description": {
        "type": "string",
        "required": false,
        "mutable": false,
        "description": "A description of the API."
    },
    "variables": {
        "type": "map",
        "required": false,
        "mutable": false,
        "description": "A mapping of arbitrary variable names to values or MOPS expressions. This variables can be referenced by MOPS expressions in the children objects of this object. These values are merged with and thus override the ones inherited from the API Object variables property."
    },
    "defaults": {
        "type": "map",
        "required": false,
        "mutable": false,
        "description": "A mapping of attributes to their default values or a MOPS expression resolving to such a map. This values are inherited by children objects as defaults when their value is unset. These values are merged with and thus override the ones inherited from the API Object default property."
    },
    "is_collection": {
        "type": "boolean",
        "required": false,
        "mutable": false,
        "default": "`false`",
        "description": "Defines whether the resource managed in this path is a collection or not."
    },
    "headers": headers,
    "accepts": accepts,
    "provides": provides,
    "schemes": schemes,
    "body_max_byte" : {
        "type": "integer",
        "required": false,
        "mutable": false
    },
    "body_read_bytes" : {
        "type": "integer",
        "required": false,
        "mutable": false
    },
    "body_read_seconds" : {
        "type": "integer",
        "required": false,
        "mutable": false
    },
    "timeout" : {
        "type": "integer",
        "required": false,
        "mutable": false,
        "default": "The value defined for configuration option `wamp.call_timeout` ([See reference](/reference/configuration/wamp.html#call-timeout))."
    },
    "connect_timeout" : {
        "type": "integer",
        "required": false,
        "mutable": false
    },
    "retries" : {
        "type": "integer",
        "required": false,
        "mutable": false
    },
    "retry_timeout" : {
        "type": "integer",
        "required": false,
        "mutable": false
    },
    "security" :  {
        "type": "SecurityObject",
        "required": false,
        "mutable": false
    },
    "delete" :  {
        "type": "OperationObject",
        "required": false,
        "mutable": false,
        "description": "The operation specification to perform in case the API Gateway receives an HTTP `DELETE` Request."
    },
    "get" :  {
        "type": "OperationObject",
        "required": false,
        "mutable": false,
        "description": "The operation specification to perform in case the API Gateway receives an HTTP `GET` Request."
    },
    "head" :  {
        "type": "OperationObject",
        "required": false,
        "mutable": false,
        "description": "The operation specification to perform in case the API Gateway receives an HTTP `HEAD` Request."
    },
    "options" :  {
        "type": "OperationObject",
        "required": false,
        "mutable": false,
        "description": "The operation specification to perform in case the API Gateway receives an HTTP `OPTIONS` Request."
    },
    "patch" :  {
        "type": "OperationObject",
        "required": false,
        "mutable": false,
        "description": "The operation specification to perform in case the API Gateway receives an HTTP `PATCH` Request."
    },
    "post" :  {
        "type": "OperationObject",
        "required": false,
        "mutable": false,
        "description": "The operation specification to perform in case the API Gateway receives an HTTP `POST` Request."
    },
    "put" :  {
        "type": "OperationObject",
        "required": false,
        "mutable": false,
        "description": "The operation specification to perform in case the API Gateway receives an HTTP `PUT` Request."
    }
};

const basicSecurity = {
    "\ttype": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "A value of `basic`."
    },
    "schemes": schemes
};

const oauth2 = {
    "\ttype": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "A value of `oauth2`."
    },
    "schemes": schemes,
    "flow": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "One of the following values:\n- `implicit`\n- `authorization_code`\n- `client_credentials`\n- `resource_owner_password_credentials`"
    },
    "token_path": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "The path to use for the obtain and refresh token action. Normally `/oauth/token`."
    },
    "revoke_token_path": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "The path to use for the revoke token action. Normally `/oauth/revoke`."
    }
};

const operation = {

    "action": {
        "type": "ActionObject",
        "required": true,
        "mutable": false,
        "description": ""
    },
    "response": {
        "type": "ResponseObject",
        "required": true,
        "mutable": false,
        "description": ""
    },
    "info": {
        "type": "string",
        "required": false,
        "mutable": false,
        "description": ""
    },
    "body_max_byte" : {
        "type": "integer",
        "required": false,
        "mutable": false,
        "description": "",
        "default": "The parent Path Object's `body_max_byte` value."
    },
    "body_read_bytes" : {
        "type": "integer",
        "required": false,
        "mutable": false,
        "description": "",
        "default": "The parent Path Object's `body_read_bytes` value."
    },
    "body_read_seconds" : {
        "type": "integer",
        "required": false,
        "mutable": false,
        "description": "",
        "default": "The parent Path Object's `body_read_seconds` value."
    }
};


const staticAction = {
    "\ttype": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "The value `static`."
    },
    "headers": headers,
    "body": {
        "type": "undefined",
        "required": false,
        "mutable": false,
        "description": "The body to be returned with the response."
    }
};

const fwdAction = {
    "\ttype": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "The value `forward`."
    },
    "http_method" : {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "The HTTP method to be used when forwarding the request to the upstream endpoint. It must be on of the HTTP methods:\n- `delete`\n- `get`\n- `head`\n- `options`\n- `patch`\n- `post`\n- `put`"
    },
    "host" : {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "The upstream host."
    },
    "path" : {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "The upstream path."
    },
    "query_string" : {
        "type": "string",
        "required": false,
        "mutable": false,
        "description": "The upstream query string."
    },
    "headers": headers,
    "body": {
        "type": "undefined",
        "required": false,
        "mutable": false,
        "description": "The body to be forwarded to the upstream endpoint."
    },
    "timeout": {
        "type": "integer",
        "required": false,
        "mutable": false,
        "default": "The parent [Path Object](#path-object) `timeout` value."
    },
    "connect_timeout": {
        "type": "integer",
        "required": false,
        "mutable": false
    },
    "retries": {
        "type": "integer",
        "required": false,
        "mutable": false
    },
    "retry_timeout": {
        "type": "integer",
        "required": false,
        "mutable": false
    }
};

const wampAction = {
    "\ttype": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "One of the following values:\n- `wamp_call`\n- `wamp_publish`"
    },
    "options": {
        "type": "map",
        "required": false,
        "mutable": false,
        "description": "The WAMP message `options`."
    },
    "args": {
        "type": "array",
        "items": {
            "type": "undefined"
        },
        "required": false,
        "mutable": false,
        "description": "The WAMP message `args`."
    },
    "kwargs": {
        "type": "map",
        "required": false,
        "mutable": false,
        "description": "The WAMP message `kwargs`."
    },
    "timeout": {
        "type": "integer",
        "required": false,
        "mutable": false,
        "default": "The parent [Path Object](#path-object) `timeout` value."
    },
    "connect_timeout": {
        "type": "integer",
        "required": false,
        "mutable": false
    },
    "retries": {
        "type": "integer",
        "required": false,
        "mutable": false
    },
    "retry_timeout": {
        "type": "integer",
        "required": false,
        "mutable": false
    }
};



const response = {
    "on_result": {
        "type": "object",
        "required": true,
        "mutable": true,
        "description": "A declaration of the desired HTTP response in case the action (as defined in the sibling `action` object) was successful.",
        "properties": {
            "headers": headers,
            "body": {
                "type": "undefined",
                "required": true,
                "mutable": true,
                "description": "The value to be returned with the HTTP response. Either a static value or an expression (`string`). For a no-return using the empty string."
            },
            "uri": {
                "type": "string",
                "required": false,
                "mutable": true,
                "description": "In the case of an HTTP `POST` this value tells the API Gateway that a new resource has been created and as a consequence the HTTP response will have the uri as the value for the HTTP `Location` header and status code set to HTTP `201 created`. In case of the HTTP request not being a `POST` or if undefined, the status code will be set to HTTP `200 OK` or the value defined by `status_code`."
            },
            "status_code": {
                "type": "integer",
                "required": false,
                "mutable": true,
                "description": "The HTTP status code for the response. This can be an `integer` or an expression that evaluates to an integer."
            }
        }
    },
    "on_error": {
        "type": "object",
        "required": true,
        "mutable": true,
                "description": "A declaration of the desired HTTP response in case the action (as defined in the sibling `action` object) failed.",
        "properties": {
            "headers": headers,
            "body": {
                "type": "undefined",
                "required": true,
                "mutable": true,
                "description": "The value to be returned with the HTTP response. Either a static value or an expression (`string`). For a no-return using the empty string."
            },
            "status_code": {
                "type": "integer",
                "required": false,
                "mutable": true,
                "description": "The HTTP status code for the response. This can be an `integer` or an expression that evaluates to an integer. For example, the following expression uses the [API Context](#api-context) `status_codes` property to extract a code and uses `500` as fallback value: \n\n```javascript\n{{status_codes |> get({{action.error.error_uri}}, 500) |> integer}}\n```"
            }
        }
    }
};


const defaults = {
    "schemes": schemes,
    "accepts": accepts,
    "provides": provides,
    "headers": headers,
    "security": {
        "type": "SecurityObject",
        "required": false,
        "mutable": true,
    },
    "body_max_byte" : {
        "type": "integer",
        "required": false,
        "mutable": false,
        "description": "",
        "default": "The parent Path Object's `body_max_byte` value."
    },
    "body_read_bytes" : {
        "type": "integer",
        "required": false,
        "mutable": false,
        "description": "",
        "default": "The parent Path Object's `body_read_bytes` value."
    },
    "body_read_seconds" : {
        "type": "integer",
        "required": false,
        "mutable": false,
        "description": "",
        "default": "The parent Path Object's `body_read_seconds` value."
    }
};

export default {
    data() {
        return {
            request: JSON.stringify(request),
            context: JSON.stringify(context),
            api: JSON.stringify(api),
            version: JSON.stringify(version),
            path: JSON.stringify(path),
            operation: JSON.stringify(operation),
            staticAction: JSON.stringify(staticAction),
            fwdAction: JSON.stringify(fwdAction),
            wampAction: JSON.stringify(wampAction),
            response: JSON.stringify(response),
            basicSecurity: JSON.stringify(basicSecurity),
            oauth2: JSON.stringify(oauth2),
            defaults: JSON.stringify(defaults)
        }
    }
};
</script>
