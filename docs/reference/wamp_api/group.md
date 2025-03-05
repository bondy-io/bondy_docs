---
outline: [2,3]
---
# Group
Group is a named collection of user or group identifiers. It can have permissions assigned to them directly or via the group membership, but cannot be authenticated.

## Description
You can use user groups to specify permissions for a collection of users, which makes permissions easier to manage for those users. When you grant a permission to a group, all of the users (and groups) in the group are granted that permission (by transitive rule).

::: warning Reserved Names
The following names are reserved and Bondy will not allow them to be used as a value for the groups's `name` property: `all` and `anonymous`.
:::

<ZoomImg src="/assets/rbac.png"/>

## Types
### input_data(){.datatype}
The object used to create or update a group.

The object represents as overview of the all group properties but the available properties are detailed in each particular operation.

<DataTreeView :data="inputCreateData" :maxDepth="10" />

### group(){.datatype}
The representation of the group returned by the read or write operations e.g. `get`, `list`, `add` or `update`.

<DataTreeView :data="group" :maxDepth="10" />

## Procedures

|Name|URI|
|:---|:---|
|[Add a group to a realm](#add-a-group-to-a-realm)|`bondy.group.add`|
|[Add a group to a group](#add-a-group-to-a-group)|`bondy.group.add_group`|
|[Add groups to a group](#add-groups-to-a-group)|`bondy.group.add_groups`|
|[Delete a group from a realm](#delete-a-group-from-a-realm)|`bondy.group.delete`|
|[Retrieve a group from a realm](#retrieve-a-group-from-a-realm)|`bondy.group.get`|
|[List all groups from a realm](#list-all-groups-from-a-realm)|`bondy.group.list`|
|[Remove a group from a group](#remove-a-group-from-a-group)|`bondy.group.remove_group`|
|[Remove groups from a group](#remove-groups-from-a-group)|`bondy.group.remove_groups`|
|[Update a group into a realm](#update-a-group-into-a-realm)|`bondy.group.update`|

### Add a group to a realm
#### bondy.group.add(realm_uri(), input_data()) -> group() {.wamp-procedure}
Creates a new group and add it on the provided realm uri.

Publishes an event under topic [bondy.group.added](#bondy-group-added){.uri} after the group has been created.

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

* [bondy.error.already_exists](/reference/wamp_api/errors/already_exists): when the provided name already exists.
* [bondy.error.missing_required_value](/reference/wamp_api/errors/missing_required_value): when a required value is not provided
* [bondy.error.invalid_datatype](/reference/wamp_api/errors/invalid_datatype): when the data type is invalid
* [bondy.error.invalid_value](/reference/wamp_api/errors/invalid_value): when the data value is invalid
* [bondy.error.invalid_data](/reference/wamp_api/errors/invalid_data): when the data values are invalid
* [bondy.error.no_such_groups](/reference/wamp_api/errors/no_such_groups): when any of the provided group name doesn't exist.
* [bondy.error.not_found](/reference/wamp_api/errors/not_found): when the provided realm uri is not found.

#### Examples

::: details Success Call
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.group.add \
"com.leapsight.test_creation_1" '{"name":"group_1"}' | jq
```
- Response:
```json
{
  "groups": [],
  "meta": {},
  "name": "group_1",
  "type": "group",
  "version": "1.1"
}
```
:::
::: details Success Call with Groups
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.group.add \
"com.leapsight.test_creation_1" '{"name":"group_2", "groups":["group_1"]}' | jq
```
- Response:
```json
{
  "groups": [
    "group_1"
  ],
  "meta": {},
  "name": "group_2",
  "type": "group",
  "version": "1.1"
}
```
:::

### Add a group to a group
#### bondy.group.add_group(realm_uri(), name(), name()) {.wamp-procedure}
Adds an existing group name to another existing group name.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to modify the group.'
		},
		'1':{
			'type': 'string',
			'required': true,
			'description' : 'The name of the group you want to add a group name.'
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

* [wamp.error.invalid_argument](/reference/wamp_api/errors/wamp_invalid_argument): when there is an invalid number of positional arguments.
* [bondy.error.no_such_groups](/reference/wamp_api/errors/no_such_groups): when the provided group name doesn't exist.

#### Examples

::: details Success Call
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.group.add_group \
"com.leapsight.test_creation_1" "group_1" "group_2"
```
- Checking the updated group Response
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.group.get "com.leapsight.test_creation_1" "group_1" | jq
```
- Response
```json
```
:::

### Add groups to a group
#### bondy.group.add_groups(realm_uri(), name(), [name()]) {.wamp-procedure}
Adds a list of existing group names to another existing group name.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to modify the group.'
		},
		'1':{
			'type': 'string',
			'required': true,
			'description' : 'The name of the group you want to add a group names.'
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

* [wamp.error.invalid_argument](/reference/wamp_api/errors/wamp_invalid_argument): when there is an invalid number of positional arguments.
* [bondy.error.no_such_groups](/reference/wamp_api/errors/no_such_groups): when any of the provided group names doesn't exist.

#### Examples

::: details Success Call
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.group.add_groups \
"com.leapsight.test_creation_1" "group_1" '["group_2","group3"]'
```
- Checking the updated group Response
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.group.get "com.leapsight.test_creation_1" "group_1" | jq
```
- Response
```json
```
:::

### Delete a group from a realm
#### bondy.group.delete(realm_uri(), name()) {.wamp-procedure}
Deletes an existing group from the provided realm uri.

Publishes an event under topic [bondy.group.deleted](#bondy-group-deleted){.uri} after the group has been deleted.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to modify the group.'
		},
		'1':{
			'type': 'string',
			'required': true,
			'description' : 'The name of the group you want to delete.'
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

* [bondy.error.unknown_group](/reference/wamp_api/errors/unknown_group): when the provided group name is not found.

#### Examples

::: details Success Call
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.group.delete \
"com.leapsight.test_creation_1" "group_3"
```
:::

### Retrieve a group from a realm
#### bondy.group.get(realm_uri(), name()) -> group() {.wamp-procedure}
Retrieves the requested group name on the provided realm uri.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to retrieve the group.'
		},
		'1':{
			'type': 'string',
			'required': true,
			'description' : 'The group name of the group you want to retrieve.'
		}
	})"
/>

##### Keyword Args
None.

#### Result

##### Positional Results
The call result is a single positional argument containing a group:

<DataTreeView :data="group" :maxDepth="10" />

##### Keyword Results
None.

#### Errors

* [bondy.error.not_found](/reference/wamp_api/errors/not_found): when the provided group name is not found.

#### Examples

::: details Success Call
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.group.get "com.leapsight.test_creation_1" "group_2" | jq
```
- Response
```json
{
  "groups": [
    "group_1"
  ],
  "meta": {},
  "name": "group_2",
  "type": "group",
  "version": "1.1"
}
```
:::

### List all groups from a realm
#### bondy.group.list(realm_uri()) -> [group()] {.wamp-procedure}
Lists all groups of the provided realm uri.

:::warning TO_CHECK
By default, the `anonymous` group is returned but maybe it is no clear when the provided realm doesn't exist.
:::

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to retrieve the groups.'
		}
	})"
/>

##### Keyword Args
None.

#### Result

##### Positional Results
The call result is a single positional argument containing a list of groups.

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
call bondy.group.list \
"com.leapsight.test_creation_1" | jq
```
- Response:
```json
[
  {
    "groups": [],
    "meta": {},
    "name": "anonymous",
    "type": "group",
    "version": "1.1"
  },
  {
    "groups": [],
    "meta": {},
    "name": "group_1",
    "type": "group",
    "version": "1.1"
  }
]
```
:::

### Remove a group from a group
#### bondy.group.remove_group(realm_uri(), name(), name()) {.wamp-procedure}
Removes an existing group name from another existing group name.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to modify the group.'
		},
		'1':{
			'type': 'string',
			'required': true,
			'description' : 'The name of the group you want to remove a group name.'
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

* [wamp.error.invalid_argument](/reference/wamp_api/errors/wamp_invalid_argument): when there is an invalid number of positional arguments.
* [bondy.error.no_such_groups](/reference/wamp_api/errors/no_such_groups): when the provided group name doesn't exist.
* [bondy.error.not_found](/reference/wamp_api/errors/not_found): when the provided group name is not found.

#### Examples

::: details Success Call
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.group.remove_group \
"com.leapsight.test_creation_1" "group_1" "group_2"
```
- Checking the updated group Response
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.group.get "com.leapsight.test_creation_1" "group_1" | jq
```
- Response
```json
```
:::

### Remove groups from a group
#### bondy.group.remove_groups(realm_uri(), name(), [name()]) {.wamp-procedure}
Removes a list of existing group names from another existing group name.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to modify the group.'
		},
		'1':{
			'type': 'string',
			'required': true,
			'description' : 'The name of the group you want to remove a group names.'
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

* [wamp.error.invalid_argument](/reference/wamp_api/errors/wamp_invalid_argument): when there is an invalid number of positional arguments.
* [bondy.error.no_such_groups](/reference/wamp_api/errors/no_such_groups): when any of the provided group names doesn't exist.

#### Examples

::: details Success Call
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.group.remove_groups \
"com.leapsight.test_creation_1" "group_1" '["group_2","group3"]'
```
- Checking the updated group Response
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.group.get "com.leapsight.test_creation_1" "group_1" | jq
```
- Response
```json
```
:::

### Update a group into a realm
#### bondy.group.update(realm_uri(), name(), input_data()) -> group() {.wamp-procedure}
Updates an existing group.

Publishes an event under topic [bondy.group.updated](#bondy-group-updated){.uri} after the group has been updated.

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

* [wamp.error.invalid_argument](/reference/wamp_api/errors/wamp_invalid_argument): when there is an invalid number of positional arguments.
* [bondy.error.invalid_datatype](/reference/wamp_api/errors/invalid_datatype): when the data type is invalid
* [bondy.error.invalid_value](/reference/wamp_api/errors/invalid_value): when the data value is invalid
* [bondy.error.invalid_data](/reference/wamp_api/errors/invalid_data): when the data values are invalid
* [bondy.error.no_such_groups](/reference/wamp_api/errors/no_such_groups): when any of the provided group name doesn't exist.
* [bondy.error.unknown_group](/reference/wamp_api/errors/unknown_group): when the provided realm uri is not found.

#### Examples

::: details Success Call
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.group.update \
"com.leapsight.test_creation_1" "group_1" '{"groups":["group_2"]}' | jq
```
- Response:
```json
{
  "groups": [
    "group_2"
  ],
  "meta": {},
  "name": "group_1",
  "type": "group",
  "version": "1.1"
}
```
:::

## Topics

#### bondy.group.added{.wamp-topic}
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
			'description' : 'The name of the group you have added.'
		}
	})"
/>

##### Keyword Results
None.

#### bondy.group.updated{.wamp-topic}
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
			'description' : 'The name of the group you have updated.'
		}
	})"
/>

##### Keyword Results
None.

#### bondy.group.deleted{.wamp-topic}
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
			'description' : 'The name of the group you have deleted.'
		}
	})"
