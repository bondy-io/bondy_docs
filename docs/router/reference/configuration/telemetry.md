---
outline: [2,3]
related:
    - text: Telemetry
      type: Concept
      link: /router/concepts/telemetry
      description: Propagation, span seats, minting and export — the model behind these keys.
    - text: Distributed Tracing
      type: How-to Guide
      link: /router/guides/administration/distributed_tracing
      description: The operator walkthrough these keys belong to.
    - text: Prometheus Metrics Reference
      type: Reference
      link: /router/reference/metrics
      description: The metrics side of telemetry — no configuration needed beyond a listener with the metrics service.
---

# Telemetry Configuration Reference

The `tracing.*` keys configure distributed-tracing span export
(OpenTelemetry, over OTLP) and context minting. Everything else about
telemetry needs no configuration: trace-context **propagation** is always
on, and the Prometheus **metrics** endpoint exists wherever a listener's
services include `metrics` (the reserved `admin` listener carries it by
default) — see the
[Network Listeners Reference](/router/reference/configuration/listeners).

## Span export (OTLP)

@[config](tracing.otlp.enabled,on|off,off,v1.0.0)

Whether Bondy exports trace spans over OTLP. When off (the default) the
OpenTelemetry SDK inside Bondy runs inert: no spans are recorded or
exported and no connections are attempted. Enable it on every node whose
spans you want — each node exports its own.

@[config](tracing.otlp.endpoint,string,http://localhost:4318,v1.0.0)

The OTLP endpoint spans are exported to, over OTLP/HTTP (protobuf). Give
the base URL only — the exporter appends the `/v1/traces` signal path
itself. The transport is fixed to OTLP/HTTP; there is no gRPC option.

@[config](tracing.service_name,string,bondy-connect,v1.0.0)

The `service.name` resource attribute stamped on every exported span — how
this node's spans are labelled in the tracing backend. Additional resource
attributes can be supplied through the standard `OTEL_RESOURCE_ATTRIBUTES`
environment variable, which the SDK reads natively.

## Minting

By default Bondy only ever joins a caller's trace context. These two keys
make it the trace boundary — see
[Minting](/router/concepts/telemetry#minting-bondy-as-the-trace-boundary).

@[config](tracing.mint.enabled,on|off,off,v1.0.0)

Whether Bondy mints a W3C trace context for a CALL that arrives without
one — the trace-boundary behaviour API gateways implement. Off, an
untraced call produces no spans anywhere. On, an untraced call gets a
fresh sampled context at the caller's node, which then rides Bondy's own
propagation — call and invocation legs, cross-node hops, the MCP upstream
`_meta` — and reaches callees, so their instrumentation can join too.
Calls that already carry a context are never re-minted. Publish/subscribe
is deliberately excluded: like a message broker, Bondy carries publisher
context verbatim and mints nothing on that plane.

@[config](tracing.mint.ratio,float,1.0,v1.0.0)

Head-sampling ratio for minted contexts: the fraction of untraced calls
that get one (`1.0` = all of them). An unsampled call stays untraced end
to end — no context is minted at all, so nothing downstream pays for it.
Only applies to minting; a context the caller attached is always honoured
regardless of this setting. Values outside `0.0`–`1.0` are refused.
