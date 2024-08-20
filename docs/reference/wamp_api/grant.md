---
outline: [2,3]
---
# Grant
A Grant specifies the permissions assigned to a user, group, or role over a particular resource. It is essentially a directive that determines what actions can be performed by which entities on specific resources. This object helps enforce access control policies by defining who can access what and in what manner.

## Description
The Grant object serves to manage and enforce permissions within an RBAC system. It allows administrators to specify which roles or users have the authority to perform particular actions on resources.

It is an essential element in RBAC systems for defining and managing permissions, ensuring that access to resources is controlled, and aligning with organizational security policies.

<ZoomImg src="/assets/rbac.png"/>

## Types
### input_data(){.datatype}
The data used to create or revoke permissions.

The object represents as overview of the all grant properties but the available properties are detailed in each particular operation.

<DataTreeView :data="inputData" :maxDepth="10" />

### grant(){.datatype}
The representation of the grant by realm.

<DataTreeView :data="grant" :maxDepth="10" />

### roleGrant(){.datatype}
The representation of the grant by role.

<DataTreeView :data="roleGrant" :maxDepth="10" />

#### Actions
Below the actions (WAMP Permissions) which can be configured on the resources:
- `wamp.register`
- `wamp.unregister`
- `wamp.call`
- `wamp.cancel`
- `wamp.subscribe`
- `wamp.unsubscribe`
- `wamp.publish`
- `wamp.disclose_caller`
- `wamp.disclose_publisher`

## Procedures
These procedures facilitate the management of permissions in an RBAC system by allowing administrators to create, revoke, and review access rights for users, groups, and roles.

- Granting permissions (role, resource, permission): creates a grant to allow the specified role to access the specified resource with the given permission.
- Revoking permissions (role, resource, permission): removes a grant that allows the specified role to access the specified resource with the given permission.
- Listing permissions (realm|role): retrieves a list of permissions granted to the specified role (user or group) or even to the realm.

