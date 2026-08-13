# bondy.error.relay_not_permitted
When the calling realm may not use the named relay.

## Description
The relay exists, but the calling realm is not in its `mail.relay.$name.realms` list.

That list is operator-owned and **default-deny**: a relay with no `realms` configured is available to the master realm only. It lives in `bondy.conf` rather than in realm state precisely so that a realm administrator cannot grant their own realm access to a relay — that would be privilege escalation across the operator/tenant boundary.

A prototype URI in the list admits every realm that inherits from it, so the fix for a family of tenant realms is usually one line. See [Configuring Mail Relays](/router/guides/administration/configuring_mail_relays).

|Handle|Nature|HTTP status|
|:---|:---|:---|
|`M003`|`permanent`|`403`|

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
