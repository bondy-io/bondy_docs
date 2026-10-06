---
related:
    - text: API Gateway WAMP API
      type: Reference
      link: /router/reference/wamp_api/api_gateway
      description: The procedures these routes call, with their arguments, results and errors.
    - text: HTTP API Gateway Specification Reference
      type: Reference
      link: /router/reference/api_gateway/specification
      description: The format of an API specification, which these routes load, return and delete.
---
# API Gateway
The Admin HTTP API routes that load, inspect and remove [API Gateway specifications](/router/reference/api_gateway/specification).

Each route calls one procedure of the [API Gateway WAMP API](/router/reference/wamp_api/api_gateway). That page is the contract for what each operation does and how it fails. This page gives the routes and what is particular to HTTP. The request and error mapping that every Admin HTTP API route shares is in [Admin HTTP API](/router/reference/http_api/index#request-and-response-mapping).

## Routes

| Method | Path | WAMP procedure |
|---|---|---|
| `POST` | `/api_specs` | [`bondy.http_gateway.api.load`](/router/reference/wamp_api/api_gateway#load-an-api-spec) |
| `POST` | `/services/load_api_spec` | [`bondy.http_gateway.api.load`](/router/reference/wamp_api/api_gateway#load-an-api-spec) |
| `GET` | `/api_specs` | [`bondy.http_gateway.api.list`](/router/reference/wamp_api/api_gateway#list-all-api-specs) |
| `GET` | `/api_specs/:id` | [`bondy.http_gateway.api.get`](/router/reference/wamp_api/api_gateway#get-an-api-spec) |
| `GET` | `/api_specs/:id/info` | [`bondy.http_gateway.api.get`](/router/reference/wamp_api/api_gateway#get-an-api-spec) |
| `DELETE` | `/api_specs/:id` | [`bondy.http_gateway.api.delete`](/router/reference/wamp_api/api_gateway#delete-an-api-spec) |

The two `POST` routes are equivalent.

## Loading a specification

The request body is the specification, as JSON. A successful load answers with an empty body.

```bash
curl -X POST "http://localhost:18081/api_specs" \
  -H 'Content-Type: application/json; charset=utf-8' \
  --data-binary "@my_api.json"
```

A specification that fails validation answers with the error as the JSON body, with `code` set to the error URI. The status follows from the URI:

| Error | Status |
|---|---|
| `bondy.error.missing_required_value` | `400` |
| `bondy.error.invalid_value` | `400` |
| `bondy.error.http_gateway.invalid_expression` | `500` |
| `bondy.error.internal_error` | `500` |

The [load errors](/router/reference/wamp_api/api_gateway#load-an-api-spec) say when each one occurs.

## Reading specifications

`GET /api_specs/:id` answers with the stored specification. `GET /api_specs` answers with an array of every stored specification.

`GET /api_specs/:id/info` answers with a summary of the stored specification: the properties `id`, `name`, `host`, `realm_uri`, `meta` and `ts`, without the versions and paths.

```bash
curl "http://localhost:18081/api_specs/com.market.demo/info"
```

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

A `GET` for an `id` that is not stored answers `404`, with `code` set to `bondy.error.not_found`.

## Deleting a specification

`DELETE /api_specs/:id` deletes the specification and stops serving its paths. It succeeds whether or not the `id` is stored.

```bash
curl -X DELETE "http://localhost:18081/api_specs/com.market.demo"
```
