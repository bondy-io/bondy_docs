# Realm
> Realms are routing and administrative domains that act as namespaces. All resources in Bondy belong to a Realm. Messages are routed separately for each individual realm so sessions attached to a realm won’t see message routed on another realm. {.definition}

## Description
The realm is a central and fundamental concept in Bondy. It does not only serve as an authentication and authorization domain but also as a message routing domain. Bondy ensures no messages routed in one realm will leak into another realm.

In Bondy a realm is represented by a control plane object.

Realms (and the associated users, credentials, groups, sources and permissions) are persisted to disk and replicated across the cluster by Bondy's control plane data replication procedures.

![Bondy Realm Diagram](/assets/realm_diagram.png)

### Realm Security

A realm's security may be checked, enabled, or disabled by an administrator through the WAMP and HTTP APIs. This allows an administrator to change security settings of a realm on the whole cluster quickly without needing to change settings on a node-by-node basis.

### Bondy Master Realm
When you start Bondy for the first time it creates and stores the Bondy Master realm a.k.a `com.leapsight.bondy`. This realm is the root realm which allows an admin user to create, list, modify and delete other realms. The realm can be customised either through the `bondy.conf` file or dynamically using this API.

However, the master realm has some limitations:

* It cannot be deleted
* It cannot use [Inheritance](#inheritance)
* It cannot use [Same Sign-on](#same-sign-on)

### User Realms
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

In addition **realms inherit Groups, Sources and Grants** from their prototype.

The following are the inheritance rules:

1. Users cannot be defined at the prototype i.e. no user inheritance.
2. A realm has access to all groups defined in the prototype i.e. from a realm perspective the prototype groups operate in the same way as if they have been defined in the realm itself. This enables roles (users and groups) in a realm to be members of groups defined in the prototype.
3. A group defined in a realm overrides any homonym group in the prototype. This works at all levels of the group membership chain.
4. The previous rule does not apply to the special group `all`. Permissions granted to `all` are merged between a realm and its prototype.

## Same Sign-on
Bondy SSO (Same Sign-on) is a feature that allows users to access multiple realms using just one set of credentials.
It is enabled by setting the realm's `sso_realm_uri` property during realm creation or during an update operation.

- It requires the user to authenticate when opening a session in a realm.
- Changing credentials e.g. updating password can be performed while connected to any realm.

To learn more about this topic review the [Single Sign-on page](/concepts/single_sign_on).

## Types
### input_data(){.datatype}
The object used to create or update a realm. Notice this object contains more information than the actually create realm e.g. users, groups, etc.

The object represents as overview of the all realm properties but the available properties are detailed in each particular operation.

<DataTreeView :data="inputCreateData" :maxDepth="10" />

### realm(){.datatype}
The representation of the realm returned by the read or write operations e.g. `get`, `list`, `create` or `update`.

<DataTreeView :data="realm" :maxDepth="10" />

## Procedures

|Name|URI|
|:---|:---|
|[Create a realm](#create-a-realm)|`bondy.realm.create`
|[Retrieve a realm](#retrieve-a-realm)|`bondy.realm.get`
|[Update a realm](#update-a-realm)|`bondy.realm.update`|
|[List all realms](#list-all-realms)|`bondy.realm.list`|
|[Delete a realm](#delete-a-realm)|`bondy.realm.delete`|
|[Retrieve if a realm security is enabled](#retrieve-if-a-realm-security-is-enabled)|`bondy.realm.security.is_enabled`|
|[Enable realm security](#enable-realm-security)|`bondy.realm.security.enable`|
|[Disable realm security](#disable-realm-security)|`bondy.realm.security.disable`|
|[Retrieve a realm security status](#retrieve-a-realm-security-status)|`bondy.realm.security.status`|

### Create a realm
### bondy.realm.create(input_data()) -> realm() {.wamp-procedure}
Creates a new realm based on the provided data. The realm is persisted and asynchronously replicated to all the nodes in the cluster.

Publishes an event under topic [bondy.realm.created](#bondy-realm-created){.uri} after the realm has been created.

::: warning AUTHORIZATION
This call is only available to sessions attached to the **Master Realm** with `wamp.call` permission.
:::

#### Call

##### Positional Args
<DataTreeView :data="createArgs" :maxDepth="10" />

##### Keyword Args
None.

#### Result

##### Positional Results
<DataTreeView :data="createResult" :maxDepth="10" />

##### Keyword Results
None.

#### Errors

* [bondy.error.already_exists](/reference/wamp_api/errors/already_exists): when the provided uri already exists.
* [bondy.error.missing_required_value](/reference/wamp_api/errors/missing_required_value): when a required value is not provided
* [bondy.error.invalid_datatype](/reference/wamp_api/errors/invalid_datatype): when the data type is invalid
* [bondy.error.invalid_value](/reference/wamp_api/errors/invalid_value): when the data value is invalid
* [bondy.error.invalid_data](/reference/wamp_api/errors/invalid_data): when the data values are invalid
* [wamp.error.invalid_argument](/reference/wamp_api/errors/wamp_invalid_argument): for example when the provided `sso_realm_uri` property value doesn't exist or there are some inconsistent property values.

#### Examples

::: details Success Call Creation
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.realm.create \
'{
    "uri":"com.leapsight.test_creation_1",
    "description":"A test creation realm"
}' | jq
```
- Response:
```json
{
  "description": "A test creation realm",
  "is_prototype": false,
  "is_sso_realm": false,
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
      "kid": "123260399",
      "kty": "EC",
      "x": "cfhg9z_BOPDAEkYDcSFbpJ1jJVqLxTSlrCJDUYRkrxM",
      "y": "zcdy7H1h1FDzwU8RFeuFxFMve9vCHUFnCOpdbMJfc4o"
    },
    {
      "crv": "P-256",
      "kid": "130260278",
      "kty": "EC",
      "x": "EDPzrOPJofWS1pm6WTI1oaNeJ7ITPz6ZjeTzXyl_8sM",
      "y": "Ki46MYcsXNb19XwoqMMenWboBAdILYjY2eOBkaAkeyQ"
    },
    {
      "crv": "P-256",
      "kid": "57089265",
      "kty": "EC",
      "x": "x_i6fqY3YkzSBi60pDOPe6nS-fxcQ4AjkrTUOjyPvhM",
      "y": "8oFJ9bernMMFzcrDBS07QiuL8fIeuqMXT-GrvwKKDZc"
    }
  ],
  "security_status": "enabled",
  "uri": "com.leapsight.test_creation_1"
}
```
:::

### Retrieve a realm
### bondy.realm.get(uri()) -> realm() {.wamp-procedure}
Retrieves the requested realm uri.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to retrieve.'
		}
	})"
/>

##### Keyword Args
None.

#### Result

##### Positional Results
The call result is a single positional argument containing a realm:

<DataTreeView :data="realm" :maxDepth="10" />

##### Keyword Results
None.

#### Errors

* [bondy.error.not_found](/reference/wamp_api/errors/not_found): when the provided uri is not found.

#### Examples

::: details Success Call Getting
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.realm.get "com.leapsight.test_creation_1" | jq
```
- Response
```json
{
  "description": "A test creation realm",
  "is_prototype": false,
  "is_sso_realm": false,
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
      "kid": "123260399",
      "kty": "EC",
      "x": "cfhg9z_BOPDAEkYDcSFbpJ1jJVqLxTSlrCJDUYRkrxM",
      "y": "zcdy7H1h1FDzwU8RFeuFxFMve9vCHUFnCOpdbMJfc4o"
    },
    {
      "crv": "P-256",
      "kid": "130260278",
      "kty": "EC",
      "x": "EDPzrOPJofWS1pm6WTI1oaNeJ7ITPz6ZjeTzXyl_8sM",
      "y": "Ki46MYcsXNb19XwoqMMenWboBAdILYjY2eOBkaAkeyQ"
    },
    {
      "crv": "P-256",
      "kid": "57089265",
      "kty": "EC",
      "x": "x_i6fqY3YkzSBi60pDOPe6nS-fxcQ4AjkrTUOjyPvhM",
      "y": "8oFJ9bernMMFzcrDBS07QiuL8fIeuqMXT-GrvwKKDZc"
    }
  ],
  "security_status": "enabled",
  "uri": "com.leapsight.test_creation_1"
}
```
:::

### Update a realm
### bondy.realm.update(uri(), input_data()) -> realm() {.wamp-procedure}
Updates the data of the provided realm uri. The realm is persisted and asynchronously replicated to all the nodes in the cluster.

Publishes an event under topic [bondy.realm.updated](#bondy-realm-updated){.uri} after the realm has been updated.

#### Call

##### Positional Args
<DataTreeView :data="updateArgs" :maxDepth="10" />

##### Keyword Args
None.

#### Result

##### Positional Results
<DataTreeView :data="updateResult" :maxDepth="10" />

##### Keyword Results
None.

#### Errors

* [bondy.error.missing_required_value](/reference/wamp_api/errors/missing_required_value): when a required value is not provided
* [bondy.error.invalid_datatype](/reference/wamp_api/errors/invalid_datatype): when the data type is invalid
* [bondy.error.invalid_value](/reference/wamp_api/errors/invalid_value): when the data value is invalid
* [bondy.error.invalid_data](/reference/wamp_api/errors/invalid_data): when the data values are invalid
* [wamp.error.invalid_argument](/reference/wamp_api/errors/wamp_invalid_argument): for example when the provided `sso_realm_uri` property value doesn't exist or there are some inconsistent property values.
* [bondy.error.not_found](/reference/wamp_api/errors/not_found): when the provided uri is not found.

#### Examples

::: details Success Call Update
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.realm.update \
"com.leapsight.test_creation_1" '{"description":"A test updating realm", "allow_connections": false}' | jq
```
- Response:
```json
{
  "allow_connections": false,
  "description": "A test updating realm",
  "is_prototype": false,
  "is_sso_realm": false,
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
      "kid": "123260399",
      "kty": "EC",
      "x": "cfhg9z_BOPDAEkYDcSFbpJ1jJVqLxTSlrCJDUYRkrxM",
      "y": "zcdy7H1h1FDzwU8RFeuFxFMve9vCHUFnCOpdbMJfc4o"
    },
    {
      "crv": "P-256",
      "kid": "130260278",
      "kty": "EC",
      "x": "EDPzrOPJofWS1pm6WTI1oaNeJ7ITPz6ZjeTzXyl_8sM",
      "y": "Ki46MYcsXNb19XwoqMMenWboBAdILYjY2eOBkaAkeyQ"
    },
    {
      "crv": "P-256",
      "kid": "57089265",
      "kty": "EC",
      "x": "x_i6fqY3YkzSBi60pDOPe6nS-fxcQ4AjkrTUOjyPvhM",
      "y": "8oFJ9bernMMFzcrDBS07QiuL8fIeuqMXT-GrvwKKDZc"
    }
  ],
  "security_status": "enabled",
  "uri": "com.leapsight.test_creation_1"
}
```
:::

### List all realms
### bondy.realm.list() -> [realm()] {.wamp-procedure}
Lists all configured realms.

#### Call

##### Positional Args
None.

##### Keyword Args
None.

#### Result

##### Positional Results
The call result is a single positional argument containing a list of all realms:

<DataTreeView :data="listResult" :maxDepth="10" />

##### Keyword Results
None.

::: details Success Call
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.realm.list | jq
```
- Response:
```json
[
    {
        "authmethods": [
            "wampcra",
            "anonymous",
            "password",
            "trust"
        ],
        "description": "The Bondy Master realm",
        "is_prototype": false,
        "is_sso_realm": false,
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
                "kid": "128116552",
                "kty": "EC",
                "x": "3Nl3CmBWDBnOXLPnfdI-tJVZbG_0oGEINrEswDSaaQM",
                "y": "mbistOgdGNfjGuM6E-IdUZ1r245-5H3-yL2BUm005Hg"
            },
            {
                "crv": "P-256",
                "kid": "19671252",
                "kty": "EC",
                "x": "T9hg9GOiJji9VILQyypKta0e3DKlhRrWnK_0aW36Cfk",
                "y": "fnV4QAfattr-ky5xSvc87pM4wfnJcnKS_4EYjqknN48"
            },
            {
                "crv": "P-256",
                "kid": "39128489",
                "kty": "EC",
                "x": "YqI61nD4OpDb2r5dOgkddeClYVGBTXb-2jFSN01Mgq0",
                "y": "sJ_Noey9m_mtFXJLBBdiCQ0xVyhlDKIIKCh8maeWRWc"
            }
        ],
        "security_status": "enabled",
        "uri": "com.leapsight.bondy"
    },
    {
        "allow_connections": true,
        "authmethods": [
            "cryptosign",
            "wampcra",
            "ticket"
        ],
        "description": "A test realm",
        "is_prototype": false,
        "is_sso_realm": false,
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
                "kid": "33524152",
                "kty": "EC",
                "x": "o1cp0-BEer7-83IJnrLlQF2vMsC4-p865y_PYbUnh0U",
                "y": "m4KH851AIVkxLPnyEPb-HAFPnI4HWzHZDH6uYODgUFg"
            },
            {
                "crv": "P-256",
                "kid": "33806473",
                "kty": "EC",
                "x": "_027ZsIM3qF4meq-NKkcMjfEFXrP_m9Rf4hvRJUFk24",
                "y": "4onurxZAIxqOc4wGSx18Hb8_VM4tepVWoylwwLcYqOY"
            },
            {
                "crv": "P-256",
                "kid": "46076726",
                "kty": "EC",
                "x": "Td_a_OxHKaG9GN90mDN_ztmBoGRgxm37UAXEkv6ONeE",
                "y": "CMLiG2fcHL-uM-VCvg54nflMw3IVtFOUWKIstMcUcEc"
            }
        ],
        "security_status": "enabled",
        "sso_realm_uri": "com.leapsight.sso",
        "uri": "com.leapsight.test_1"
    },
    {
        "allow_connections": true,
        "authmethods": [
            "cryptosign",
            "wampcra",
            "ticket"
        ],
        "description": "A test realm",
        "is_prototype": false,
        "is_sso_realm": false,
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
                "kid": "122308677",
                "kty": "EC",
                "x": "X1Re0aJaKBYBKavtHHzjVoOcMuB1Il3L--oVBCIVse8",
                "y": "QEJEd36cyMYoh2mZvX6y1TQ1gYf0l89HIj8OZpj9gyE"
            },
            {
                "crv": "P-256",
                "kid": "134200500",
                "kty": "EC",
                "x": "Da6LJMUF91CXBcFbrbQONoviFaobF20o_XVj092LKMY",
                "y": "OyIY99J789NHKfYlhlzK4X5Iux18Ghs5YaJ04vxUwXE"
            },
            {
                "crv": "P-256",
                "kid": "98270293",
                "kty": "EC",
                "x": "ElQOShI0xqJbAT5KJ1MgCMzzr7IlrP9DZFiv5uoQgqQ",
                "y": "MK0COTzwvH9da4aKtAFkoWmvh7fgAUqW_8EXKj5-vCo"
            }
        ],
        "security_status": "enabled",
        "sso_realm_uri": "com.leapsight.sso",
        "uri": "com.leapsight.test_2"
    },
    {
        "allow_connections": false,
        "authmethods": [
            "cryptosign",
            "wampcra"
        ],
        "description": "A test realm",
        "is_prototype": false,
        "is_sso_realm": true,
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
                "kid": "29257788",
                "kty": "EC",
                "x": "XH0ww1p6w-rEruIA82mkZOCD_zMDJIBfHVrU7AfV_m4",
                "y": "140OhdeBqptXAt1TpTDubrVpkAt3z8Xe5Ca8rmQ_pUw"
            },
            {
                "crv": "P-256",
                "kid": "30467900",
                "kty": "EC",
                "x": "JT3ftrZmD3VyrvxsaRmgcsmaTKE-nrJ0zp5xCh0pnS8",
                "y": "GVr32Te7dAGhKz-JHajksBio4DGfnBXgCRMvZqsQBGI"
            },
            {
                "crv": "P-256",
                "kid": "91434376",
                "kty": "EC",
                "x": "z1MBM-Kmv9m_MfpdJgTR-5SQRe1NCXFX7gBhuvse1_Y",
                "y": "mMZ1AewL2hSGbUtcm2Z06U2_XymNT6D89SP5mvgIyT0"
            }
        ],
        "security_status": "enabled",
        "uri": "com.leapsight.sso"
    },
    {
        "description": "A test realm",
        "is_prototype": false,
        "is_sso_realm": false,
        "password_opts": {
            "params": {
                "iterations": 10000,
                "kdf": "pbkdf2"
            },
            "protocol": "cra"
        },
        "prototype_uri": "com.leapsight.test.proto",
        "public_keys": [
            {
                "crv": "P-256",
                "kid": "109453414",
                "kty": "EC",
                "x": "fPuKjLMb2hyMN_AWX6qAbGbhBSguDICAq-UMBHyVDDE",
                "y": "F2Oi9S_loNMWOWlnMn_LeQvAPI3AUXIPpn-VTt8YNck"
            },
            {
                "crv": "P-256",
                "kid": "70190073",
                "kty": "EC",
                "x": "ZbsvGGWnxq9grIDgEv35K44OtezAvCabRiRNYd1nRU4",
                "y": "aLFBQyLPtGY5jNrOWu2tfDf_YK92KpsEtEKKzIFGZho"
            },
            {
                "crv": "P-256",
                "kid": "71347183",
                "kty": "EC",
                "x": "NcEOakYR-t9U3z5t4Ws3no3nk2YdhszaN-XpSgbgi3E",
                "y": "GhbiXvLZPC8XOUWA-Zo0TKFpXr1Se8dNzrwWNloi1kQ"
            }
        ],
        "security_status": "enabled",
        "uri": "com.leapsight.test.inheritance"
    },
    {
        "authmethods": [
            "cryptosign",
            "wampcra",
            "anonymous",
            "oauth2",
            "password",
            "trust",
            "ticket"
        ],
        "description": "A test realm",
        "is_prototype": false,
        "is_sso_realm": false,
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
                "kid": "28821883",
                "kty": "EC",
                "x": "35dxB-NVWz4bXcC_XeV-ikfL6Vn3FgsAn6MZDwClOB8",
                "y": "A99cPIU6x1Rxw4IyfcSyu6GxQ4KzQHaStdWP7QKUIVU"
            },
            {
                "crv": "P-256",
                "kid": "5640599",
                "kty": "EC",
                "x": "AEjB2EC5kchCFuylw7Qcna4ERPGzkogcoInYLEQI1Co",
                "y": "5GoNsIhylGs4sogoLP7DOKrdU4OO2p-dwWDz3wVCYSA"
            },
            {
                "crv": "P-256",
                "kid": "81638418",
                "kty": "EC",
                "x": "jHJMWbqcWPemB7X-a1eZ1ctcoTAxdJqffp1Yil_Pbqc",
                "y": "u5mQGe24nprq1rzVvXOMeqk7h7-43AYsMgWIaNxQZTM"
            }
        ],
        "security_status": "enabled",
        "uri": "com.leapsight.test"
    },
    {
        "allow_connections": true,
        "authmethods": [
            "cryptosign",
            "wampcra",
            "ticket"
        ],
        "description": "A test prototype realm",
        "is_prototype": true,
        "is_sso_realm": false,
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
                "kid": "106052618",
                "kty": "EC",
                "x": "5sP3cIu6I3ZfGB7IfmifEByZ89sLk9d1RK712C_xwek",
                "y": "crYZ5LqCJoHDicylRFQn6kG77L1IgelDysAk1nIceVM"
            },
            {
                "crv": "P-256",
                "kid": "4239631",
                "kty": "EC",
                "x": "_3BNiNCrxNqg4NBhRMIkci0zCBD7fB54y-l_VZ3GT3E",
                "y": "B51Yq27FP7ttwFctWpeG6OK8GIMV6MRSBFDi00EZbhg"
            },
            {
                "crv": "P-256",
                "kid": "74648249",
                "kty": "EC",
                "x": "2Aj7LNfDi1lnc1Xqm5v1X0Lo6PDGbJXjaGnfUI-qZl4",
                "y": "RqNo7Ye0Kdb3y4d08k_aumM5WhD0fkknJL2zn_9AUrI"
            }
        ],
        "security_status": "enabled",
        "sso_realm_uri": "com.leapsight.sso",
        "uri": "com.leapsight.test.proto"
    }
]
```
:::


### bondy.realm.delete(uri(); force=boolean()) {.wamp-procedure}
Deletes the realm and all its associated objects.

This call fails with an error if the realm has associated users. To override this behaviour use the `force` option.
::: warning ADMIN AUTHORIZATION
This call is only available when the session is attached to the Master Realm
:::

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to delete.'
		}
	})"
/>

##### Keyword Args

<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'force':{
			'type': 'boolean',
			'required': false,
			'default': false,
			'description' : 'Force the deletion of the realm, even if the realm still has associated users.'
		}
	})"
/>

#### Result

##### Positional Results
None.

##### Keyword Results
None.

### Retrieve if a realm security is enabled
### bondy.realm.security.is_enabled(uri) {.wamp-procedure}
Returns `true` if security is enabled for the realm identified with `uri`. Otherwise returns `false`.
Realm security is `enabled` by default.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to retrieve if the security is enabled or not.'
		}
	})"
