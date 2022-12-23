---
draft: true
related:
    - text: HTTP API Gateway Specification Reference
      type: Reference
      link: /reference/api_gateway/specification
      description: Bondy HTTP API Gateway acts as a reverse proxy by accepting incoming REST API actions and translating them into WAMP actions over a Realm's procedures and topics.
    - text: Marketplace HTTP API Gateway
      type: Tutorial
      link: /tutorials/getting_started/marketplace_api_gateway
      description: A tutorial that demonstrates a simple marketplace with Python microservices and a VueJS Web App.
---
# HTTP API Gateway
Bondy API Gateway is a reverse proxy that lets you manage, configure, and route requests to your WAMP APIs and also to external HTTP/REST APIs. It allows Bondy to be integrated into an existing HTTP/REST API ecosystem.

## API
The following http api is used to configure and manage the [Gateway Specification](../api_gateway/specification):

|Name|HTTP Method|URL|
|:---|:---|:---|
|[Get an API Spec](#api-get)|GET|`/api_specs/:id`|
|[Get info an API Spec](#api-get-info)|GET|`/api_specs/:id/info`|
|[List all API Specs](#api-list)|GET|`/api_specs`|
|[Load an API Spec](#api-load)|POST|`/api_specs`|
|[Load an API Spec](#api-load)|POST|`/services/load_api_spec`|

### API Get

It allows to retrieve the requested api spec id.

This endpoint is useful for example to be entirely sure to check if the api spec definition was properly loaded and activated.

:::::: tabs code
::: tab Request
```bash
curl -X "GET" "http://localhost:18081/api_specs/com.market.demo" \
-H 'Content-Type: application/json; charset=utf-8' | jq
```
:::
::: tab Response
```json
{
  "defaults": {
    "connect_timeout": 5000.00000000000000000,
    "headers": "{{variables.cors_headers}}",
    "retries": 0E-20,
    "schemes": "{{variables.schemes}}",
    "security": "{{variables.oauth2}}",
    "timeout": 15000.0000000000000000
  },
  "host": "_",
  "id": "com.market.demo",
  "meta": {},
  "name": "Marketplace Demo API",
  "realm_uri": "com.market.demo",
  "status_codes": {
    "com.example.error.internal_error": 500.000000000000000000,
    "com.example.error.not_found": 404.000000000000000000,
    "com.example.error.unknown_error": 500.000000000000000000
  },
  "ts": -576459578303,
  "variables": {},
  "versions": {}
}
```
:::
::::::

#### Errors

* `bondy.error.not_found`: when the provided api spec id is not found.

:::::: tabs code
::: tab bondy.error.not_found
```json
{
  "code": "bondy.error.not_found",
  "description": "",
  "message": ""
}
```
:::
::::::

### API Get Info

It allows to retrieve the info (some attributes) of the requested api spec id.

:::::: tabs code
::: tab Request
```bash
curl -X "GET" "http://localhost:18081/api_specs/com.market.demo/info" \
-H 'Content-Type: application/json; charset=utf-8' | jq
```
:::
::: tab Response
```json
{
  "host": "_",
  "id": "com.market.demo",
  "meta": {},
  "name": "Marketplace Demo API",
  "realm_uri": "com.market.demo",
  "ts": -576459578303
}
```
:::
::::::

#### Errors

* `bondy.error.not_found`: when the provided api spec id is not found.

:::::: tabs code
::: tab bondy.error.not_found
```json
{
  "code": "bondy.error.not_found",
  "description": "",
  "message": ""
}
```
:::
::::::

### API List

It allows to retrieve the all loaded apis spec.

:::::: tabs code
::: tab Request
```bash
curl -X "GET" "http://localhost:18081/api_specs" \
-H 'Content-Type: application/json; charset=utf-8' | jq
```
:::
::: tab Response
```json
[
  {
    "defaults": {
      "connect_timeout": 5000,
      "headers": "{{variables.headers}}",
      "retries": 0,
      "schemes": "{{variables.schemes}}",
      "security": "{{variables.oauth2}}",
      "timeout": 5000
    },
    "host": "_",
    "id": "com.leapsight.test",
    "name": "Test API",
    "realm_uri": "com.leapsight.test",
    "status_codes": {
      "bondy.error.already_exists": 400,
      "bondy.error.badarg": 400,
      "bondy.error.no_such_user": 400,
      "bondy.error.not_found": 404
    },
    "ts": -576460749718,
    "variables": {
      "headers": {
        "access-control-allow-credentials": "true",
        "access-control-allow-headers": "origin,x-requested-with,content-type,accept",
        "access-control-allow-methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
        "access-control-allow-origin": "*",
        "access-control-max-age": "86400"
      },
      "oauth2": {
        "flow": "resource_owner_password_credentials",
        "revoke_token_path": "/oauth/revoke",
        "schemes": "{{variables.schemes}}",
        "token_path": "/oauth/token",
        "type": "oauth2"
      },
      "schemes": [
        "http",
        "https"
      ],
      "wamp_error_body": "{{action.error.kwargs |> put(code, {{action.error.error_uri}})}}"
    },
    "versions": {
      "1.0.0": {
        "base_path": "/[v1.0]",
        "defaults": {
          "timeout": 20000
        },
        "languages": [
          "en"
        ],
        "paths": {
          "/services/call": {
            "description": "",
            "is_collection": false,
            "options": {
              "action": {},
              "response": {
                "on_error": {
                  "body": ""
                },
                "on_result": {
                  "body": ""
                }
              }
            },
            "post": {
              "action": {
                "args": "{{request.body.args}}",
                "kwargs": "{{request.body.kwargs}}",
                "options": "{{request.body.options}}",
                "procedure": "{{request.body.procedure}}",
                "type": "wamp_call"
              },
              "response": {
                "on_error": {
                  "body": {
                    "args": "{{action.error.args}}",
                    "details": "{{action.error.details}}",
                    "error_uri": "{{action.error.error_uri}}",
                    "kwargs": "{{action.error.kwargs}}"
                  },
                  "status_code": "{{status_codes |> get({{action.error.error_uri}}, 500) |> integer}}"
                },
                "on_result": {
                  "body": {
                    "args": "{{action.result.args}}",
                    "details": "{{action.result.details}}",
                    "kwargs": "{{action.result.kwargs}}"
                  }
                }
              }
            },
            "summary": "Allows to perform an arbitrary WAMP call."
          }
        },
        "variables": {}
      }
    }
  },
  {
    "defaults": {
      "connect_timeout": 5000.00000000000000000,
      "headers": "{{variables.cors_headers}}",
      "retries": 0E-20,
      "schemes": "{{variables.schemes}}",
      "security": "{{variables.oauth2}}",
      "timeout": 15000.0000000000000000
    },
    "host": "_",
    "id": "com.market.demo",
    "meta": {},
    "name": "Marketplace Demo API",
    "realm_uri": "com.market.demo",
    "status_codes": {
      "com.example.error.internal_error": 500.000000000000000000,
      "com.example.error.not_found": 404.000000000000000000,
      "com.example.error.unknown_error": 500.000000000000000000
    },
    "ts": -576459578303,
    "variables": {},
    "versions": {}
  }
]
```
:::
::::::

#### Errors


### API Load

The following command will load the API Specification, validate it and if successful it will be compiled and activate it.

::: info Note
There are two endpoints you can use to load the api spec definition with the same behaviour:
- **/services/load_api_spec**
- **/api_specs**
:::

:::::: tabs code
::: tab Request 1
```bash
curl -X "POST" "http://localhost:18081/api_specs" \
-H 'Content-Type: application/json; charset=utf-8' \
-H 'Accept: application/json; charset=utf-8' \
--data-binary "@my_api.json"
```
:::
::: tab Request 2
```bash
curl -X "POST" "http://localhost:18081/services/load_api_spec" \
-H 'Content-Type: application/json; charset=utf-8' \
-H 'Accept: application/json; charset=utf-8' \
--data-binary "@my_api.json"
```
:::
::::::

#### Errors

* `wamp.error.invalid_argument`: when there is an invalid number of positional arguments. 

:::::: tabs code
::: tab wamp.error.invalid_argument
```json
{
  "code": "wamp.error.invalid_argument",
  "description": "",
  "message": "There is no realm named 'com.example.my_api'"
}
```
:::
::::::