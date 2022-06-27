# Group
> Group is a named collection of user identifiers. It can have permissions assigned to them directly or via the group membership, but cannot be authenticated.

## Description

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
|[Add a group](#add-a-group)|`bondy.group.add`
||`bondy.group.add_group`|
||`bondy.group.add_groups`|
||`bondy.group.delete`|
||`bondy.group.get`|
||`bondy.group.list`|
||`bondy.group.remove_group`|
||`bondy.group.remove_groups`|
||`bondy.group.update`|

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
            inputUpdateData: JSON.stringify(inputUpdateData)
		}
	}
};
</script>