# bondy.error.stale
Bondy 1.0.0 does not return this error URI.

## Description
The condition is a `cursor` keyword argument that was minted for a different query, or by a release with a different cursor encoding.

The caller of a procedure that meets this condition receives [`bondy.error.internal_error`](/router/reference/wamp_api/errors/internal_error) instead. The error carries a `trace_id` and no detail about the condition.

This applies to the paginated registry procedures, for example [`bondy.registration.list`](/router/reference/wamp_api/registration#list-registrations-paginated). [`bondy.alarm.history`](/router/reference/wamp_api/alarm) answers the same condition with [`wamp.error.invalid_argument`](/router/reference/wamp_api/errors/wamp_invalid_argument), and `details.reason` is `stale`. In both cases, restart from the first page: omit `cursor`.
