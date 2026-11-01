# bondy.error.running
Bondy 1.0.0 does not return this error URI.

## Description
The condition is a call to [`bondy.router.bridge.remove`](/router/reference/wamp_api/bridge_relay) for a bridge relay that runs or restarts. Stop the bridge relay first, then remove it.

The caller of a procedure that meets this condition receives [`bondy.error.internal_error`](/router/reference/wamp_api/errors/internal_error) instead. The error carries a `trace_id` and no detail about the condition.
