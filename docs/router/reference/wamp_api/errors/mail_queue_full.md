# bondy.error.mail_queue_full
When the relay's queue is at its bound.

## Description
More messages are waiting for this relay than `mail.relay.$name.queue.max_size` allows.

Refusing is deliberate, and is the whole backpressure contract: a caller that blocked on a stalled relay would have moved the stall rather than absorbed it — and for the broker bridge, that somewhere else is a subscriber processing router events. So a full queue answers immediately and says the condition is temporary.

A queue that fills persistently means the relay cannot keep up with what is being sent to it. Raise `pool.size` if the relay can take more concurrency, or `rate_limit.rate` if Bondy is throttling below what the relay allows; raising `queue.max_size` alone only delays the same answer.

|Handle|Nature|HTTP status|
|:---|:---|:---|
|`M009`|`transient`|`429`|

##### Positional Results
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        0: {
            'type': 'string',
            'description': 'The error message.'
        }
	})"
/>

##### Keyword Results
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        'relay': {
            'type': 'string',
            'description': 'The configured NAME of the relay. Never its hostname, username or credential.'
        }
	})"
/>

## See also
- [Mail](/router/concepts/mail) — the model these errors come from.
- [Mail WAMP API](/router/reference/wamp_api/mail) — the procedures that raise them.
- [Mail Configuration Reference](/router/reference/configuration/mail) — the keys that decide them.
