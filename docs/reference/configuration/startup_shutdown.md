# Startup/Shutdown Configuration Reference

| Parameter | Acceptable Values | Default | From Version |
|---|---|---|---|
| `shutdown_grace_period`{.config-param}The period in seconds that Bondy will wait for clients to gracefully terminate their connections when the router is shutting down. | Time duration with units, e.g. &#x27;10s&#x27; for 10 seconds | 30 |
| `startup.wait_for_store_aae_exchange`{.config-param}Defines whether Bondy will wait for the first active anti-entropy (AAE) exchange to be finished before continuing with initialisation. In order for the AAE exchange to be executed the property **aae_enabled** needs to be set to on. | on \| off | on | 0.8.8 |
| `startup.wait_for_store_hashtrees`{.config-param}Defines whether Bondy will wait for the db hashtrees to be built before continuing with initialisation. In order for the hashtrees to be build the property aae_enabled needs to be on. This is automatically turned on in case the property **startup.wait_for_store_aae_exchange** is enabled. | on \| off | on | 0.8.8 |
| `startup.wait_for_store_partitions`{.config-param}Defines whether Bondy will wait for the db partitions to be initialised before continuing with initialisation. This is automatically turned on in case the property **startup.wait_for_store_hashtrees** is enabled. | on \| off | on | 0.8.8 |

