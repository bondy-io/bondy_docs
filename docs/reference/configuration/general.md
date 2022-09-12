# General Configuration Reference

## Node Identity

@[config](nodename,string,'bondy@127.0.0.1',v0.1.0)

 Name of the Bondy node.

@[config](distributed_cookie,string,bondy,v0.1.0)

This is the [Distributed Erlang magic cookie](https://www.erlang.org/doc/reference_manual/distributed.html#security). Bondy doesn't actually use distributed erlang in production, so this is not required to establish a cluster connection. However, if you want to connect Bondy via an Erlang remote shell e.g.`bondy remote_console`, you will need this parameter to be set.

## Paths

@[config](platform_data_dir)

@[config](platform_etc_dir)

@[config](platform_log_dir)

@[config](platform_tmp_dir)

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