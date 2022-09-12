# General Configuration Reference

@[config](nodename, string, 'bondy@127.0.0.1', v0.1.0)

 Name of the Erlang node.

@[config](distributed_cookie, string, bondy, v0.1.0)

This is the [Distributed Erlang magic cookie](https://www.erlang.org/doc/reference_manual/distributed.html#security). Bondy doesn't actually use distributed erlang in production, so this is not required to establish a cluster connection. However, if you want to connect Bondy via an Erlang remote shell e.g.`bondy remote_console`, you will need this parameter to be set.


@[config](platform_data_dir)

@[config](platform_etc_dir)

@[config](platform_log_dir)

@[config](platform_tmp_dir)