/>

##### Keyword Args
None.

#### Result

##### Positional Results
The call result is a single positional argument containing `true` or `false`

##### Keyword Results
None.

#### Errors

* [bondy.error.not_found](/reference/wamp_api/errors/not_found): when the provided uri is not found.

#### Examples

::: details Success Call
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.realm.security.is_enabled "com.leapsight.test_creation_1"
```
- Response:
```json
true
```
:::

### Enable realm security
### bondy.realm.security.enable(uri) {.wamp-procedure}
Enables the security for the realm identified with `uri`.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to enable the security.'
		}
	})"
/>

##### Keyword Args
None.

#### Result

##### Positional Results
None.

##### Keyword Results
None.

#### Errors

* [bondy.error.not_found](/reference/wamp_api/errors/not_found): when the provided uri is not found.

#### Examples

::: details Success Call
- Request
```bash
/wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.realm.security.enable "com.leapsight.test_creation_1"
```
:::

### Disable realm security
### bondy.realm.security.disable(uri) {.wamp-procedure}
Disables security for the realm identified with `uri`.

::: danger Danger
Disabling security removes the various authentication and authorization checks that take place when establishing a session, performing operations against a Bondy Realm and/or routing messages.
We recommend using this option only during development.
:::

Users, groups, and other security resources remain available for configuration while security is disabled. The changes will be made effective when security is re-enabled.

Realm security is enabled by default.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to disable the security.'
		}
	})"
/>

##### Keyword Args
None.

#### Result

##### Positional Results
None.

##### Keyword Results
None.

#### Errors

* [bondy.error.not_found](/reference/wamp_api/errors/not_found): when the provided uri is not found.

#### Examples

::: details Success Call
- Request
```bash
/wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.realm.security.disable "com.leapsight.test_creation_1"
```
:::

### Retrieve a realm security status
### bondy.realm.security.status(uri) {.wamp-procedure}
Returns the security status (`enabled` or `disabled`) for the realm identified by `uri`.
Realm security is `enabled` by default.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to retrieve if the security status.'
		}
	})"
/>

##### Keyword Args
None.

#### Result

##### Positional Results
The call result is a single positional argument containing the string `enabled` or `disabled`.

##### Keyword Results
None.

#### Errors

* [bondy.error.not_found](/reference/wamp_api/errors/not_found): when the provided uri is not found.

#### Examples

::: details Success Call
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.realm.security.status "com.leapsight.test_creation_1"
```
- Response:
```json
"enabled"
```
:::

