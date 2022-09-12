# WAMP Features Configuration Reference

## WAMP URIs

@[config](wamp.uri.strictness,loose|strict,loose,v0.9.0)


## Call Timeout

@[config](wamp.call_timeout,duration_time_units,30s,v0.1.0)

The default timeout for WAMP (RPC) Calls when the CALL.Options.timeout
property is not used. This value will be restricted by the
[`wamp.max_call_timeout`](#wamp.max_call_timeout) property.



@[config](wamp.max_call_timeout,duration_time_units,10m,v0.1.0)

The maximum timeout value for WAMP (RPC) Calls for the `CALL.Options.
timeout` or the [`wamp.call_timeout`](#wamp.call_timeout) default.

::: tip No infinite timeout support
According to WAMP, an unspecified timeout or a value of `0` disables the  feature, but we disagree, there should be no such thing as "infinite timeouts". Set it to 24 hours, a week or even a year if you want.
:::


## Message Retention

@[config](wamp.message_retention.default_ttl,time_duration_units,0,v0.9.0)

@[config](wamp.message_retention.enabled,on|off,on,v0.9.0)

@[config](wamp.message_retention.max_memory,byte_size_units,1GB,v0.9.0)

@[config](wamp.message_retention.max_message_size,byte_size_units,64KB,v0.9.0)

@[config](wamp.message_retention.max_messages,integer,1000000,v0.9.0)

@[config](wamp.message_retention.storage_type,ram|disk|ram_disk,ram,v0.9.0)



