---
draft: true
---
# HTTP API Gateway Configuration Reference
Bondy HTTP API Gateway is an HTTP/REST API management subsystem that sits between an HTTP client and a realm's WAMP RPC procedures and PubSub Topics. It acts as a reverse proxy by accepting incoming REST API actions and translating them into WAMP actions over those procedures and topics.

## Overview

The API Gateway hosts one or more APIs. Each API is defined using the API Specification Object, a JSON data structure that can contain static values or expressions that are evaluated against the HTTP request data in runtime.

## API Specification Format

The API Specification is a JSON object with the structure represented by the following tree:

- [API Object](#api-object)
    - [Version Object](#version-object)
        - [Path Object 1](#path-object)
            - An [Operation Object](#operation-object) per HTTP verb
                - [Action Object](#action-object)
                - [Response Object](#response-object)
        - ...
        - [Path Object N](#path-object)
    - [Version Object](#version-object)
        - [Path Object 1](#path-object)
        - ...

The following diagram shows the object structure in detail, including all properties and types.

<ZoomImg src="/assets/api_gateway_spec.png"/>

## API Object
The API object is the root of an API definition. It contains one or more API versions.

- **id** *string [required]*
A global unique identifier for this API.
- **name** *string*
A display name for the API.
- **host** *string [required]*
The hostname or a pattern match.
- **realm_uri** *uri*
The realm this API will target.
- **meta** *map*
- **variables** *map*
A mapping of arbitrary variable names to values or MOPS expressions. This variables can be referenced by MOPS expressions in the children objects of this object.
- **defaults** *Defaults*
A mapping of attributes to their default values. This values are inherited by children objects as defaults when their value is unset.
- **status_codes** *map*
A mapping of WAMP error URIs to HTTP Status codes.
- **versions** *array*
An array of [Version](https://www.notion.so/HTTP-API-Gateway-b87c2e0d529e4485875a74e4bb987618) objects.

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

- **base_path** string
The base path for this version of the API e.g. `"/[v1.0]"`.
- **is_active** boolean
Whether the path is active.
- **is_deprecated** boolean
Whether the path is deprecated i.e. will be removed in future versions.
- **pool_size** integer
- **info** map,
- **variables** *map*
A mapping of arbitrary variable names to values or MOPS expressions. This variables can be referenced by MOPS expressions in the children objects of this object.
These values are merged with and thus override the ones inherited from the API Object variables property.
- **defaults** *Defaults*
A mapping of attributes to their default values. This values are inherited by children objects as defaults when their value is unset.
These values are merged with and thus override the ones inherited from the API Object default property.
- **status_codes** map
A mapping of WAMP Error URIs to HTTP Status Codes.
- **languages** *array*
An array of language code string.
- **paths** *array*
Array of [Path](https://www.notion.so/HTTP-API-Gateway-b87c2e0d529e4485875a74e4bb987618) objects

## Path Object

- **summary** string
- **description** string
A user description for this object
- **variables** map | Expr
- **defaults** Defaults | Expr
- **is_collection** boolean
Defines wether the resource managed in this path is a collection or not.
- **headers** map | Expr
- **accepts** array
An array of content types. The supported content types are:
    - `application/json`
    - `application/json; charset=utf-8`
    - `application/msgpack`
    - `application/msgpack; charset=utf-8`
    - `application/x-www-form-urlencoded`
- **provides** array
An array of content types. The supported content types are:
    - `application/json`
    - `application/json; charset=utf-8`
    - `application/msgpack`
    - `application/msgpack; charset=utf-8`
- **schemes** array
An array of strings where values can be: `http` or `https`.
- **security** Security
- **body_max_byte** integer
- **body_read_bytes** integer
- **body_read_seconds** integer
- **timeout** integer
- **connect_timeout** integer
- **retries** integer
- **retry_timeout** integer
- **delete** Operation
- **get** Operation
- **head** Operation
- **options** Operation
- **patch** Operation
- **post** Operation
- **put** Operation

## Operation Object

- info ReqInfo
- body_max_byte integer
- body_read_bytes integer
- body_read_seconds integer
- action Action
- response Response

## Action Object

### Static Action

- **type** = "static"
- **headers** map
- **body** any

### Forward Action

- **type** = "forward"
- **http_method** *string*
One of the following values:
    - `delete`
    - `get`
    - `head`
    - `options`
    - `patch`
    - `post`
    - `put`
- **host** string
- **path** string
- **query_string** string
- **headers** map
- **body** any
- **timeout** integer
- **connect_timeout** integer
- **retries** integer
- **retry_timeout** integer

### WAMP Action

- **type** *string*
One of the following values:
    - `wamp_call`
    - `wamp_publish`
    - `wamp_register`
    - `wamp_unregister`
    - `wamp_subscribe`
    - `wamp_unsubscribe`
- options map
- timeout integer
- retries integer
- procedure uri
- options map
- arguments Any[]
- arguments_kw map

## Response Object

- **headers** map
- **body** any
- **status_code** integer
- **uri** uri

## Defaults Object

- **schemes** *array*
An array of strings where values can be: `http` or `https`.
- security Security
- body_max_byte integer
- body_read_bytes integer
- body_read_seconds integer
- headers map
- **accepts** array
An array of content types. The supported content types are:
    - `application/json`
    - `application/json; charset=utf-8`
    - `application/msgpack`
    - `application/msgpack; charset=utf-8`
    - `application/x-www-form-urlencoded`
- **provides** array
An array of content types. The supported content types are:
    - `application/json`
    - `application/json; charset=utf-8`
    - `application/msgpack`
    - `application/msgpack; charset=utf-8`
- timeout integer
- connect_timeout integer
- retries integer
- retry_timeout integer

## Security Object

One of the following objects.

### Basic Security

- type = basic string
- schemes SCHEME[]

### APIKeySecurity

::: warning
NOT IMPLEMENTED
:::

- type = api_key string
- schemes SCHEME[]
- header_name string

### OAUTH2 Security

- type = oauth2 string
- description string
- **schemes** *array*
An array of strings where values can be: `http` or `https`.
- **flow** *string*
One of the following values:
    - `implicit`
    - `authorization_code`
    - `client_credentials`
    - `resource_owner_password_credentials`
- **token_path** *string*
The path to use for the obtain and refresh token action. Normally `/oauth/token`
- **revoke_token_path** string
The path to use for the revoke token action. Normally `/oauth/revoke`

## API Context

The API context is a map that contains the results of parsing and evaluating the definitions and expressions defined in an API Specification. This map contains the following keys:

<DataTreeView :data="apiContext" :maxDepth="10" />


::: info Accessing Request Object's properties
These properties are addressable by the expression language using the key `request` e.g. the following expression will evaluate to the contents of the request body.

```
{{request.body}}
```

:::

## API Expression Language

Most API Specification object properties support expressions using an embedded logic-less domain-specific language (internally called "mops") for data transformation and dynamic configuration.

This same language is also used by the [Broker Bridge Specification](/reference/configuration/broker_bridge).

The expression language operates on the [API Context](#api-context), a recursive map data structure that at design time contains an API Request object.

::: info How do the API specification expressions work?
**It works by expanding keys (or key paths) provided in a context object and adding or updating keys in the same context object.**

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


:::

<script>
const apiRequest = {
    "type": "object",
    "required": false,
    "mutable": false,
    "description": "the HTTP request data and metadata for each request.",
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
            "description": "The HTTP method of the request. One of the following values: `delete`, `get`, `head`, `options`, `patch`, `post`, `put`."
        },
        "scheme": {
            "type": "string",
            "required": false,
            "mutable": false,
            "description": "The scheme used by the request i.e. `http` or `https`."
        },
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
        "headers": {
            "type": "map",
            "required": false,
            "mutable": false,
            "description": "A map where the keys are HTTP headers."
        },
        "language": {
            "type": "string",
            "required": false,
            "mutable": false,
            "description": "The requested language.",
            "default": "en"
        },
        "query_string": {
            "type": "string",
            "required": false,
            "mutable": false,
            "description": "The HTTP query string. See query_params."
        },
        "query_params": {
            "type": "map",
            "required": false,
            "mutable": false,
            "description": "A map of query params to values. This is the result of parsing the query_string. Example: for HTTP request `GET [http://example.com/users?region=us&type=individual](http://example.com/v1/foo?x=100&y=200)` the value of this property will be the map `{\"region\": \"us\", \"type\": \"individual\"}` ."
        },
        "bindings": {
            "type": "string",
            "required": false,
            "mutable": false,
            "description": "A map of path variable bindings. Example: for HTTP request `GET http://example.com/users/U12345` and path specification `/users/:id` , this property will have a map with key `id` and value the value resulting from matching the pate value of this property will be `{\"id\": \"U12345\"}`"
        },
        "body": {
            "type": "any",
            "required": false,
            "mutable": false,
            "description": "The body of the request. This is the result of decoding the HTTP body using the encoding determined by the [Path Object](https://www.notion.so/HTTP-API-Gateway-b87c2e0d529e4485875a74e4bb987618) `accepts` property which defines the content-types allowed for `POST`, `PUT` and `PATCH`."
        },
        "body_length": {
            "type": "integer",
            "required": false,
            "mutable": false,
            "description": "The length of the body in bytes."
        }
    }
};

const apiContext = {
    "request": apiRequest,
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


export default {
    data() {
        return {
            apiContext: JSON.stringify(apiContext)
        }
    }
};
</script>
