---
draft: true
related:
    - text: Realm
      type: WAMP API Reference
      link: /reference/wamp_api/realm
      description: Creating, retrieving and managing realms and also enabling, disabling and checking per realm security status.
    - text: Realm
      type: HTTP API Reference
      link: /reference/http_api/realm
      description: Creating, retrieving and managing realms and also enabling, disabling and checking per realm security status.
---
# Realms
The realm is a central and fundamental concept in Bondy. It does not only serve as an authentication and authorization domain but also as a message routing domain. Bondy ensures no messages routed in one realm will leak into another realm.

## Description
::: definition Realm
Realms are routing and administrative domains that act as namespaces. All resources in Bondy belong to a Realm. Messages are routed separately for each individual realm so sessions attached to a realm won’t see message routed on another realm.
:::


<ZoomImg src="/assets/realm_diagram.png"/>

In Bondy a realm is represented by a control plane object and is identified by a WAMP URI e.g. `com.mycompany.myrealm`.

Realms (and the associated users, credentials, groups, sources and permissions) are persisted to disk and replicated across the cluster by Bondy's control plane data replication service.

As a Bondy administrator[^admin] you can dynamically create (and manage) any number of realms using the [WAMP](/reference/wamp_api/realm) and [HTTP](/reference/http_api/realm) APIs when connected to the [Master Realm](#master-realm).

[^admin]: What constitutes an administrator i.e. what permissions and administrator has and which user is an administrator is actually defined by you using the security configuration.

::: info How many realms?
Because a realm is a control plane data object, there is no limit to the number of realms you can have. However, since part of the realm data is stored both in memory and disk, the actual limit is determined by the amount of memory and storage a Bondy node has access to.

Notice that since realms are globally replicated, the smallest node in a Bondy cluster (in terms of memory and storage) will be the one determining the actual limit.
:::


## Master Realm
When you start Bondy for the first time it creates and stores the Bondy Master realm identifiedm with the uri `bondy` (also the now deprecated `com.leapsight.bondy`).

This realm is the root realm which allows an admin user to create, list, modify and delete other realms. The realm can be customised either through the `bondy.conf` file or dynamically using the [WAMP](/reference/wamp_api/realm) and [HTTP](/reference/http_api/realm) APIs.

However, the master realm has some limitations:

* It cannot be deleted
* It cannot use [Prototype Inheritance](#prototype-inheritance)
* It cannot use [Same Sign-on](#same-sign-on)


## Prototype Inheritance

Prototypical inheritance allows us to reuse the properties (including RBAC definitions) from one realm to another through a reference URI configured on the `prototype_uri` property.

Key characteristics:

* Prototypical inheritance is a form of single inheritance i.e. realms can only inherit from a single prototype.
* The `prototype_uri` property is defined as an **irreflexive property** i.e. a realm cannot have itself as prototype.
* In addition **a prototype cannot inherit from another prototype**. This means the inheritance chain is bounded to one level.

::: definition Prototype Realm
A **Prototype Realm** is a realm that acts as a prototype for the construction of other realms. It is a normal realm whose property `is_prototype` has been set to `true`.
:::

The following is the list of properties which a realm inherits from a prototype when those properties have not been assigned a value. Setting a value to these properties is equivalent to overriding the prototype's.

- `security_enabled`
- `allow_connections`
- `sso_realm_uri`
- `authmethods`

In addition **realms inherit Groups, Sources and Grants** from their prototype.
based on the following rules:

1. Users cannot be defined for a Prototype Realm i.e. no user inheritance.
2. A realm has access to all groups defined in its prototype i.e. from a realm perspective the prototype groups operate in the same way as if they have been defined in the realm itself. This enables roles (users and groups) in a realm to be members of groups defined in its prototype.
3. A group defined in a realm overrides any homonym group in its prototype. This works at all levels of the group membership chain.
4. The previous rule does not apply to the special group `all`. Permissions granted to `all` are merged between a realm and its prototype.


## Security

Each realm has its own Security service, which provides Authentication and Authorization.

A realm's security service may be checked, enabled, or disabled by an administrator through the APIs. This allows an administrator to change security settings of a realm on the whole cluster quickly without needing to change settings on a node-by-node basis.

## Same Sign-on (SSO)
Bondy SSO (Same Sign-on) is a feature that allows users to access multiple realms using just one set of credentials.

To use SSO one needs first create a realm (A) as an SSO realm (by setting its `is_sso_realm` property to `true`).

Subsequently one or more realms can use realm A as their SSO Realm by respectively setting their property `sso_realm_uri` to the URI of realm A.

- It requires the user to authenticate when opening a session in a realm.
- Changing credentials e.g. updating password can be performed while connected to any realm.

To learn more about this topic review the [Same Sign-on page](/concepts/same_sign_on).

