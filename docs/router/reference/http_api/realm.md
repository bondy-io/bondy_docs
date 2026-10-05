---
related:
    - type: concepts
      text: Realms
      link: /router/concepts/realms
      description: Realms are routing and administrative domains that act as namespaces. All resources in Bondy belong to a Realm.
    - type: tutorial
      text: How to use Same-sign on
      link: /router/tutorials/security/same_sign_on
      description: Learn how to create and use a Same Sign-on Realm.
---
# Realm
Creating, retrieving and managing realms and also enabling, disabling and checking per realm security status.

[Realms](/router/concepts/realms) are routing and administrative domains that act as namespaces. All resources in Bondy belong to a Realm. Messages are routed separately for each individual realm so sessions attached to a realm won’t see message routed on another realm.

<!--@include: ../parts/realm_data.md-->

## API

Real## API

Realm management is available over HTTP through the [Admin HTTP API](/router/reference/http_api/index#realms). Each route calls the matching [Realm WAMP API](/router/reference/wamp_api/realm) procedure, which documents the arguments, results and errors.

| Method | Path | WAMP procedure |
|---|---|---|
| `GET` | `/realms` | `bondy.realm.list` |
| `POST` | `/realms` | `bondy.realm.create` |
| `GET` | `/realms/:realm_uri` | `bondy.realm.get` |
| `PUT` | `/realms/:realm_uri` | `bondy.realm.update` |
| `DELETE` | `/realms/:realm_uri` | `bondy.realm.delete` |
| `GET` | `/realms/:realm_uri/security_enabled` | `bondy.realm.security.is_enabled` |
| `PUT` | `/realms/:realm_uri/security_enabled` | `bondy.realm.security.enable` |
| `DELETE` | `/realms/:realm_uri/security_enabled` | `bondy.realm.security.disable` |
