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


## Procedures
The following wamp api is used to configure and manage the [Gateway Specification](../api_gateway/specification):

|Name|URI|
|:---|:---|
|[Add an API Spec](#api-add)|`bondy.http_gateway.api.add`|
|[Get an API Spec](#api-get)|`bondy.http_gateway.api.get`|
|[List all API Specs](#api-list)|`bondy.http_gateway.api.list`|
|[Load an API Spec](#api-load)|`bondy.http_gateway.api.load`|
|[Delete an API Spec](#api-delete)|`bondy.http_gateway.api.delete`|

### API Add
::: warning
CURRENTLY NOT IMPLEMENTED
:::

### API Delete
::: warning
CURRENTLY NOT IMPLEMENTED
:::

### API Get

bondy.http_gateway.api.get(api_spec_id) -> result(api_spec){.wamp-procedure}

It allows to retrieve the requested api spec id.

This procedure is useful for example to be entirely sure to check if the api spec definition was properly loaded and activated.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The id of the api spec you want to retrieve.'
		}
	})"
/>

##### Keyword Args
None.

#### Result

##### Positional Results
<DataTreeView :data="apiArgOrRes" :maxDepth="10" />

##### Keyword Results
None.

#### Errors

* [bondy.error.not_found](/reference/wamp_api/errors/not_found): when the provided api spec id is not found.
* [wamp.error.invalid_argument](/reference/wamp_api/errors/wamp_invalid_argument): when there is an invalid number of positional arguments.

#### Examples

::: details Success Call
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.http_gateway.api.get \
'com.market.demo' | jq
```
- Response:
```json
[
  {
    "defaults": {
      "connect_timeout": 5000,
      "headers": "{{variables.cors_headers}}",
      "retries": 0,
      "schemes": "{{variables.schemes}}",
      "security": "{{variables.oauth2}}",
      "timeout": 15000
    },
    "host": "_",
    "id": "com.market.demo",
    "meta": {},
    "name": "Marketplace Demo API",
    "realm_uri": "com.market.demo",
    "status_codes": {
      "com.example.error.internal_error": 500,
      "com.example.error.not_found": 404,
      "com.example.error.unknown_error": 500
    },
    "ts": -576459578303,
    "variables": {},
    "versions": {}
  }
]
```
:::

### API List

bondy.http_gateway.api.list() -> result([api_spec]) {.wamp-procedure}

It allows to retrieve the all loaded apis spec.

#### Call

##### Positional Args
None

##### Keyword Args
None.

#### Result

##### Positional Results
<DataTreeView :data="apiListRes" :maxDepth="10" />

##### Keyword Results
None.

#### Errors

#### Examples

::: details Success Call
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.http_gateway.api.load \

```
- Response:

:::

### API Load

bondy.http_gateway.api.load(api_spec_data) {.wamp-procedure}

Validates, loads and activates the api spec definition.

#### Call

##### Positional Args
<DataTreeView :data="apiArgOrRes" :maxDepth="10" />

##### Keyword Args
None.

#### Result

##### Positional Results
None.

##### Keyword Results
None.

#### Errors

* [bondy.error.invalid_data](/reference/wamp_api/errors/invalid_data): when the data values are invalid.
* [wamp.error.invalid_argument](/reference/wamp_api/errors/wamp_invalid_argument): when there is an invalid number of positional arguments.

#### Examples

Below there is an example loading the partial spec of the Marketplace api spec you can find at [api_gateway_config.json](https://github.com/bondy-io/bondy-demo-marketplace/blob/main/resources/api_gateway_config.json)

::: details Success Call
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.http_gateway.api.load \
'{
    "id":"com.market.demo",
    "name":"Marketplace Demo API",
    "host":"_",
    "realm_uri":"com.market.demo",
    "meta":{   
    },
    "variables":{
    },
    "defaults":{
        "retries":0,
        "timeout":15000,
        "connect_timeout":5000,
        "schemes":"{{variables.schemes}}",
        "security":"{{variables.oauth2}}",
        "headers":"{{variables.cors_headers}}"
    },
    "status_codes": {
        "com.example.error.not_found": 404,
        "com.example.error.unknown_error": 500,
        "com.example.error.internal_error": 500
    },
    "versions": {
    }
}' | jq
```
- Response:
None if it was loaded successfully
:::