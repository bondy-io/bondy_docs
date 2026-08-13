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

## The default handler

Bondy ships one log handler, `default`, configurable via the keys below. Additional handlers can be added under `log.handlers.$id.*`, following the same key shape, e.g. to send a separate, more selective log to its own destination.

@[config](log.handlers.default.enabled,on&#124;off,on,v1.0.0)

Whether the default handler is active at all. Turning it off silences Bondy's logging entirely unless another handler is configured.

@[config](log.handlers.default.level,debug&#124;info&#124;notice&#124;warning&#124;error&#124;critical&#124;alert&#124;emergency,info,v1.0.0)

A second, per-handler level filter, applied after `log.level`. Since an event must pass both filters to be logged, setting this below `log.level` has no effect — use `log.level` to change what's captured at all, and this key only to make one handler stricter than the primary level.

@[config](log.handlers.default.backend,disk&#124;console,console,v1.0.0)

Where the default handler writes: `console` for standard output/error, `disk` for a log file. This is the coarse switch; `log.handlers.default.config.type` and `.config.file` below control the specifics of each.

@[config](log.handlers.default.config.type,standard_io&#124;standard_error&#124;file,standard_io,v1.0.0)

For a `console` backend, which stream to write to. Defaults to `standard_io`, unless `log.handlers.default.config.file` is set, in which case Bondy treats the handler as file-based regardless of this value.

@[config](log.handlers.default.config.file,path,N/A,v1.0.0)

Log file path for a `disk` (or file-configured `console`) handler. Setting this implies `log.handlers.default.config.type = file`.

::: tip Running under a supervisor
When Bondy runs attached to a terminal (e.g. `bondy console`) or under a process supervisor that captures standard output (Docker, systemd), leave the backend as `console` and let the supervisor own log capture and rotation, rather than pointing Bondy at a file it would then need to rotate itself.
:::

## Advanced handler tuning

The default handler also exposes OTP Logger's overload-protection knobs — burst limiting (`log.handlers.default.config.burst_limit_enable`, `.burst_limit_max_count`, `.burst_limit_window_time`), queue-length-based load shedding (`.sync_mode_qlen`, `.drop_mode_qlen`, `.flush_qlen`), and an overload-triggered restart (`.overload_kill_enable` and related keys) — plus formatter options (`log.handlers.default.formatter.*`) for colored output, term/map depth, and timestamp format. These follow [Erlang's Logger handler configuration](https://www.erlang.org/doc/apps/kernel/logger_chapter.html#handlers) directly; the defaults suit most deployments, and are worth changing only once you've identified a specific overload or formatting problem.

## See also

- [Node Configuration Reference](/router/reference/configuration/node#logging) — `vm.W`, the separate VM-level warning-message classification, not to be confused with this application-level logging configuration.
