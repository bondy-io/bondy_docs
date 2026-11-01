# bondy.error.invalid_recipient
When an address in the request is not a valid address.

## Description
Every address in `to`, `cc`, `bcc`, `reply_to` and `from` is syntax-validated before the request is queued, so a malformed address is refused immediately rather than after a worker has opened a connection.

A relay may also reject a recipient it considers invalid; that arrives as [`bondy.error.mail_rejected`](/router/reference/wamp_api/errors/mail_rejected) instead, because it is the relay's judgement rather than Bondy's.

|Handle|Nature|HTTP status|
|:---|:---|:---|
|`M005`|`permanent`|`400`|

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
The standard [error payload](/router/reference/errors#the-error-payload). Each key of `details` also appears at the top level.

<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        'code': {
            'type': 'string',
            'description': 'invalid_recipient'
        },
        'details': {
            'type': 'object',
            'description': 'Holds address, the value that is not a valid address.'
        }
	})"
/>

## See also
- [Mail](/router/concepts/mail) — the model these errors come from.
- [Mail WAMP API](/router/reference/wamp_api/mail) — the procedures that raise them.
- [Mail Configuration Reference](/router/reference/configuration/mail) — the keys that decide them.
