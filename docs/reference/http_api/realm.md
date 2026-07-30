---
draft: true
related:
    - type: concepts
      text: Realms
      link: /concepts/realms
      description: Realms are routing and administrative domains that act as namespaces. All resources in Bondy belong to a Realm.
    - type: tutorial
      text: How to use Same-sign on
      link: /tutorials/security/same_sign_on
      description: Learn how to create and use a Same Sign-on Realm.
---
# Realm
Creating, retrieving and managing realms and also enabling, disabling and checking per realm security status.

[Realms](/concepts/realms) are routing and administrative domains that act as namespaces. All resources in Bondy belong to a Realm. Messages are routed separately for each individual realm so sessions attached to a realm won’t see message routed on another realm.

<!--@include: ../parts/realm_data.md-->

## API

Realm management has no built-in HTTP endpoint today — creating, retrieving, updating, and deleting a realm, and enabling or disabling its security, are only available through the [Realm WAMP API](/reference/wamp_api/realm).

::: tip Exposing realm management over HTTP
If you need an HTTP surface for realm management, the [HTTP API Gateway](/reference/http_api/api_gateway) lets you define your own endpoints that call the `bondy.realm.*` WAMP procedures — the same mechanism used to expose any other WAMP procedure as REST. See the [HTTP API Gateway Specification Reference](/reference/api_gateway/specification) for the `wamp_call` action type that does this.
:::