---
draft: true
outline: [2,3]
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

## Overview
::: definition Realm
Realms are routing and administrative domains that act as namespaces. All resources in Bondy belong to a Realm. Messages are routed separately for each individual realm so sessions attached to a realm won’t see message routed on another realm.
:::

<ZoomImg src="/assets/realm_diagram.png"/>

In Bondy, a realm is represented by a control plane object and is identified by a WAMP URI e.g. `com.mycompany.myrealm`.

Realms (and the associated users, credentials, groups, sources and permissions) are persisted to disk and replicated across the cluster by Bondy's control plane data replication service.

As a Bondy administrator[^admin] you can dynamically create (and manage) any number of realms using the [WAMP](/reference/wamp_api/realm) and [HTTP](/reference/http_api/realm) APIs when connected to the [Master Realm](#master-realm).

[^admin]: The definition of an administrator, including their permissions and which user(s) have administrative privileges, is determined by your realm's security configuration.

::: info How many realms?
Since a realm is a control plane object, there is no defined limit to the number of realms you can have. However, the amount of memory and storage available to a Bondy node determines the actual limit, as part of the realm data is stored in both memory and disk.

It's important to note that since realms are globally replicated, the smallest node in a Bondy cluster (in terms of memory and storage) will determine the actual limit.
:::


## Master Realm
When you start Bondy for the first time it creates and stores the Bondy Master realm identified with the uri `bondy` (also the now deprecated `com.leapsight.bondy`).

This realm is the root realm, which allows administrative users to create, list, modify, and delete other realms, among other administrative capabilities.

The master realm can be customised either through the `bondy.conf` file or dynamically using the [WAMP](/reference/wamp_api/realm) and [HTTP](/reference/http_api/realm) APIs. However, the master realm has some limitations:

* It cannot be deleted
* It cannot use [Prototype Inheritance](#prototype-inheritance)
* It cannot use [Same Sign-on](#same-sign-on)
* Sessions attached to the realm are not permitted to register procedures (RPC) or publish messages (Pub/Sub)


## Prototype Inheritance

Prototypical inheritance enables properties, including RBAC definitions, from a parent realm to be reused in a child realm.

Key characteristics:

* Prototypical inheritance is a form of single inheritance i.e. realms can only inherit from a single prototype.
* The `prototype_uri` property is defined as an **irreflexive** property i.e. a realm cannot have itself as prototype.
* In addition **a prototype cannot inherit from another prototype**. This means the inheritance chain is bounded to one level.

::: definition Prototype Realm
A **Prototype Realm** is a realm that acts as a prototype for the construction of other realms. It is a normal realm whose property `is_prototype` has been set to `true`.
:::

To enable prototypical inheritance on a realm, you must set the prototype realm's URI on the child's `prototype_uri` property.

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

A realm can be seen as a self-contained Identity and Access Management (IAM) Service. Realms currently implement a Role-based Access Control (RBAC) approach to restricting access and to allow operations to authorized users.

RBAC is a policy-neutral access-control mechanism defined around roles and privileges. All operations on a realm are authorized using RBAC.

Users, groups and permissions for a realm are managed by the realm itself and are segregated from other realms. Realms provides this capability internally without the need for an external IAM system.

In addition, a realm defines which authentication methods are available and allows to restrict the available methods based on the connection’s source IP address (CIDR).


### Identity Management
User (person or automated agent) credentials and metadata are stored in the realm's local storage.

Each user has attributes associated with them, including a username, credentials (password or authorized keys), and metadata determined by the client applications.


### Authentication
A Realm supports different authentication protocols. In most cases, you can implement at least one authentication method but usually you will find useful to define different authentication methods to different roles and/or segregate them by source (CIDR).

The following methods can be used via WAMP:

- `anonymous`: Allows access to clients which connect without credentials, assigning them as members of the 'anonymous' group. You can configure the allowed sources for the anonymous user and the permissions assigned to the anonymous group - but you cannot make the anonymous group a member of another group.
- `password`: Allows access to clients which connect with an existing username (WAMP authid field) and password, where the password is send in clear-text and is therefore vulnerable to password “sniffing” attacks, unless the connection is protected by TLS encryption. It should be avoided and replaced by the use of **wamp-cra** or **wamp-scram** challenge-response methods if possible.
- `trust`: Allows access to clients which connect with an existing username (WAMP authid field) but does not request them to authenticate. This is to be used in conjunction with source definition e.g. trust only clients within a defined network (CIDR).
- `cookie`
- `wampcra`
- `cryptosign`
<!-- - `wamp-scram` -->
- `ticket`: Allows access to clients which connect with an existing username (WAMP authid field) and a ticket previously generated by Bondy. If the transport is not encrypted, this method is vulnerable to ticket “sniffing” attacks, a man-in-the-middle can sniff and possibly hijack the ticket. If the ticket value is reused, that might enable replay attacks. It should be used only when the connection is protected by TLS encryption.
- `oauth2`: TBD

### Authorization

### Same Sign-on (SSO)
Bondy SSO (Same Sign-on) is a feature that allows users to access multiple realms using just one set of credentials.

To use SSO, you first need to create a realm (A) as an SSO realm. This can be done by setting its `is_sso_realm` property to `true`.

Subsequently one or more realms can use realm A as their SSO Realm by respectively setting their property `sso_realm_uri` to the URI of realm A.

To learn more about this topic review the [Same Sign-on page](/concepts/same_sign_on).

### Single Sign-on