|Name|URI|
|:---|:---|
|[Create a new grant](#create-a-new-grant)|`bondy.grant.create`|
|[Revoke an existing grant](#revoke-an-existing-grant)|`bondy.grant.revoke`|
|[List the realm grants](#list-grants-of-the-realm)|`bondy.realm.grants`|
|[List the group grants](#list-grants-of-the-group)|`bondy.group.grants`|
|[List the user grants](#list-grants-of-the-user)|`bondy.user.grants`|

### Create a new grant
#### bondy.grant.create(realm_uri(), input_data()) -> grant() {.wamp-procedure}
This procedure is used to create a new grant, which assigns specific permissions to a role (user or group) for a particular resource. By invoking `bondy.grant.create`, administrators can specify who (the principal) is being granted access, what resources they can access, and what actions they are permitted to perform.

It creates a new grant and add it on the given realm uri.

Use cases:
- grant **permissions** on any to `all` | {**user** | **group** [,...]}
- grant **permissions** on {**resource**, `exact` | `prefix` | `wildcard`} to `all` | {**user** | **group** [,...]}

#### Call

##### Positional Args
<DataTreeView :data="inputArgs" :maxDepth="10" />

##### Keyword Args
None.

#### Result

##### Positional Results
None

##### Keyword Results
None.

#### Errors

* [wamp.error.no_such_realm](/reference/wamp_api/errors/wamp_no_such_realm): when the given realm uri does not exist.
* [bondy.error.duplicate_roles](/reference/wamp_api/errors/duplicate_roles): when there are duplicated roles (users and/or groups).
* [bondy.error.unknown_roles](/reference/wamp_api/errors/unknown_roles): when the given roles do not exist.
* [bondy.error.invalid_data](/reference/wamp_api/errors/invalid_data): when there validation failures on the given data.

#### Examples

::: code-group
```javascript [Using AutobahnJS]
session.call("bondy.grant.create", [
   "com.leapsight.test",
   {
        "permissions": [
            "wamp.subscribe",
            "wamp.unsubscribe",
            "wamp.call",
            "wamp.cancel"
        ],
        "resources": [
            {
                "uri": "com.leapsight.example.",
                "match": "prefix"
            },
            {
                "uri": "com.leapsight.test.echo",
                "match": "exact"
            }
        ],
        "roles": [
            "client"
        ]
    }
])
```
```bash [Using wick]
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.grant.create \
"com.leapsight.test" \
'{
    "permissions": [
        "wamp.subscribe",
        "wamp.unsubscribe",
        "wamp.call",
        "wamp.cancel"
    ],
    "resources": [
        {
            "uri": "com.leapsight.example.",
            "match": "prefix"
        },
        {
            "uri": "com.leapsight.test.echo",
            "match": "exact"
        }
    ],
    "roles": [
        "client"
    ]
}' | jq
```
:::

### Revoke an existing grant
#### bondy.grant.revoke(realm_uri(), input_data()) -> grant() {.wamp-procedure}
This procedure is used to remove an existing grant. When `bondy.grant.revoke` is called, it removes the permissions previously granted to a role (user or group) for a specific resource. This helps in managing and adjusting access control by revoking rights that are no longer needed or are being altered.

#### Call

##### Positional Args
<DataTreeView :data="inputArgs" :maxDepth="10" />

##### Keyword Args
None.

#### Result

##### Positional Results
None

##### Keyword Results
None.

#### Errors

* [wamp.error.no_such_realm](/reference/wamp_api/errors/wamp_no_such_realm): when the given realm uri does not exist.
* [bondy.error.unknown_roles](/reference/wamp_api/errors/unknown_roles): when the given roles do not exist.
* [bondy.error.invalid_data](/reference/wamp_api/errors/invalid_data): when there validation failures on the given data.

#### Examples

::: code-group
```javascript [Using AutobahnJS]
session.call("bondy.grant.revoke", [
   "com.leapsight.test",
   {
        "permissions": [
            "wamp.subscribe",
            "wamp.unsubscribe"
        ],
        "resources": [
            {
                "uri": "com.leapsight.example.",
                "match": "prefix"
            }
        ],
        "roles": [
            "client"
        ]
    }
])
```
```bash [Using wick]
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.grant.revoke \
"com.leapsight.test" \
'{
    "permissions": [
        "wamp.subscribe",
        "wamp.unsubscribe"
    ],
    "resources": [
        {
            "uri": "com.leapsight.example.",
            "match": "prefix"
        }
    ],
    "roles": [
        "client"
    ]
}' | jq
```
:::

### List grants of the realm
#### bondy.realm.grants(realm_uri()) -> [grant()] {.wamp-procedure}
This procedure retrieves the list of grants applied at the realm level. It provides a comprehensive view of all permissions that are granted within a particular realm, which can include various users, groups, and roles along with their associated permissions on resources.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to retrieve the grants.'
		}
	})"
/>

##### Keyword Args
None.

#### Result

##### Positional Results
The call result is a single positional argument containing a list of grants.

<DataTreeView :data="realmGrants" :maxDepth="10" />

##### Keyword Results
None.

#### Errors

* [bondy.error.not_found](/reference/wamp_api/errors/not_found): when the given realm uri does not exist.

#### Examples

::: code-group
```javascript [Using AutobahnJS]
session.call("bondy.realm.grants", ["com.leapsight.test"])
```
```bash [Using wick]
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.realm.grants \
"com.leapsight.test" | jq
```
```json [Result]
[
  [
    {
      "permissions": [
        "wamp.call",
        "wamp.cancel"
      ],
      "resources": {
        "match": "prefix",
        "uri": "com.leapsight.example."
      },
      "roles": [
        "user/client"
      ]
    },
    {
      "permissions": [
        "wamp.call",
        "wamp.cancel",
        "wamp.subscribe",
        "wamp.unsubscribe"
      ],
      "resources": {
        "match": "exact",
        "uri": "com.leapsight.test.echo"
      },
      "roles": [
        "user/client"
      ]
    },
    {
      "permissions": [
        "wamp.call",
        "wamp.cancel",
        "wamp.subscribe",
        "wamp.unsubscribe"
      ],
      "resources": {
        "match": "prefix",
        "uri": "com.leapsight.example."
      },
      "roles": [
        "group/clients"
      ]
    },
    {
      "permissions": [
        "wamp.call",
        "wamp.cancel",
        "wamp.subscribe",
        "wamp.unsubscribe"
      ],
      "resources": {
        "match": "exact",
        "uri": "com.leapsight.test.echo"
      },
      "roles": [
        "group/clients"
      ]
    }
  ]
]
```
:::

### List grants of the group
#### bondy.group.grants(realm_uri(), group_name()) -> [grant()] {.wamp-procedure}
This procedure is used to fetch the grants associated with a specific group. It shows the permissions that have been assigned to the group across various resources, helping administrators understand what access rights are available to the group members.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to retrieve the grants.'
		},
		'1':{
			'type': 'string',
			'required': true,
			'description' : 'The group name.'
		}
	})"
/>

##### Keyword Args
None.

#### Result

##### Positional Results
The call result is a single positional argument containing a list of grants.
An empty list is returned when the provided group doesn't exist.

<DataTreeView :data="roleGrants" :maxDepth="10" />

##### Keyword Results
None.

#### Errors

* [bondy.error.not_found](/reference/wamp_api/errors/not_found): when the given realm uri does not exist.

#### Examples

