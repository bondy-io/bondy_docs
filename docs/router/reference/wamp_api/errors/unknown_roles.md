# bondy.error.unknown_roles
When the role that you're trying to retrieve doesn't exist.

## Description
Normally this is caused by an operation trying to retrieve a role that not exist.

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
            'description': 'unknown_roles'
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
    "code":"unknown_roles",
    "description":"", 
    "message":"[client]"
}
```