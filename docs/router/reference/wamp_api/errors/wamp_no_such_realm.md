# wamp.error.no_such_realm
When the given realm uri does not exist.

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
            'description': 'wamp.error.no_such_realm'
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
    "code":"wamp.error.no_such_realm",
    "description":"A realm named 'com.leapsight.test'could not be found.", 
    "message":"The request failed because the realm provided does not exist."
}
```