# bondy.error.no_such_users
Bondy 1.0.0 does not return this error URI.

## Description
The condition is a call to [`bondy.source.add`](/connect/reference/wamp_api/source) whose `usernames` names a user that does not exist.

The caller of a procedure that meets this condition receives [`bondy.error.internal_error`](/connect/reference/wamp_api/errors/internal_error) instead. The error carries a `trace_id` and no detail about the condition.