::: code-group
```javascript [Using AutobahnJS]
session.call("bondy.group.grants", ["com.leapsight.test", "client"])
```
```bash [Using wick]
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.group.grants \
"com.leapsight.test" "client" | jq
```
```json [Result]
[
  [
    {
      "permissions": [
        "wamp.call",
        "wamp.cancel",
        "wamp.subscribe",
        "wamp.unsubscribe"
      ],
      "resources": {
        "match": "exact",
        "uri": "com.leapsight.test.echo"
      }
    },
    {
      "permissions": [
        "wamp.call",
        "wamp.cancel"
      ],
      "resources": {
        "match": "prefix",
        "uri": "com.leapsight.example."
      }
    }
  ]
]
```
:::

### List grants of the user
#### bondy.user.grants(realm_uri(), username()) -> [grant()] {.wamp-procedure}
This procedure retrieves the grants associated with a specific user. It provides information on what permissions the user has been granted across different resources, allowing administrators to review and manage individual user access effectively.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The URI of the realm you want to retrieve the grants.'
		},
		'1':{
			'type': 'string',
			'required': true,
			'description' : 'The username.'
		}
	})"
/>

##### Keyword Args
None.

#### Result

##### Positional Results
The call result is a single positional argument containing a list of grants.
An empty list is returned when the provided user doesn't exist.

<DataTreeView :data="roleGrants" :maxDepth="10" />

##### Keyword Results
None.

#### Errors

* [bondy.error.not_found](/reference/wamp_api/errors/not_found): when the given realm uri does not exist.

#### Examples

::: code-group
```javascript [Using AutobahnJS]
session.call("bondy.user.grants", ["com.leapsight.test", "john.doe"])
```
```bash [Using wick]
./wick --url ws://localhost:18080/ws \
--realm com.leapsight.bondy \
call bondy.user.grants \
"com.leapsight.test" "john.doe" | jq
```
```json [Result]
[
  [
    {
      "permissions": [
        "wamp.call",
        "wamp.cancel",
        "wamp.subscribe",
        "wamp.unsubscribe"
      ],
      "resources": {
        "match": "exact",
        "uri": "com.leapsight.test.echo"
      }
    },
    {
      "permissions": [
        "wamp.call",
        "wamp.cancel",
        "wamp.subscribe",
        "wamp.unsubscribe"
      ],
      "resources": {
        "match": "prefix",
        "uri": "com.leapsight.example."
      }
    }
  ]
]
```
:::

<script>
    const inputResource = {
        "uri": {
            "type": "string",
            "required": true,
            "description": "A wamp uri."
        },       
        "match": {
            "type": "string",
            "required": true,
            "description": "Allowed values: `exact`, `prefix`, `wildcard`"
        }
    };
    const resource = {
        "uri": {
            "type": "string",
            "description": "A wamp uri."
        },       
        "match": {
            "type": "string",
            "description": "The matching"
        }
    };
    const inputGrant = {
        "roles": {
            "type": "array",
            "required": true,
            "description": "A list of roles. Roles like as `all` or `anonymous` are allowed. Role could be prefixed with `user/` or `group/` to indicate the type (even in case of ambiguity)",
            "items": {
                "type": "string"
            }
        },
        "permissions" :  {
            "type": "array",
            "required": true,
            "description": "A list of actions.",
            "items": {
                "type": "string"
            }
        },
        "resources" :  {
            "type": "array",
            "required": true,
            "description": "A list of resources.",
            "items": {
                "type": "object",
                "properties": inputResource
            }
        }
    };
    const roleGrant = {
        "permissions" :  {
            "type": "array",
            "description": "The list of actions.",
            "items": {
                "type": "string"
            }
        },
        "resources" :  {
            "type": "array",
            "description": "The list of resources.",
            "items": {
                "type": "object",
                "properties": resource
            }
        }
    };
    const grant = {
        "roles": {
            "type": "array",
            "description": "The list of roles.",
            "items": {
                "type": "string"
            }
        },
        ...roleGrant
    };
    

// const grant = {...grantData};

export default {
	data() {
        return {
            inputData: JSON.stringify(inputGrant),
            grant: JSON.stringify(grant),
            roleGrant: JSON.stringify(roleGrant),
			inputArgs: JSON.stringify({
				0:{ 
					'type': 'string',
					'required': true,
					'description' : 'The URI of the realm you want to add/revoke a grant.'
				},
				1: {
					"type": "object",
                    "required": true,
					"description": "The grant configuration data",
					"properties" : inputGrant
				}
			}),
			realmGrants: JSON.stringify({
				0: {
					"type": "array",
					"description": "The grants of the realm you want to retrieve.",
					"items" : {
						"type": "object",
						"description": "The grant.",
						"properties": grant
					}
				}
			}),
            roleGrants: JSON.stringify({
				0: {
					"type": "array",
					"description": "The grants of the role you want to retrieve.",
					"items" : {
						"type": "object",
						"description": "The grant.",
						"properties": roleGrant
					}
				}
			})
		}
	}
};
</script>