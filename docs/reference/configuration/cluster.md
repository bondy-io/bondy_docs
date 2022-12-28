# Cluster Configuration Reference
Bondy configuration options controlling the cluster.


## Listener options

@[config](cluster.peer_port,integer,18086,v0.8.8)

Defines the IP Port number to use for the cluster TCP connection.
The default value is `18086`.

@[config](cluster.parallelism,integer,1,v0.8.8)

Defines the number of TCP connections for the cluster TCP stack. If a value higher than `1` is used, then the cluster connection will use a pool with size equal to the defined value for every named channel.

::: warning
At the moment there are 3 named channels so defining a value of `4` will create a pool of 12 connections. We recommend using a value of `1` until Bondy allows to selectively assign parallelism for each named channel.
:::

@[config](cluster.tls.enabled,on|off,off,v0.8.8)

If enabled then the cluster connection will be established over TLS (making the remaining TLS options mandatory). Otherwise, it will be established over TCP/IP.
The default value is `off`.

::: tip
We recommend enabling this option for production use.
:::

@[config](cluster.tls.cacertfile,path, '$(platform_etc_dir)/cacert.pem',v0.8.8)

Default signing authority location for cluster TLS connection.

@[config](cluster.tls.certfile,path, '$(platform_etc_dir)/cert.pem',v0.8.8)

Default cert location for cluster TLS connection.
The default value is `$(platform_etc_dir)/cert.pem`.


@[config](cluster.tls.keyfile,path, '$(platform_etc_dir)/key.pem')

Default key location for cluster TLS connection.



## Peer Discovery / Automatic Join

@[config](cluster.peer_discovery.enabled,on|off,off)

Defines whether Bondy should actively search for peer nodes using a defined strategy.

@[config](cluster.peer_discovery.type,string)

Defines the module responsible for implementing the node discovery strategy. At the moment only options is `bondy_peer_discovery_dns_agent`.


@[config](cluster.peer_discovery.automatic_join,on|off,off)

Defines whether Bondy will automatically join a discovered node forming a cluster.

@[config](cluster.peer_discovery.join_retry_interval,time_duration_units,5s)

Defines the time duration Bondy will wait between automatic join attempts.

@[config](cluster.peer_discovery.polling_interval,time_duration_units,10s)

Defines the time duration Bondy will wait between polling attempts.

@[config](cluster.peer_discovery.timeout,time_duration_units,5s)

Defines the time duration Bondy will wait for a response for a polling attempt.


@[config](cluster.peer_discovery.join_retry_interval,time_duration_units,5s,v1.0.0)

The time the agent will wait to initiate the next join attempt. For this to
take effect cluster.peer_discovery.automatic_join needs to be on.

@[config](cluster.peer_discovery.config.$name,string,N/A,v1.0.0)

The configuration for the selected strategy in `cluster.peer_discovery.type`. Refer to each strategy documentation.


Example: The selected type requires two params `keyA` and `keyB`.

```
cluster.peer_discovery.config.keyA = valueA
cluster.peer_discovery.config.keyB = valueB
```


@[config](cluster.peer_discovery.config.$name.$_,string,N/A,v1.0.0)

The configuration for the selected strategy in `cluster.peer_discovery.type`. Refer to each strategy documentation.

Example: The selected type requires two params `keyA` and `keyB` where the latter takes an array of values.

```
cluster.peer_discovery.config.keyA = value1
cluster.peer_discovery.config.keyB._ = value2
cluster.peer_discovery.config.keyB._ = value3
```

## Topology

@[config](cluster.topology,fullmesh|p2p,fullmesh,v1.0.0)

::: warning
At the moment the only option is `fullmesh`.
:::

## Membership View Sync

@[config](cluster.lazy_tick_period,duration_time_units,1s,v1.0.0)

* [ ] document

@[config](cluster.exchange_tick_period,duration_time_units,10s,v1.0.0)


## Automatic leave


@[config](cluster.automatic_leave,on|off,off,v1.0.0)

Defines whether a Bondy node should perform a cluster leave operation
automatically when it is being shutdown.
