# bondy.error.no_such_users
> When the usernames value is invalid.

## Description
Normally this is caused when there are request or input data validation failures.

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
            'description': 'no_such_users'
        },
        'description': {
            'type': 'string',
            'description': 'The error description'
        },
        'message': {
            'type': 'array',
            'description': 'The invalid usernames',
            'items': {
                'type': 'string'
            }
        }
	})"
/>