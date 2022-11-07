# bondy.error.invalid_datatype
When the data value is invalid according to the data type definition.

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
            'description': 'invalid_datatype'
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
        },
        'value': {
            'type': 'string',
            'description': 'The provided value'
        }
	})"
/>