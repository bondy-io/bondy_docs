# Logging Configuration Reference

Bondy logs through Erlang/OTP's Logger application. Every log event carries one of eight severity levels, most to least severe:

|Level|Description|
|:---|---|
|emergency|system is unusable|
|alert|action must be taken immediately|
|critical|critical conditions|
|error|error conditions|
|warning|warning conditions|
|notice|normal but significant conditions|
|info|informational messages|
|debug|debug-level messages|

A level filters events *less* severe than itself: at `info` (the default), `debug` events are discarded and everything from `info` up to `emergency` is kept.

## Setting the level

@[config](log.level,debug&#124;info&#124;notice&#124;warning&#124;error&#124;critical&#124;alert&#124;emergency,info,v1.0.0)

The primary log level. An event less severe than this is discarded immediately, before it reaches any handler — lowering this is the first step to seeing `debug` events; raising it is the cheapest way to cut logging volume in production.

## Log handlers

A handler takes the events that pass `log.level`, applies its own level and filters, formats each event as one line, and writes it to its destination. Every handler has its own overload protection, file sync, filter, and formatter settings.

Bondy ships one handler, `default`, configured under `log.handlers.default.*`. Additional handlers are declared under `log.handlers.$id.*`, where `$id` is a name you choose. Both families accept the same keys with the same defaults, with one exception: `log.handlers.default.enabled` defaults to `on`, while `log.handlers.$id.enabled` defaults to `off`. Bondy builds a handler only when its `enabled` key is `on`, so a new handler needs at least that key set.

Each section below documents the `$id` keys in full, then lists the matching `log.handlers.default.*` keys.

The following `bondy.conf` fragment adds a second handler named `errors`. It writes events of level `error` and above to a file, without colour, while the default handler keeps writing to standard output:

```properties
log.handlers.errors.enabled = on
log.handlers.errors.level = error
log.handlers.errors.config.type = file
log.handlers.errors.config.file = /var/log/bondy/error.log
log.handlers.errors.formatter.colored = off
```

Every key the fragment leaves out takes its default. `config.type = file` is required alongside `config.file`; see [`config.file`](#log.handlers.$id.config.file).

## Declaring a handler

@[config](log.handlers.$id.enabled,on&#124;off,off,v1.0.0)

Whether the handler `$id` exists. Bondy only builds handlers whose `enabled` key is `on`; every other key under `log.handlers.$id` is ignored while this is `off`.

@[config](log.handlers.$id.backend,disk&#124;console,console,v1.0.0)

The Logger handler module behind this handler: `console` selects OTP's `logger_std_h`, which writes to standard output, standard error, or a file, depending on `config.type`. `disk` selects OTP's `logger_disk_log_h`.

::: warning `disk` is rejected in this release
`logger_disk_log_h` accepts only `wrap` or `halt` as its type, but Bondy always passes `config.type`, whose values are `standard_io`, `standard_error` or `file`. OTP Logger therefore rejects a `disk` handler with an `invalid_config` error. To write to a file, keep `backend = console` and set `config.type = file`.
:::

@[config](log.handlers.$id.level,debug&#124;info&#124;notice&#124;warning&#124;error&#124;critical&#124;alert&#124;emergency,info,v1.0.0)

The handler's own level, applied after `log.level`. An event must pass both to be written, so setting this below `log.level` has no effect. Use `log.level` to change what Bondy captures at all, and this key to make one handler stricter than the others.

@[config](log.handlers.$id.config.type,standard_io&#124;standard_error&#124;file,standard_io,v1.0.0)

The destination of a `console` handler: standard output, standard error, or the file named by `config.file`.

@[config](log.handlers.$id.config.file,path,N/A,v1.0.0)

The log file path when `config.type` is `file`. A relative path is resolved against the node's working directory. Because `config.type` always has a value (`standard_io` unless set), setting `config.file` alone is not enough: OTP Logger rejects a `standard_io` or `standard_error` handler that names a file. Set `config.type = file` together with this key.

::: tip Running under a supervisor
When Bondy runs attached to a terminal (e.g. `bondy console`) or under a process supervisor that captures standard output (Docker, systemd), leave the default handler on `standard_io` and let the supervisor own log capture and rotation, rather than pointing Bondy at a file it would then need to rotate itself.
:::

The default handler accepts the same keys under `log.handlers.default`.

@[config](log.handlers.default.enabled,on&#124;off,on,v1.0.0)

Whether the default handler is active. Turning it off silences Bondy's logging entirely unless another handler is enabled.

@[config](log.handlers.default.backend,disk&#124;console,console,v1.0.0)

The default handler's backend. See [`log.handlers.$id.backend`](#log.handlers.$id.backend).

@[config](log.handlers.default.level,debug&#124;info&#124;notice&#124;warning&#124;error&#124;critical&#124;alert&#124;emergency,info,v1.0.0)

The default handler's level. See [`log.handlers.$id.level`](#log.handlers.$id.level).

@[config](log.handlers.default.config.type,standard_io&#124;standard_error&#124;file,standard_io,v1.0.0)

The default handler's destination. See [`log.handlers.$id.config.type`](#log.handlers.$id.config.type).

@[config](log.handlers.default.config.file,path,N/A,v1.0.0)

The default handler's log file. Requires `log.handlers.default.config.type = file`. See [`log.handlers.$id.config.file`](#log.handlers.$id.config.file).

## Overload protection

Each handler protects itself from overload in three ways. Burst limiting caps the number of events written per time window. Queue-length thresholds switch the handler between asynchronous, synchronous, drop, and flush modes as its message queue grows. Overload kill terminates and restarts a handler whose queue or memory grows past a limit. The defaults suit most deployments; change them only after observing a specific overload problem.

### Burst limit

@[config](log.handlers.$id.config.burst_limit_enable,on&#124;off,on,v1.0.0)

Enables burst limiting. With it on, the handler writes at most `burst_limit_max_count` events per `burst_limit_window_time` and drops the rest until the window ends. This keeps a burst of events from filling a log file quickly or slowing down file sync.

@[config](log.handlers.$id.config.burst_limit_max_count,integer,500,v1.0.0)

The maximum number of events the handler writes within one burst window.

@[config](log.handlers.$id.config.burst_limit_window_time,duration,1s,v1.0.0)

The length of the burst window.

### Queue-length thresholds

The handler checks its message queue length as it processes events. The three thresholds below select its mode. Below `sync_mode_qlen`, processes that log hand events to the handler and continue (asynchronous mode). From `sync_mode_qlen`, each logging process waits until the handler has processed its event (synchronous mode), which slows producers down. From `drop_mode_qlen`, new events are dropped before they reach the handler. From `flush_qlen`, the handler discards every event already in its queue. The values must satisfy `sync_mode_qlen` ≤ `drop_mode_qlen` ≤ `flush_qlen` and `drop_mode_qlen` > 1, or OTP Logger rejects the configuration. Setting two adjacent thresholds equal disables the lower mode, since the higher one is checked first.

@[config](log.handlers.$id.config.sync_mode_qlen,integer,10,v1.0.0)

The queue length at which the handler switches from asynchronous to synchronous mode.

@[config](log.handlers.$id.config.drop_mode_qlen,integer,200,v1.0.0)

The queue length at which new events are dropped.

@[config](log.handlers.$id.config.flush_qlen,integer,1000,v1.0.0)

The queue length at which the handler discards its whole queue.

### Overload kill

@[config](log.handlers.$id.config.overload_kill_enable,on&#124;off,off,v1.0.0)

Enables overload kill. With it on, the handler process is terminated when its queue exceeds `overload_kill_qlen` or its memory exceeds `overload_kill_mem_size`, and is restarted after `overload_kill_restart_after`. This bounds the memory a handler can use when the other mechanisms cannot keep up.

@[config](log.handlers.$id.config.overload_kill_mem_size,integer,3000000,v1.0.0)

The maximum memory, in bytes, the handler process may use before it is terminated.

@[config](log.handlers.$id.config.overload_kill_qlen,integer,20000,v1.0.0)

The maximum queue length the handler may reach before it is terminated.

@[config](log.handlers.$id.config.overload_kill_restart_after,duration,5s,v1.0.0)

The delay before a terminated handler restarts.

### Default handler

The default handler accepts the same overload keys under `log.handlers.default.config`, with the same defaults.

@[config](log.handlers.default.config.burst_limit_enable,on&#124;off,on,v1.0.0)

See [`log.handlers.$id.config.burst_limit_enable`](#log.handlers.$id.config.burst_limit_enable).

@[config](log.handlers.default.config.burst_limit_max_count,integer,500,v1.0.0)

See [`log.handlers.$id.config.burst_limit_max_count`](#log.handlers.$id.config.burst_limit_max_count).

@[config](log.handlers.default.config.burst_limit_window_time,duration,1s,v1.0.0)

See [`log.handlers.$id.config.burst_limit_window_time`](#log.handlers.$id.config.burst_limit_window_time).

@[config](log.handlers.default.config.sync_mode_qlen,integer,10,v1.0.0)

See [`log.handlers.$id.config.sync_mode_qlen`](#log.handlers.$id.config.sync_mode_qlen).

@[config](log.handlers.default.config.drop_mode_qlen,integer,200,v1.0.0)

See [`log.handlers.$id.config.drop_mode_qlen`](#log.handlers.$id.config.drop_mode_qlen).

@[config](log.handlers.default.config.flush_qlen,integer,1000,v1.0.0)

See [`log.handlers.$id.config.flush_qlen`](#log.handlers.$id.config.flush_qlen).

@[config](log.handlers.default.config.overload_kill_enable,on&#124;off,off,v1.0.0)

See [`log.handlers.$id.config.overload_kill_enable`](#log.handlers.$id.config.overload_kill_enable).

@[config](log.handlers.default.config.overload_kill_mem_size,integer,3000000,v1.0.0)

See [`log.handlers.$id.config.overload_kill_mem_size`](#log.handlers.$id.config.overload_kill_mem_size).

@[config](log.handlers.default.config.overload_kill_qlen,integer,20000,v1.0.0)

See [`log.handlers.$id.config.overload_kill_qlen`](#log.handlers.$id.config.overload_kill_qlen).

@[config](log.handlers.default.config.overload_kill_restart_after,duration,5s,v1.0.0)

See [`log.handlers.$id.config.overload_kill_restart_after`](#log.handlers.$id.config.overload_kill_restart_after).

## File sync

A handler that writes to a file can sync buffered data to disk at a fixed interval. It only syncs when something has been logged since the last sync. Without repeated sync, the operating system decides when buffered data reaches the disk. Handlers that write to standard output or standard error do not sync.

@[config](log.handlers.$id.config.filesync_repeat_enable,on&#124;off,on,v1.0.0)

Controls repeated file sync.

::: warning The flag is inverted in this release
Bondy's configuration translation turns repeated sync *off* when this key is `on`, and keeps `filesync_repeat_interval` when it is `off`. With the defaults, a file handler therefore does not sync on an interval. To get repeated sync, set this key to `off`.
:::

@[config](log.handlers.$id.config.filesync_repeat_interval,duration,5s,v1.0.0)

How often the handler syncs to disk while repeated sync is active.

The default handler accepts the same keys under `log.handlers.default.config`.

@[config](log.handlers.default.config.filesync_repeat_enable,on&#124;off,on,v1.0.0)

See [`log.handlers.$id.config.filesync_repeat_enable`](#log.handlers.$id.config.filesync_repeat_enable).

@[config](log.handlers.default.config.filesync_repeat_interval,duration,5s,v1.0.0)

See [`log.handlers.$id.config.filesync_repeat_interval`](#log.handlers.$id.config.filesync_repeat_interval).

## Filtering

Every handler runs a fixed chain of filters on each event that passes its level. Bondy builds the chain from the keys below:

1. Progress reports are written or dropped according to `allow_progress_reports`.
2. Events from processes whose group leader is on a remote node are dropped.
3. Events with no `domain` metadata are written. Bondy's own log events carry no domain, so they pass here.
4. Events in a domain named in `filter_domains` are written. Events in one of the known domains (`otp`, `ssl`, `bondy_audit`) that is not named are dropped.
5. An event no filter decided on is handled by `filter_default`.

@[config](log.handlers.$id.filter_default,log&#124;stop,stop,v1.0.0)

What happens to an event that no filter decided on: `log` writes it, `stop` drops it. With `stop`, an event whose domain does not exactly match one in `filter_domains` is dropped.

@[config](log.handlers.$id.filter_domains,string,otp&#44;bondy_audit,v1.0.0)

A comma-separated list of the domains this handler writes, drawn from `otp`, `ssl`, and `bondy_audit`. Each name matches an event's domain exactly: `otp` matches the domain `[otp, sasl]`, which OTP uses for supervisor, crash, and progress reports; `ssl` matches `[ssl]`; `bondy_audit` matches `[bondy_audit]`. Events whose domain is `[otp]` alone, or `[otp, ssl]`, match none of these and fall through to `filter_default`. Leaving a domain out of one handler and naming it in another sends that domain's events to the second handler only.

@[config](log.handlers.$id.allow_progress_reports,on&#124;off,off,v1.0.0)

Whether the handler writes OTP progress reports, the events supervisors and applications emit as they start children. They are noisy and are off by default. Turning this on also requires `otp` in `filter_domains`, since progress reports carry the `[otp, sasl]` domain and are dropped otherwise.

The default handler accepts the same keys under `log.handlers.default`.

@[config](log.handlers.default.filter_default,log&#124;stop,stop,v1.0.0)

See [`log.handlers.$id.filter_default`](#log.handlers.$id.filter_default).

@[config](log.handlers.default.filter_domains,string,otp&#44;bondy_audit,v1.0.0)

See [`log.handlers.$id.filter_domains`](#log.handlers.$id.filter_domains).

@[config](log.handlers.default.allow_progress_reports,on&#124;off,off,v1.0.0)

See [`log.handlers.$id.allow_progress_reports`](#log.handlers.$id.allow_progress_reports).

## Formatting

Every handler formats events with Bondy's `bondy_logger_formatter`, which writes each event as one line of `key=value` pairs:

```
when=2026-01-01T10:00:00.000000+00:00 level=info pid=<0.1234.0> at=bondy_mod:fun/2:42 description="..." node=bondy@127.0.0.1 realm=com.example ...
```

Metadata such as `realm`, `session_id`, or `trace_id` appears only when the event carries it. The keys below control how values are rendered.

@[config](log.handlers.$id.formatter.map_depth,integer,3,v1.0.0)

How many levels of nested maps the formatter flattens into `parent_child=value` pairs. Deeper levels are printed as `key=...`. `-1` removes the limit.

@[config](log.handlers.$id.formatter.term_depth,integer,50,v1.0.0)

The depth limit for printing Erlang terms that are not text, such as tuples and lists of integers. `-1` removes the limit.

@[config](log.handlers.$id.formatter.colored,on&#124;off,on,v1.0.0)

Whether the formatter wraps the `when` to `description` part of each line in a terminal colour chosen by level. Turn it off for handlers that write to a file or to a log collector that does not interpret ANSI escape sequences.

Each `colored_<level>` key holds the ANSI escape sequence that starts a line of that level. The defaults shown use `\e` for the escape character (byte `0x1B`). `bondy.conf` does not interpret `\e`, so a custom value must contain the escape character itself.

@[config](log.handlers.$id.formatter.colored_debug,string,\e[0;38m,v1.0.0)

The colour of `debug` lines.

@[config](log.handlers.$id.formatter.colored_info,string,\e[0;39m,v1.0.0)

The colour of `info` lines.

@[config](log.handlers.$id.formatter.colored_notice,string,\e[0;36m,v1.0.0)

The colour of `notice` lines.

@[config](log.handlers.$id.formatter.colored_warning,string,\e[0;33m,v1.0.0)

The colour of `warning` lines.

@[config](log.handlers.$id.formatter.colored_error,string,\e[0;31m,v1.0.0)

The colour of `error` lines.

@[config](log.handlers.$id.formatter.colored_critical,string,\e[0;35m,v1.0.0)

The colour of `critical` lines.

@[config](log.handlers.$id.formatter.colored_alert,string,\e[0;45m,v1.0.0)

The colour of `alert` lines.

@[config](log.handlers.$id.formatter.colored_emergency,string,\e[1;41;1m,v1.0.0)

The colour of `emergency` lines.

@[config](log.handlers.$id.formatter.time_offset,integer,0,v1.0.0)

The UTC offset applied to the `when` timestamp, in **microseconds**. `0` prints UTC with a `+00:00` suffix; `3600000000` prints UTC+1 with `+01:00`.

@[config](log.handlers.$id.formatter.time_designator,string,T,v1.0.0)

The character placed between the date and the time in the `when` timestamp, as in RFC 3339.

The default handler accepts the same keys under `log.handlers.default.formatter`.

@[config](log.handlers.default.formatter.map_depth,integer,3,v1.0.0)

See [`log.handlers.$id.formatter.map_depth`](#log.handlers.$id.formatter.map_depth).

@[config](log.handlers.default.formatter.term_depth,integer,50,v1.0.0)

See [`log.handlers.$id.formatter.term_depth`](#log.handlers.$id.formatter.term_depth).

@[config](log.handlers.default.formatter.colored,on&#124;off,on,v1.0.0)

See [`log.handlers.$id.formatter.colored`](#log.handlers.$id.formatter.colored).

@[config](log.handlers.default.formatter.colored_debug,string,\e[0;38m,v1.0.0)

The default handler's `debug` colour.

@[config](log.handlers.default.formatter.colored_info,string,\e[0;39m,v1.0.0)

The default handler's `info` colour.

@[config](log.handlers.default.formatter.colored_notice,string,\e[0;36m,v1.0.0)

The default handler's `notice` colour.

@[config](log.handlers.default.formatter.colored_warning,string,\e[0;33m,v1.0.0)

The default handler's `warning` colour.

@[config](log.handlers.default.formatter.colored_error,string,\e[0;31m,v1.0.0)

The default handler's `error` colour.

@[config](log.handlers.default.formatter.colored_critical,string,\e[0;35m,v1.0.0)

The default handler's `critical` colour.

@[config](log.handlers.default.formatter.colored_alert,string,\e[0;45m,v1.0.0)

The default handler's `alert` colour.

@[config](log.handlers.default.formatter.colored_emergency,string,\e[1;41;1m,v1.0.0)

The default handler's `emergency` colour.

@[config](log.handlers.default.formatter.time_offset,integer,0,v1.0.0)

See [`log.handlers.$id.formatter.time_offset`](#log.handlers.$id.formatter.time_offset).

@[config](log.handlers.default.formatter.time_designator,string,T,v1.0.0)

See [`log.handlers.$id.formatter.time_designator`](#log.handlers.$id.formatter.time_designator).

## See also

- [Node Configuration Reference](/router/reference/configuration/node#logging) — `vm.W`, the separate VM-level warning-message classification, not to be confused with this application-level logging configuration.
