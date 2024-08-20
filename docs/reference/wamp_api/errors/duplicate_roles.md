# bondy.error.duplicate_roles
When there are duplicated roles.

## Description
Normally this is caused by an operation trying to create grants to a roles (users and/or groups).

##### Positional Results
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        0: {
            'type': 'string',
            'description': 'The error message'
        }
	})"
/>

##### Keyword Results
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        'code': {
            'type': 'string',
            'description': 'duplicate_roles'
        },
        'description': {
            'type': 'string',
            'description': 'The error description'
        },
        'message': {
            'type': 'string',
            'description': 'The error message'
        }
	})"
/>

#### Example

```json
{
    "code":"duplicate_roles",
    "description":"", 
    "message":"admin"
}
```