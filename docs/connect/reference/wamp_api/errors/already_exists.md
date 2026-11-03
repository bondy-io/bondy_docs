# bondy.error.already_exists
When the resource that you're trying to create already exists.

## Description
Normally this is caused by an operation trying to create a resource with an identifier that is already in use.
Bondy raises the error when a request creates a resource that already exists, such as a realm, a user, a group or a user alias.

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
            'description': 'already_exists'
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