## Topics

### bondy.realm.created{.wamp-topic}
### bondy.realm.updated{.wamp-topic}
### bondy.realm.deleted{.wamp-topic}

<script>
const realmUri = {
    "uri": {
		"type": "string",
		"required": true,
		"mutable": false,
		"description": "The realm identifier"
	}
};
const realmData = {
	"description": {
		"type": "string",
		"required": true,
		"mutable": true,
		"description": "A textual description of the realm.",
        "default": ""
	},
	"is_prototype": {
		"type": "boolean",
		"required": true,
		"mutable": true,
		"description": "If true this realm is a realm used as a prototype. Prototype realms cannot be used by themselves. Once a realm has been designated as a prototype it cannot be changed.",
		"default": "false"
	},
	"prototype_uri": {
		"type": "string",
		"required": false,
		"mutable": false,
		"description": "If present, this it the URI of the the realm prototype this realm inherits some of its behaviour and features from."
	},
	"is_sso_realm": {
		"type": "boolean",
		"required": true,
		"mutable": true,
		"description": "If true this realm is an SSO Realm. Once a realm has been designated as an SSO realm it cannot be changed.",
		"default": "false"
	},
	"sso_realm_uri": {
		"type": "string",
		"required": false,
		"mutable": false,
		"description": "If present, this it the URI of the SSO Realm this realm is connected to. Once a realm has been associated with an SSO realm it cannot be changed.",
		"default": "The realm's prototype value if the realm inherits from a prototype (see prototype_uri), otherwise undefined."
	},
	"allow_connections": {
		"type": "boolean",
		"required": true,
		"mutable": true,
		"description": "If true this realm is allowing connections from clients. It is normally set to false when the realm is an SSO Realm. Prototype realms never allow connections.",
		"default": "undefined"
	},
	"authmethods": {
		"type": "array",
		"required": true,
		"mutable": true,
		"description": "The list of the authentication methods allowed by this realm.",
		"default": "['anonymous', 'trust', 'password', 'ticket', 'oauth2', 'wampcra', 'cryptosign']",
		"items" : {
			"type": "string"
		}
	},
    "security_enabled" : {
		"type": "boolean",
		"required": false,
		"mutable": true,
		"description": "Wether security is enabled or not.",
        "default": "undefined"
	},
    "users" :  {
		"type": "array",
		"required": false,
		"mutable": true,
		"description": "A list of user objects.",
		"items": {
			"type": "User"
		}
	},
	"groups" :  {
		"type": "array",
		"required": false,
		"mutable": true,
		"description": "A list of group objects.",
		"items": {
			"type": "Group"
		}
	},
	"sources" :  {
		"type": "array",
		"required": false,
		"mutable": true,
		"description": "A list of source objects.",
		"items": {
			"type": "Source"
		}
	},
	"grants" :  {
		"type": "array",
		"required": false,
		"mutable": true,
		"description": "A list of grant objects.",
		"items": {
			"type": "Grant"
		}
	},
    "private_keys" :  {
		"type": "array",
		"required": false,
		"mutable": true,
		"description": "A list of private keys used for signing.",
		"items": {
			"type": "PrivateKey"
		}
	},
	"encryption_keys" :  {
		"type": "array",
		"required": false,
		"mutable": true,
		"description": "A list of private keys used for encryption.",
		"items": {
			"type": "PrivateKey"
		}
	}
};

