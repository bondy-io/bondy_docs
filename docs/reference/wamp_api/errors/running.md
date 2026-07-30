# bondy.error.running
When an operation cannot proceed because the resource it targets is currently running (or restarting).

## Description
Some operations require a resource to be stopped first — for example, removing a [Bridge](/reference/wamp_api/bridge_relay) definition while it is actively running would silently orphan a live connection. The call is refused instead; stop the resource first, then retry. A resource that is `restarting` (mid-transition, neither fully stopped nor fully up) is refused for the same reason and surfaces this same error.

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
            'description': 'running (or restarting)'
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
