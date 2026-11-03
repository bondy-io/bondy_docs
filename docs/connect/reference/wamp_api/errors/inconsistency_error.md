# bondy.error.inconsistency_error
When the values of two or more properties in a request contradict each other.

## Description
Each value can be valid on its own, but the combination is not. These procedures raise the error:

- [`bondy.realm.create`](/connect/reference/wamp_api/realm) and [`bondy.realm.update`](/connect/reference/wamp_api/realm) when `is_prototype` is `true` and `prototype_uri` is set.
- [`bondy.realm.create`](/connect/reference/wamp_api/realm) and [`bondy.realm.update`](/connect/reference/wamp_api/realm) when `is_sso_realm` is `true` and `sso_realm_uri` is set.
- [`bondy.realm.create`](/connect/reference/wamp_api/realm) and [`bondy.realm.update`](/connect/reference/wamp_api/realm) when `sso_realm_uri` is the realm's own URI.
- [`bondy.realm.update`](/connect/reference/wamp_api/realm) when the update changes the SSO realm of a realm that holds users linked to the current SSO realm. The same check applies to each realm that inherits `sso_realm_uri` from this realm as a prototype. The `description` lists the realms that hold linked users.
- [`bondy.grant.create`](/connect/reference/wamp_api/grant) and [`bondy.grant.revoke`](/connect/reference/wamp_api/grant) when a resource has an empty `uri` and a `match` other than `prefix`.

The error is `permanent`. Change the request so that the values agree. The HTTP status is `400`.

##### Positional Results
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        0: {
            'type': 'string',
            'description': 'The error message: The operation failed due to inconsistent values.'
        }
	})"
/>

##### Keyword Results
The standard [error payload](/connect/reference/errors#the-error-payload). `keys` and `keys_text` also appear at the top level.

<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        'code': {
            'type': 'string',
            'description': 'invalid_argument. The value is kept for compatibility. Branch on uri.'
        },
        'description': {
            'type': 'string',
            'description': 'Names the keys whose values are inconsistent, or explains the conflict.'
        },
        'details': {
            'type': 'object',
            'description': 'Holds keys, the list of property names, and keys_text, the same list as one string.'
        }
	})"
/>
