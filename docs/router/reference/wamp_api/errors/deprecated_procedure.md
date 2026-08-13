# bondy.error.deprecated_procedure
When the called procedure has been deprecated.

## Description
Raised instead of `wamp.error.no_such_procedure` for a URI that once worked and has since been retired in favour of a replacement — for example [`bondy.oauth2.token.lookup`](/router/reference/wamp_api/oauth2#not-implemented). The error message names the deprecated URI; check the corresponding reference page for its replacement.

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