const inputCreateData = {...realmUri, ...realmData};
const inputUpdateData = {...realmData};

const realm = {...realmUri, ...realmData,
    "security_status" :  {
		"type": "string",
		"required": false,
		"mutable": true,
		"description": "The string 'enabled' if enabled is true. Otherwise the string is 'disabled'."
	}
};

export default {
	data() {
        return {
			inputCreateData: JSON.stringify(inputCreateData),
            realm: JSON.stringify(realm),
			createArgs: JSON.stringify({
				0: {
					"type": "object",
					"description": "The realm configuration data",
					"mutable": true,
					"properties" : inputCreateData
				}
			}),
			createResult: JSON.stringify({
				0: {
					"type": "object",
					"description": "The created realm.",
					"mutable": true,
					"properties" : realm
				}
			}),
            inputUpdateData: JSON.stringify(inputUpdateData),
            updateArgs: JSON.stringify({
                0: {
                    "type": "string",
                    "required": true,
                    "description" : "The URI of the realm you want to update."
                },
				1: {
					"type": "object",
					"description": "The realm configuration data",
					"mutable": true,
					"properties" : inputUpdateData
				}
			}),
			updateResult: JSON.stringify({
				0: {
					"type": "object",
					"description": "The updated realm.",
					"mutable": true,
					"properties" : realm
				}
			}),
			listResult: JSON.stringify({
				0: {
					"type": "array",
					"description": "The realms you want to retrieve.",
					"items" : {
						"type": "object",
						"description": "The realm.",
						"properties": realm
					}
				}
			})
		}
	}
};
</script>