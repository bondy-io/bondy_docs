# Realm
> Realms are routing and administrative domains that act as namespaces. All resources in Bondy belong to a Realm. Messages are routed separately for each individual realm so sessions attached to a realm won’t see message routed on another realm. {.definition}


## Description
The realm is a central and fundamental concept in Bondy. It does not only serve as an authentication and authorization domain but also as a message routing domain. Bondy ensures no messages routed in one realm will leak into another realm.

In Bondy a realm is represented by a control plane object.

Realms (and the associated users, credentials, groups, sources and permissions) are persisted to disk and replicated across the cluster by Bondy's control plane data replication procedures.

#### Realm Security

A realm's security may be checked, enabled, or disabled by an administrator through the WAMP and HTTP APIs. This allows an administrator to change security settings of a realm on the whole cluster quickly without needing to change settings on a node-by-node basis.

#### Bondy Master Realm
When you start Bondy for the first time it creates and stores the Bondy Master realm a.k.a `com.leapsight.bondy`. This realm is the root realm which allows an admin user to create, list, modify and delete other realms. The realm can be customised either through the `bondy.conf` file or dynamically using this API.

However, the master realm has some limitations:

* It cannot be deleted
* It cannot use [Inheritance](#inheritance)
* It cannot use [Same Sign-on](#same-sign-on)

#### User Realms
As a Bondy administrator you can dynamically create any number of realms.


## Inheritance
A **Prototype Realm** is a realm that acts as a prototype for the construction of other realms. A prototype realm is a normal realm whose property `is_prototype` has been set to true.

Prototypical inheritance allows us to reuse the properties (including RBAC definitions) from one realm to another through a reference URI configured on the `prototype_uri` property.
Prototypical inheritance is a form of single inheritance as realms are can only be related to a single prototype.
The `prototype_uri` property is defined as an **irreflexive property** i.e. a realm cannot have itself as prototype. In addition **a prototype cannot inherit from another prototype**. This means the inheritance chain is bounded to one level.

The following is the list of properties which a realm inherits from a prototype when those properties have not been assigned a value. Setting a value to these properties is equivalent to overriding the prototype's.

- `security_enabled`
- `allow_connections`
- `sso_realm_uri`
- `authmethods`

In addition realms inherit Groups, Sources and Grants from their prototype.

The following are the inheritance rules:

1. Users cannot be defined at the prototype i.e. no user inheritance.
2. A realm has access to all groups defined in the prototype i.e. from a realm perspective the prototype groups operate in the same way as if they have been defined in the realm itself. This enables roles (users and groups) in a realm to be members of groups defined in the prototype.
3. A group defined in a realm overrides any homonyms group in the prototype. This works at all levels of the group membership chain.
4. The previous rule does not apply to the special group all'. Permissions granted to **all** are merged between a realm and its prototype.

## Same Sign-on
Bondy SSO (Same Sign-on) is a feature that allows users to access multiple realms using just one set of credentials.
It is enabled by setting the realm's `sso_realm_uri` property during realm creation or during an update operation.

- It requires the user to authenticate when opening a session in a realm.
- Changing credentials e.g. updating password can be performed while connected to any realm.

## Types
### input_data(){.datatype}


### realm(){.datatype}
The representation of the realm returned by the read operations e.g. `get` and `list`.

|Name|Type|Attrs|Description|
|:---|---|---|---|
|**uri**| `uri`|`required` `immutable`| The realm identifier|
|**description**| `string`|| A textual description of the realm.|
|**is_prototype**| boolean| immutable| If `true` this realm is a realm used as a prototype.Prototype realms cannot be used by themselves. Once a realm has been designated as a prototype it cannot be changed.<br><i>Default: `false`</i>|
|**prototype_uri**|uri||If present, this it the URI of the the realm prototype this realm inherits some of its behaviour and features from|
|**sso_realm_uri**|uri||If present, this it the URI of the SSO Realm this realm is connected to. Once a realm has been associated with an SSO realm it cannot be changed.<br><i>Default: the realm's prototype value if the realm inherits from a prototype (see `prototype_uri`), otherwise undefined.</i>|
|**is_sso_realm**|boolean|immutable|If `true` this realm is an SSO Realm. Once a realm has been designated as an SSO realm it cannot be changed.<br><i>Default: `false`</i>|
|**allow_connections**| boolean||If `true` this realm is allowing connections from clients. It is normally set to `false` when the realm is an SSO Realm. Prototype realms never allow connections.<br><i>Default: the realm's prototype value if the realm inherits from a prototype (see `prototype_uri`). Otherwise `true`.</i>|
|**authmethods**| array(string)||The list of the authentication methods allowed by this realm.<br><i>Default: `[anonymous, trust, password, ticket, oauth2, wampcra, cryptosign]`</i>|
|**security_status**|string||The string **enabled** if enabled is true. Otherwise the string is **disabled**.|
|**public_keys**|array(value)||A list of [JWK](jwk) values.
|**password_opts**|map||The password options to be used as default when adding users to the realm|


{.property-table}

## Procedures


### bondy.realm.create(input_data) -> realm() {.wamp-procedure}
Creates a new realm based on `input_data`. The realm is persisted and asynchronously replicated to all the nodes in the cluster.

Publishes an event under topic [bondy_realm_created](#bondy-realm-created){.uri} after the realm has been created.

::: warning ADMIN AUTHORIZATION
This call is only available to sessions attached to the Master Realm and with `wamp.call` permission on the uri or pattern matching the uri.
:::

### bondy.realm.get(uri()) -> realm() {.wamp-procedure}

Foo

#### Examples

::: details Realm created successfully | JSON
```json
{
	"uri": "com.example.test",
	"description": "A test realm",
	"security_status": "enabled",
	"sso_realm_uri": null,
	"is_sso_realm": false,
	"allow_connections": true,
	"authmethods": [
		"cryptosign",
		"wampcra",
		"anonymous",
		"oauth2",
		"password",
		"trust",
		"ticket"
	],
	"password_opts": {
      "params": {
          "iterations": 10000,
          "kdf": "pbkdf2"
      },
      "protocol": "cra"
  },
	"public_keys": [
		{
			"crv": "P-256",
			"kid": "39904946",
			"kty": "EC",
			"x": "jHJMWbqcWPemB7X-a1eZ1ctcoTAxdJqffp1Yil_Pbqc",
			"y": "u5mQGe24nprq1rzVvXOMeqk7h7-43AYsMgWIaNxQZTM"
		},
		{
			"crv": "P-256",
			"kid": "77311347",
			"kty": "EC",
			"x": "AEjB2EC5kchCFuylw7Qcna4ERPGzkogcoInYLEQI1Co",
			"y": "5GoNsIhylGs4sogoLP7DOKrdU4OO2p-dwWDz3wVCYSA"
		},
		{
			"crv": "P-256",
			"kid": "92027690",
			"kty": "EC",
			"x": "35dxB-NVWz4bXcC_XeV-ikfL6Vn3FgsAn6MZDwClOB8",
			"y": "A99cPIU6x1Rxw4IyfcSyu6GxQ4KzQHaStdWP7QKUIVU"
		}
	]
}
```
:::

### bondy.realm.update(uri(), input_data()) {.wamp-procedure}

### bondy.realm.list() {.wamp-procedure}

### bondy.realm.delete(uri(); force=boolean()) {.wamp-procedure}
::: warning ADMIN AUTHORIZATION
This call is only available when the session is attached to the Master Realm
:::

### bondy.realm.security.is_enabled(uri) {.wamp-procedure}
Returns `true` if security is enabled for the realm identified with `uri`. Otherwise returns `false`.
Realm security is `enabled` by default.

### bondy.realm.security.enable(uri) {.wamp-procedure}

### bondy.realm.security.disable(uri) {.wamp-procedure}
Disables security for the realm identified with `uri`.

::: danger Danger
Disabling security removes the various authentication and authorization checks that take place when establishing a session, performing operations against a Bondy Realm and/or routing messages.
We recommend using this option only during development.
:::

Users, groups, and other security resources remain available for configuration while security is disabled. The changes will be made effective when security is re-enabled.

Realm security is enabled by default.



### bondy.realm.security.status(uri) {.wamp-procedure}
Returns the security status (`enabled` or `disabled`) for the realm identified by `uri`.
Realm security is `enabled` by default.

## Topics

### bondy.realm.created{.wamp-topic}
