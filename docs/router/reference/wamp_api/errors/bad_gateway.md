# bondy.error.bad_gateway
When the HTTP API Gateway cannot reach the upstream server a request was forwarded to.

## Description
Raised by a `forward` action in an [API Gateway Specification](/router/reference/api_gateway/specification) when a request to the upstream HTTP/REST host gets no response, for example because the connection is refused or the host name does not resolve. It surfaces to the original HTTP caller as `502 Bad Gateway`. An upstream that does not respond in time raises [`bondy.error.gateway_timeout`](/router/reference/errors#system) (`504`) instead. A request that gets a response of any status does not raise this error: Bondy returns that response to the caller as it is.

The [HTTP connector](/router/reference/configuration/http_connector) raises it to a WAMP caller in two cases:

- The connection to the upstream fails, and the cause is neither a timeout nor a pool that is down.
- The upstream answers with a `3xx` status, or with a `5xx` status other than `504`.

A connect, pool checkout or response that outlasts the procedure's `timeout` raises `bondy.error.gateway_timeout` (`504`). A `504` answer from the upstream raises `wamp.error.timeout`. A connector whose connection pool is down raises `wamp.error.unavailable`.

The results below describe the error body of a `forward` action. The HTTP connector's error has no positional arguments. Its kwargs carry `status` and `message` when the upstream sent no response, and `status` and `body` when the upstream answered.

##### Positional Results
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        0: {
            'type': 'string',
            'description': 'The error message, including the upstream URL Bondy failed to reach'
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
        'details': {
            'type': 'object',
            'description': 'Holds `url`, the upstream URL Bondy failed to reach. The underlying connection error is logged, not returned.'
        },
        'message': {
            'type': 'string',
            'description': 'The error message'
        }
	})"
/>
