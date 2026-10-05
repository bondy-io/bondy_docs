---
outline: [2,3]
---
# User
A user is an identity that is able to authenticate into a Bondy Realm.

## Description
A User is a person or software agent who wants to access a Realm. It can be authenticated and authorized; permissions (authorization) may be granted directly or via [Group](/router/reference/wamp_api/group) membership.

Users have attributes associated with themselves like `username` or `aliases`, credentials (`password` or `authorized keys`) and `metadata` determined by the client applications.

When you create a user, you then have to grant it permissions by making it a member of a user [Group](/router/reference/wamp_api/group) that has appropriate permission attached (recommended), or by directly attaching permissions to the user. You also have to define one or more [Sources](/router/reference/wamp_api/source) which define the required authentication methods contextual to the user network location.

::: warning Reserved Names
The following names are reserved and Bondy will not allow them to be used as a value for the user's username property: `all`, `anonymous`, `any`, `from`, `on`, `to`.
:::

<ZoomImg src="/assets/rbac.png"/>

### Aliasing
Provides the ability for a user to authenticate using different usernames (authid).
A user can have a maximum of 5 aliases.

## Types
### input_data(){.datatype}
The object used to create or update a user.

The object represents an overview of all the user properties; the available properties are detailed for each particular operation.

<DataTreeView :data="inputCreateData" :maxDepth="10" />

### user(){.datatype}
The representation of the user returned by the read or write operations e.g. `get`, `list`, `add` or `update`.

<DataTreeView :data="user" :maxDepth="10" />

## Procedures

