# bondy.error.import_in_progress
Bondy 1.0.0 does not return this error URI.

## Description
The condition is a call to [`bondy.export.create`](/connect/reference/wamp_api/export) or [`bondy.export.import`](/connect/reference/wamp_api/export) while an import runs on the node. A node runs one export or import at a time.

The caller of a procedure that meets this condition receives [`bondy.error.internal_error`](/connect/reference/wamp_api/errors/internal_error) instead. The error carries a `trace_id` and no detail about the condition.

Call [`bondy.export.status`](/connect/reference/wamp_api/export) to see whether an export or import runs.
