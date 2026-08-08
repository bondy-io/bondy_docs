# bondy.error.mail_delivery_failed
When delivery failed after exhausting its retries or its deadline.

## Description
A transient failure — a `4xx` reply, a timeout, a dropped connection, a failed TLS handshake — that did not succeed within the relay's `retry.max_attempts` or the request's own deadline, whichever ran out first.

Transient means the *nature* of the failure, not that Bondy is still trying: it has stopped. The message may well succeed if sent again later, which is what distinguishes this from [`bondy.error.mail_rejected`](/reference/wamp_api/errors/mail_rejected).

For a message sent with [`bondy.mail.send_async`](/reference/wamp_api/mail) there is no caller to receive this error; the failure is recorded in the message's status, counted as a dead letter, and logged.

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
- [Mail](/concepts/mail) — the model these errors come from.
- [Mail WAMP API](/reference/wamp_api/mail) — the procedures that raise them.
- [Mail Configuration Reference](/reference/configuration/mail) — the keys that decide them.
