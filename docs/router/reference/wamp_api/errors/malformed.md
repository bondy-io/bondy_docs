# bondy.error.malformed
When a pagination `cursor` isn't a decodable cursor at all.

## Description
Raised by a paginated `bondy.*` procedure — for example [`bondy.registration.list`](/router/reference/wamp_api/registration#list-registrations-paginated) — when the `cursor` keyword argument is not a value Bondy ever produced (truncated, corrupted, or hand-crafted). Unlike [`bondy.error.stale`](/router/reference/wamp_api/errors/stale), which means the cursor is genuinely a prior page's cursor but no longer valid, this means the value cannot be decoded as a cursor at all. Restart pagination from the first page (omit `cursor`).

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
            'description': 'malformed'
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