/>

##### Keyword Results
None.

<script>
const groupData = {
	"name": {
		"type": "string",
		"required": true,
		"mutable": false,
		"description": "The group identifier. This is always in lowercase."
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
	"meta": {
        "type": "map",
        "required": true,
		"mutable": true,
		"description": "Group metadata.",
        "default": "`{}`"
    }
};

const inputCreateData = {...groupData};
const inputUpdateData = {...groupData};

const group = {...groupData};

export default {
	data() {
        return {
			inputCreateData: JSON.stringify(inputCreateData),
            group: JSON.stringify(group),
			createArgs: JSON.stringify({
				0:{ 
					'type': 'string',
					'required': true,
					'description' : 'The URI of the realm you want to add a group.'
				},
				1: {
					"type": "object",
					"description": "The group configuration data",
					"mutable": true,
					"properties" : inputCreateData
				}
			}),
			createResult: JSON.stringify({
				0: {
					"type": "object",
					"description": "The created group.",
					"mutable": true,
					"properties" : group
				}
			}),
			updateArgs: JSON.stringify({
				0:{ 
					'type': 'string',
					'required': true,
					'description' : 'The URI of the realm you want to update a group.'
				},
				1:{
					'type': 'string',
					'required': true,
					'description' : 'The name of the group you want to update.'
				},
				2: {
					"type": "object",
					"description": "The group configuration data",
					"mutable": true,
					"properties" : inputCreateData
				}
			}),
			updateResult: JSON.stringify({
				0: {
					"type": "object",
					"description": "The updated group.",
					"mutable": true,
					"properties" : group
				}
			}),
            inputUpdateData: JSON.stringify(inputUpdateData),
			listResult: JSON.stringify({
				0: {
					"type": "array",
					"description": "The groups of the realm you want to retrieve.",
					"items" : {
						"type": "object",
						"description": "The group.",
						"properties": group
					}
				}
			})
		}
	}
};
</script>