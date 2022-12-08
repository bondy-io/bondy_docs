---
draft: true
---
# API Gateway Expressions Reference
Bondy API Specification use a logic-less domain-specific language (internally called _"Mops"_) for data transformation and dynamic configuration.

::: warning Notice
The expression language operates on the [API Context](/reference/api_gateway/specification) and it works by expanding keys (or key paths) provided in a context and adding or updating keys in the same context object.

This reference assumes you are familiar with the API Context schema.
:::

## Overview

We call Mops "logic-less" because there are no if statements, else clauses, or for loops. Instead there are only _tags_. Some tags are replaced with a value, some nothing, and others a series of values. This document explains the different types of Mops tags[^1].

[^1]: Mops droves inspiration from Mops is inspired by [mustache](https://mustache.github.io).

## Expressions

Expressions are strings containing one or more [Tags](#tags).

You can use an expression in an API Gateway Specification object property when its value is of type `expression`.

::: definition Expression Type
The expression type syntax used across the documentation is `() => DATATYPE` where `DATATYPE` is the type the expression should evaluate to i.e. `() => string` means that once evaluated the expression should return a `string` type.
:::



## Tags

Tags are indicated by the double mustaches. `{{"\{\{request\}\}"}}` is a tag, as is `{{"\{\{defaults.timeout\}\}"}}`.

Mops always operates on an [API Context](/reference/api_gateway/specification), a map that contains

### Variables



### Functions

