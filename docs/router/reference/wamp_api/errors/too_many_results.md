# bondy.error.too_many_results
When a bounded `wamp.*` meta enumeration would exceed its result limit.

## Description
Procedures like [`wamp.registration.list`](/router/reference/wamp_api/registration#list-registrations) and [`wamp.subscription.match`](/router/reference/wamp_api/subscription#match-a-topic-uri) return the unpaginated shapes the WAMP specification gives. A realm's cluster-wide result set has no fixed bound, so each of these enumerations is capped; past the cap this error is raised instead of silently truncating the result. Switch to the paginated `bondy.*` equivalent (e.g. [`bondy.registration.list`](/router/reference/wamp_api/registration#list-registrations-paginated)) with its `limit` / `cursor` keyword arguments.

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
            'description': 'too_many_results'
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
