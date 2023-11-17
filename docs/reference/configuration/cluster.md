# Cluster Configuration Reference
Bondy configuration options controlling cluster formation including automatic peer discovery and performance options.


## Listener options

@[config](cluster.listen_addrs,list(string),See&nbsp;below,v1.0.0-rc.2)

Defines a list of `ip_address:port` this node will use to listen for
incoming cluster connections. The value accepts the following input strings:

```text
cluster.listen_addrs = 192.168.50.174:18086
cluster.listen_addrs = [192.168.50.174:18086]
cluster.listen_addrs = 192.168.50.174:18086, 192.168.50.180:18086
cluster.listen_addrs = [192.168.50.174:18086, 192.168.50.180:18086]
```
This option also accepts IP addresses without a port.

```text
cluster.listen_addrs = 192.168.50.174
cluster.listen_addrs = [192.168.50.174]
```

In this cases the port will be the value of the [cluster.peer_port](#cluster.peer_port) option.

If this option is provided, Bondy will ignore [cluster.peer_ip](#cluster.peer_ip) and [cluster.peer_port](#cluster.peer_port) but notice that  [cluster.peer_port](#cluster.peer_port) might still be required for some discovery strategies used by [Peer Discovery](#peer-discovery-automatic-join) e.g. `dns` discovery which will only discover the peer IP addresses but not the ports in which they are listening.

#### Default
If this option is missing, the IP Address will defaul to the value of [cluster.peer_ip](#cluster.peer_ip) option, unless is also missing, in which case the nodename's (`BONDY_ERL_NODENAME` environment variable) host part will be used to determine the IP address.

The port will default to the value of [cluster.peer_port](#cluster.peer_port).

:::tip
This options allows multiple values in case you should want to listen on multiple interfaces.

However, normally you will use a single network interface. In that case we recommend disabling this option (by commenting it in your `bondy.config` file) and setting the `BONDY_ERL_NODENAME` environment variable using a fully-qualified host name e.g. `bondy@bondy1.mycluster.local`.

Notice the [cluster.peer_port](#cluster.peer_port) might still be required for other Bondy features. Check the option documentation.
:::

@[config](cluster.peer_ip,integer,See&nbsp;below,v0.8.8)

The IP address to use for the peer connection listener when option
[cluster.listen_addrs](#cluster.listen_addrs) has not been defined.

#### Default
If a value is not defined (and [cluster.listen_addrs](#cluster.listen_addrs)) was not used, Bondy will attempt to resolve the IP address using the nodename (`BONDY_ERL_NODENAME` environment variable) by parsing the right the part to the `@` character in the nodename, and will default to `127.0.0.1` if it can't.


@[config](cluster.peer_port,integer,18086,v0.8.8)

The port number to use for the peer connection listener for the cluster TCP/TLS connections.

This value has two main purposes:
1. Define the port in which the node will listen for the cluster named channel connections (TCP or TLS) when option [cluster.listen_addrs](#cluster.listen_addrs) have not been defined.
2. Define the port in which peer nodes will listen when using a [Peer Discovery](#peer-discovery-automatic-join) strategy that does not provide port number e.g. DNS.

:::tip
For production environments we recommend setting the `BONDY_ERL_NODENAME` environment variable using a fully-qualified host name e.g. `bondy@bondy1.mycluster.local` and always setting the same value for `peer_port` on all peers.

```text
cluster.peer_port = 18086
```

However, if you want to make use of [cluster.listen_addrs](#cluster.listen_addrs) to listen to connections on multiple network interfaces, we recommend always
setting the same value for `peer_port` on all peers, and having at least one
address in `cluster.listen_addrs` having the same port value.

```text
cluster.listen_addrs = [192.168.50.174:18086]
cluster.peer_port = 18086
```

:::


@[config](cluster.parallelism,integer,1,v0.8.8)

:::danger Deprecated in 1v1.0.0-rc.1
Use the following options instead:
* [cluster.channels.default.parallelism](#cluster.channels.default.parallelism)
* [cluster.channels.control_plane.parallelism](#cluster.channels.control_plane.parallelism)
* [cluster.channels.data.parallelism](#cluster.channels.data.parallelism)
* [cluster.channels.wamp_relay.parallelism](#cluster.channels.wamp_relay.parallelism)
:::

@[config](cluster.channels.default.parallelism,integer,1,v1.0.0)

The default channel's parallelism. This channel is used when the other channels are down.

@[config](cluster.channels.default.compression,flag,off,v1.0.0)

The default channel's compression option. This channel is used when the other channels are down.

@[config](cluster.channels.data.parallelism,integer,2,v1.0.0)

The data channel's parallelism.

This channel is used to replicate and synchronise the router's configuration and state data amongst the cluster nodes.

@[config](cluster.channels.data.compression,flag,off,v1.0.0)

The control_plane channel's compression options.

This channel is used to replicate and synchronise the router's configuration and state data amongst the cluster nodes.

@[config](cluster.channels.control_plane.parallelism,integer,1,v1.0.0)

The control plane channel's parallelism.

This channel is used to disseminate cluster membership and control messages.

@[config](cluster.channels.control_plane.compression,flag,on,v1.0.0)

The control_plane channel's compression options.

This channel is used to disseminate cluster membership and control messages.

@[config](cluster.channels.wamp_relay.parallelism,integer,2,v1.0.0)

The wamp_relay channel's parallelism.

This channel is used to route RPC and PubSub requests across the cluster e.g. WAMP.

@[config](cluster.channels.wamp_relay.compression,flag,off,v1.0.0)

The wamp_relay channel's compression options.

This channel is used to route RPC and PubSub requests across the cluster e.g. WAMP.

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
