# bondy.error.sender_not_permitted
When the requested sender address is outside what the relay allows.

## Description
The request supplied a `from` whose domain is not in the relay's `mail.relay.$name.allowed_from` list. With that key unset — the default — a caller cannot set `from` at all and always sends as the relay's configured sender.

This is a **narrowing**, not a check applied after the fact. Validating an asserted sender fails open when misconfigured: forget to configure it and everything is permitted. Deriving the sender from the relay and narrowing within an explicit list fails closed. You cannot spoof what you cannot set.

Omit `from` to send as the relay's own sender, or ask an operator to add the domain.

|Handle|Nature|HTTP status|
|:---|:---|:---|
|`M004`|`permanent`|`403`|

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
            'description': 'sender_not_permitted'
        },
        'details': {
            'type': 'object',
            'description': 'Holds relay, the configured name of the relay, and address, the sender address that the relay refused.'
        }
	})"
/>

## See also
- [Mail](/connect/concepts/mail) — the model these errors come from.
- [Mail WAMP API](/connect/reference/wamp_api/mail) — the procedures that raise them.
- [Mail Configuration Reference](/connect/reference/configuration/mail) — the keys that decide them.
