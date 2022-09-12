# Data Storage and Replication Configuration Reference


## Store

@[config](store.data_dir)

@[config](store.open_retries_delay)

@[config](store.open_retry_Limit)

@[config](store.partitions)

@[config](store.shard_by)


## Active Anti-entropy

@[config](aae.enabled,on | off,on,v0.8.8)

Controls whether the active anti-entropy subsystem is enabled. | on \| off | on

@[config](aae.exchange_on_cluster_join,on | off, on)

@[config](aae.data_exchange_timeout,time_duration_units,1m)


@[config](aae.exchange_timer,time_duration_units,1m,v0.8.8)
Controls when will the AAE system will trigger the next AAE exchange.


@[config](aae.hashtree_timer,time_duration_units,10s,v0.8.8)

@[config](aae.hashtree_ttl,time_duration_units,1w,v0.8.8)