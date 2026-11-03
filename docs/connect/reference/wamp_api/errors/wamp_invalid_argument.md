# wamp.error.invalid_argument
When the given argument type or value is invalid.

## Description
Normally this is caused when the given argument types or values are not acceptable to the called procedure.

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
            'description': 'invalid_argument'
        },
        'description': {
            'type': 'string',
            'description': 'The error description'
        },
        'message': {
            'type': 'string',
            'description': 'The error message'
        },
        'keys': {
            'type': 'array',
            'description': 'The property keys with failures',
            'items': {
                'type': 'string'
            }
        }
	})"
/>