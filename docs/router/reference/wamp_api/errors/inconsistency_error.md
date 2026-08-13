# bondy.error.inconsistency_error
An internal consistency check failure — not an error a client action can trigger or avoid.

## Description
Bondy's internal fire-and-forget call helper expects a `CALL` it issues to never receive a synchronous reply — only an asynchronous `RESULT` or `ERROR` delivered later, per the WAMP protocol. This error is raised if that invariant is ever violated. Seeing it indicates a bug in Bondy itself, not a problem with the calling client or the called procedure; there is no client-side change that prevents it.

##### Positional Results
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        0: {
            'type': 'string',
            'description': 'The error message: \'Inconsistency error\''
        }
	})"
/>

##### Keyword Results
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        'code': {
            'type': 'string',
            'description': 'inconsistency_error'
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
