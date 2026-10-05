---
draft: true
---
# API Gateway Expressions Reference
Bondy API Specification use a logic-less, dynamically-typed interpolation domain-specific language embedded in Erlang (internally called _"Mops"_) for data transformation and dynamic configuration.

The expression language operates on the [API Context](/router/reference/api_gateway/specification#api-context) and it works by expanding keys (or key paths) provided in a context and adding or updating keys in the same context object.

This reference assumes you are familiar with the API Context schema. The [Broker Bridge Specification](/router/reference/configuration/broker_bridge) uses the same language against a different context.

::: info Technically speaking
Mops is a **residualizing (staged) interpreter for a logic-less
quasiquotation DSL** — partial evaluation by construction, sitting one reflective step below a Futamura projection.

Its surface combines Mustache-style quasiquotation with a `jq`-style point-free operator pipeline over JSON-shaped data.

Its semantics is an environment-passing interpreter valued in a reader–resumption monad `Res ≅ Value ⊎ (Env ⇀ Res)`: closed subterms evaluate eagerly, while subterms whose context is not yet available are residualized as suspended, non-memoized closures, yielding a multi-stage (online partial-evaluation) discipline that resolves incrementally as the environment is enriched. A context value that is itself an expression is evaluated when it is looked up, so bindings may refer to one another; a cyclic reference does not terminate.

The language is non-Turing-complete and unityped, trading totality and static safety for a compact specification and a small, composable operator algebra.
:::



## Overview

We call Mops "logic-less" because there are no if statements, else clauses, or for loops. Instead there are only _tags_. A tag is replaced with a value, optionally after passing that value through a pipeline of functions. This document describes the tag forms, the context they read from, and every function the language provides[^1].

[^1]: Mops draws inspiration from [mustache](https://mustache.github.io).

## Expressions

Expressions are strings containing one or more [Tags](#tags).

You can use an expression in an API Gateway Specification object property when its value is of type `expression`.

An expression is a _promise_ i.e. a proxy for a value not necessarily known when the promise is created. An expression that reads only `variables`, `defaults` or `status_codes` is evaluated when the specification is loaded. An expression that reads `request`, `action` or `security` is evaluated when the Gateway handles a request; see [Incremental Evaluation](/router/reference/api_gateway/specification#incremental-evaluation).

::: definition Promise Type
The promise type syntax used across the documentation is `() => DATATYPE` where `DATATYPE` is the type of value the promise should be fulfilled with i.e. `() => string` means that once the expression is evaluated, and thus the promise fulfilled, the value should be of type `string`.
:::

A string that contains no `{{` is not an expression. It is used as written.

## Tags

Tags are indicated by the double mustaches. `{{request}}` is a tag, as is `{{defaults.timeout}}`.

A tag holds a key path, optionally followed by a [function pipeline](#function-pipelines). The path walks into the [API Context](/router/reference/api_gateway/specification#api-context) one dot-separated key at a time, so `{{request.body.sku}}` reads the `sku` key of the incoming request body, and `{{action.result}}` reads the result of the specification's most recently evaluated action.

Spaces and tabs inside a tag are ignored. `{{ request.body.sku }}` and `{{request.body.sku}}` are the same tag.

### Value Expressions

An expression that consists of a single tag evaluates to the value at that path, with its type preserved: a number stays a number, a map stays a map, a list stays a list.

```text
{{request.body.price}}       →  13.99
{{request.body.customer}}    →  {"first_name": "John", "last_name": "Doe", "email": "john.doe@foo.com"}
```

The tag must be the whole expression. Text before or after it makes the expression invalid, and so does a second tag; use a string expression for either.

### String Expressions

An expression enclosed in double quotes is a string template. It may contain any number of tags mixed with literal text, and always evaluates to a string. In a JSON specification the quotes are escaped:

```json
{
    "location": "\"/orders/{{request.body.sku}}\"",
    "greeting": "\"Order {{request.body.sku}} for {{request.body.customer.first_name}}\""
}
```

The `greeting` value above evaluates to `"Order ZPK1972 for John"`. String values are inserted as written; numbers and booleans are inserted in their usual text form. Maps and lists are inserted in an internal representation that is not JSON, so interpolate scalars only.

### Path Resolution

A path that names a key the context does not contain makes evaluation fail. So does a path that continues past a value that is not a map, e.g. `{{request.body.price.amount}}` when `price` is a number. Paths never evaluate to `null`. To read an optional key, read its parent map and use [`get`](#get) with a default.

## Context Keys

The API Context is a map with the following top-level keys. Every tag path starts at one of them.

- **`request`** — the incoming HTTP request (method, headers, path, query, body). See [Request Object](/router/reference/api_gateway/specification#request-object) for its full shape.
- **`action`** — the result (`action.result`) or error (`action.error`) of the specification's most recently performed action. See [Result Object](/router/reference/api_gateway/specification#result-object) and [Error Object](/router/reference/api_gateway/specification#error-object).
- **`security`** — the identity of the authenticated caller, present once the request has been authenticated with an OAuth2 token. It holds `realm_uri`, `session`, `client_id`, `authid`, `username` (same value as `authid`), `authmethod`, `groups`, `locale` and `meta`.
- **`variables`** — the `variables` declared in the API Gateway Specification, merged from the API, version and path levels, with lower levels overriding higher ones.
- **`defaults`** — the default values declared in the specification, merged the same way. See [Defaults Object](/router/reference/api_gateway/specification#defaults-object).
- **`status_codes`** — the map from error URI to HTTP status code: the Gateway's built-in mapping, overridden by the `status_codes` declared at the API and version levels. See [Status Codes](/router/reference/api_gateway/specification#status-codes).

## Function Pipelines

A tag can pass its value through one or more functions with the `|>` operator. Functions apply left to right; each receives the output of the one before it.

```text
{{request.body.price |> integer}}                  →  13
{{request.body.scores |> tail |> max}}             →  9
```

### Arguments

Some functions take arguments in parentheses, separated by commas. Each argument is one of:

- **A bare word**, such as `email` or `500`. It is a literal string. Numbers are not parsed, so `500` is the string `"500"`; pipe the result through [`integer`](#integer) when you need a number.
- **A single-quoted word**, such as `'email'`. It is the same literal string with the quotes removed. Use `''` for the empty string.
- **A tag**, such as `{{variables.field}}`. It is replaced by the value at that path.

Because all spaces and tabs inside a tag are removed, a literal argument cannot contain a space: `'first name'` becomes `firstname`. An argument cannot contain a comma, and a tag used as an argument cannot contain a `|>` pipeline.

### Failure

A function fails when the value it receives is not of a type it accepts, or when its arguments do not match one of its forms. A failed function makes the whole expression fail; no function returns `null` or passes its input through on a type mismatch. An unknown function name fails the same way.

There is one exception. When the value entering a function is the empty string, every function, including an unknown one, returns the empty string.

### Example Context

The examples in the rest of this page evaluate against the following context, at request time:

```json
{
    "request": {
        "method": "POST",
        "body": {
            "sku": "ZPK1972",
            "price": 13.99,
            "qty": "3",
            "discount": -2.5,
            "gift": "true",
            "tags": ["new", "sale", "eco"],
            "scores": [7, 3, 9],
            "customer": {
                "first_name": "John",
                "last_name": "Doe",
                "email": "john.doe@foo.com"
            }
        }
    },
    "action": {
        "error": {"error_uri": "com.example.error.not_found"}
    },
    "variables": {
        "field": "email",
        "headers": {"x-tenant": "acme", "x-trace": "on"},
        "overrides": {"x-trace": "off", "x-region": "eu"}
    },
    "status_codes": {"com.example.error.not_found": 404}
}
```

## Converting Types

### `integer`

`Value |> integer`

Converts a number or a numeric string to an integer. Floats, and strings holding a float, are truncated toward zero (`"-4.5"` becomes `-4`). **Fails** for a string that is not a number, and for any other type.

```text
{{request.body.price |> integer}}    →  13
{{request.body.qty |> integer}}      →  3
```

### `float`

`Value |> float`

Converts a number or a numeric string to a float. **Fails** for a string that is not a number, and for any other type.

```text
{{request.body.qty |> float}}        →  3.0
```

### `boolean`

`Value |> boolean`

Converts a truth value to a boolean. `true`, `1`, `"true"` and `"1"` give `true`; `false`, `0`, `"false"` and `"0"` give `false`. **Fails** for any other value, including other numbers and strings such as `"yes"`.

```text
{{request.body.gift |> boolean}}     →  true
```

## Working with Numbers

### `abs`

`Number |> abs`

Returns the absolute value of a number. **Fails** for any value that is not a number, including numeric strings; convert those first with `integer` or `float`.

```text
{{request.body.discount |> abs}}     →  2.5
```

## Working with Lists

Every function in this group **fails** when its input is not a list.

### `head`

`List |> head`

Returns the first element of a list, or the empty string if the list is empty.

```text
{{request.body.tags |> head}}        →  "new"
```

### `tail`

`List |> tail`

Returns the list without its first element. An empty list gives an empty list.

```text
{{request.body.tags |> tail}}        →  ["sale", "eco"]
```

### `last`

`List |> last`

Returns the last element of a list, or the empty string if the list is empty.

```text
{{request.body.tags |> last}}        →  "eco"
```

### `nth`

`List |> nth(N)`

Returns the element at position `N`, counting from 1. `N` is a literal positive integer. **Fails** when `N` is less than 1 or greater than the length of the list.

```text
{{request.body.tags |> nth(2)}}      →  "sale"
```

### `min`

`List |> min`

Returns the smallest element of a list, or the empty string if the list is empty. Elements of different types compare in Erlang term order, in which every number is smaller than every string.

```text
{{request.body.scores |> min}}       →  3
```

### `max`

`List |> max`

Returns the largest element of a list, or the empty string if the list is empty. Elements compare as for `min`.

```text
{{request.body.scores |> max}}       →  9
```

### `length`

`List |> length`

Returns the number of elements in a list. It does not measure strings or maps; use [`size`](#size) for a map.

```text
{{request.body.tags |> length}}      →  3
```

### `random`

`List |> random(N)`

Returns a list of `N` elements picked at random from distinct positions of the input list, in random order. `N` is a literal integer. `random(0)` returns an empty list. When the input list has exactly one element and `N` is 1, the result is that element, not a one-element list. **Fails** when `N` is greater than the length of the list.

```text
{{request.body.tags |> random(1)}}   →  ["eco"]    (any one of the three tags)
```

## Working with Maps

Every function in this group **fails** when its input is not a map, unless the input is the string `"$map"`, which `get`, `put`, `with` and `without` treat as an empty map.

### `get`

`Map |> get(Key)`
`Map |> get(Key, Default)`

Returns the value stored under `Key`. With a `Default`, returns `Default` when the map has no such key. **Fails** when the key is missing and no default is given, and when `Key` is a tag that resolves to a value that is not a string.

A literal `Default` is a string. In the second example below the default `500` is the string `"500"`, which is why the result is piped through `integer`.

```text
{{request.body.customer |> get(email)}}                               →  "john.doe@foo.com"
{{request.body.customer |> get({{variables.field}})}}                 →  "john.doe@foo.com"
{{request.body.customer |> get(phone, '')}}                           →  ""
{{status_codes |> get({{action.error.error_uri}}, 500) |> integer}}   →  404
```

### `put`

`Map |> put(Key, Value)`

Returns the map with `Value` stored under `Key`, replacing any existing value. A literal `Value` is stored as a string; use a tag to store a value of another type.

```text
{{variables.headers |> put(x-sku, {{request.body.sku}})}}
    →  {"x-tenant": "acme", "x-trace": "on", "x-sku": "ZPK1972"}
```

### `merge`

`Map |> merge(Other)`
`Map |> merge(_, Other)`
`Map |> merge(Other, _)`

Combines two maps into one. Where both maps hold the same key, the map on the right wins. The `_` placeholder marks the position of the piped map: `merge(Other)` and `merge(_, Other)` let `Other` override the piped map; `merge(Other, _)` lets the piped map override `Other`. A bare `$map` argument stands for an empty map. **Fails** when either side is not a map, or when the arguments match none of the three forms.

```text
{{variables.headers |> merge({{variables.overrides}})}}
    →  {"x-tenant": "acme", "x-trace": "off", "x-region": "eu"}

{{variables.headers |> merge({{variables.overrides}}, _)}}
    →  {"x-tenant": "acme", "x-trace": "on", "x-region": "eu"}
```

### `with`

`Map |> with([Key, ...])`

Returns a map that keeps only the listed keys. Listed keys that the map does not contain are ignored. The square brackets are required.

```text
{{request.body.customer |> with([first_name, last_name])}}
    →  {"first_name": "John", "last_name": "Doe"}
```

### `without`

`Map |> without([Key, ...])`

Returns the map with the listed keys removed. Listed keys that the map does not contain are ignored. The square brackets are required.

```text
{{request.body.customer |> without([email])}}
    →  {"first_name": "John", "last_name": "Doe"}
```

::: warning Request-time keys
When a key in the list is a tag that reads `request`, `action` or `security`, `without` currently returns the map restricted to the listed keys, as `with` does, instead of removing them. List literal keys, or keys from `variables` and `defaults`, until this is fixed.
:::

### `size`

`Map |> size`

Returns the number of keys in a map. It does not measure lists; use [`length`](#length) for a list.

```text
{{request.body.customer |> size}}    →  3
```

## Encoding

### `base64:encode`

`String |> base64:encode`

Encodes a string in standard, padded Base64. **Fails** for any value that is not a string.

```text
{{request.body.sku |> base64:encode}}    →  "WlBLMTk3Mg=="
```

### `base64:decode`

`String |> base64:decode`

Decodes a standard Base64 string. The result is the decoded bytes, which need not be valid UTF-8. **Fails** for a string that is not valid Base64, and for any value that is not a string.

```text
{{request.body.sku |> base64:encode |> base64:decode}}    →  "ZPK1972"
```
