# bondy.error.relay_unavailable
When the relay could not be reached.

## Description
Bondy raises this error when the last delivery attempt failed with a network failure, for example a refused connection. It also raises this error when no delivery worker of the relay is running, for example while the worker restarts. A timeout gives `bondy.error.request_timeout` instead.

Repeated transient failures mark the relay down and raise the `mail_relay_down` alarm; see `mail.relay.$name.health.failure_threshold` in the [Mail Configuration Reference](/router/reference/configuration/mail).

|Handle|Nature|HTTP status|
|:---|:---|:---|
|`M008`|`transient`|`503`|

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
The standard [error payload](/router/reference/errors#the-error-payload).

<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        'code': {
            'type': 'string',
            'description': 'relay_unavailable'
        },
        'details': {
            'type': 'object',
            'description': 'Empty. The error names no relay.'
        }
	})"
/>

## See also
- [Mail](/router/concepts/mail) — the model these errors come from.
- [Mail WAMP API](/router/reference/wamp_api/mail) — the procedures that raise them.
- [Mail Configuration Reference](/router/reference/configuration/mail) — the keys that decide them.
