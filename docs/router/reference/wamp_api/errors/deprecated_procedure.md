# bondy.error.deprecated_procedure
When the called procedure has been deprecated.

## Description
Bondy raises this error instead of `wamp.error.no_such_procedure` for a reserved URI that it does not serve because another procedure does the same job. Examples are [`bondy.oauth2.token.lookup`](/router/reference/wamp_api/oauth2#not-implemented), and [`bondy.source.get`](/router/reference/wamp_api/source#retrieve-a-source-from-a-realm) with its legacy alias `bondy.security.find_source`. The error message names the deprecated URI; check the corresponding reference page for its replacement.

##### Positional Results
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        0: {
            'type': 'string',
            'description': 'The error message, naming the deprecated procedure URI'
        }
	})"
/>

##### Keyword Results
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        'message': {
            'type': 'string',
            'description': 'The error message'
        }
	})"
/>
