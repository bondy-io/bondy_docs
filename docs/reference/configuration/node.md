
# Node Configuration Reference
Configure the nodename, platform paths and Erlang VM parameters.


## Node Identity

A distributed Bondy system consists of a number of Bondy router instances communicating with each other. Each such instance is called a `node` and must be given a name.


@[config](nodename,string,'bondy@127.0.0.1',v0.1.0)

Name of the Bondy node.

The format of the nodename is a string `name@host`:
*  `name` is the name given by the user, while
* `host` is the full host name.

The nodename is the node unique identifier within a cluster and thus each nodename must be unique.

:::danger DEPRECATED
Use environment variable `BONDY_ERL_NODENAME` instead
:::

@[config](distributed_cookie,string,bondy,v0.1.0)

This is the [Distributed Erlang magic cookie](https://www.erlang.org/doc/reference_manual/distributed.html#security). Bondy doesn't actually use distributed Erlang for clustering, so this is not required for deploying a cluster.

However, if you want to connect to Bondy via an Erlang remote shell—e.g. by executing `bondy remote_console` on the host, VM or container running Bondy—we will need this option to be set.

:::warning Security
We recommend changing this value a secret value to prevent unauthorised users to gain access to Bondy's underlying Erlang VM.
:::

:::danger DEPRECATED
Use environment variable `BONDY_ERL_DISTRIBUTED_COOKIE` instead
:::


## Paths

@[config](platform_data_dir,path,'./data',v0.1.0)

:::danger DEPRECATED
Use environment variable `BONDY_DATA_DIR` instead
:::

@[config](platform_etc_dir,path,'./etc',v0.1.0)

:::danger DEPRECATED
Use environment variable `BONDY_DATA_ETC` instead
:::

@[config](platform_log_dir,path,'./log',v0.1.0)

:::danger DEPRECATED
Use environment variable `BONDY_DATA_LOG` instead
:::

@[config](platform_tmp_dir,path,'./tmp',v0.1.0)

:::danger DEPRECATED
Use environment variable `BONDY_DATA_TMP` instead
:::

## Erlang Virtual Machine

The following are advanced params and require knowledge of the Erlang VM.
Read more at: http://erlang.org/doc/man/erl.html.

@[config](erlang.async_threads,0..1024,64,v0.1.0)

Sets the number of threads in async thread pool. If thread support is available, the default is 64.


@[config](erlang.k)

@[config](erlang.max_ports,1024..134217727,65536,v0.1.0)

The number of concurrent ports/sockets.

@[config](erlang.sbwt)

@[config](erlang.schedulers.compaction_of_load)

@[config](erlang.schedulers.online)

@[config](erlang.schedulers.total)

@[config](erlang.schedulers.utilization_balancing)

@[config](erlang.smp)

erlang.W