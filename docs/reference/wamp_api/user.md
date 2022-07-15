# User
> A user is a role that is able to log into a Bondy Realm.

## Description
Users are persons or software systems with authorized access to a Realm. They can be authenticated and authorized; permissions (authorization) may be granted directly or via Group  membership.

Users have attributes associated with themelves like usernames or alias, credentials (password or authorized keys) and metadata determined by the client applications.

There are some restrictions for the usernames due to reserved names like as `all`, `anonymous`, `any`, `from`, `on`, `to`.

### Aliasing

## Types
### input_data(){.datatype}
The object used to create or update a user.

The object represents as overview of the all user properties but the available properties are detailed in each particular operation.

<DataTreeView :data="inputCreateData" :maxDepth="10" />

### user(){.datatype}
The representation of the user returned by the read or write operations e.g. `get`, `list`, `add` or `update`.

<DataTreeView :data="user" :maxDepth="10" />

## Procedures

|Name|URI|
|:---|:---|
|[Add a user to a realm](#add-a-user-to-a-realm)|`bondy.user.add`|
||`bondy.user.add_alias`|
||`bondy.user.add_group`|
||`bondy.user.add_groups`|
||`bondy.user.change_password`|
||`bondy.user.delete`|
||`bondy.user.disable`|
||`bondy.user.enable`|
|[Retrieve a user from a realm](#retrieve-a-user-from-a-realm)|`bondy.user.get`|
||`bondy.user.is_enabled`|
|[List all users from a realm](#list-all-users-from-a-realm)|`bondy.user.list`|
||`bondy.user.remove_alias`|
||`bondy.user.remove_group`|
||`bondy.user.remove_groups`|
||`bondy.user.update`|

### Add a user to a realm
### bondy.user.add(realm_uri(), input_data()) -> user() {.wamp-procedure}
Creates a new user and add it on the provided realm uri.

Publishes an event under topic [bondy.user.added](#bondy-user-added){.uri} after the user has been created.

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

* [bondy.error.already_exists](/reference/wamp_api/errors/already_exists): when the provided username already exists.
* [bondy.error.missing_required_value](/reference/wamp_api/errors/missing_required_value): when a required value is not provided
* [bondy.error.invalid_datatype](/reference/wamp_api/errors/invalid_datatype): when the data type is invalid
* [bondy.error.invalid_value](/reference/wamp_api/errors/invalid_value): when the data value is invalid
* [bondy.error.invalid_data](/reference/wamp_api/errors/invalid_data): when the data values are invalid
* [bondy.error.no_such_groups](/reference/wamp_api/errors/no_such_groups): when any of the provided group name doesn't exist.
* [bondy.error.not_found](/reference/wamp_api/errors/not_found): when the provided realm uri is not found.
* [wamp.error.invalid_argument](/reference/wamp_api/errors/wamp_invalid_argument): for example when the provided `sso_realm_uri` property value doesn't exist.

#### Examples

::: details Success Call
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.user.add \
"com.leapsight.test_creation_1" '{"username":"user_1"}' | jq
```
- Response:
```json
{
  "authorized_keys": [],
  "enabled": true,
  "groups": [],
  "has_authorized_keys": false,
  "has_password": false,
  "meta": {},
  "sso_realm_uri": null,
  "type": "user",
  "username": "user_1",
  "version": "1.1"
}
```
:::
::: details Success Call with Groups
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.user.add \
"com.leapsight.test_creation_1" '{"username":"user_3", "groups":["group_1"], "password":"my_password"}' | jq
```
- Response:
```json
{
  "authorized_keys": [],
  "enabled": true,
  "groups": [
    "group_1"
  ],
  "has_authorized_keys": false,
  "has_password": true,
  "meta": {},
  "sso_realm_uri": null,
  "type": "user",
  "username": "user_3",
  "version": "1.1"
}
```
:::

### Retrieve a user from a realm
### bondy.user.get(realm_uri(), username()) -> user() {.wamp-procedure}
Retrieves the requested username on the provided realm uri.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to retrieve the user.'
		},
		'1':{
			'type': 'string',
			'required': true,
			'description' : 'The username of the user you want to retrieve.'
		}
	})"
/>

##### Keyword Args
None.

#### Result

##### Positional Results
The call result is a single positional argument containing a user:

<DataTreeView :data="user" :maxDepth="10" />

##### Keyword Results
None.

#### Errors

* [bondy.error.not_found](/reference/wamp_api/errors/not_found): when the provided username is not found.

#### Examples

::: details Success Call
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.user.get "com.leapsight.test_creation_1" "user_1" | jq
```
- Response
```json
{
  "authorized_keys": [],
  "enabled": true,
  "groups": [],
  "has_authorized_keys": false,
  "has_password": false,
  "meta": {},
  "sso_realm_uri": null,
  "type": "user",
  "username": "user_1",
  "version": "1.1"
}
```
:::

### List all users from a realm
### bondy.user.list(realm_uri()) -> [user()] {.wamp-procedure}
Lists all users of the provided realm uri.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to retrieve the users.'
		}
	})"
/>

##### Keyword Args
None.

#### Result

##### Positional Results
The call result is a single positional argument containing a list of users.
An empty list is returned when the provided realm uri doens't exist.

<DataTreeView :data="listResult" :maxDepth="10" />

##### Keyword Results
None.

#### Errors
None.

#### Examples

::: details Success Call
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.user.list \
"com.leapsight.test_creation_1" | jq
```
- Response:
```json
[
  {
    "authorized_keys": [],
    "enabled": true,
    "groups": [],
    "has_authorized_keys": false,
    "has_password": false,
    "meta": {},
    "sso_realm_uri": null,
    "type": "user",
    "username": "user_1",
    "version": "1.1"
  },
  {
    "authorized_keys": [],
    "enabled": true,
    "groups": [
      "group_1"
    ],
    "has_authorized_keys": false,
    "has_password": false,
    "meta": {},
    "sso_realm_uri": null,
    "type": "user",
    "username": "user_2",
    "version": "1.1"
  },
  {
    "authorized_keys": [],
    "enabled": true,
    "groups": [
      "group_1"
    ],
    "has_authorized_keys": false,
    "has_password": true,
    "meta": {},
    "sso_realm_uri": null,
    "type": "user",
    "username": "user_3",
    "version": "1.1"
  }
]
```
::: 

## Topics

### bondy.user.added{.wamp-topic}
### bondy.user.updated{.wamp-topic}
### bondy.user.credentials_changed{.wamp-topic}
### bondy.user.deleted{.wamp-topic}

<script>
const authorizationData = {
	"password": {
		"type": "string",
		"required": false,
		"mutable": true,
		"description": "The user password."
	},
	"authorized_keys": {
		"type": "array",
		"required": false,
		"mutable": true,
		"description": "The authorized keys.",
        "items": {
			"type": "string"
		}
	}
};

const userData = {
	"username": {
		"type": "string",
		"required": true,
		"mutable": false,
		"description": "The user identifier."
	},
	"groups" :  {
		"type": "array",
		"required": false,
		"mutable": true,
		"description": "A list of group names.",
		"items": {
			"type": "string"
		}
	},
	"sso_realm_uri": {
		"type": "string",
		"required": true,
		"mutable": false,
		"description": "If present, this it the URI of the SSO Realm where the user is auhenticated. Once a user has been associated with an SSO realm it cannot be changed.",
		"default": "undefined"
	},
    "enabled" : {
		"type": "boolean",
		"required": true,
		"mutable": true,
		"description": "If the user is enabled or not.",
        "default": true
	},
    "meta": {
        "type": "map",
        "required": true,
		"mutable": true,
		"description": "User metadata.",
        "default": {}
    }
};

const inputCreateData = {...userData, ...authorizationData};
const inputUpdateData = {...userData, ...authorizationData};

const user = {...userData,
	"authorized_keys": {
		"type": "array",
		"required": false,
		"mutable": true,
		"description": "The authorized keys.",
        "items": {
			"type": "string"
		}
	},
	"has_password" :  {
		"type": "boolean",
		"required": true,
		"mutable": true,
		"description": "If the user has a password."
	},
	"has_authorized_keys" :  {
		"type": "boolean",
		"required": true,
		"mutable": true,
		"description": "If the user has an authorized keys."
	}
};

export default {
	data() {
        return {
			inputCreateData: JSON.stringify(inputCreateData),
            user: JSON.stringify(user),
			createArgs: JSON.stringify({
				0:{ 
					"type": "string",
                    "required": true,
					"description": "The URI of the realm you want to add a user."
				},
				1: {
					"type": "object",
					"description": "The user configuration data",
					"mutable": true,
					"properties": inputCreateData
				}
			}),
			createResult: JSON.stringify({
				0: {
					"type": "object",
					"description": "The created user.",
					"mutable": true,
					"properties": user
				}
			}),
            inputUpdateData: JSON.stringify(inputUpdateData),
            updateArgs: JSON.stringify({
                0: {
                    "type": "string",
                    "required": true,
                    "description": "The username or uuid of the user you want to update."
                },
				1: {
					"type": "object",
					"description": "The user configuration data",
					"mutable": true,
					"properties": inputUpdateData
				}
			}),
			updateResult: JSON.stringify({
				0: {
					"type": "object",
					"description": "The updated user.",
					"mutable": true,
					"properties": user
				}
			}),
			listResult: JSON.stringify({
				0: {
					"type": "array",
					"description": "The users of the realm you want to retrieve.",
					"items" : {
						"type": "object",
						"description": "The user.",
						"properties": user
					}
				}
			})
		}
	}
};
</script>