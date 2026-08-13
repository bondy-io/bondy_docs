# bondy.error.unavailable
When one or more cluster nodes could not be reached to confirm the result of a cluster-wide request.

## Description
Some procedures — for example [`wamp.registration.get`](/router/reference/wamp_api/registration#get-a-registration) or [`bondy.registration.callee.list`](/router/reference/wamp_api/registration#list-callees) — answer a question that only makes sense cluster-wide, by asking every node that might hold the answer. When a node that could hold it does not respond in time, Bondy cannot tell whether the resource exists there or not, so it raises this error instead of a false "not found". Retry; a failure that keeps repeating points to a node or network problem rather than a missing resource.

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
            'description': 'unavailable'
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
