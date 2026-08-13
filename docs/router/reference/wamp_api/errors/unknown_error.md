# bondy.error.unknown_error
A catch-all for an internal error term that doesn't match any of Bondy's more specific error codes.

## Description
Bondy maps most internal error reasons to a specific `bondy.error.*` code so a caller can act on it programmatically. When an operation fails with a reason that isn't one of those recognised cases, it's reported as `unknown_error` instead of being silently swallowed. The `description` field carries the raw underlying error term (formatted as text) for diagnosis — treat this as a signal to check Bondy's own logs or file an issue, not something to branch application logic on.

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
            'description': 'unknown_error'
        },
        'description': {
            'type': 'string',
            'description': 'The underlying error term, formatted as text'
        },
        'message': {
            'type': 'string',
            'description': 'The error message'
        }
	})"
/>
