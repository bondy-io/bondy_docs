# bondy.error.http_gateway.invalid_expression
When a [Mops expression](/reference/api_gateway/expressions) in an API Gateway Specification fails to evaluate.

## Description
Raised while the HTTP API Gateway evaluates a `mops` expression against the [API Context](/reference/api_gateway/specification#api-context) for an incoming request. Two distinct causes map to this same error: a malformed or otherwise invalid expression, or a well-formed expression that reads a key the context doesn't have — for example, a WAMP or HTTP action's response is missing the property the expression expects. Check the API Gateway Specification's action definitions against the actual shape of the response it receives.

##### Positional Results
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        0: {
            'type': 'string',
            'description': 'The error message, naming the failing expression and the value or key it failed against'
        }
	})"
/>

##### Keyword Results
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        'code': {
            'type': 'string',
            'description': 'http_gateway.invalid_expression'
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
