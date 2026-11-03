# bondy.error.invalid_datatype
Bondy 1.0.0 does not return this error URI.

## Description
The condition is an argument whose value does not have the data type that the procedure requires.

The caller receives [`bondy.error.unknown_error`](/connect/reference/wamp_api/errors/unknown_error) instead. In that error, `code` is `invalid_datatype`. `details.key` names the property and `details.value` holds the value, as text. `description` names the data type that the property requires.
