# Startup/Shutdown Configuration Reference
> Bondy configuration options controlling serveral aspects of what happens during Bondy startup and shutdown.{.definition}

## Startup

@[config](startup.wait_for_store_partitions,on|off,on,v0.8.8)

Defines whether Bondy will wait for the db partitions to be initialised before continuing with initialisation. This is automatically turned on in case the property **startup.wait_for_store_hashtrees** is enabled.


@[config](startup.wait_for_store_hashtrees,on|off,on,v0.8.8 )

Defines whether Bondy will wait for the db hashtrees to be built before continuing with initialisation. In order for the hashtrees to be build the property aae_enabled needs to be on. This is automatically turned on in case the property **startup.wait_for_store_aae_exchange** is enabled.

@[config](startup.wait_for_store_aae_exchange,on|off,on,0.8.8)

Defines whether Bondy will wait for the first active anti-entropy (AAE) exchange to be finished before continuing with initialisation. In order for the AAE exchange to be executed the property **aae_enabled** needs to be set to on.

## Shutdown

@[config](shutdown_grace_period,time_duration_units,30s,v0.8.8)

The period in seconds that Bondy will wait for clients to gracefully terminate their connections when the router is shutting down.

