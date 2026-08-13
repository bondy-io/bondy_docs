# bondy.error.relay_unavailable
When the relay could not be reached.

## Description
Bondy could not establish a usable connection to the relay: the connection was refused, timed out, or the TLS handshake failed.

A TLS handshake failure is transient rather than permanent on purpose — a certificate chain being rotated is a temporary condition, and the relay may verify on the next attempt.

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
