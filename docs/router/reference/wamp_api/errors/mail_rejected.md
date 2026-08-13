# bondy.error.mail_rejected
When the relay refused the message.

## Description
The relay answered with a `5xx` reply: an unknown recipient, a blocked sender, a message it will not carry. Offering it again produces the same answer, so it is never retried.

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
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        'relay': {
            'type': 'string',
            'description': 'The configured NAME of the relay.'
        },
        'code': {
            'type': 'string',
            'description': 'The three-digit SMTP reply code, and nothing else from the reply. A relay banner is written by someone other than Bondy and may say anything at all; the code is the part a caller can act on.'
        }
	})"
/>

## See also
- [Mail](/router/concepts/mail) — the model these errors come from.
- [Mail WAMP API](/router/reference/wamp_api/mail) — the procedures that raise them.
- [Mail Configuration Reference](/router/reference/configuration/mail) — the keys that decide them.
