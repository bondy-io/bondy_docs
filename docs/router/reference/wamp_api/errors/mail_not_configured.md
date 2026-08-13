# bondy.error.mail_not_configured
When no mail relay is configured, or the named one cannot be used as configured.

## Description
Bondy sends email through relays declared in `bondy.conf`. With no `mail.relay.*` key configured the subsystem is **dormant**: the node boots normally, logs one informational line, and every mail procedure answers this error. That is a deliberate state and not a fault — configuring email is an operator's choice, and a node that has not made it must still boot.

The same error is raised when a relay *is* declared but cannot be used as configured — for example its credential could not be resolved, so it was dropped at startup rather than started unauthenticated. Saying "not configured" of a relay that is plainly present in `bondy.conf` would send an operator looking in the wrong place, so the message distinguishes the two cases.

See the [Mail Configuration Reference](/router/reference/configuration/mail).

|Handle|Nature|HTTP status|
|:---|:---|:---|
|`M001`|`permanent`|`501`|

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
