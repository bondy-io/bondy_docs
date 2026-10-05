# wamp.error.timeout
When an operation did not finish within the time the caller allowed it.

## Description
Raised when a `bondy.*` procedure runs out of the time budget the call set, and stops rather than answering with a partial result presented as a whole one.

The budget comes from the `CALL.Options._deadline` extension option — milliseconds from now, after which to give up. A caller can only *shorten* what a procedure would otherwise wait: a deadline says when to give up, not how long the router may take.

[`bondy.alarm.history`](/router/reference/wamp_api/alarm#bondy-alarm-history-page) raises it on a **progressive** walk whose deadline is spent. The chunks already delivered are complete as far as they go; nothing after them was read. The error settles the call in place of a final result, because a truncated stream marked `has_more: false` would claim to be complete. When paging rather than streaming, a spent budget is not an error at all — the page stops early and its `cursor` resumes where it stopped.

Distinct from [`bondy.error.timeout`](/router/reference/wamp_api/errors/timeout), which is Bondy waiting on the result of a call it issued internally.

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
