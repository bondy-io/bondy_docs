# Cluster Configuration Reference
Bondy configuration options controlling cluster formation including automatic peer discovery and performance options.

## Enabling clustering

@[config](cluster.enabled,on|off,on,v1.0.0)

Whether the node clusters. Every part of Bondy that needs to know whether other members exist (compaction, reclamation, origin retirement and the authentication freshness fence) reads this setting rather than counting the members it can currently see.

With `on`, the node starts the cluster peer service and replicates its data to the other members through anti-entropy ([`db.aae`](/router/reference/configuration/data_storage)).

With `off`, the node runs on its own:

* it opens no cluster port and runs no [peer discovery](#peer-discovery);
* [`bondy.cluster.members`](/router/reference/wamp_api/cluster) returns this node only, and `bondy.cluster.leave` answers `bondy.error.cluster_disabled`;
* the authentication freshness fence always certifies the node;
* compaction and reclamation run on the node's own history, since no other member can contradict it.

::: warning A single-node deployment must set `cluster.enabled = off`
A node left on the default `on` with no other member does **not** behave as a single node. Bondy does not persist the cluster membership, so a member that has just restarted lists only itself until it rejoins; with clustering on, a membership of one is treated exactly like that restarted member, and it licenses nothing:

* **authentication is refused.** Under the default [`db.aae.fence.on_isolation = refuse`](/router/reference/configuration/data_storage), a node with no reachable peer is never certified fresh, so every authentication attempt, anonymous included, fails with `temporarily_unavailable`;
* **history is never compacted and deleted data is never reclaimed.** Compaction, reclamation and origin retirement hold, and the node logs a rate-limited "GC stalled" warning with reason `no_members`.

Set `cluster.enabled = off` on every node meant to run alone.
:::

::: warning A node that ran with clustering off joins only empty nodes
Two nodes may be joined only while at most one of them has truncated its history, and a node that ran with `off` has. To turn clustering on for it:

1. Restart it with `cluster.enabled = on`. It becomes the first node of the cluster.
2. Join it only with nodes whose data directories are empty, and start those nodes with `cluster.enabled = on` from their very first boot: a node writes at first boot, and with `off` it would truncate those writes.

If two nodes that have each truncated are joined, neither can install the other's data. Both keep serving their own data but never converge, and each logs on every retry:

```text
Refused to install the peer's snapshot: the peer has not seen events this node
truncated. If this persists, the two nodes truncated history separately before
they were joined (for example, each ran with cluster.enabled = off). Empty one
of them and rejoin it.
```

To recover, choose the node whose data to keep, stop the other, empty its `platform_data_dir`, and start it with `cluster.enabled = on` so that it joins empty. **The writes the emptied node accepted on its own are lost.**
:::

::: warning Remove a member from the cluster before turning clustering off
Before restarting a member with `cluster.enabled = off`, remove it with [`bondy.cluster.leave`](/router/reference/wamp_api/cluster), calling it first with `dry_run`: it refuses unless every remaining member is reachable and ready. Otherwise the remaining members keep counting the node, and the node and the cluster each truncate history the other lacks, so they can never converge again.

[`cluster.automatic_leave`](#cluster.automatic_leave) is read when the node starts, so turning it on just before a shutdown does nothing. To bring the node back into the cluster later, follow the rule above: it has truncated on its own, so it rejoins a cluster with data only after it has been emptied.
:::

## Listener options

@[config](cluster.listen_addresses,list(string),See&nbsp;below,v1.0.0-rc.2)

Defines a list of `ip_address:port` this node will use to listen for
incoming cluster connections. The value accepts the following input strings:

```text
cluster.listen_addresses = 192.168.50.174:18086
cluster.listen_addresses = [192.168.50.174:18086]
cluster.listen_addresses = 192.168.50.174:18086, 192.168.50.180:18086
cluster.listen_addresses = [192.168.50.174:18086, 192.168.50.180:18086]
```
This option also accepts IP addresses without a port.

```text
cluster.listen_addresses = 192.168.50.174
cluster.listen_addresses = [192.168.50.174]
```

In this cases the port will be the value of the [cluster.peer_port](#cluster.peer_port) option.

If this option is provided, Bondy will ignore [cluster.peer_ip](#cluster.peer_ip) and [cluster.peer_port](#cluster.peer_port) but notice that  [cluster.peer_port](#cluster.peer_port) might still be required for some discovery strategies used by [Peer Discovery](#peer-discovery) e.g. `dns` discovery which will only discover the peer IP addresses but not the ports in which they are listening.

#### Default
If this option is missing, the IP Address will defaul to the value of [cluster.peer_ip](#cluster.peer_ip) option, unless is also missing, in which case the nodename's (`BONDY_ERL_NODENAME` environment variable) host part will be used to determine the IP address.

The port will default to the value of [cluster.peer_port](#cluster.peer_port).

:::tip
This options allows multiple values in case you should want to listen on multiple interfaces.

However, normally you will use a single network interface. In that case, disable this option (by commenting it out in your `bondy.config` file) and set the `BONDY_ERL_NODENAME` environment variable using a fully-qualified host name e.g. `bondy@bondy1.mycluster.local`.

Notice the [cluster.peer_port](#cluster.peer_port) might still be required for other Bondy features. Check the option documentation.
:::

@[config](cluster.peer_ip,ip_address,See&nbsp;below,v0.8.8)

The IP address to use for the peer connection listener when option
[cluster.listen_addresses](#cluster.listen_addresses) has not been defined.

#### Default
If a value is not defined (and [cluster.listen_addresses](#cluster.listen_addresses)) was not used, Bondy will attempt to resolve the IP address using the nodename (`BONDY_ERL_NODENAME` environment variable) by parsing the right the part to the `@` character in the nodename, and will default to `127.0.0.1` if it can't.


@[config](cluster.peer_port,integer,18086,v0.8.8)

The port number to use for the peer connection listener for the cluster TCP/TLS connections.

This value has two main purposes:
1. Define the port in which the node will listen for the cluster named channel connections (TCP or TLS) when option [cluster.listen_addresses](#cluster.listen_addresses) have not been defined.
2. Define the port in which peer nodes will listen when using a [Peer Discovery](#peer-discovery) strategy that does not provide port number e.g. DNS.

:::tip
For production environments, set the `BONDY_ERL_NODENAME` environment variable using a fully-qualified host name e.g. `bondy@bondy1.mycluster.local` and always set the same value for `peer_port` on all peers.

```text
cluster.peer_port = 18086
```

However, if you want to make use of [cluster.listen_addresses](#cluster.listen_addresses) to listen to connections on multiple network interfaces, always set
the same value for `peer_port` on all peers, and have at least one
address in `cluster.listen_addresses` use the same port value.

```text
cluster.listen_addresses = [192.168.50.174:18086]
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

@[config](cluster.channels.wamp_relay.parallelism,integer,8,v1.0.0)

The wamp_relay channel's parallelism.

This channel is used to route RPC and PubSub requests across the cluster e.g. WAMP.

@[config](cluster.channels.wamp_relay.compression,flag,off,v1.0.0)

The wamp_relay channel's compression options.

This channel is used to route RPC and PubSub requests across the cluster e.g. WAMP.

@[config](cluster.tls.enabled,on|off,off,v0.8.8)

If enabled then the cluster connection will be established over TLS (making the remaining TLS options mandatory). Otherwise, it will be established over TCP/IP.
The default value is `off`.

::: tip
Enable this option for production use.
:::

@[config](cluster.tls.allow_insecure,on|off,off,v1.0.0)

Bondy's Partisan peer plane is plaintext and unauthenticated by default (`cluster.tls.enabled = off`, and `verify_none` even when TLS is on) — an on-path attacker could otherwise read or modify replicated credentials and realm signing keys, and a rogue peer could inject security state. When automatic peer discovery (`cluster.peer_discovery.enabled = on`) is configured but the peer plane is insecure, **Bondy refuses to start**.

Set this to `on` to acknowledge the risk and downgrade the refusal to a startup warning instead — appropriate for a properly network-isolated cluster. The secure fix is to enable TLS with peer verification and a private cluster CA, as documented below.

@[config](cluster.tls.server.verify,verify_peer|verify_none,verify_none,v1.0.0)

Whether the server side of the cluster TLS connection verifies the peer's certificate against the configured CA. Set to `verify_peer` with a private cluster CA for a secure peer plane — this, together with `cluster.tls.enabled = on`, is what `cluster.tls.allow_insecure` above is guarding against skipping.

@[config](cluster.tls.client.verify,verify_peer|verify_none,verify_none,v1.0.0)

The same, for the client side of the cluster TLS connection.

@[config](cluster.tls.server.certfile,path,'&#123;&#123;platform_etc_dir&#125;&#125;/server/keycert.pem',v1.0.0)

Certificate location for the server side of the cluster TLS connection.

@[config](cluster.tls.server.keyfile,path,'&#123;&#123;platform_etc_dir&#125;&#125;/server/key.pem',v1.0.0)

Key location for the server side of the cluster TLS connection.

@[config](cluster.tls.server.cacertfile,path,'&#123;&#123;platform_etc_dir&#125;&#125;/server/cacert.pem',v1.0.0)

CA certificate location for the server side of the cluster TLS connection.

@[config](cluster.tls.server.versions,string,1.3,v1.0.0)

Comma-separated TLS protocol version(s) (`1.2` and/or `1.3`) supported by the server side.

@[config](cluster.tls.client.certfile,path,'&#123;&#123;platform_etc_dir&#125;&#125;/client/keycert.pem',v1.0.0)

Certificate location for the client side of the cluster TLS connection.

@[config](cluster.tls.client.keyfile,path,'&#123;&#123;platform_etc_dir&#125;&#125;/client/key.pem',v1.0.0)

Key location for the client side of the cluster TLS connection.

@[config](cluster.tls.client.cacertfile,path,'&#123;&#123;platform_etc_dir&#125;&#125;/client/cacert.pem',v1.0.0)

CA certificate location for the client side of the cluster TLS connection.

@[config](cluster.tls.client.versions,string,1.3,v1.0.0)

Comma-separated TLS protocol version(s) supported by the client side.

## Message Framing

@[config](cluster.max_message_size,bytesize,64MB,v1.0.0)

Upper bound on a single length-prefixed frame accepted on the peer
connection, enforced identically on both the connect and accept paths —
before a peer's identity has been verified. This bounds a
pre-authentication memory-exhaustion / decompression-bomb vector: without a
cap, a frame's declared length could force the receiver to allocate
unbounded memory before the connection is ever rejected. Raise it only if
you have legitimately large control-plane payloads that exceed the default.

## Peer Connection Limits

@[config](cluster.rpc_max_concurrency,integer|infinity,10000,v1.0.0)

The maximum number of inbound inter-node RPC requests that may run concurrently on this node. A request received past this limit fails at once with `{badrpc, overloaded}` instead of being queued. Set to `infinity` to remove the limit.

@[config](cluster.connection_high_watermark,integer|infinity,infinity,v1.0.0)

The maximum number of messages that may be queued to a single peer connection before further sends to it are refused with `{error, overloaded}`. With the default, `infinity`, a sender faster than the peer's socket can grow that queue until the node runs out of memory. Lower it to fail fast instead.

@[config](cluster.tls.handshake_timeout,duration_time_units,5s,v1.0.0)

The time allowed for the server side of the TLS handshake on an inbound peer connection. It stops a stalled or deliberately slow handshake from holding an acceptor indefinitely.

## Cross-node Forwarding

When a client on one node publishes to subscribers or calls a callee on another node, the node relays the WAMP message over the `wamp_relay` channel. The relayed message types are `PUBLISH`, `INVOCATION`, `INTERRUPT`, `RESULT` and `ERROR`. The two keys below set the Partisan delivery options for every relayed message. With both off, relaying is best-effort: a message lost with its connection is not sent again.

@[config](router.forward.ack,on|off,off,v1.0.0)

Asks Partisan to acknowledge each relayed message. With `on`, the sending node records each message until the receiving node acknowledges it, and resends the messages still unacknowledged on Partisan's retransmission timer.

@[config](router.forward.retransmission,on|off,off,v1.0.0)

Passed to Partisan as its `retransmission` option. Partisan uses that option to mark a message that is itself a resend, and does not record such a message for a later resend. So with `ack = on`, turning this on stops relayed messages from being recorded, and unacknowledged messages are not resent. Leave it `off`.

## Registry Routing (RIB)

Cross-node call and event routing is unconditional — there is nothing to enable. The one setting below tunes observability only; it does not change what the registry replicates. See [Registry Routing (RIB)](/router/concepts/registry_routing) for the concept.

@[config](registry.rib.check_interval,duration_time_units,5m,v1.0.0)

How often each node compares its summary cells against the registry ground truth per realm, logging a warning naming any divergence found. `0` disables the sweep.

The summary machinery is instrumented on the Admin API `/metrics` endpoint (`bondy_registry_rib_members`, `bondy_registry_rib_stub_cells`, `bondy_registry_rib_divergences`, `bondy_rpc_rib_completions_total`, `bondy_rpc_rib_retries_total`), and covered by a dedicated **Registry RIB** section in the bundled Grafana dashboard.

::: warning Keep node clocks from stepping backwards
A node's summary cells are stamped from a node-wide hybrid logical clock, and on every replica the highest-stamped reading wins. A node restarted with its wall clock stepped back past the last stamp it issued writes readings that lose to its own older ones, so a peer may keep routing to callees the node no longer has. Keep node clocks synchronised (NTP or equivalent) and never step a clock backwards across a restart. See [Registry Routing (RIB)](/router/concepts/registry_routing#restarts-and-clocks).
:::

## Peer Discovery

See [Running a Cluster](/router/guides/deployment/running_a_cluster) for a worked example of forming a cluster with these keys.

@[config](cluster.peer_discovery.enabled,on|off,off,v1.0.0)

Whether Bondy searches for peer nodes using the strategy configured below, and joins every peer a lookup reports. There is no separate join setting.

Discovery only adds members. A member that a later lookup stops reporting (a Kubernetes pod that is not Ready, for example) is not removed: a node leaves the cluster only through [`bondy.cluster.leave`](/router/reference/wamp_api/cluster) or through its own shutdown when [cluster.automatic_leave](#cluster.automatic_leave) is on.

::: warning A discovering node requires a secure peer plane
When this setting is `on`, Bondy refuses to start unless `cluster.tls.enabled` is `on` and both `cluster.tls.server.verify` and `cluster.tls.client.verify` are `verify_peer`. Set [cluster.tls.allow_insecure](#cluster.tls.allow_insecure) to `on` to downgrade the refusal to a startup warning.
:::

@[config](cluster.peer_discovery.type,dns&#124;list,N/A,v1.0.0)

Selects the discovery strategy: `dns` resolves peer addresses from a DNS record (see `cluster.peer_discovery.config.*` below — `record_type`, `query`, `node_basename`), `list` uses a fixed, manually configured address list (`name`, `addresses`). A custom Partisan peer-discovery-agent module name is also accepted directly, for a strategy not built in to Partisan.

@[config](cluster.peer_discovery.initial_delay,duration_time_units,10s,v1.0.0)

How long the discovery agent waits after startup before its first lookup.

@[config](cluster.peer_discovery.polling_interval,duration_time_units,10s,v1.0.0)

How long the discovery agent waits between lookups, after the first one.

@[config](cluster.peer_discovery.timeout,duration_time_units,5s,v1.0.0)

How long the discovery agent waits for a response to a single lookup before treating it as failed.

@[config](cluster.peer_discovery.config.$name,string,N/A,v1.0.0)

Configuration for the selected `cluster.peer_discovery.type` strategy — refer to that strategy's own configuration keys (linked above) for what `$name` should be. For example, the `dns` strategy expects:

```text
cluster.peer_discovery.config.record_type = a
cluster.peer_discovery.config.query = bondy-cluster.internal
cluster.peer_discovery.config.node_basename = bondy
```

@[config](cluster.peer_discovery.config.$name.$item,string,N/A,v1.0.0)

The array form of the same mechanism, for a strategy parameter that takes a list rather than a single value — for example, the `list` strategy's `addresses`:

```text
cluster.peer_discovery.config.name = bondy
cluster.peer_discovery.config.addresses._ = bondy1@10.0.0.1:18086
cluster.peer_discovery.config.addresses._ = bondy2@10.0.0.2:18086
```

## Topology

@[config](cluster.overlay.topology,fullmesh|p2p,fullmesh,v1.0.0)

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

::: warning
A node started with `automatic_leave = on` leaves the cluster on **every** graceful shutdown, including a routine restart, and it does so without the safety check that [`bondy.cluster.leave`](/router/reference/wamp_api/cluster) performs (that every remaining member is reachable and ready). A node that has left must rejoin, and if it truncated history while it was out it must first be emptied (see [Enabling clustering](#enabling-clustering)). The value is read when the node starts.
:::
