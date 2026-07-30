# bondy.error.timeout
When a call does not receive a matching result or error within its timeout.

## Description
Raised when Bondy is waiting on the result of a call it issued internally (for example, one API module invoking another) and no matching `RESULT` or `ERROR` arrives before the call's timeout elapses. This is distinct from — and does not override — the WAMP-level [`wamp.call_timeout`](/reference/configuration/wamp#call-timeout) enforced on a client's own `CALL`; see that configuration reference for the client-facing timeout behaviour.

##### Positional Results
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        0: {
            'type': 'string',
            'description': 'The error message, stating the timeout value in milliseconds'
        }
	})"
/>

##### Keyword Results
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        'procedure_uri': {
            'type': 'uri',
            'description': 'The URI of the procedure that was called'
        },
        'timeout': {
            'type': 'integer',
            'description': 'The timeout value, in milliseconds, that elapsed'
        }
	})"
/>
