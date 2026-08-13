# bondy.error.bad_gateway
When the HTTP API Gateway cannot reach the upstream server a request was forwarded to.

## Description
Raised by a `forward` action in an [API Gateway Specification](/router/reference/api_gateway/specification) when Bondy's connection attempt to the upstream HTTP/REST host fails (connection refused, DNS failure, timeout, and similar). It surfaces to the original HTTP caller as `503 Service Unavailable`. It is not raised for a request Bondy successfully forwards and gets an error response for — that response is returned to the caller as-is, unmodified.

##### Positional Results
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        0: {
            'type': 'string',
            'description': 'The error message, including the upstream URL Bondy failed to connect to'
        }
	})"
/>

##### Keyword Results
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        'code': {
            'type': 'string',
            'description': 'bad_gateway'
        },
        'description': {
            'type': 'string',
            'description': 'The underlying connection error reason'
        },
        'message': {
            'type': 'string',
            'description': 'The error message'
        }
	})"
/>
