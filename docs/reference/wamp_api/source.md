# Source
> Source is used to define an authentication method and IP-based restrictions (CIDR). A user cannot be authenticated to a Realm  until a source is defined.

## Description

## Types
### input_data(){.datatype}
The object used to create or update a source.

The object represents as overview of the all source properties but the available properties are detailed in each particular operation.

<DataTreeView :data="inputCreateData" :maxDepth="10" />

### source(){.datatype}
The representation of the source returned by the read or write operations e.g. `get`, `list` or `add`.

<DataTreeView :data="source" :maxDepth="10" />

## Procedures

|Name|URI|
|:---|:---|
|[Add a source](#add-a-source)|`bondy.source.add`
||`bondy.source.delete`|
||`bondy.source.get`|
||`bondy.source.list`|
||`bondy.source.match`|

## Topics

### bondy.source.added{.wamp-topic}
### bondy.source.deleted{.wamp-topic}

<script>
const sourceData = {
	"usernames": {
		"type": "array",
		"required": true,
		"mutable": false,
		"description": "A list of usernames.",
        "items": {
			"type": "string"
		}
	},
    "cidr": {
		"type": "array",
		"required": true,
		"mutable": true,
		"description": "A list of the restricted IPs or {IP, mask bits} tuples",
        "items": {
			"type": "string"
		},
        "default": []
	},
	"authmethod" :  {
		"type": "string",
		"required": true,
		"mutable": true,
		"description": "The allowed authentication method.",
		"items": {
			"type": "string"
		}
	},
	"meta": {
        "type": "map",
        "required": true,
		"mutable": true,
		"description": "Source metadata.",
        "default": {}
    }
};

const inputCreateData = {...sourceData};
const inputUpdateData = {...sourceData};

const source = {...sourceData};

export default {
	data() {
        return {
			inputCreateData: JSON.stringify(inputCreateData),
            source: JSON.stringify(source),
			createArgs: JSON.stringify({
				0: {
					"type": "object",
					"description": "The source configuration data",
					"mutable": true,
					"properties" : inputCreateData
				}
			}),
			createResult: JSON.stringify({
				0: {
					"type": "object",
					"description": "The created source.",
					"mutable": true,
					"properties" : source
				}
			}),
            inputUpdateData: JSON.stringify(inputUpdateData)
		}
	}
};
</script>