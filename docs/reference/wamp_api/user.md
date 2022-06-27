# User
> A user is a role that is able to log into a Bondy Realm.

## Description
Users are persons or software systems with authorized access to a Realm. They can be authenticated and authorized; permissions (authorization) may be granted directly or via Group  membership.

Users have attributes associated with themelves like usernames or alias, credentials (password or authorized keys) and metadata determined by the client applications.

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
|[Add a user](#add-a-user)|`bondy.user.add`
||`bondy.user.add_alias`
||`bondy.user.add_group`|
||`bondy.user.add_groups`|
||`bondy.user.change_password`|
||`bondy.user.delete`|
||`bondy.user.disable`|
||`bondy.user.enable`|
||`bondy.user.get`|
||`bondy.user.is_enabled`|
||`bondy.user.list`|
||`bondy.user.remove_alias`|
||`bondy.user.remove_group`|
||`bondy.user.remove_groups`|
||`bondy.user.update`|


## Topics

### bondy.user.added{.wamp-topic}
### bondy.user.updated{.wamp-topic}
### bondy.user.credentials_changed{.wamp-topic}
### bondy.user.deleted{.wamp-topic}

<script>
const userData = {
	"username": {
		"type": "string",
		"required": true,
		"mutable": false,
		"description": "The user identifier."
	},
	"password": {
		"type": "string",
		"required": false,
		"mutable": true,
		"description": "The user password."
	},
	"authorized_keys": {
		"type": "array",
		"required": false,
		"mutable": false,
		"description": "The authorized keys.",
        "items": {
			"type": "string"
		}
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
		"default": undefined
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

const inputCreateData = {...userData};
const inputUpdateData = {...userData};

const user = {...userData};

export default {
	data() {
        return {
			inputCreateData: JSON.stringify(inputCreateData),
            user: JSON.stringify(user),
			createArgs: JSON.stringify({
				0: {
					"type": "object",
					"description": "The user configuration data",
					"mutable": true,
					"properties" : inputCreateData
				}
			}),
			createResult: JSON.stringify({
				0: {
					"type": "object",
					"description": "The created user.",
					"mutable": true,
					"properties" : user
				}
			}),
            inputUpdateData: JSON.stringify(inputUpdateData),
            updateArgs: JSON.stringify({
                0: {
                    "type": "string",
                    "required": true,
                    "description" : "The username or uuid of the user you want to update."
                },
				1: {
					"type": "object",
					"description": "The user configuration data",
					"mutable": true,
					"properties" : inputUpdateData
				}
			}),
			updateResult: JSON.stringify({
				0: {
					"type": "object",
					"description": "The updated user.",
					"mutable": true,
					"properties" : user
				}
			})
		}
	}
};
</script>