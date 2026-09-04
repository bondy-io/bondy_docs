# Errors

The error URIs raised by the administrative WAMP API, with a page each.

For the shape of the payload that accompanies any of them &mdash; and for the
complete catalogue of error URIs across the router, the HTTP API Gateway and the
cluster &mdash; see the [Error Reference](/router/reference/errors).

## Bondy Error URIs

* [bondy.error.active_users](/router/reference/wamp_api/errors/active_users): when the provided resource has associated users.
* [bondy.error.already_exists](/router/reference/wamp_api/errors/already_exists): when the provided resource identifier already exists.
* [bondy.error.bad_gateway](/router/reference/wamp_api/errors/bad_gateway): when the HTTP API Gateway cannot reach a forward action's upstream host.
* [bondy.error.bad_signature](/router/reference/wamp_api/errors/bad_signature): when the provided password doesn't match with the previous one.
* [bondy.error.deprecated_procedure](/router/reference/wamp_api/errors/deprecated_procedure): when the called procedure has been deprecated.
* [bondy.error.export_in_progress](/router/reference/wamp_api/errors/export_in_progress): when an export or import is requested while an export is already running.
* [bondy.error.http_gateway.invalid_expression](/router/reference/wamp_api/errors/invalid_expression): when a Mops expression in an API Gateway Specification fails to evaluate.
* [bondy.error.import_in_progress](/router/reference/wamp_api/errors/import_in_progress): when an export or import is requested while an import is already running.
* [bondy.error.inconsistency_error](/router/reference/wamp_api/errors/inconsistency_error): an internal consistency check failure, not caused by client or procedure behaviour.
* [bondy.error.internal_error](/router/reference/wamp_api/errors/internal_error): when there is an internal or unexpected error.
* [bondy.error.invalid_data](/router/reference/wamp_api/errors/invalid_data): when the data values are invalid.
* [bondy.error.invalid_datatype](/router/reference/wamp_api/errors/invalid_datatype): when the data type is invalid.
* [bondy.error.invalid_recipient](/router/reference/wamp_api/errors/invalid_recipient): when an address in a mail request is not a valid address.
* [bondy.error.invalid_value](/router/reference/wamp_api/errors/invalid_value): when the data value is invalid.
* [bondy.error.mail_delivery_failed](/router/reference/wamp_api/errors/mail_delivery_failed): when mail delivery failed after exhausting its retries or its deadline.
* [bondy.error.mail_not_configured](/router/reference/wamp_api/errors/mail_not_configured): when no mail relay is configured, or the named one cannot be used as configured.
* [bondy.error.mail_queue_full](/router/reference/wamp_api/errors/mail_queue_full): when a mail relay's queue is at its bound.
* [bondy.error.mail_rejected](/router/reference/wamp_api/errors/mail_rejected): when a mail relay refused the message.
* [bondy.error.malformed](/router/reference/wamp_api/errors/malformed): when a pagination `cursor` isn't a decodable cursor at all.
* [bondy.error.missing_required_value](/router/reference/wamp_api/errors/missing_required_value): when a required value is not provided.
* [bondy.error.no_such_groups](/router/reference/wamp_api/errors/no_such_groups): when there is a group name that doesn't exist.
* [bondy.error.no_such_relay](/router/reference/wamp_api/errors/no_such_relay): when the named mail relay does not exist.
* [bondy.error.no_such_users](/router/reference/wamp_api/errors/no_such_users): when there is a username that doesn't exist.
* [bondy.error.not_found](/router/reference/wamp_api/errors/not_found): when the resource with the provided identifier doesn't exist.
* [bondy.error.property_range_limit](/router/reference/wamp_api/errors/property_range_limit): when a property's value would exceed the maximum number of values allowed.
* [bondy.error.relay_not_permitted](/router/reference/wamp_api/errors/relay_not_permitted): when the calling realm may not use the named mail relay.
* [bondy.error.relay_unavailable](/router/reference/wamp_api/errors/relay_unavailable): when a mail relay could not be reached.
* [bondy.error.running](/router/reference/wamp_api/errors/running): when an operation cannot proceed because the resource it targets is running or restarting.
* [bondy.error.sender_not_permitted](/router/reference/wamp_api/errors/sender_not_permitted): when the requested sender address is outside what the mail relay allows.
* [bondy.error.stale](/router/reference/wamp_api/errors/stale): when a pagination `cursor` no longer matches the query it was minted for.
* [bondy.error.timeout](/router/reference/wamp_api/errors/timeout): when the operation execution can't be performed in the provided timeout.
* [bondy.error.too_many_results](/router/reference/wamp_api/errors/too_many_results): when a bounded `wamp.*` meta enumeration would exceed its result limit.
* [bondy.error.unavailable](/router/reference/wamp_api/errors/unavailable): when one or more cluster nodes could not be reached to confirm the result of a cluster-wide request.
* [bondy.error.unknown_error](/router/reference/wamp_api/errors/unknown_error): a catch-all for an internal error that doesn't map to a more specific code.
* [bondy.error.unknown_group](/router/reference/wamp_api/errors/unknown_group): when the group with the provided name doesn't exist.
* [bondy.error.unknown_roles](/router/reference/wamp_api/errors/unknown_roles): when the role or roles with the provided name doesn't/don't exist.


## WAMP Error URIs

* [wamp.error.invalid_argument](/router/reference/wamp_api/errors/wamp_invalid_argument): when the given argument type or value is invalid.
* [wamp.error.no_such_principal](/router/reference/wamp_api/errors/wamp_no_such_principal): when the given authid does not exist.
* [wamp.error.no_such_realm](/router/reference/wamp_api/errors/wamp_no_such_realm): when the given realm uri does not exist.
* [wamp.error.no_such_registration](/router/reference/wamp_api/errors/wamp_no_such_registration): when no registration exists for the given registration id.
* [wamp.error.no_such_subscription](/router/reference/wamp_api/errors/wamp_no_such_subscription): when no subscription exists for the given subscription id.
* [wamp.error.timeout](/router/reference/wamp_api/errors/wamp_timeout): when an operation did not finish within the `_deadline` the caller set.