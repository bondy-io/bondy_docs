---
related:
    - type: concepts
      text: Realms
      link: /concepts/realms
      description: Realms are routing and administrative domains that act as namespaces. All resources in Bondy belong to a Realm.
    - type: tutorial
      text: How to use Same-sign on
      link: /tutorials/security/same_sign_on
      description: Learn how to use create and use a Same Sign-on Realm.
    - type: Reference
      text: Realm WAMP API
      link: /reference/wamp_api/realm
      description: Creating, retrieving and managing realms and also enabling, disabling and checking per realm security status.
---
# Same Sign-on
Bondy SSO (Same Sign-on) is a feature that allows users to authenticate into multiple realms using just one set of credentials.

## Background
A realm can be seen as a self-contained Identity Provider and Authorization Service: all users, groups and permissions for a realm are managed by the realm itself in a (virtual) private database.

In addition, a realm defines which authentication methods are available and allows to restrict the available methods to a user or group of users based on the connection’s source IP address (CIDR).

When your distributed system design requires users to belong to multiple realms this creates the problem of each user having multiple credentials (one per realm) e.g. passwords and/or public keys, which are not synchronised amongst them.

Same Sign-on (SSO) is a solution to that problem.

::: definition SSO Realm
With SSO one or more realms can delegate the credentials management and the authentication process to a common (shared) ***SSO Realm***. That is, the SSO Realm becomes the Identity Provider for the other realms.
:::

Enabling this new feature doesn't affect the capability to manage users "locally" in each realm.

::: info Notice
At the moment the realm object only allows a single SSO realm to be associated with it, but the rest of the logic in the platform already caters for multiple SSO realms per realm, so we will be enabling this in the future.
:::

## How does it work?

SSO works by having realms **share a common realm** to which they delegate the user identification and authentication.

To use SSO one needs first create a realm as an SSO realm e.g. `com.example.sso`  by setting its `is_sso_realm` property to `true`.

Subsequently one or more realms can use the newly created SSO Realm by respectively setting their property `sso_realm_uri` to `com.example.sso`.

In the following diagram both realms `com.example.realm.1` and `com.example.realm.2` have their property `sso_realm_uri` set to `com.example.sso`.

<ZoomImg src="/assets/sso.png"/>

This allows the user `Linda` to authenticate to both realms using a single set of credentials stored in SSO realm `com.example.sso`.




## Logging-in

There is no need to change the client code to use Same Sign-on. The user can login using its credentials to any of the realms it belongs to.

## Changing credentials

Changing credentials (`password` or `authorized_keys`) can be done by calling the Bondy APIs while logged-in on any of the realms the user is associated with, Bondy will forward the operation to the linked SSO realm.

## Creating local users

Users can still be created normally on any realm (aka a "Local" user). To do this we just create the user without specifying a value for the property `sso_realm_uri` or setting it to `null`.

## Configuring via a file

The security file format is just the same payload used by the WAMP APIs explained above.

Every time Bondy boots it loads the provided security configuration file and makes a call to `bondy.realm.add`. This however uses a **special mode of operation** of the API. While use interactively (and as mentioned above) the API will **return an error when trying to create and already existing object** but when applying the configuration from file it will override the data.

That is, when using a configuration file Bondy treats it as a declarative configuration statement.

::: info Complete working example
* [ ] link to repo here
:::

## FAQs

### Is this the same as Single Sign-on?

No. Same Sign-on still requires the user to authenticate again when opening a session on a realm.

### Where does the authorization happen?

Authorization is still performed by the realm the user is connecting to. That means the permissions will be those granted by the local RBAC configuration for the realm. Bondy SSO only handles authentication.
