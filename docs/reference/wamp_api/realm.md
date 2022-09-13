# Realm


<!--@include: ../parts/realm.md-->

## Procedures

|Name|URI|
|:---|:---|
|[Create a realm](#create-a-realm)|`bondy.realm.create`|
|[Retrieve a realm](#retrieve-a-realm)|`bondy.realm.get`|
|[Update a realm](#update-a-realm)|`bondy.realm.update`|
|[List all realms](#list-all-realms)|`bondy.realm.list`|
|[Delete a realm](#delete-a-realm)|`bondy.realm.delete`|
|[Retrieve if a realm security is enabled](#retrieve-if-a-realm-security-is-enabled)|`bondy.realm.security.is_enabled`|
|[Enable realm security](#enable-realm-security)|`bondy.realm.security.enable`|
|[Disable realm security](#disable-realm-security)|`bondy.realm.security.disable`|
|[Retrieve a realm security status](#retrieve-a-realm-security-status)|`bondy.realm.security.status`|

### Create a realm
### bondy.realm.create(input_data) -> result(realm){.wamp-procedure}
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

::: details Success Call
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
### bondy.realm.get(uri) -> result(realm){.wamp-procedure}
Retrieves the requested realm uri.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'uri',
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

::: details Success Call
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
### bondy.realm.update(uri, input_data) -> <br>result(realm) {.wamp-procedure}
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

::: details Success Call
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.realm.update \
"com.leapsight.test_creation_1" \
'{
    "description": "A test updating realm",
    "allow_connections": true,
    "authmethods": ["cryptosign","wampcra","ticket"],
    "grants": [
        {
            "permissions" : [
                "wamp.subscribe",
                "wamp.unsubscribe",
                "wamp.call",
                "wamp.cancel",
                "wamp.publish"
            ],
            "uri" : "",
            "match" : "prefix",
            "roles" : "all"
        }
    ]
}' | jq
```
- Response:
```json
{
  "allow_connections": true,
  "authmethods": [
    "cryptosign",
    "wampcra",
    "ticket"
  ],
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
      "kid": "35794812",
      "kty": "EC",
      "x": "Q4ONdVUBv-C-XEaTGbAN7A0pDsLqtYWkbQcJeSVtz60",
      "y": "cQAI_QemFKuW_4bsJc0kVfhOdDo1yxQVnIkTDuK2sPA"
    },
    {
      "crv": "P-256",
      "kid": "67154376",
      "kty": "EC",
      "x": "kvvohf8yBoPvY8LzWG3mBaa4y3pjMoMamuO81RRix5E",
      "y": "cUBFbCyFfU60-BuQx8eaG9VfbZYrj-4Ip9zbvRJtQ0E"
    },
    {
      "crv": "P-256",
      "kid": "67318382",
      "kty": "EC",
      "x": "GLwRYxvqT18LXKoIXGOYRKHM-CJzycno2OKn1-0pBZM",
      "y": "_GBlnw0VneuhLOkw7hWVB2dNfnpHL53m6pgBThVB_b0"
    }
  ],
  "security_status": "enabled",
  "uri": "com.leapsight.test_creation_1"
}
```
:::

### List all realms
### bondy.realm.list() -> result([realm]) {.wamp-procedure}
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

### Delete a realm
### bondy.realm.delete(uri; force=boolean -> result() {.wamp-procedure}
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
			'type': 'uri',
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

#### Errors

* [bondy.error.not_found](/reference/wamp_api/errors/not_found): when the provided uri is not found.
* [bondy.error.active_users](/reference/wamp_api/errors/active_users): when there are associated users and the `force` option is false.

#### Examples

::: details Success Call
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.realm.delete "com.leapsight.test_creation_1"
```
:::
::: details Success Call with force option
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.realm.delete "com.leapsight.test_creation_1" --kwarg force=true
```
:::

### Retrieve if a realm security is enabled
### bondy.realm.security.is_enabled(uri) -> results(boolean) {.wamp-procedure}
Returns `true` if security is enabled for the realm identified with `uri`. Otherwise returns `false`.
Realm security is `enabled` by default.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'uri',
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
### bondy.realm.security.enable(uri) -> result() {.wamp-procedure}
Enables the security for the realm identified with `uri`.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'uri',
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
### bondy.realm.security.disable(uri) -> result() {.wamp-procedure}
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
			'type': 'uri',
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
### bondy.realm.security.status(uri) -> 'enabled' | 'disabled' {.wamp-procedure}
Returns the security status (`enabled` or `disabled`) for the realm identified by `uri`.
Realm security is `enabled` by default.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'uri',
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
##### Positional Results
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'uri',
			'description' : 'The URI of the realm you have created.'
		}
	})"
/>

##### Keyword Results
None.

### bondy.realm.updated{.wamp-topic}
##### Positional Results
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'uri',
			'description' : 'The URI of the realm you have updated.'
		}
	})"
/>

##### Keyword Results
None.

### bondy.realm.deleted{.wamp-topic}
##### Positional Results
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'uri',
			'description' : 'The URI of the realm you have deleted.'
		}
	})"
/>

##### Keyword Results
None.
