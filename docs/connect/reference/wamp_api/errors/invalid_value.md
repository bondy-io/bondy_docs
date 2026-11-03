# bondy.error.invalid_value
When the data value is invalid.

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
            'description': 'invalid_value'
        },
        'description': {
            'type': 'string',
            'description': 'The error description'
        },
        'key': {
            'type': 'string',
            'description': 'The property key with failures'
        },
        'message': {
            'type': 'string',
            'description': 'The error message'
        }
	})"
/>