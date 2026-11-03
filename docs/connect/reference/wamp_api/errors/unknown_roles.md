# bondy.error.unknown_roles
Bondy 1.0.0 does not return this error URI.

## Description
The condition is a call to [`bondy.grant.create`](/connect/reference/wamp_api/grant) or [`bondy.grant.revoke`](/connect/reference/wamp_api/grant) that names a role that is neither a user nor a group of the realm.

The caller of a procedure that meets this condition receives [`bondy.error.internal_error`](/connect/reference/wamp_api/errors/internal_error) instead. The error carries a `trace_id` and no detail about the condition.
