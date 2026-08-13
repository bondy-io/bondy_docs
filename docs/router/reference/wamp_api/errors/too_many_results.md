# bondy.error.too_many_results
When a bounded `wamp.*` meta enumeration would exceed its result limit.

## Description
Procedures like [`wamp.registration.list`](/router/reference/wamp_api/registration#list-registrations) and [`wamp.subscription.match`](/router/reference/wamp_api/subscription#match-a-topic-uri) keep the spec-compliant, unpaginated shape a single-node router historically returned. On a distributed router the cluster-wide result set has no fixed bound, so each of these enumerations is capped; past the cap this error is raised instead of silently truncating the result. Switch to the paginated `bondy.*` equivalent (e.g. [`bondy.registration.list`](/router/reference/wamp_api/registration#list-registrations-paginated)) with its `_limit` / `_cursor` `CALL.Options` extension keys.

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
