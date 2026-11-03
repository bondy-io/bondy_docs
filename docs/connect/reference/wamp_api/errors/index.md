# Errors

The error URIs raised by the administrative WAMP API, with a page each.

For the shape of the payload that accompanies any of them &mdash; and for the
complete catalogue of error URIs across the router, the HTTP API Gateway and the
cluster &mdash; see the [Error Reference](/connect/reference/errors).

## Bondy Error URIs

* [bondy.error.already_exists](/connect/reference/wamp_api/errors/already_exists): when the provided resource identifier already exists.
* [bondy.error.bad_gateway](/connect/reference/wamp_api/errors/bad_gateway): when an upstream service that Bondy forwards to gives no usable answer.
* [bondy.error.conflict](/connect/reference/wamp_api/errors/conflict): when the request conflicts with the current state of the resource, for example deleting a realm other realms depend on.
* [bondy.error.deprecated_procedure](/connect/reference/wamp_api/errors/deprecated_procedure): when the called procedure has been deprecated.
* [bondy.error.http_gateway.invalid_expression](/connect/reference/wamp_api/errors/invalid_expression): when a Mops expression in an API Gateway Specification fails to evaluate.
* [bondy.error.inconsistency_error](/connect/reference/wamp_api/errors/inconsistency_error): when the values of two or more properties in a request contradict each other.
* [bondy.error.internal_error](/connect/reference/wamp_api/errors/internal_error): when Bondy fails for a reason that it cannot describe safely to the caller.
* [bondy.error.invalid_data](/connect/reference/wamp_api/errors/invalid_data): when a request fails validation on more than one property.
* [bondy.error.invalid_recipient](/connect/reference/wamp_api/errors/invalid_recipient): when an address in a mail request is not a valid address.
* [bondy.error.invalid_value](/connect/reference/wamp_api/errors/invalid_value): when the data value is invalid.
* [bondy.error.mail_delivery_failed](/connect/reference/wamp_api/errors/mail_delivery_failed): when mail delivery failed and the relay's retry budget ran out.
* [bondy.error.mail_not_configured](/connect/reference/wamp_api/errors/mail_not_configured): when no mail relay is configured, or the named one cannot be used as configured.
* [bondy.error.mail_queue_full](/connect/reference/wamp_api/errors/mail_queue_full): when a mail relay's queue is at its bound.
* [bondy.error.mail_rejected](/connect/reference/wamp_api/errors/mail_rejected): when a mail relay refused the message.
* [bondy.error.missing_required_value](/connect/reference/wamp_api/errors/missing_required_value): when a required value is not provided.
* [bondy.error.no_such_relay](/connect/reference/wamp_api/errors/no_such_relay): when the named mail relay does not exist.
* [bondy.error.not_found](/connect/reference/wamp_api/errors/not_found): when the resource with the provided identifier doesn't exist.
* [bondy.error.property_range_limit](/connect/reference/wamp_api/errors/property_range_limit): when a property's value would exceed the maximum number of values allowed.
* [bondy.error.relay_not_permitted](/connect/reference/wamp_api/errors/relay_not_permitted): when the calling realm may not use the named mail relay.
* [bondy.error.relay_unavailable](/connect/reference/wamp_api/errors/relay_unavailable): when a mail relay could not be reached.
* [bondy.error.sender_not_permitted](/connect/reference/wamp_api/errors/sender_not_permitted): when the requested sender address is outside what the mail relay allows.
* [bondy.error.too_many_results](/connect/reference/wamp_api/errors/too_many_results): when a bounded `wamp.*` meta enumeration would exceed its result limit.
* [bondy.error.unavailable](/connect/reference/wamp_api/errors/unavailable): when one or more cluster nodes could not be reached to confirm the result of a cluster-wide request.
* [bondy.error.unknown_error](/connect/reference/wamp_api/errors/unknown_error): when an error carries a code that the error catalogue does not hold.

## WAMP Error URIs

* [wamp.error.invalid_argument](/connect/reference/wamp_api/errors/wamp_invalid_argument): when the given argument type or value is invalid.
* [wamp.error.no_such_principal](/connect/reference/wamp_api/errors/wamp_no_such_principal): when the given authid does not exist.
* [wamp.error.no_such_realm](/connect/reference/wamp_api/errors/wamp_no_such_realm): when the given realm uri does not exist.
* [wamp.error.no_such_registration](/connect/reference/wamp_api/errors/wamp_no_such_registration): when no registration exists for the given registration id.
* [wamp.error.no_such_subscription](/connect/reference/wamp_api/errors/wamp_no_such_subscription): when no subscription exists for the given subscription id.
* [wamp.error.timeout](/connect/reference/wamp_api/errors/wamp_timeout): when an operation did not finish within its timeout.

## URIs that Bondy 1.0.0 does not return

These pages name a condition and the error that Bondy 1.0.0 returns for it.

* [bondy.error.bad_signature](/connect/reference/wamp_api/errors/bad_signature): the old password given to `bondy.user.change_password` does not match.
* [bondy.error.export_in_progress](/connect/reference/wamp_api/errors/export_in_progress): an export or import is requested while an export runs.
* [bondy.error.import_in_progress](/connect/reference/wamp_api/errors/import_in_progress): an export or import is requested while an import runs.
* [bondy.error.invalid_datatype](/connect/reference/wamp_api/errors/invalid_datatype): a value does not have the required data type.
* [bondy.error.malformed](/connect/reference/wamp_api/errors/malformed): a pagination `cursor` does not decode.
* [bondy.error.no_such_groups](/connect/reference/wamp_api/errors/no_such_groups): a user or group names a group that does not exist.
* [bondy.error.no_such_users](/connect/reference/wamp_api/errors/no_such_users): a source names a user that does not exist.
* [bondy.error.running](/connect/reference/wamp_api/errors/running): a bridge relay that runs or restarts is removed.
* [bondy.error.stale](/connect/reference/wamp_api/errors/stale): a pagination `cursor` no longer matches its query.
* [bondy.error.timeout](/connect/reference/wamp_api/errors/timeout): a call times out.
* [bondy.error.unknown_group](/connect/reference/wamp_api/errors/unknown_group): a group operation names a group that does not exist.
* [bondy.error.unknown_roles](/connect/reference/wamp_api/errors/unknown_roles): a grant names a role that does not exist.
