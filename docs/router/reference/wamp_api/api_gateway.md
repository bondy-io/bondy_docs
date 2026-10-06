---
related:
    - text: HTTP API Gateway Specification Reference
      type: Reference
      link: /router/reference/api_gateway/specification
      description: The format of an API specification, which these procedures load, return and delete.
    - text: Marketplace HTTP API Gateway
      type: Tutorial
      link: /router/tutorials/getting_started/marketplace_api_gateway
      description: A tutorial that demonstrates a simple marketplace with Python microservices and a VueJS Web App.
---
# API Gateway
The WAMP procedures that load, inspect and remove [API Gateway specifications](/router/reference/api_gateway/specification) at runtime.

An API specification describes an HTTP API: its paths, and the WAMP action each path performs. Bondy stores each specification under its `id` in the cluster's replicated storage, and builds HTTP routes from every stored specification. These procedures change the stored set. The same operations are available over HTTP; see [API Gateway HTTP API](/router/reference/http_api/api_gateway).

::: warning AUTHORIZATION
Only a session attached to the master realm (`com.leapsight.bondy`) can call these procedures. A session in any other realm gets `wamp.error.not_authorized`.
:::

## Procedures

|Name|URI|
|:---|:---|
|[Load an API spec](#load-an-api-spec)|`bondy.http_gateway.api.load`|
|[Get an API spec](#get-an-api-spec)|`bondy.http_gateway.api.get`|
|[List all API specs](#list-all-api-specs)|`bondy.http_gateway.api.list`|
|[Delete an API spec](#delete-an-api-spec)|`bondy.http_gateway.api.delete`|

Bondy also reserves `bondy.http_gateway.api.add`, but does not implement it. A call to it fails with `wamp.error.no_such_procedure`. Use `bondy.http_gateway.api.load`.

## Adding and replacing specifications

### Load an API spec

bondy.http_gateway.api.load(api_spec){.wamp-procedure}

Validates an API specification, stores it, and rebuilds the HTTP routes so that its paths are served.

Bondy validates the specification by parsing it and compiling its routes. If either step fails, Bondy stores nothing and the routes do not change.

A specification is identified by its `id`. Loading a specification whose `id` is already stored replaces the stored one. Bondy stores the specification as submitted, and sets its `ts` property to the load time.

Loading a specification also creates two groups in the specification's realm, `resource_owners` and `api_clients`, if they do not exist. [OAuth2 clients and resource owners](/router/reference/wamp_api/oauth2) are users in these groups. The token endpoint checks that a client is in `api_clients` and a resource owner is in `resource_owners`.

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

* `bondy.error.missing_required_value`: the specification omits a required property.
* `bondy.error.invalid_value`: a property has a value of the wrong type or outside its allowed values.
* `bondy.error.http_gateway.invalid_expression`: an [expression](/router/reference/api_gateway/expressions) in the specification cannot be parsed.
* `bondy.error.internal_error`: any other validation failure. This includes an action with no `type` or an unsupported `type`, a path that is not valid, and the reserved path `/ws`. The node log records the actual reason under "Error while loading API specification".
* `wamp.error.invalid_argument`: the call does not have exactly one positional argument.
* `wamp.error.not_authorized`: the session is not attached to the master realm.

#### Examples

This example loads a partial version of the Marketplace specification. The complete file is [api_gateway_config.json](https://github.com/bondy-io/bondy-demo-marketplace/blob/main/resources/api_gateway_config.json).

::: code-group

```bash [Request]
wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.http_gateway.api.load \
'{
    "id":"com.market.demo",
    "name":"Marketplace Demo API",
    "host":"_",
    "realm_uri":"com.market.demo",
    "meta":{},
    "variables":{},
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
    "versions": {}
}'
```

```text [Response]
The result carries no arguments.
```
:::

## Inspecting specifications

### Get an API spec

bondy.http_gateway.api.get(api_spec_id) -> result(api_spec){.wamp-procedure}

Returns the stored specification with the given `id`, as it was loaded, including the `ts` that Bondy set.

Use it to confirm that a specification was stored as you submitted it.

#### Call

##### Positional Args
<DataTreeView
  :maxDepth="10"
  :data="JSON.stringify({
    '0':{
      'type': 'string',
      'required': true,
      'description' : 'The id of the API specification.'
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

* `bondy.error.not_found`: no specification with this `id` is stored.
* `wamp.error.invalid_argument`: the call does not have exactly one positional argument.
* `wamp.error.not_authorized`: the session is not attached to the master realm.

#### Examples

::: code-group

```bash [Request]
wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.http_gateway.api.get \
'com.market.demo'
```

```json [Response]
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
```
:::

### List all API specs

bondy.http_gateway.api.list() -> result([api_spec]){.wamp-procedure}

Returns every stored specification, in the same form as `bondy.http_gateway.api.get`.

#### Call

##### Positional Args
None.

##### Keyword Args
None.

#### Result

##### Positional Results
<DataTreeView :data="apiListRes" :maxDepth="10" />

##### Keyword Results
None.

#### Errors

* `wamp.error.invalid_argument`: the call has positional arguments.
* `wamp.error.not_authorized`: the session is not attached to the master realm.

#### Examples

::: code-group

```bash [Request]
wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.http_gateway.api.list
```

```json [Response]
[
  {
    "host": "_",
    "id": "com.market.demo",
    "name": "Marketplace Demo API",
    "realm_uri": "com.market.demo",
    "ts": -576459578303,
    "...": "the remaining properties, as for bondy.http_gateway.api.get"
  }
]
```
:::

## Removing specifications

### Delete an API spec

bondy.http_gateway.api.delete(api_spec_id){.wamp-procedure}

Deletes the stored specification with the given `id` and rebuilds the HTTP routes. The specification's paths stop being served. No listener restart is necessary.

The call succeeds whether or not a specification with this `id` is stored. The result does not say whether anything was deleted. Call [`bondy.http_gateway.api.get`](#get-an-api-spec) first if you need to know.

#### Call

##### Positional Args
<DataTreeView
  :maxDepth="10"
  :data="JSON.stringify({
    '0':{
      'type': 'string',
      'required': true,
      'description' : 'The id of the API specification to delete.'
    }
  })"
/>

##### Keyword Args
None.

#### Result

##### Positional Results
One positional result, the string `ok`.

##### Keyword Results
None.

#### Errors

* `wamp.error.invalid_argument`: the call does not have exactly one positional argument.
* `wamp.error.not_authorized`: the session is not attached to the master realm.

#### Examples

::: code-group

```bash [Request]
wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.http_gateway.api.delete \
'com.market.demo'
```

```json [Response]
"ok"
```
:::

<!--@include: ../api_gateway/specification_data.md-->
