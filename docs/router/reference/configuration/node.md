
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

@[config](platform_log_dir,path,'./log',v0.1.0)

The directory Bondy writes its log files to. The default is `./log` relative to the release root, and `/bondy/log` in the Docker image.

::: info The configuration directory is not a setting
The directory holding `bondy.conf` and the other configuration files is fixed when the release is built: `./etc` relative to the release root, and `/bondy/etc` in the Docker image. Default paths shown on these pages as `platform_etc_dir` refer to that directory.
:::

@[config](platform_tmp_dir,path,'./tmp',v0.1.0)

:::danger DEPRECATED
Use environment variable `BONDY_DATA_TMP` instead
:::

@[config](platform_runtime_dir,path,'./run',v1.0.0)

The directory for runtime objects that need a filesystem with Unix domain socket support. Today it holds one file: the internal admin socket, `bondy_admin.sock` (see [The reserved `admin` listener](/router/reference/configuration/listeners#the-reserved-admin-listener)). The default is `./run` relative to the release root, and `/bondy/run` in the Docker image.

This is deliberately not `platform_tmp_dir`. You may relocate scratch space, and several filesystems you might move it onto reject a Unix socket bind: NFS, SMB/CIFS, 9p, some FUSE-backed CSI drivers and gVisor. The node does not boot when the admin socket cannot bind. Keep this directory on the container's own filesystem and do not declare it as a volume. Under a read-only root filesystem, mount an `emptyDir` (Kubernetes) or a `tmpfs` (Docker) here. Give every node its own directory: two nodes sharing one collide on the socket path.

## Erlang Virtual Machine

The following configure the underlying Erlang VM (`erl`) directly — each maps to a documented `erl` emulator flag. They are advanced settings; the defaults suit most deployments. See [erl(1)](https://www.erlang.org/doc/man/erl.html) for the full flag semantics.

### Schedulers

@[config](vm.cpu.scheduler.total,integer,0,v1.0.0)

Number of scheduler threads to create (`erl +S Total:Online`), combined with [vm.cpu.scheduler.online](#vm.cpu.scheduler.online) into a single flag. `0` (the default) uses the VM's own default — normally one scheduler per logical CPU, or fewer if the emulator detects a CPU quota (e.g. a container `cpu.limit`). Rarely needs changing: lower it only to leave headroom for other processes co-located on the same host.

@[config](vm.cpu.scheduler.online,integer,0,v1.0.0)

Number of those scheduler threads to keep online at boot (`erl +S Total:Online`); can also be changed at runtime via `erlang:system_flag(schedulers_online, N)`. `0` uses the VM default. Taking schedulers offline (while keeping them created) is cheaper to reverse at runtime than changing the total.

@[config](vm.cpu.scheduler.busy_wait_threshold,none&#124;very_short&#124;short&#124;medium&#124;long&#124;very_long,none,v1.0.0)

How long a scheduler busy-waits for new work before sleeping, once its run queue empties. A longer threshold trades idle CPU burn for lower wake-up latency on bursty workloads; `none` sleeps immediately. This flag's semantics are Erlang/OTP-internal and can change between OTP releases without notice.

@[config](vm.cpu.scheduler.compaction_of_load,on&#124;off,on,v1.0.0)

When on, load balancing favours migrating runnable processes onto a smaller set of schedulers so that as many schedulers as possible stay fully loaded, rather than spreading load evenly and leaving several schedulers occasionally idle. Mutually exclusive in intent with [vm.cpu.scheduler.utilization_balancing](#vm.cpu.scheduler.utilization_balancing) below — Erlang/OTP recommends leaving at most one of the two enabled.

@[config](vm.cpu.scheduler.utilization_balancing,on&#124;off,off,v1.0.0)

When on, load balancing instead strives for equal scheduler *utilization* across all schedulers, rather than compacting load onto fewer of them. See [vm.cpu.scheduler.compaction_of_load](#vm.cpu.scheduler.compaction_of_load) above.

@[config](vm.cpu.scheduler.force_wakeup_interval,integer,0,v1.0.0)

Interval in milliseconds at which the VM scans all run queues and wakes one sleeping scheduler for each non-empty queue it finds (`erl +sfwi`). `0`, the default, disables the scan. It is a workaround for native code that runs for long periods without yielding; enable it only if you see work waiting in run queues while schedulers sleep.

### Dirty schedulers

Dirty schedulers run work that would block a normal scheduler for too long: dirty CPU schedulers take CPU-bound native code and large garbage collections, dirty I/O schedulers take blocking I/O such as file reads and writes.

@[config](vm.cpu.dirty_scheduler.number,integer,N/A,v1.0.0)

Number of dirty CPU scheduler threads to create (`erl +SDcpu Total:Online`), combined with [vm.cpu.dirty_scheduler.online](#vm.cpu.dirty_scheduler.online) into a single flag. At most 1024, and the VM also caps it at the number of normal schedulers. Unset, the VM creates as many as there are normal schedulers. The cap exists so that dirty CPU work cannot starve normal processes.

@[config](vm.cpu.dirty_scheduler.online,integer,N/A,v1.0.0)

Number of those dirty CPU scheduler threads to keep online at boot (`erl +SDcpu Total:Online`). At most 1024, and capped at the number of normal schedulers online. Unset, it equals the number of normal schedulers online. It can also be changed at runtime with `erlang:system_flag(dirty_cpu_schedulers_online, N)`.

@[config](vm.cpu.dirty_scheduler.busy_wait_threshold,none&#124;very_short&#124;short&#124;medium&#124;long&#124;very_long,none,v1.0.0)

As [vm.cpu.scheduler.busy_wait_threshold](#vm.cpu.scheduler.busy_wait_threshold), for dirty CPU schedulers (`erl +sbwtdcpu`). Bondy sets `none`, so idle dirty CPU schedulers sleep at once instead of spending CPU on a busy wait; the VM's own default is `short`.

@[config](vm.io.dirty_scheduler.number,integer,128,v1.0.0)

Number of dirty I/O scheduler threads (`erl +SDio`), from 1 to 1024. Bondy raises it from the VM default of 10 to 128. Unlike dirty CPU schedulers, the count is not capped by the number of normal schedulers, because dirty I/O threads are expected to spend their time blocked rather than on the CPU. Use microstate accounting (`msacc`) to see their load before changing it.

@[config](vm.io.dirty_scheduler.stack_size,integer,N/A,v1.0.0)

Suggested stack size for dirty I/O scheduler threads, in kilowords (`erl +sssdio`). At most 128. Unset, the VM default of 40 kilowords applies. Dirty I/O threads get a smaller stack than normal schedulers; raise this only if a NIF or driver doing deep work on them overflows it.

@[config](vm.io.dirty_scheduler.busy_wait_threshold,none&#124;very_short&#124;short&#124;medium&#124;long&#124;very_long,none,v1.0.0)

As [vm.cpu.scheduler.busy_wait_threshold](#vm.cpu.scheduler.busy_wait_threshold), for dirty I/O schedulers (`erl +sbwtdio`). Bondy sets `none`; the VM's own default is `short`.

### Asynchronous I/O

@[config](vm.async_thread.number,integer,1,v1.0.0)

Number of threads in the async thread pool (`erl +A`), used by linked-in drivers for work that could otherwise block a scheduler for a long time. Since OTP 21 few of Erlang/OTP's own linked-in drivers still use this pool — most have moved to dirty I/O schedulers — so this mainly matters if a NIF or driver dependency of Bondy's still relies on it.

@[config](vm.async_thread.stack_size,bytesize,N/A,v1.0.0)

Suggested stack size for each async pool thread (`erl +a`). You give a byte size such as `128KB`; Bondy converts it to the kilowords the flag expects. The value must be divisible by the word size and lie between 16 and 8192 kilowords (128KB to 64MB on a 64-bit VM). Unset, the VM default of 16 kilowords applies. The VM treats it as a suggestion and may ignore it on some platforms. Raise it only for a linked-in driver that needs a deeper stack than Erlang/OTP's own drivers.

### I/O polling

The VM watches sockets and other file descriptors for readiness with dedicated poll threads, each serving one or more pollsets. The key names below spell "poll" as "pool".

@[config](vm.io.poolset.number,integer,N/A,v1.0.0)

Number of pollsets (`erl +IOp`). It only applies on platforms that support concurrent updates of a pollset; elsewhere the VM uses one pollset per poll thread. Unset, the VM uses 1.

@[config](vm.io.poolset.percentage,integer,N/A,v1.0.0)

Number of pollsets as a percentage of the number of poll threads (`erl +IOPp`). Ignored when [vm.io.poolset.number](#vm.io.poolset.number) is also set.

@[config](vm.io.pool_thread.number,integer,N/A,v1.0.0)

Number of I/O poll threads (`erl +IOt`), from 1 to 1024. Unset, the VM uses 1. If microstate accounting (`msacc`) shows the poll thread under high load, add threads.

@[config](vm.io.pool_thread.percentage,integer,N/A,v1.0.0)

Number of I/O poll threads as a percentage of the number of schedulers (`erl +IOPt`). Ignored when [vm.io.pool_thread.number](#vm.io.pool_thread.number) is also set.

### Ports

@[config](vm.port.limit,integer,2097152,v1.0.0)

Maximum number of simultaneously open ports (`erl +Q`) — every listener socket, outbound TCP/TLS connection, and file handle the VM holds counts against this limit. The emulator may round the configured value up. Raise it before you raise your OS file-descriptor limit for the Bondy process, since this is the VM-level ceiling underneath that OS one.

### Processes

@[config](vm.process.limit,integer,2097152,v1.0.0)

Maximum number of Erlang processes that can exist at once (`erl +P`), from 1024 to 134217727. Every Erlang process counts against it, so it also caps the router's own limits, such as the [overload protection](/router/reference/configuration/overload_protection) settings. The VM may choose a larger value than the one given, often a power of two; `erlang:system_info(process_limit)` reports the value in effect.

### Memory allocators

@[config](vm.memory_allocators.allocation_tagging,on&#124;off,on,v1.0.0)

Tags allocations with the code that made them (`erl +Muatags`), so that memory used by NIFs and drivers can be attributed when you inspect the node's allocators. Bondy turns it on.

@[config](vm.memory_allocators.super_carrier_size,bytesize,0MB,v1.0.0)

Size of the super carrier (`erl +MMscs`), given as a byte size and passed to the VM in megabytes. The super carrier is one large contiguous area of virtual address space reserved up front; the segment allocator (`mseg_alloc`) creates new carriers inside it while it exists. `0MB`, the default, disables it.

@[config](vm.memory_allocators.super_carrier_only,on&#124;off,off,v1.0.0)

When on, the segment allocator creates carriers only inside the super carrier (`erl +MMsco`); when off, it creates carriers outside it once it is full. Bondy sets `off`; the VM's own default is `true`. It has no effect unless [vm.memory_allocators.super_carrier_size](#vm.memory_allocators.super_carrier_size) is non-zero.

### Time

@[config](vm.time_correction,on&#124;off,on,v1.0.0)

Enables time correction (`erl +c`), which lets the VM adjust Erlang monotonic time to stay in step with the operating system's clock. Leave it on.

@[config](vm.time_correction.warp_mode,no_time_warp&#124;single_time_warp&#124;multi_time_warp,multi_time_warp,v1.0.0)

The time warp mode (`erl +C`): how Erlang system time may move when the operating system clock changes. Bondy sets `multi_time_warp`, which lets Erlang system time follow changes to the OS clock at any moment while Erlang monotonic time keeps advancing steadily; the VM's own default is `no_time_warp`.

### Distribution

Bondy carries cluster traffic over Partisan, not distributed Erlang. Distributed Erlang is only used to attach a remote shell, for example with `bondy remote_console`.

@[config](vm.distribution.interface,string,N/A,v1.0.0)

The IPv4 or IPv6 address that distributed Erlang listens on. This is not an emulator flag: it sets the `kernel` application's `inet_dist_use_interface` parameter, and the value must be a literal address, not a hostname. Unset, distribution listens on all interfaces. Set it to a loopback or private address to keep the remote-shell port off public networks.

### Crash dumps

@[config](vm.crash_dump,path,N/A,v1.0.0)

The file the VM writes a crash dump to when it terminates abnormally. Bondy passes it as the `ERL_CRASH_DUMP` environment variable (`erl -env ERL_CRASH_DUMP <file>`). Unset, the VM writes `erl_crash.dump` in its working directory. The Docker image sets the `ERL_CRASH_DUMP` environment variable to `/dev/null`, which discards dumps. To keep dumps for analysis, point this at a volume that survives a container restart.

### Logging

@[config](vm.W,w&#124;i&#124;e,w,v1.0.0)

How the VM's built-in `error_logger` classifies messages sent to its warning routines: as warnings (`w`, the default), errors (`e`), or info reports (`i`). This governs only the emulator's own warning-classification convention, not Bondy's application-level [logging configuration](/router/reference/logging).

## See also

- [Logging Configuration Reference](/router/reference/logging) — Bondy's own application-level log levels and handlers, distinct from the VM-level `vm.W` mapping above.
- [Clustering](/router/concepts/clustering) — why cluster formation doesn't depend on `distributed_cookie` or Distributed Erlang.