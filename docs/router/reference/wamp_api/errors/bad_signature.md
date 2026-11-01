# bondy.error.bad_signature
Bondy 1.0.0 does not return this error URI.

## Description
The condition is a call to [`bondy.user.change_password`](/router/reference/wamp_api/user) that supplies the old password, when the old password does not match the stored one.

The caller of a procedure that meets this condition receives [`bondy.error.internal_error`](/router/reference/wamp_api/errors/internal_error) instead. The error carries a `trace_id` and no detail about the condition.
