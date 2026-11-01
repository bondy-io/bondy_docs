# bondy.error.no_such_groups
Bondy 1.0.0 does not return this error URI.

## Description
The condition is a user or group that names a group that does not exist in the realm or in its prototype. [`bondy.user.add`](/router/reference/wamp_api/user), [`bondy.user.update`](/router/reference/wamp_api/user), [`bondy.group.add`](/router/reference/wamp_api/group) and [`bondy.group.update`](/router/reference/wamp_api/group) check this condition.

The caller of a procedure that meets this condition receives [`bondy.error.internal_error`](/router/reference/wamp_api/errors/internal_error) instead. The error carries a `trace_id` and no detail about the condition.
