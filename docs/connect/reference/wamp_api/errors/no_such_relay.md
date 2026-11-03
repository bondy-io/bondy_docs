# bondy.error.no_such_relay
When the named mail relay does not exist.

## Description
The request named a relay that is not declared in `bondy.conf`, or named none while several are configured and `mail.default_relay` is unset.

Bondy does not guess which relay a caller meant when there are several: guessing is how mail goes out through the wrong one. Call [`bondy.mail.relay.list`](/connect/reference/wamp_api/mail) to see the relays the calling realm may use.

This can also occur *after* a message was queued, if the relay was reconfigured away while the message was waiting.

|Handle|Nature|HTTP status|
|:---|:---|:---|
|`M002`|`permanent`|`400`|

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
The standard [error payload](/connect/reference/errors#the-error-payload). Each key of `details` also appears at the top level.

<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        'code': {
            'type': 'string',
            'description': 'no_such_relay'
        },
        'details': {
            'type': 'object',
            'description': 'Holds relay, the name the request gave. Empty when the request named no relay.'
        }
	})"
/>

## See also
- [Mail](/connect/concepts/mail) — the model these errors come from.
- [Mail WAMP API](/connect/reference/wamp_api/mail) — the procedures that raise them.
- [Mail Configuration Reference](/connect/reference/configuration/mail) — the keys that decide them.
