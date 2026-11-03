# bondy.error.unknown_error
When an error carries a code that the error catalogue does not hold.

## Description
Bondy raises this error when it builds an error from an error map whose `code` names no catalogued type. For example, a value that does not have the required data type arrives with this URI and with `code` set to `invalid_datatype`. In that case, `code`, `message`, `description` and `details` come from the original failure. The URI and the handle `S002` come from this entry.

A failure that Bondy cannot describe safely arrives as [`bondy.error.internal_error`](/connect/reference/wamp_api/errors/internal_error) instead.

##### Positional Results
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        0: {
            'type': 'string',
            'description': 'The error message: \'An unknown error occurred.\''
        }
	})"
/>

##### Keyword Results
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        'code': {
            'type': 'string',
            'description': 'The code of the original failure, for example invalid_datatype'
        },
        'description': {
            'type': 'string',
            'description': 'The description of the original failure'
        },
        'message': {
            'type': 'string',
            'description': 'The error message'
        }
	})"
/>
