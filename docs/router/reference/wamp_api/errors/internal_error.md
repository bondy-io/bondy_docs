# bondy.error.internal_error

## Description
The catch-all raised when Bondy encounters an unhandled exception while processing a request — a crash in call routing, procedure registration, or a Bondy procedure that serves the call — rather than letting the exception take down the session. A caller receives it when the call fails on the caller's node, and also when it fails on the cluster peer node that the call was forwarded to. It carries a `trace_id` correlating the error with Bondy's server-side logs, which is the detail worth handing to an administrator when reporting one of these.

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
        'trace_id': {
            'type': 'string',
            'description': 'Identifier correlating this error with Bondy\'s server-side logs'
        }
	})"
/>
