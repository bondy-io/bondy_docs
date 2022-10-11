# Active Anti-entropy Configuration Reference
> Periodically, each Bondy node will choose a random peer and perform an exchange comparing their replicated data and exchanging any missing and/or repairing conflicting data. This is done efficiently by using Merkle trees (a.k.a hashtrees) that are stored on the data store.{.definition}


@[config](aae.enabled,on|off,on,v0.8.8)

Controls whether the active anti-entropy subsystem is enabled.

@[config](aae.exchange_on_cluster_join,on|off,on)

@[config](aae.data_exchange_timeout,time_duration_units(),1m)


@[config](aae.exchange_timer,time_duration_units(),1m,v0.8.8)

Controls when will the AAE system will trigger the next AAE exchange.


@[config](aae.hashtree_timer,time_duration_units(),10s,v0.8.8)

@[config](aae.hashtree_ttl,time_duration_units(),1w,v0.8.8)

Controls how often the AAE hashtrees (on-disk merkle trees) are re-build.

::: warning Notice
Not working at the moment.
Currently hashtrees are always rebuild during startup. In next releases we will enable this feature.
:::