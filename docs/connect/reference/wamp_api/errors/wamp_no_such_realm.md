# wamp.error.no_such_realm
When the given realm uri does not exist.

## Description
A procedure raises this error when the realm URI it was given names no realm. `details.realm_uri` holds that URI when Bondy knows it.

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
        },
        'details': {
            'type': 'object',
            'description': 'Holds realm_uri, the URI that names no realm, when Bondy knows it. realm_uri also appears at the top level.'
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