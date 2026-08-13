# wamp.error.no_such_subscription
When no subscription exists for the given subscription id.

## Description
Raised by [`wamp.subscription.get`](/router/reference/wamp_api/subscription#get-a-subscription), [`wamp.subscription.list_subscribers`](/router/reference/wamp_api/subscription#list-a-subscription-s-subscribers), and [`wamp.subscription.count_subscribers`](/router/reference/wamp_api/subscription#count-a-subscription-s-subscribers) when every reachable cluster node confirms no subscription with the given id exists — whether it never existed, was since removed, or lived on a node that has left the cluster. If a node holding it could not be reached to confirm its absence, Bondy raises [`bondy.error.unavailable`](/router/reference/wamp_api/errors/unavailable) instead of this error, so as not to report a false negative.

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
            'description': 'wamp.error.no_such_subscription'
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
