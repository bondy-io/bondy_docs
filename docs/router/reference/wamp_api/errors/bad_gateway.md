# bondy.error.bad_gateway
When an upstream service that Bondy forwards to gives no usable answer.

## Description
Three components raise this error. Each one sends it in a different shape.

The `forward` action of an [API Gateway Specification](/router/reference/api_gateway/specification) raises it when a request to the upstream HTTP host fails and the failure is not a timeout. Examples are a refused connection and a host name that does not resolve. The original HTTP caller receives `502 Bad Gateway`. The response body is the standard [error payload](/router/reference/errors#the-error-payload) as JSON. `message` names the upstream URL, and `details.url` holds it. The underlying connection error goes to the log only. An upstream that does not respond in time gives [`bondy.error.gateway_timeout`](/router/reference/errors#system) (`504`) instead. An upstream that answers with any status does not give this error: the action's `on_result` or `on_error` response applies.

The [HTTP connector](/router/reference/configuration/http_connector) raises it to a WAMP caller in two cases:

- The connection to the upstream fails, and the cause is neither a timeout nor a pool that is down.
- The upstream answers with a `3xx` status, or with a `5xx` status other than `504`. A `503` answer is one of these cases.

A connect, pool checkout or response that outlasts the procedure's `timeout` gives `bondy.error.gateway_timeout`. A `504` or `408` answer from the upstream gives `wamp.error.timeout`. A connector whose connection pool is down gives `wamp.error.unavailable`.

A procedure that Bondy projects from an [MCP upstream](/router/reference/configuration/mcp) raises it when the upstream MCP session is not available or the upstream MCP server cannot be reached.

##### Positional Results
None. The HTTP connector and the MCP upstream send an `ERROR` with no positional arguments. The `forward` action answers over HTTP, which has no positional arguments.

##### Keyword Results
The HTTP connector and the MCP upstream send the keyword arguments below. They do not send the standard error payload.

<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        'status': {
            'type': 'integer',
            'description': 'HTTP connector only. 502 when the upstream sent no response. Otherwise the status the upstream answered with.'
        },
        'message': {
            'type': 'string',
            'description': 'Present when the upstream sent no response. The HTTP connector sends Upstream connection failed. The MCP upstream sends Upstream MCP session unavailable or Upstream MCP server unreachable.'
        },
        'body': {
            'type': 'any',
            'description': 'HTTP connector only, when the upstream answered. The response body, decoded when it is JSON and as received otherwise.'
        }
	})"
/>
