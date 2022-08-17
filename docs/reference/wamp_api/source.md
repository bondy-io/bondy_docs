# Source
> Source is used to define an authentication method and IP-based restrictions (CIDR). A user cannot be authenticated to a Realm  until a source is defined.

## Description
It can be used to restrict the user access based on authmethod and IP filtering.

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
|[Add a source to a realm](#add-a-source-to-a-realm)|`bondy.source.add`|
|[Remove a source from a realm](#remove-a-source-from-a-realm)|`bondy.source.delete`|
|[Retrieve a source from a realm](#retrieve-a-source-from-a-realm)|`bondy.source.get`|
|[List all sources from a realm](#list-all-sources-from-a-realm)|`bondy.source.list`|
|[Find sources from a realm](#find-sources-from-a-realm)|`bondy.source.match`|

### Add a source to a realm
### bondy.source.add(realm_uri(), input_data()) -> source() {.wamp-procedure}
Creates a new source and add it on the provided realm uri. This operation is **idempotent** and works also as update.

Publishes an event under topic [bondy.source.added](#bondy-source-added){.uri} after the source has been created.

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

* [bondy.error.missing_required_value](/reference/wamp_api/errors/missing_required_value): when a required value is not provided
* [bondy.error.invalid_datatype](/reference/wamp_api/errors/invalid_datatype): when the data type is invalid
* [bondy.error.invalid_value](/reference/wamp_api/errors/invalid_value): when the data value is invalid
* [bondy.error.invalid_data](/reference/wamp_api/errors/invalid_data): when the data values are invalid.
* [bondy.error.no_such_users](/reference/wamp_api/errors/no_such_users): when any of the provided usernames doesn't exist.
* [bondy.error.not_found](/reference/wamp_api/errors/not_found): when the provided realm uri is not found.

#### Examples

::: details Success Call
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.source.add \
"com.leapsight.test_creation_1" \
'{
	"usernames":["user_1"],
	"authmethod":"password",
	"cidr":"0.0.0.0/0"
}' | jq
```
- Response:
```json
{
  "authmethod": "password",
  "cidr": "0.0.0.0/0",
  "meta": {},
  "type": "source",
  "version": "1.1"
}
```
:::

### Remove a source from a realm
### bondy.source.delete(realm_uri(), [username()] | all | anonymous, cidr()) -> source() {.wamp-procedure}
Removes an existing source from the provided realm uri.

Publishes an event under topic [bondy.source.deleted](#bondy-source-deleted){.uri} after the source has been removed.

#### Call

##### Positional Args
The operation supports 3 positional arguments with some reserved keys for the second arg (usernames):

<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to remove the source.'
		},
		'1':{
			'type': 'array',
			'required': true,
			'description' : 'The list of usernames of the source you want to remove.',
			'items': {
				'type': 'string'
			}
		},
		'2':{
			'type': 'string',
			'required': true,
			'description' : 'The cidr of the source you want to remove.'
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

* [wamp.error.invalid_argument](/reference/wamp_api/errors/wamp_invalid_argument): when the 3 required parameters are not provided.

#### Examples

::: details Success Call
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.source.delete \
"com.leapsight.test_creation_1" '["user_1"]' "0.0.0.0/0"
```
:::

### Retrieve a source from a realm

::: info TODO
Not implemented. At the moment `wamp.error.no_such_procedure` is returned.
:::

### List all sources from a realm
### bondy.source.list(realm_uri()) -> [source()] {.wamp-procedure}
Lists all sources of the provided realm uri.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to retrieve the sources.'
		}
	})"
/>

##### Keyword Args
None.

#### Result

##### Positional Results
The call result is a single positional argument containing a list of sources.
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
call bondy.source.list \
"com.leapsight.test_creation_1" | jq
```
- Response:
```json
[
  {
    "authmethod": "password",
    "cidr": "0.0.0.0/0",
    "meta": {},
    "type": "source",
    "username": "user_1",
    "version": "1.1"
  }
]
```
:::

### Find sources from a realm
### bondy.source.match(realm_uri() | realm_uri(), username() | realm_uri(), username(), ip()) -> [source()] {.wamp-procedure}
Finds the requested sources on the provided realm uri according the search criteria.

If the realm uri doesn't exist it returns the default sources on the master realm

#### Call

##### Positional Args
The operation supports 1, 2 or 3 positional arguments.

- When only a realm uri is provided, by default, the sources assigned to `all` username are returned.
- When a realm uri and username are provided, the sources assigned to the username are returned.

<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to find sources.'
		},
		'1':{
			'type': 'string',
			'required': false,
			'description' : 'The username assigned to the sources.'
		},
		'2':{
			'type': 'string',
			'required': false,
			'description' : 'The cidr.'
		}
	})"
/>

##### Keyword Args
None.

#### Result

##### Positional Results
The call result is a single positional argument containing a sources:

<DataTreeView :data="listResult" :maxDepth="10" />

##### Keyword Results
None.

#### Errors
* [wamp.error.invalid_argument](/reference/wamp_api/errors/wamp_invalid_argument): when the required parameters are not provided.

#### Examples

::: details Success Call realm matching
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.source.match "com.leapsight.test_creation_1" | jq
```
- Response
```json
[
  {
    "authmethod": "cryptosign",
    "cidr": "0.0.0.0/0",
    "meta": {
      "description": "Allows all users from any network authenticate using password credentials."
    },
    "type": "source",
    "username": "all",
    "version": "1.1"
  },
  {
    "authmethod": "password",
    "cidr": "0.0.0.0/0",
    "meta": {
      "description": "Allows all users from any network authenticate using password credentials. This should ideally be restricted to your local administrative or DMZ network."
    },
    "type": "source",
    "username": "all",
    "version": "1.1"
  },
  {
    "authmethod": "wampcra",
    "cidr": "0.0.0.0/0",
    "meta": {
      "description": "Allows all users from any network authenticate using password credentials."
    },
    "type": "source",
    "username": "all",
    "version": "1.1"
  }
]
```
:::
::: details Success Call realm and username matching
- Request
```bash
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.source.match "com.leapsight.test_creation_1" "user_1" | jq
```
- Response
```json
[
  {
    "authmethod": "password",
    "cidr": "0.0.0.0/0",
    "meta": {},
    "type": "source",
    "username": "user_1",
    "version": "1.1"
  }
]
```
:::

## Topics

::: info TODO
Not implemented.
:::

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
		"type": "string",
		"required": true,
		"mutable": true,
		"description": "A restricted IP/mask",
        "default": "0.0.0.0/0"
	},
	"authmethod" :  {
		"type": "string",
		"required": true,
		"mutable": true,
		"description": "The allowed authentication method."
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
            inputUpdateData: JSON.stringify(inputUpdateData),
			listResult: JSON.stringify({
				0: {
					"type": "array",
					"description": "The sources of the realm you want to retrieve.",
					"items" : {
						"type": "object",
						"description": "The source.",
						"properties": source
					}
				}
			})
		}
	}
};
</script>