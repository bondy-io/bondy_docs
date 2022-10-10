
# Node Configuration Reference
> Configure the nodename, platform paths and Erlang VM parameters.{.definition}


## Node Identity

A distributed Bondy system consists of a number of Bondy router instances communicating with each other. Each such instance is called a `node` and must be given a name.


@[config](nodename,string,'bondy@127.0.0.1',v0.1.0)

Name of the Bondy node.

The format of the nodename is a string `name@host`:
*  `name` is the name given by the user, while
* `host` is the full host name.

The nodename is the node unique identifier within a cluster and thus each nodename must be unique.

@[config](distributed_cookie,string,bondy,v0.1.0)

This is the [Distributed Erlang magic cookie](https://www.erlang.org/doc/reference_manual/distributed.html#security). Bondy doesn't actually use distributed erlang in production, so this is not required to establish a cluster connection. However, if you want to connect Bondy via an Erlang remote shell e.g.`bondy remote_console`, you will need this parameter to be set.

## Paths

@[config](platform_data_dir,path,'./data',v0.1.0)

@[config](platform_etc_dir,path,'./etc',v0.1.0)

@[config](platform_log_dir,path,'./log',v0.1.0)

@[config](platform_tmp_dir,path,'./tmp',v0.1.0)

## Erlang Virtual Machine

@[config](erlang.async_threads,0..1024,64,v0.1.0)

Sets the number of threads in async thread pool. If thread support is available, the default is 64. More information at: http://erlang.org/doc/man/erl.html


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