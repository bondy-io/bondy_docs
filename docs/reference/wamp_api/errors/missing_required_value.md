# bondy.error.missing_required_value
> When the required data is not provided.

## Description
Normally this is caused when there are request or input data without required values.

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
            'description': 'missing_required_value'
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