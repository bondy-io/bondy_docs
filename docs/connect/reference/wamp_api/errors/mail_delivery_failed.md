# bondy.error.mail_delivery_failed
When delivery failed and the relay's retry budget ran out.

## Description
Bondy raises this error when the last delivery attempt failed with a transient failure and the relay's retry budget ran out. `mail.relay.$name.retry.max_attempts` sets that budget. The last failure is one of these:

- A `4xx` reply from the relay.
- A response that the SMTP client did not expect.
- A failure that the SMTP client did not classify.

Other transient failures give other errors. A timeout on the last attempt, or a request deadline that runs out first, gives `bondy.error.request_timeout`. A network failure on the last attempt gives [`bondy.error.relay_unavailable`](/connect/reference/wamp_api/errors/relay_unavailable).

Transient is the nature of the failure. Bondy has stopped trying. The same message can succeed when it is sent again later. That is the difference from [`bondy.error.mail_rejected`](/connect/reference/wamp_api/errors/mail_rejected).

For a message sent with [`bondy.mail.send_async`](/connect/reference/wamp_api/mail) there is no caller to receive this error; the failure is recorded in the message's status, counted as a dead letter, and logged.

|Handle|Nature|HTTP status|
|:---|:---|:---|
|`M007`|`transient`|`502`|

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
The standard [error payload](/connect/reference/errors#the-error-payload). The top-level `code` is `mail_delivery_failed`. The SMTP reply code is in `details.code` only.

<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        'code': {
            'type': 'string',
            'description': 'mail_delivery_failed'
        },
        'details': {
            'type': 'object',
            'description': 'Holds code, the three-digit SMTP reply code of the last attempt, when the relay answered with a 4xx reply. Nothing else from the reply reaches the caller. Empty otherwise.'
        }
	})"
/>

## See also
- [Mail](/connect/concepts/mail) — the model these errors come from.
- [Mail WAMP API](/connect/reference/wamp_api/mail) — the procedures that raise them.
- [Mail Configuration Reference](/connect/reference/configuration/mail) — the keys that decide them.
