# wamp.error.timeout
When an operation did not finish within its timeout.

## Description
Bondy raises this error in these cases:

- The dealer's call timeout elapses before the callee answers. The `ERROR` message's `Details` hold `procedure_uri` and `timeout`, the timeout in milliseconds. `Args[0]` states the timeout. The message has no keyword arguments. See [`wamp.call_timeout`](/connect/reference/configuration/wamp#call-timeout).
- A `bondy.*` procedure runs out of the time budget that the call set.
- An [HTTP connector](/connect/reference/configuration/http_connector) upstream answers with status `504` or `408`. The keyword arguments are `status` and `body`.
- A `SUBSCRIBE` times out while the broker waits for the subscription to complete.

The time budget of a `bondy.*` procedure comes from the `CALL.Options._deadline` extension option, in milliseconds from now. A caller can only shorten what a procedure would otherwise wait: a deadline says when to give up, not how long the router can take.

[`bondy.alarm.history`](/connect/reference/wamp_api/alarm#bondy-alarm-history-page) raises it on a **progressive** walk whose deadline is spent. The chunks already delivered are complete as far as they go; nothing after them was read. The error settles the call in place of a final result, because a truncated stream marked `has_more: false` would claim to be complete. When paging rather than streaming, a spent budget is not an error at all — the page stops early and its `cursor` resumes where it stopped.

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
            'description': 'timeout'
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
