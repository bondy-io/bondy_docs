# Group
> Group is a named collection of user identifiers. It can have permissions assigned to them directly or via the group membership, but cannot be authenticated.

## Description
There are some restrictions for the names due to reserved words like as `all` and `anonymous`.

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
|[Add a group to a realm](#add-a-group-to-a-realm)|`bondy.group.add`
||`bondy.group.add_group`|
||`bondy.group.add_groups`|
||`bondy.group.delete`|
|[Retrieve a group from a realm](#retrieve-a-group-from-a-realm)|`bondy.group.get`|
|[List all groups from a realm](#list-all-groups-from-a-realm)|`bondy.group.list`|
||`bondy.group.remove_group`|
||`bondy.group.remove_groups`|
||`bondy.group.update`|

### Add a group to a realm
### bondy.user.add(realm_uri(), input_data()) -> group() {.wamp-procedure}
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

::: details Success Call Simple Creation
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
::: details Success Call with Groups Creation
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

### Retrieve a group from a realm
### bondy.group.get(realm_uri(), name()) -> group() {.wamp-procedure}
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
			'description' : 'The group name of the user you want to retrieve.'
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

::: details Success Call Getting
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
### bondy.group.list(realm_uri()) -> [group()] {.wamp-procedure}
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

## Topics

### bondy.group.added{.wamp-topic}
### bondy.group.updated{.wamp-topic}
### bondy.group.deleted{.wamp-topic}

<script>
const groupData = {
	"name": {
		"type": "string",
		"required": true,
		"mutable": false,
		"description": "The group identifier."
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
        "default": {}
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
				0: {
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