---
draft: true
---
# API Gateway Expressions Reference
Bondy API Specification use a logic-less, dynamically-typed interpolation domain-specific language embedded in Erlang (internally called _"Mops"_) for data transformation and dynamic configuration.

The expression language operates on the [API Context](/router/reference/api_gateway/specification) and it works by expanding keys (or key paths) provided in a context and adding or updating keys in the same context object.

This reference assumes you are familiar with the API Context schema.

::: info Technically speaking
Mops is a **residualizing (staged) interpreter for a logic-less
quasiquotation DSL** — partial evaluation by construction, sitting one reflective step below a Futamura projection.

Its surface combines Mustache-style quasiquotation with a `jq`-style point-free operator pipeline over JSON-shaped data. 

Its semantics is an environment-passing interpreter valued in a reader–resumption monad `Res ≅ Value ⊎ (Env ⇀ Res)`: closed subterms evaluate eagerly, while subterms whose context is not yet available are residualized as suspended, non-memoized closures, yielding a multi-stage (online partial-evaluation) discipline that resolves incrementally as the environment is enriched. A separate fixpoint mechanism resolves mutually-referential bindings by iterated unfolding. 

The language is non-Turing-complete and unityped, trading totality and static safety for a compact specification and a small, composable operator algebra.
:::



## Overview

We call Mops "logic-less" because there are no if statements, else clauses, or for loops. Instead there are only _tags_. Some tags are replaced with a value, some nothing, and others a series of values. This document explains the different types of Mops tags[^1].

[^1]: Mops draws inspiration from [mustache](https://mustache.github.io).

## Expressions

Expressions are strings containing one or more [Tags](#tags).

You can use an expression in an API Gateway Specification object property when its value is of type `expression`.

An expression is a _promise_ i.e. a proxy for a value not necessarily known when the promise is created.

::: definition Promise Type
The promise type syntax used across the documentation is `() => DATATYPE` where `DATATYPE` is the type of value the promise should be fulfilled with i.e. `() => string` means that once the expression is evaluated, and thus the promise fulfilled, the value should be of type `string`.
:::



## Tags

Tags are indicated by the double mustaches. `{{"\{\{request\}\}"}}` is a tag, as is `{{"\{\{defaults.timeout\}\}"}}`.

Mops always operates on an [API Context](/router/reference/api_gateway/specification#api-context), a map keyed by `request`, `variables`, `action`, and `defaults`. A tag's path walks into that map, so `{{"\{\{request.body.sku\}\}"}}` reads the `sku` key of the incoming request body, and `{{"\{\{action.result\}\}"}}` reads the result of the specification's most recently evaluated action.

### Variables

Every tag path starts at one of the API Context's four top-level keys:

- **`request`** — the incoming HTTP request (method, headers, path, query, body). See [Request Object](/router/reference/api_gateway/specification#request-object) for its full shape.
- **`variables`** — the `variables` object declared in the API Gateway Specification node currently being evaluated (see the specification's own `"variables"` property).
- **`action`** — the result (`action.result`) or error (`action.error`) of the specification's most recently performed action. See [Result Object](/router/reference/api_gateway/specification#result-object).
- **`defaults`** — the Gateway-wide default values (for example `defaults.status_codes`), listed in full in [Defaults](/router/reference/api_gateway/specification#defaults).

### Functions

A tag can pipe its value through one or more functions with the `|>` operator, left to right, e.g. `{{"\{\{request.body.price \|> integer\}\}"}}` converts the piped value to an integer before substitution. Functions seen in the reference examples on this site include `integer` and `string` (type coercion), `head` (first element of a list), and `get` (map lookup with a default, e.g. `{{"\{\{status_codes \|> get({{action.error.error_uri}}, 500)\}\}"}}`).

::: warning Not exhaustive
Mops' complete function catalogue isn't captured anywhere in this reference yet — the functions above are only the ones already demonstrated elsewhere in the API Gateway docs. Treat this list as a starting point, not a ceiling.
:::