# bondy.error.invalid_data
When the data values are invalid.

## Description
Bondy raises this error when a request fails validation on more than one property. `errors` holds one entry for each failure. Bondy also raises this error when it cannot decode request data in its declared format. In that case, `details.format` names the format.

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
    "uri": "bondy.error.invalid_data",
    "code": "invalid_data",
    "handle": "C014",
    "nature": "permanent",
    "message": "Invalid data.",
    "description": "There were 2 validation errors.",
    "details": {
        "errors": [
            {
                "code": "missing_required_value",
                "description": "A value for 'roles' is required.",
                "key": "roles",
                "message": "Missing required value."
            },
            {
                "code": "missing_required_value",
                "description": "A value for 'permissions' is required.",
                "key": "permissions",
                "message": "Missing required value."
            }
        ]
    },
    "errors": [
        {
            "code": "missing_required_value",
            "description": "A value for 'roles' is required.",
            "key": "roles",
            "message": "Missing required value."
        },
        {
            "code": "missing_required_value",
            "description": "A value for 'permissions' is required.",
            "key": "permissions",
            "message": "Missing required value."
        }
    ],
    "causes": [],
    "doc_uri": "/errors/C014"
}
```
