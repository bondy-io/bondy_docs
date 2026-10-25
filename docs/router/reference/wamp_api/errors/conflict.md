# bondy.error.conflict
When a request conflicts with the current state of the resource it names.

## Description
Bondy raises this error when a deletion would leave other resources without something they depend on. The error is permanent: the same call fails in the same way until you remove the dependent resources. Over HTTP, Bondy maps it to the status `409 Conflict`.

These procedures raise it:

- [`bondy.realm.delete`](/router/reference/wamp_api/realm#delete-a-realm) when other realms use the realm as their prototype or SSO realm. `details.realms` lists those realms. The `force` option does not override this refusal.
- [`bondy.realm.delete`](/router/reference/wamp_api/realm#delete-a-realm) when the realm has users and `force` is `false`.
- [`bondy.user.delete`](/router/reference/wamp_api/user#delete-a-user-from-a-realm) when other realms hold a local user of the same name that uses this realm as its SSO realm. `details.realms` lists those realms.

The `description` field names what to remove before you call again.

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
            'description': 'conflict'
        },
        'message': {
            'type': 'string',
            'description': 'The error message'
        },
        'description': {
            'type': 'string',
            'description': 'What to remove before calling again'
        },
        'details': {
            'type': 'object',
            'description': 'Holds `realms`, the dependent realms, when the refusal names them'
        }
	})"
/>
