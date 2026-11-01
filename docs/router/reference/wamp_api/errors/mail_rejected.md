# bondy.error.mail_rejected
When the relay refused the message.

## Description
The relay answered with a `5xx` reply: an unknown recipient, a blocked sender, a message it will not carry. Bondy also raises this error for a permanent delivery failure that has no more specific error. Offering the message again produces the same answer, so Bondy does not retry it.

The HTTP status is **400 and not 502**. A gateway status would suggest an upstream problem worth retrying; the relay was reachable and working, and it declined this particular message.

Only the three-digit reply code reaches the caller. A relay's rejection text can echo the recipient, the subject, or whatever else its operator chose to put in a banner, so the rest stays in the log.

|Handle|Nature|HTTP status|
|:---|:---|:---|
|`M006`|`permanent`|`400`|

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
The standard [error payload](/router/reference/errors#the-error-payload). The top-level `code` is `mail_rejected`. The SMTP reply code is in `details.code` only.

<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        'code': {
            'type': 'string',
            'description': 'mail_rejected'
        },
        'details': {
            'type': 'object',
            'description': 'Holds code, the three-digit SMTP reply code, when the relay answered with a 5xx reply. Nothing else from the reply reaches the caller. Empty otherwise.'
        }
	})"
/>

## See also
- [Mail](/router/concepts/mail) — the model these errors come from.
- [Mail WAMP API](/router/reference/wamp_api/mail) — the procedures that raise them.
- [Mail Configuration Reference](/router/reference/configuration/mail) — the keys that decide them.
