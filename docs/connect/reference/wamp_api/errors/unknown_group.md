# bondy.error.unknown_group
Bondy 1.0.0 does not return this error URI.

## Description
The condition is a group operation, such as [`bondy.group.update`](/connect/reference/wamp_api/group) or [`bondy.group.delete`](/connect/reference/wamp_api/group), on a group that does not exist in the realm.

The caller of a procedure that meets this condition receives [`bondy.error.internal_error`](/connect/reference/wamp_api/errors/internal_error) instead. The error carries a `trace_id` and no detail about the condition.
