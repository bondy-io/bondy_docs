
# Node Configuration Reference
Configure the nodename, platform paths and Erlang VM parameters.


## Node Identity

A distributed Bondy system consists of a number of Bondy router instances communicating with each other. Each such instance is called a `node` and must be given a name.


@[configRemoved](nodename,Set the BONDY_ERL_NODENAME environment variable instead,v1.0.0)

The nodename is the node's unique identifier within a cluster (`name@host`) and must be unique cluster-wide. Setting it in `bondy.conf` predates this release; today it is read once, before `bondy.conf` itself is parsed, from the `BONDY_ERL_NODENAME` environment variable.

@[configRemoved](distributed_cookie,Set the BONDY_ERL_DISTRIBUTED_COOKIE environment variable instead,v1.0.0)

This is the [Distributed Erlang magic cookie](https://www.erlang.org/doc/reference_manual/distributed.html#security). Bondy doesn't use distributed Erlang for clustering (Partisan carries cluster traffic instead — see [Clustering](/router/concepts/clustering)), so this is only needed to connect via an Erlang remote shell, e.g. `bondy remote_console`. Like the nodename above, it's read from the `BONDY_ERL_DISTRIBUTED_COOKIE` environment variable before `bondy.conf` is parsed, not from `bondy.conf` itself.

::: warning Security
Change this from its default: an unchanged, publicly-known cookie lets anyone who can reach the node's distribution port attach an Erlang remote shell with full VM access.
:::


## Paths

@[config](platform_data_dir,path,'./data',v0.1.0)

:::danger DEPRECATED
Use environment variable `BONDY_DATA_DIR` instead
:::

:::warning The data directory must accept `fsync` on a directory
The durable stores make a write crash-safe by writing a temporary file, syncing
it, renaming it into place and then syncing the directory, so that the rename
itself survives a power loss. The data directory must therefore be on a
filesystem that accepts `fsync` on a directory. APFS does, and so do the
overlay and tmpfs mounts of a Linux container.

A store also syncs its directory when it opens, before it reads anything there.
When a directory cannot be synced, `main` fails to open and the node reports
NOT READY with the [`bondy_db_main_unavailable`](/router/reference/alarms#bondy-db-main-unavailable)
alarm; a storage shard that cannot sync is restarted, and while it is stopped
the node reports NOT READY with the
[`bondy_oplog_instance_down`](/router/reference/alarms#bondy-oplog-instance-down)
alarm.
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

The following configure the underlying Erlang VM (`erl`) directly — each maps to a documented `erl` emulator flag. They are advanced settings; the defaults suit most deployments. See [erl(1)](https://www.erlang.org/doc/man/erl.html) for the full flag semantics.

### Schedulers

@[config](vm.cpu.scheduler.total,integer,0,v1.0.0)

Number of scheduler threads to create (`erl +S Total:Online`), combined with [vm.cpu.scheduler.online](#vm-cpu-scheduler-online) into a single flag. `0` (the default) uses the VM's own default — normally one scheduler per logical CPU, or fewer if the emulator detects a CPU quota (e.g. a container `cpu.limit`). Rarely needs changing: lower it only to leave headroom for other processes co-located on the same host.

@[config](vm.cpu.scheduler.online,integer,0,v1.0.0)

Number of those scheduler threads to keep online at boot (`erl +S Total:Online`); can also be changed at runtime via `erlang:system_flag(schedulers_online, N)`. `0` uses the VM default. Taking schedulers offline (while keeping them created) is cheaper to reverse at runtime than changing the total.

@[config](vm.cpu.scheduler.busy_wait_threshold,none&#124;very_short&#124;short&#124;medium&#124;long&#124;very_long,none,v1.0.0)

How long a scheduler busy-waits for new work before sleeping, once its run queue empties. A longer threshold trades idle CPU burn for lower wake-up latency on bursty workloads; `none` sleeps immediately. This flag's semantics are Erlang/OTP-internal and can change between OTP releases without notice.

@[config](vm.cpu.scheduler.compaction_of_load,on&#124;off,on,v1.0.0)

When on, load balancing favours migrating runnable processes onto a smaller set of schedulers so that as many schedulers as possible stay fully loaded, rather than spreading load evenly and leaving several schedulers occasionally idle. Mutually exclusive in intent with [vm.cpu.scheduler.utilization_balancing](#vm-cpu-scheduler-utilization-balancing) below — Erlang/OTP recommends leaving at most one of the two enabled.

@[config](vm.cpu.scheduler.utilization_balancing,on&#124;off,off,v1.0.0)

When on, load balancing instead strives for equal scheduler *utilization* across all schedulers, rather than compacting load onto fewer of them. See [vm.cpu.scheduler.compaction_of_load](#vm-cpu-scheduler-compaction-of-load) above.

### Asynchronous I/O

@[config](vm.async_thread.number,integer,1,v1.0.0)

Number of threads in the async thread pool (`erl +A`), used by linked-in drivers for work that could otherwise block a scheduler for a long time. Since OTP 21 few of Erlang/OTP's own linked-in drivers still use this pool — most have moved to dirty I/O schedulers — so this mainly matters if a NIF or driver dependency of Bondy's still relies on it.

### Ports

@[config](vm.port.limit,integer,2097152,v1.0.0)

Maximum number of simultaneously open ports (`erl +Q`) — every listener socket, outbound TCP/TLS connection, and file handle the VM holds counts against this limit. The emulator may round the configured value up. Raise it before you raise your OS file-descriptor limit for the Bondy process, since this is the VM-level ceiling underneath that OS one.

### Logging

@[config](vm.W,w&#124;i&#124;e,w,v1.0.0)

How the VM's built-in `error_logger` classifies messages sent to its warning routines: as warnings (`w`, the default), errors (`e`), or info reports (`i`). This governs only the emulator's own warning-classification convention, not Bondy's application-level [logging configuration](/router/reference/logging).

## See also

- [Logging Configuration Reference](/router/reference/logging) — Bondy's own application-level log levels and handlers, distinct from the VM-level `vm.W` mapping above.
- [Clustering](/router/concepts/clustering) — why cluster formation doesn't depend on `distributed_cookie` or Distributed Erlang.