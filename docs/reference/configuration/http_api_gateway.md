# HTTP API Gateway Configuration Reference
Bondy HTTP API Gateway is an HTTP/REST API management subsystem that sits between an HTTP client and a realm's WAMP RPC procedures and PubSub Topics. It acts as a reverse proxy by accepting incoming REST API actions and translating them into WAMP actions over those procedures and topics.

## Overview

The API Gateway hosts one or more APIs.

Each API is defined using an [API Specification Object](#api-specification-object), a JSON data structure that can contain static values and/or [expressions](#api-expression-language) that are evaluated against the HTTP request data at runtime to determine which action to perform e.g. `CALL` or `PUBLISH` and how to transform the input data.


::: definition Evaluation
More specifically, the definitions found by the API Gateway in an [API Specification Object](#api-specification-object) are evaluated at runtime against the [API Context](#api-context) which contains the HTTP [Request object](#request-object).
:::




## Request object

The object represents the contents (data and metadata) for each HTTP request that will be can be accessed by an [API Specification Object](#api-specification-object).

<DataTreeView :data="request" :maxDepth="10" />

## API Context

The API context is a map that at runtime contains the HTTP Request data and the results of parsing and evaluating the definitions and expressions defined in an API Specification Object against itself. That is, the evaluation of the expressions is done incrementally, where the input values of an expression can be the result of another expression.

This map can contains the following pre-defined keys:

<DataTreeView :data="context" :maxDepth="10" />


::: info Accessing Request Object's properties
These properties are addressable by the expression language using the key `request` e.g. the following expression will evaluate to the contents of the request body.

```
{{request.body}}
```
:::

## API Specification Object

The API Specification is a JSON object with the structure represented by the following tree:

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

```json
TBD
```

## Path Object

A path specification to be used as a value to a key in the `paths` property of a [Version Object](#version-object).

<DataTreeView :data="path" :maxDepth="10" />

### Path Patterns and Bindings
TBD

### Example

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

## Operation Object

<DataTreeView :data="operation" :maxDepth="10" />

## Action Object

The API Gateway currently supports 3 types of actions.

### Static Action
An action that returns a static response.


<DataTreeView :data="staticAction" :maxDepth="10" />

#### Example

```json
TBD
```

### Forward Action
An action that forwards the incoming HTTP request to an upstream HTTP endpoint.

<DataTreeView :data="fwdAction" :maxDepth="10" />

#### Example

```json
TBD
```

### WAMP Action
An action that transforms an incoming HTTP request to a WAMP operation.

<DataTreeView :data="wampAction" :maxDepth="10" />

#### Example

```json
TBD
```

## Response Object

<DataTreeView :data="response" :maxDepth="10" />

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



## API Expression Language

Most API Specification object properties support expressions using an embedded logic-less domain-specific language (internally called "mops") for data transformation and dynamic configuration.

This same language is also used by the [Broker Bridge Specification](/reference/configuration/broker_bridge).

The expression language operates on the [API Context](#api-context), a recursive map data structure that at design time contains an API Request object.

Mops works by **expanding keys (or key paths) provided in a context object and adding or updating keys in the same context object.**

To understand how mops is used in those use cases let's first explore a very simple and non-Bondy related example to understand how Mops works.

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
            "description": "The HTTP method of the request. One of the following values:\n- `delete`\n- `get`\n- `head`\n- `options`\n- `patch`\n- `post`\n- `put`."
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
        "description": "The contents (data and metadata) for each HTTP request."
    },
    "security": {
        "type": "SecurityObject",
        "required": false,
        "mutable": true,
        "description": ""
    },
    "action": {
        "type": "ActionObject",
        "required": false,
        "mutable": true,
        "description": "Will contain the result or error of the action performed by the Gateway during an HTTP request."
    },
    "variables": {
        "type": "map",
        "required": false,
        "mutable": true,
        "description": "A mapping of arbitrary variable names to values or expressions. This entries of this map are obtained during the parsing of the API Object tree. At each level of the tree this property will merge in the values of the target object's `variables` property, so children nodes can access the entries defined in the ancestors, override them and/or add new variables to the context."
    },
    "defaults": {
        "type": "map",
        "required": false,
        "mutable": true,
        "description": "A mapping of object properties to their default values. This entries of this map are obtained during the parsing of the API Object tree. At each level of the tree this property will merge in the values of the target object's `defaults` property, so children nodes can access the entries defined in the ancestors, override them and/or add new defaults to the context. Expressions in the defaults mapping can reference variables in the `variables` property."
    },
    "status_codes": {
        "type": "map",
        "required": false,
        "mutable": true,
        "description": "A mapping of WAMP Error URIs to HTTP Status Codes. This entries of this map are obtained during the parsing of the API Object tree. At each level of the tree this property will merge in the values of the target object's `status_codes` property, so children nodes can access the entries defined in the ancestors, override them and/or add new status codes to the context."
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
        "description": "A mapping of attributes to their default values. This values are inherited by children objects as defaults when their value is unset."
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
        "mutable": false
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
        "mutable": false
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
        "mutable": false
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
    "headers": headers,
    "body": {
        "type": "undefined",
        "required": false,
        "mutable": false,
        "description": "The body to be returned with the response."
    },
    "status_code": {
        "type": "integer",
        "required": false,
        "mutable": false,
        "description": "The HTTP status code for the response"
    },
    "uri": {
        "type": "string",
        "required": false,
        "mutable": false,
        "description": "The URI for the response. If defined, the status code will the redirect code."
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
