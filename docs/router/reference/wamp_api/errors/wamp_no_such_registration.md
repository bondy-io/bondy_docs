# wamp.error.no_such_registration
When no registration exists for the given registration id.

## Description
Raised by [`wamp.registration.get`](/router/reference/wamp_api/registration#get-a-registration), [`wamp.registration.list_callees`](/router/reference/wamp_api/registration#list-a-registration-s-callees), and [`wamp.registration.count_callees`](/router/reference/wamp_api/registration#count-a-registration-s-callees) when every reachable cluster node confirms no registration with the given id exists — whether it never existed, was since removed, or lived on a node that has left the cluster. If a node holding it could not be reached to confirm its absence, Bondy raises [`bondy.error.unavailable`](/router/reference/wamp_api/errors/unavailable) instead of this error, so as not to report a false negative.

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
            'description': 'wamp.error.no_such_registration'
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
