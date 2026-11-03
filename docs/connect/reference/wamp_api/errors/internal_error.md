# bondy.error.internal_error
When Bondy fails for a reason that it cannot describe safely to the caller.

## Description
Bondy raises this error when a procedure fails with a reason that the [error catalogue](/connect/reference/errors) does not hold. It also raises this error when a call crashes in call routing, in procedure registration or in a Bondy procedure. The caller receives the error both when the failure happens on the caller's node and when it happens on the cluster node that the call was forwarded to.

The error carries no detail about the reason. It carries a `trace_id` instead. When Bondy logs the failure through the error value, the log entry has the same `trace_id`. A crash in a call that was forwarded to another node is logged in this way. Other failures can produce no log entry with that `trace_id`. Give the `trace_id` to an administrator when you report the error.

The error is `transient`. The HTTP status is `500`.

##### Positional Results
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        0: {
            'type': 'string',
            'description': 'The error message: Internal system error.'
        }
	})"
/>

##### Keyword Results
The standard [error payload](/connect/reference/errors#the-error-payload), with `details` empty.

<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        'code': {
            'type': 'string',
            'description': 'internal_error'
        },
        'trace_id': {
            'type': 'string',
            'description': 'A W3C Trace Context trace-id: 32 lowercase hex characters.'
        }
	})"
/>
