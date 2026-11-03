# bondy.error.http_gateway.invalid_expression
When a [Mops expression](/connect/reference/api_gateway/expressions) in an API Gateway Specification fails to evaluate.

## Description
Raised while the HTTP API Gateway evaluates a `mops` expression against the [API Context](/connect/reference/api_gateway/specification#api-context) for an incoming request. Two distinct causes map to this same error: a malformed or otherwise invalid expression, or a well-formed expression that reads a key the context doesn't have — for example, a WAMP or HTTP action's response is missing the property the expression expects. Check the API Gateway Specification's action definitions against the actual shape of the response it receives.

When the gateway evaluates an expression for an incoming request, the HTTP caller receives `500` and the standard [error payload](/connect/reference/errors#the-error-payload) as the JSON body. When [`bondy.http_gateway.api.load`](/connect/reference/wamp_api/api_gateway) evaluates an expression while it loads a specification, the WAMP caller receives the error.

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
            'description': 'bondy.error.http_gateway.invalid_expression. The code is the full URI.'
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
