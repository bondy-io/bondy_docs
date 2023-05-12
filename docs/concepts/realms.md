---
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
The realm is a central and fundamental concept in Bondy, serving as an application network domain that segregates authentication, authorization, and message routing. Bondy ensures that no messages routed in one realm will leak into another realm.

## Overview
::: definition Realm
A realm is a logical grouping of application network resources that are managed under a common administrative authority. It represents an administrative boundary within an application network and allows for centralized control and management of resources, connections, user accounts, security policies, and other application network-related configurations.
:::

All resources in Bondy belong to a realm. Messages are routed separately for each individual realm, so sessions attached to a realm won’t see messages routed on another realm.

It is the equivalent of a domain in computer networks.

<ZoomImg src="/assets/realm_diagram.png"/>

## The Realm object

In Bondy, a realm is represented by a control plane object and is identified by a WAMP URI e.g. `com.mycompany.myrealm`.

Realms (and the associated configuration) are persisted to disk and replicated across the cluster by Bondy's control plane data replication service.

As a Bondy administrator[^admin] you can dynamically create (and manage) any number of realms using the [WAMP](/reference/wamp_api/realm) and [HTTP](/reference/http_api/realm) APIs when connected to the [Master Realm](#master-realm).

[^admin]: The definition of an administrator, including their permissions and which user(s) have administrative privileges, is determined by your realm's security configuration.

::: info How many realms?
Since a realm is a control plane object, there is no defined limit to the number of realms you can have. However, the amount of memory and storage available to a Bondy node determines the actual limit, as part of the realm data is stored in both memory and disk.

It's important to note that since realms are globally replicated, the smallest node in a Bondy cluster (in terms of memory and storage) will determine the actual limit.
:::


## Identity Management

A realm can be seen as a self-contained Identity and Access Management (IAM) service.

Realms currently implement a Role-based Access Control (RBAC) approach to restricting access and to allow operations to authorized users. RBAC is a policy-neutral access-control mechanism defined around roles and privileges. All operations on a realm are authorized using RBAC.

Realms provides this capability internally, without the need for an external IAM system. User identities (whether human or automated agents), credentials, metadata, group definitions, role assignments, and role permissions are stored in the realm's local storage.

::: warning Important
Role-Based Access Control (RBAC) definitions for a realm are separate from other realm definitions. This means that each realm has its own set of identities, groups, role assignments, and role permission rules.

As a result of this segregation, a session attached to a realm cannot read and/or operate (via admin APIs) on the RBAC definitions of other realms.

This also means that a user must have separate identities for different realms. However, as explained in [Same Sign-on](#same-sign-on-sso), Bondy provides a way to allow a user to access multiple realms using a single set of credentials to reduce administrative burden.
:::


## Authentication

To attach a session to a realm, the user first needs to authenticate[^security].

[^security]: Unless the realm's security has been disabled by the administrator.

A realm defines the authentication methods that are available and allows administrators to restrict the available methods based on RBAC role assignments, including the connection's source IP address (CIDR).

In most cases, you can implement at least one authentication method, but it is often useful to define different authentication methods for different roles and/or segregate them by source (CIDR).

### Anonymous

Allows access to clients to connect without credentials, assigning them as members of the 'anonymous' group. You can configure the allowed sources for the anonymous user and the permissions assigned to the anonymous group - but you cannot make the anonymous group a member of another group.

### Trust
This feature grants access to clients that connect with an existing identity but does not require them to authenticate. It should be used in conjunction with a source definition, such as trusting only clients within a defined network (CIDR).

::: tip Note
This authentication method is primarily designed to enable administrator access from the local network e.g. `localhost`.
:::

### Password
Allows access to clients which connect with an existing username (WAMP authid field) and password, where the password is send in clear-text and is therefore vulnerable to password “sniffing” attacks, unless the connection is protected by TLS encryption.

::: warning Important
Note that Bondy will store a salted hash of the password, as is the case for the challenge-response method. However, since the password is sent by the client in clear text (unless TLS is used), this method should be avoided. Instead, use a challenge-response method which is more secure.
:::


### Challenge-Response
WAMP Challenge-Response ("WAMP-CRA") authentication is a simple and secure authentication mechanism that uses a shared secret. Both the client and server share a secret, which never travels over the wire. This means WAMP-CRA can be used via non-TLS connections.

::: tip Important
The secret (password) is never stored in Bondy. Instead, a salted hash of the password is stored.
:::

<!-- ### SCRAM
The WAMP Salted Challenge Response Authentication Mechanism, or "WAMP-SCRAM," is a password-based authentication method that does not transmit or store the shared secret as cleartext. WAMP-SCRAM is based on two RFCs: RFC5802 (*Salted Challenge Response Authentication Mechanism*) and RFC7677 (*SCRAM-SHA-256 and SCRAM-SHA-256-PLUS*). [¶](https://wamp-proto.org/wamp_latest_ietf.html#section-13.3-1)

WAMP-SCRAM supports the Argon2 ([draft-irtf-cfrg-argon2](https://datatracker.ietf.org/doc/draft-irtf-cfrg-argon2/)) password-based key derivation function, which is a memory-hard algorithm that resists cracking on GPU hardware. PBKDF2 ([RFC2898](https://tools.ietf.org/html/rfc2898)) is also supported for applications that must use primitives currently approved by cryptographic standards. -->

### Cryptosign
WAMP-Cryptosign is a WAMP authentication method that uses public-private key cryptography. Specifically, it is based on [Ed25519](https://ed25519.cr.yp.to/) digital signatures, as described in [RFC8032](https://wamp-proto.org/wamp_latest_ietf.html#RFC8032).

Ed25519 is an [elliptic curve signature scheme](https://ed25519.cr.yp.to/ed25519-20110926.pdf) that uses elliptic curve parameters equivalent to [Curve25519](https://cr.yp.to/ecdh.html). Curve25519 is a [SafeCurve](https://safecurves.cr.yp.to/) designed to be easy to implement and avoid security issues resulting from common implementation challenges and bugs. Ed25519 is intended to operate at around the 128-bit security level, and there are robust native implementations available as open-source, such as [libsodium](https://github.com/jedisct1/libsodium).

Using Cryptosign, the private key is never shared with Bondy. Instead, the user identity definition will contain with one or more public keys.


### Ticket
An authentication ticket is a signed (and possibly encrypted) assertion of a user's identity. A client can use this ticket to authenticate the user without needing to ask them to re-enter their credentials.

A client can obtain a ticket from a session authenticated using a method other than [Anonymous](#anonymous) and [Trust](#trust) and use it to authenticate the user to the same realm, unless it is used in conjunction with [Single Sign-on](#single-sign-on). Single Sign-on enables the user to authenticate to multiple realms using the same ticket.

::: warning Important
If the transport is not encrypted, this method is vulnerable to "sniffing" attacks on the ticket. A man-in-the-middle can sniff and possibly hijack the ticket. If the ticket value is reused, that might enable replay attacks. Therefore, this method should only be used when the connection is protected by TLS encryption.
:::

### OAuth2
Allows users with previously obtained tokens from an [HTTP API Gateway](/reference/api_gateway/index) session using the supported [OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc6749) flows to establish a session to the same realm without the need to authenticate again.

::: tip
This authentication method is primarily designed for clients to share a token between HTTP and WAMP sessions. If you are only using WAMP, we recommend using the Ticket method instead.
:::

### Authorization
WAMP enables authenticated users perform various actions, including:

- Registering procedures using fully qualified URIs or URI patterns to receive invocations.
- Calling procedures using fully qualified URIs or URI patterns.
- Subscribing to topics using fully qualified URIs or URI patterns to receive events.
- Publishing events to fully qualified URIs.

To perform these actions, users must have been granted the correct permissions. Permissions for a realm are defined using the RBAC.

::: tip
Unlike the WAMP specification, which only allows a single active role (group) per session, Bondy allows for multiple active groups. To achieve this, pass a comma-separated string of the desired groups in the `authrole` session request details or simply leave the property undefined.
:::

### Accounting/Auditing
::: info
To be implemented.

Records the action ("operation") taken on a URI or URI pattern for a Realm, as well as the Principal ("user") who requested it, and whether the action was allowed or denied.

:::



## Master Realm
When you start Bondy for the first time it creates and stores the Bondy Master realm identified with the uri `bondy` (also the now deprecated `com.leapsight.bondy`).

This realm is the root realm, which allows administrative users to create, list, modify, and delete other realms, among other administrative capabilities.

The master realm can be customised either through the `bondy.conf` file or dynamically using the [WAMP](/reference/wamp_api/realm) and [HTTP](/reference/http_api/realm) APIs. However, it has some limitations when compared with user realms:


* Sessions attached to the realm are not permitted to register procedures or publish events
* It cannot be deleted
* It cannot use [Prototype Inheritance](#prototype-inheritance)
* It cannot use [Same Sign-on](#same-sign-on-sso) or [Single Sign-on](#single-sign-on)

## Prototype Inheritance

::: definition Prototype Realm
A **Prototype Realm** is a realm that acts as a prototype for the construction of other realms. It is a normal realm whose property `is_prototype` has been set to `true`.
:::


Prototypical inheritance enables properties, including authentication and authorization definitions, from a parent realm to be reused in a child realm.

Key characteristics:

* Prototypical inheritance is a form of *single inheritance* i.e. realms can only inherit from a single prototype.
* A realm cannot inherit from itself (*irreflexive* relationship).
* In addition *a prototype cannot inherit from another prototype*. This means the inheritance chain is bounded to one level.


To enable prototypical inheritance on a realm, you must set the prototype realm's URI on the child's `prototype_uri` property.

The following is the list of properties which a realm inherits from a prototype when those properties have not been assigned a value. Setting a value to these properties is equivalent to overriding the prototype's.

- `security_enabled`
- `allow_connections`
- `sso_realm_uri`
- `authmethods`

In addition, *realms inherit Groups, Sources and Grants* from their prototype based on the following rules:

1. Users cannot be defined for a Prototype Realm, which means there is no user inheritance.
2. A realm has access to all groups defined in its prototype. From the realm's perspective, the prototype groups operate in the same way as if they had been defined in the realm itself. This enables roles (users and groups) in a realm to be members of groups defined in its prototype.
3. A group defined in a realm overrides any homonym group in its prototype. This works at all levels of the group membership chain.
4. The previous rule does not apply to the special group `all`. Permissions granted to `all` are merged between a realm and its prototype.

## Same Sign-on (SSO)
Bondy SSO (Same Sign-on) is a feature that allows users to access multiple realms using just one set of credentials.

To use SSO, you first need to create a realm (A) as an SSO realm. This can be done by setting its `is_sso_realm` property to `true`.

Subsequently one or more realms can use realm A as their SSO Realm by respectively setting their property `sso_realm_uri` to the URI of realm A.

To learn more about this topic review the [Same Sign-on section](/concepts/same_sign_on).

## Single Sign-on

Bondy Single Sign-On is a feature that enables users to access one or more realms using a ticket, thereby bypassing the authentication step.

It is a combination of [Same Sign-on](#same-sign-on-sso) and [Ticket](#ticket) authentication method.

To learn more about this topic review the [Single Sign-on page](/concepts/single_sign_on).
