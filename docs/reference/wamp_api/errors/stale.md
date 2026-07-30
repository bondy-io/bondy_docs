# bondy.error.stale
When a pagination `_cursor` no longer matches the query it was minted for.

## Description
Raised by a paginated `bondy.*` procedure — for example [`bondy.registration.list`](/reference/wamp_api/registration#list-registrations-paginated) — when the `_cursor` passed in `CALL.Options` was minted under a different schema or node-walk shape than the one now in effect (a Bondy upgrade changed the cursor encoding, or the cursor was replayed against a different query). Restart pagination from the first page (omit `_cursor`) rather than retrying the same one.

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
            'description': 'stale'
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