|Name|URI|
|:---|:---|
|[Add a user to a realm](#add-a-user-to-a-realm)|`bondy.user.add`|
|[Update a user in a realm](#update-a-user-in-a-realm)|`bondy.user.update`|
|[Delete a user from a realm](#delete-a-user-from-a-realm)|`bondy.user.delete`|
|[Enable a user in a realm](#enable-a-user-in-a-realm)|`bondy.user.enable`|
|[Disable a user in a realm](#disable-a-user-in-a-realm)|`bondy.user.disable`|
|[Check if a user is enabled](#check-if-a-user-is-enabled)|`bondy.user.is_enabled`|
|[Retrieve a user from a realm](#retrieve-a-user-from-a-realm)|`bondy.user.get`|
|[List all users from a realm](#list-all-users-from-a-realm)|`bondy.user.list`|
|[Change the user password](#change-the-user-password)|`bondy.user.change_password`|
|[Add an alias to a user](#add-an-alias-to-a-user)|`bondy.user.add_alias`|
|[Remove an alias from a user](#remove-an-alias-from-a-user)|`bondy.user.remove_alias`|
|[Add a group to a user](#add-a-group-to-a-user)|`bondy.user.add_group`|
|[Add groups to a user](#add-groups-to-a-user)|`bondy.user.add_groups`|
|[Remove a group from a user](#remove-a-group-from-a-user)|`bondy.user.remove_group`|
|[Remove groups from a user](#remove-groups-from-a-user)|`bondy.user.remove_groups`|

## Creating, updating, and deleting

### Add a user to a realm
#### bondy.user.add(realm_uri(), input_data()) -> user() {.wamp-procedure}
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

* [bondy.error.already_exists](/router/reference/wamp_api/errors/already_exists): when the provided username already exists.
* [bondy.error.missing_required_value](/router/reference/wamp_api/errors/missing_required_value): when a required value is not provided
* [bondy.error.invalid_datatype](/router/reference/wamp_api/errors/invalid_datatype): when the data type is invalid
* [bondy.error.invalid_value](/router/reference/wamp_api/errors/invalid_value): when the data value is invalid
* [bondy.error.invalid_data](/router/reference/wamp_api/errors/invalid_data): when the data values are invalid
* [bondy.error.no_such_groups](/router/reference/wamp_api/errors/no_such_groups): when any of the provided group name doesn't exist.
* [bondy.error.not_found](/router/reference/wamp_api/errors/not_found): when the provided realm uri is not found.
* [wamp.error.invalid_argument](/router/reference/wamp_api/errors/wamp_invalid_argument): for example when the provided `sso_realm_uri` property value doesn't exist.

#### Examples

::: code-group
```bash [Call]
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
call bondy.user.add \
"com.leapsight.test_creation_1" '{"username":"user_1"}' | jq
```

```json [Result]
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

::: code-group
```bash [Call w/Groups]
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
call bondy.user.add \
"com.leapsight.test_creation_1" '{"username":"user_3", "groups":["group_1"], "password":"my_password"}' | jq
```

```json [Result]
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

### Update a user in a realm
#### bondy.user.update(realm_uri(), username(), input_data()) -> user() {.wamp-procedure}
Updates an existing user.

Publishes an event under topic [bondy.user.updated](#bondy-user-updated){.uri} after the user has been updated.
Optionally, publishes an event under topic [bondy.user.credentials_changed](#bondy-user-credentials-changed){.uri} if the user's authorized_keys have been changed.

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

* [bondy.error.missing_required_value](/router/reference/wamp_api/errors/missing_required_value): when a required value is not provided
* [bondy.error.invalid_datatype](/router/reference/wamp_api/errors/invalid_datatype): when the data type is invalid
* [bondy.error.invalid_value](/router/reference/wamp_api/errors/invalid_value): when the data value is invalid
* [bondy.error.invalid_data](/router/reference/wamp_api/errors/invalid_data): when the data values are invalid
* [bondy.error.no_such_groups](/router/reference/wamp_api/errors/no_such_groups): when any of the provided group name doesn't exist.
* [bondy.error.not_found](/router/reference/wamp_api/errors/not_found): when the provided realm uri or username is not found.
* [wamp.error.invalid_argument](/router/reference/wamp_api/errors/wamp_invalid_argument): for example when the provided `sso_realm_uri` property value doesn't exist.

#### Examples

::: code-group
```bash [Call]
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
call bondy.user.update \
"com.leapsight.test_creation_1" "user_3" \
'{
	"groups":["group_1","group_2"],
	"enabled":true,
	"authorized_keys":["1766c9e6ec7d7b354fd7a2e4542753a23cae0b901228305621e5b8713299ccdd"]
}' | jq
```

```json [Result]
{
  "aliases": [
    "user3_alias5",
    "user3_alias4",
    "user3_alias3",
    "user3_alias2",
    "user3_alias1"
  ],
  "authorized_keys": [
    "1766C9E6EC7D7B354FD7A2E4542753A23CAE0B901228305621E5B8713299CCDD"
  ],
  "enabled": true,
  "groups": [
    "group_1",
    "group_2"
  ],
  "has_authorized_keys": true,
  "has_password": true,
  "meta": {},
  "sso_realm_uri": null,
  "type": "user",
  "username": "user_3",
  "version": "1.1"
}
```
:::
::: details Success Call checking if the new keys were changed
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.test_creation_1 \
--authmethod=cryptosign --authid="user_3" --private-key="4ffddd896a530ce5ee8c86b83b0d31835490a97a9cd718cb2f09c9fd31c4a7d7" \
call bondy.user.get "com.leapsight.test_creation_1" "user_3" | jq
```
- Response
```json
{
  "aliases": [
    "user3_alias5",
    "user3_alias4",
    "user3_alias3",
    "user3_alias2",
    "user3_alias1"
  ],
  "authorized_keys": [
    "1766C9E6EC7D7B354FD7A2E4542753A23CAE0B901228305621E5B8713299CCDD"
  ],
  "enabled": true,
  "groups": [
    "group_1",
    "group_2"
  ],
  "has_authorized_keys": true,
  "has_password": true,
  "meta": {},
  "sso_realm_uri": null,
  "type": "user",
  "username": "user_3",
  "version": "1.1"
}
```
:::

### Delete a user from a realm
#### bondy.user.delete(realm_uri(), username()) {.wamp-procedure}
Deletes the requested username from the provided realm uri.

Publishes an event under topic [bondy.user.deleted](#bondy-user-deleted){.uri} after the user has been deleted.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to delete the user.'
		},
		'1':{
			'type': 'string',
			'required': true,
			'description' : 'The username of the user you want to delete.'
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

* [wamp.error.no_such_principal](/router/reference/wamp_api/errors/wamp_no_such_principal): when the provided username does not exist.

#### Examples

::: code-group
```bash [Call]
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
call bondy.user.delete "com.leapsight.test_creation_1" "user_1"
```
:::

## Enabling and disabling

### Enable a user in a realm
#### bondy.user.enable(realm_uri(), username()) {.wamp-procedure}
Enables the requested username on the provided realm uri.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to enable the user.'
		},
		'1':{
			'type': 'string',
			'required': true,
			'description' : 'The username of the user you want to enable.'
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

#### Examples

::: code-group
```bash [Call]
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
call bondy.user.enable "com.leapsight.test_creation_1" "user_1"
```
:::

### Disable a user in a realm
#### bondy.user.disable(realm_uri(), username()) {.wamp-procedure}
Disables the requested username on the provided realm uri.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to disable the user.'
		},
		'1':{
			'type': 'string',
			'required': true,
			'description' : 'The username of the user you want to disable.'
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

#### Examples

::: code-group
```bash [Call]
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
call bondy.user.disable "com.leapsight.test_creation_1" "user_1"
```
:::

### Check if a user is enabled
#### bondy.user.is_enabled(realm_uri(), username()) -> boolean() {.wamp-procedure}
Checks if the requested username on the provided realm uri is enabled.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to check the user.'
		},
		'1':{
			'type': 'string',
			'required': true,
			'description' : 'The username of the user you want to check if is enabled.'
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

* [wamp.error.invalid_argument](/router/reference/wamp_api/errors/wamp_invalid_argument): when there is an invalid number of positional arguments.
* [wamp.error.no_such_principal](/router/reference/wamp_api/errors/wamp_no_such_principal): when the provided username does not exist.

#### Examples

::: code-group
```bash [Call]
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
call bondy.user.is_enabled "com.leapsight.test_creation_1" "user_1"
```

```json [Result]
true
```
:::

## Querying

### Retrieve a user from a realm
#### bondy.user.get(realm_uri(), username()) -> user() {.wamp-procedure}
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

* [bondy.error.not_found](/router/reference/wamp_api/errors/not_found): when the provided username is not found.

#### Examples

::: code-group
```bash [Call]
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
call bondy.user.get "com.leapsight.test_creation_1" "user_1" | jq
```

```json [Result]
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
#### bondy.user.list(realm_uri()) -> [user()] {.wamp-procedure}
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
An empty list is returned when the provided realm uri doesn't exist.

<DataTreeView :data="listResult" :maxDepth="10" />

##### Keyword Results
None.

#### Errors
None.

#### Examples

::: code-group
```bash [Call]
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
call bondy.user.list \
"com.leapsight.test_creation_1" | jq
```

```json [Result]
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

## Managing the password

### Change the user password
#### bondy.user.change_password(realm_uri(), username(), new_password(), old_password()) {.wamp-procedure}
Changes the password of an existing user.

Publishes an event under topic [bondy.user.credentials_changed](#bondy-user-credentials-changed){.uri} after the user's password has been changed.

#### Call

##### Positional Args
The operation supports 3 or 4 positional arguments.

<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to to modify the user password.'
		},
		'1':{
			'type': 'string',
			'required': true,
			'description' : 'The username of the user you want to update the password.'
		},
		'2':{
			'type': 'string',
			'required': true,
			'description' : 'The new password.'
		},
		'3':{
			'type': 'string',
			'required': false,
			'description' : 'The old password.'
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

* [bondy.error.bad_signature](/router/reference/wamp_api/errors/bad_signature): when the provided old password doesn't match.
* [wamp.error.invalid_argument](/router/reference/wamp_api/errors/wamp_invalid_argument): when there is an invalid number of positional arguments.
* [bondy.error.not_found](/router/reference/wamp_api/errors/not_found): when the provided username does not exist.

#### Examples

::: code-group
```bash [Call]
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
call bondy.user.change_password \
"com.leapsight.test_creation_1" "user_3" "my_new_password"
```

```bash [Checking if the new password was changed]
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.test_creation_1 \
--authmethod=wampcra --authid="user_3" --secret="my_new_password" \
call bondy.user.get "com.leapsight.test_creation_1" "user_3" | jq
```

```json [Result]
{
  "aliases": [
    "user3_alias5",
    "user3_alias4",
    "user3_alias3",
    "user3_alias2",
    "user3_alias1"
  ],
  "authorized_keys": [
    "1766C9E6EC7D7B354FD7A2E4542753A23CAE0B901228305621E5B8713299CCDD"
  ],
  "enabled": true,
  "groups": [
    "group_1",
    "group_2"
  ],
  "has_authorized_keys": true,
  "has_password": true,
  "meta": {},
  "sso_realm_uri": null,
  "type": "user",
  "username": "user_3",
  "version": "1.1"
}
```
:::

::: code-group
```bash [Call w/old password]
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
call bondy.user.change_password \
"com.leapsight.test_creation_1" "user_3" "my_password" "my_new_password"
```
:::

## Managing aliases

### Add an alias to a user
#### bondy.user.add_alias(realm_uri(), username(), alias()) {.wamp-procedure}
Adds an alias to an existing user.

If the user is an SSO user, the alias is added on the SSO Realm only.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to modify the user.'
		},
		'1':{
			'type': 'string',
			'required': true,
			'description' : 'The username of the user you want to add an alias.'
		},
		'2':{
			'type': 'string',
			'required': true,
			'description' : 'The alias to add.'
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

* [wamp.error.invalid_argument](/router/reference/wamp_api/errors/wamp_invalid_argument): when there is an invalid number of positional arguments.
* [wamp.error.no_such_principal](/router/reference/wamp_api/errors/wamp_no_such_principal): when the provided username does not exist.
* [bondy.error.property_range_limit](/router/reference/wamp_api/errors/property_range_limit): when the value for property 'alias' already contains the maximum number of values allowed (5).

#### Examples

::: code-group
```bash [Call]
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
call bondy.user.add_alias \
"com.leapsight.test_creation_1" "user_3" "user3_alias1"
```

```bash [Checking the updated user]
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
call bondy.user.get "com.leapsight.test_creation_1" "user_3" | jq
```

```json [Result]
{
  "aliases": [
    "user3_alias1"
  ],
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

::: code-group

```bash [Checking if the authentication succeed with the alias]
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.test_creation_1 \
--authmethod=wampcra --authid="user3_alias1" --secret="my_password" \
call bondy.user.get "com.leapsight.test_creation_1" "user_3" | jq
```

```json [Result]
{
  "aliases": [
    "user3_alias1"
  ],
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

### Remove an alias from a user
#### bondy.user.remove_alias(realm_uri(), username(), alias()) {.wamp-procedure}
Removes an existing alias from an existing user.

If the user is an SSO user, the alias is removed from the SSO Realm only.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to modify the user.'
		},
		'1':{
			'type': 'string',
			'required': true,
			'description' : 'The username of the user you want to remove an alias.'
		},
		'2':{
			'type': 'string',
			'required': true,
			'description' : 'The alias to remove.'
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

* [wamp.error.invalid_argument](/router/reference/wamp_api/errors/wamp_invalid_argument): when there is an invalid number of positional arguments.
* [wamp.error.no_such_principal](/router/reference/wamp_api/errors/wamp_no_such_principal): when the provided username does not exist.
* [bondy.error.property_range_limit](/router/reference/wamp_api/errors/property_range_limit): when the value for property 'alias' already contains the maximum number of values allowed (5).

#### Examples

::: code-group
```bash [Call]
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
call bondy.user.remove_alias \
"com.leapsight.test_creation_1" "user_3" "user3_alias1"
```

```bash [Checking the updated user]
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
call bondy.user.get "com.leapsight.test_creation_1" "user_3" | jq
```

```json [Result]
{
  "aliases": [
    "user3_alias5",
    "user3_alias4",
    "user3_alias3",
    "user3_alias2"
  ],
  "authorized_keys": [
    "1766C9E6EC7D7B354FD7A2E4542753A23CAE0B901228305621E5B8713299CCDD"
  ],
  "enabled": true,
  "groups": [
    "group_1",
    "group_2"
  ],
  "has_authorized_keys": true,
  "has_password": true,
  "meta": {},
  "sso_realm_uri": null,
  "type": "user",
  "username": "user_3",
  "version": "1.1"
}
```
:::

## Managing group membership

### Add a group to a user
#### bondy.user.add_group(realm_uri(), username(), group_name()) {.wamp-procedure}
Adds a group name to an existing user.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to modify the user.'
		},
		'1':{
			'type': 'string',
			'required': true,
			'description' : 'The username of the user you want to add a group name.'
		},
		'2':{
			'type': 'string',
			'required': true,
			'description' : 'The group name to add.'
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

* [wamp.error.invalid_argument](/router/reference/wamp_api/errors/wamp_invalid_argument): when there is an invalid number of positional arguments.
* [bondy.error.no_such_groups](/router/reference/wamp_api/errors/no_such_groups): when the provided group name doesn't exist.
* [wamp.error.no_such_principal](/router/reference/wamp_api/errors/wamp_no_such_principal): when the provided username does not exist.

#### Examples

::: code-group
```bash [Call]
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
call bondy.user.add_group \
"com.leapsight.test_creation_1" "user_3" "group_1"
```

```bash [Checking the updated user]
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
call bondy.user.get "com.leapsight.test_creation_1" "user_3" | jq
```

```json [Result]
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

### Add groups to a user
#### bondy.user.add_groups(realm_uri(), username(), [group_name()]) {.wamp-procedure}
Adds a list of group names to an existing user.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to modify the user.'
		},
		'1':{
			'type': 'string',
			'required': true,
			'description' : 'The username of the user you want to add a group names.'
		},
		'2':{
			'type': 'array',
			'required': true,
			'description' : 'The group names to add.',
			'items': {
				'type': 'string'
			}
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

* [wamp.error.invalid_argument](/router/reference/wamp_api/errors/wamp_invalid_argument): when there is an invalid number of positional arguments.
* [bondy.error.no_such_groups](/router/reference/wamp_api/errors/no_such_groups): when any of the provided group names doesn't exist.
* [wamp.error.no_such_principal](/router/reference/wamp_api/errors/wamp_no_such_principal): when the provided username does not exist.

#### Examples

::: code-group
```bash [Call]
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
call bondy.user.add_groups \
"com.leapsight.test_creation_1" "user_3" '["group_1","group_2"]'
```

```bash [Checking the updated user]
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
call bondy.user.get "com.leapsight.test_creation_1" "user_3" | jq
```

```json [Result]
{
  "authorized_keys": [],
  "enabled": true,
  "groups": [
    "group_1",
	"group_2"
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

### Remove a group from a user
#### bondy.user.remove_group(realm_uri(), username(), group_name()) {.wamp-procedure}
Removes an existing group name from an existing user.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to modify the user.'
		},
		'1':{
			'type': 'string',
			'required': true,
			'description' : 'The username of the user you want to remove a group name.'
		},
		'2':{
			'type': 'string',
			'required': true,
			'description' : 'The group name to remove.'
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

* [wamp.error.invalid_argument](/router/reference/wamp_api/errors/wamp_invalid_argument): when there is an invalid number of positional arguments.
* [wamp.error.no_such_principal](/router/reference/wamp_api/errors/wamp_no_such_principal): when the provided username does not exist.

#### Examples

::: code-group
```bash [Call]
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
call bondy.user.remove_group \
"com.leapsight.test_creation_1" "user_3" "group_1"
```

```bash [Checking the updated user]
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
call bondy.user.get "com.leapsight.test_creation_1" "user_3" | jq
```

```json [Result]
{
  "aliases": [
    "user3_alias5",
    "user3_alias4",
    "user3_alias3",
    "user3_alias2",
    "user3_alias1"
  ],
  "authorized_keys": [],
  "enabled": true,
  "groups": [
    "group_2"
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

### Remove groups from a user
#### bondy.user.remove_groups(realm_uri(), username(), [group_name()]) {.wamp-procedure}
Removes a list of group names from an existing user.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to modify the user.'
		},
		'1':{
			'type': 'string',
			'required': true,
			'description' : 'The username of the user you want to remove a group names.'
		},
		'2':{
			'type': 'array',
			'required': true,
			'description' : 'The group names to remove.',
			'items': {
				'type': 'string'
			}
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

* [wamp.error.invalid_argument](/router/reference/wamp_api/errors/wamp_invalid_argument): when there is an invalid number of positional arguments.
* [wamp.error.no_such_principal](/router/reference/wamp_api/errors/wamp_no_such_principal): when the provided username does not exist.

#### Examples

::: code-group
```bash [Call]
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
call bondy.user.remove_groups \
"com.leapsight.test_creation_1" "user_3" '["group_1","group_2"]'
```

```bash [Checking the updated user]
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
call bondy.user.get "com.leapsight.test_creation_1" "user_3" | jq
```

```json [Result]
{
  "aliases": [
    "user3_alias5",
    "user3_alias4",
    "user3_alias3",
    "user3_alias2",
    "user3_alias1"
  ],
  "authorized_keys": [],
  "enabled": true,
  "groups": [],
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

## Topics

#### bondy.user.added{.wamp-topic}
##### Positional Results
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'description' : 'The username of the user you have added.'
		}
	})"
/>

##### Keyword Results
None.

#### bondy.user.updated{.wamp-topic}
##### Positional Results
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'description' : 'The realm uri.'
		},
		'1':{
			'type': 'string',
			'description' : 'The username of the user you have updated.'
		}
	})"
/>

##### Keyword Results
None.

#### bondy.user.credentials_changed{.wamp-topic}
##### Positional Results
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'description' : 'The realm uri.'
		},
		'1':{
			'type': 'string',
			'description' : 'The username of the user you have changed its credentials.'
		}
	})"
/>

##### Keyword Results
None.

#### bondy.user.deleted{.wamp-topic}
##### Positional Results
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'description' : 'The realm uri.'
		},
		'1':{
			'type': 'string',
			'description' : 'The username of the user you have deleted.'
		}
	})"
/>

##### Keyword Results
None.

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
        "default": "`true`"
	},
    "meta": {
        "type": "map",
        "required": true,
		"mutable": true,
		"description": "User metadata.",
        "default": "`{}`"
    }
};

const inputCreateData = {...userData, ...authorizationData};
const inputUpdateData = {...userData,
	"authorized_keys": {
		"type": "array",
		"required": false,
		"mutable": true,
		"description": "The authorized keys.",
        "items": {
			"type": "string"
		}
}};

const user = {...userData,
	"aliases" :  {
		"type": "array",
		"required": false,
		"mutable": true,
		"description": "The list of aliases.",
		"items": {
			"type": "string",
			"description": "The alias"
		}
	},
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
				0:{ 
					"type": "string",
                    "required": true,
					"description": "The URI of the realm you want to modify a user."
				},
                1: {
                    "type": "string",
                    "required": true,
                    "description": "The username or uuid of the user you want to update."
                },
				2: {
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
