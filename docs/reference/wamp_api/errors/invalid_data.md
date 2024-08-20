# bondy.error.invalid_data
When the data values are invalid.

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
            'description': 'invalid_data'
        },
        'description': {
            'type': 'string',
            'description': 'The error description'
        },
        'message': {
            'type': 'string',
            'description': 'The error message'
        },
        'errors': {
            'type': 'array',
            'description': 'The errors details',
            'items': {
                'type': 'object',
                'description': 'Error details',
                'properties': {
                    'code': {
                        'type': 'string',
                        'description': 'The error code'
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
                }
            }
        }
	})"
/>

#### Example

```json
{
    "code":"invalid_data",
    "description":"There were 3 validation errors.",
    "errors":[
        {
            "code":"missing_required_value",
            "description":"A value for 'uri' is required.",
            "key":"uri",
            "message":"Missing required value."
        },
        {
            "code":"missing_required_value",
            "description":"A value for 'roles' is required.",
            "key":"roles",
            "message":"Missing required value."
        },
        {
            "code":"missing_required_value",
            "description":"A value for 'permissions' is required.",
            "key":"permissions",
            "message":"Missing required value"
        },
        "message":"Invalid data."
    ]
}
```