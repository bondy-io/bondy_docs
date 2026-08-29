---
outline: [2,3]
related:
    - text: Telemetry
      type: Concept
      link: /router/concepts/telemetry
      description: Propagation, span seats, minting and export — the model this guide switches on.
    - text: Telemetry Configuration Reference
      type: Configuration Reference
      link: /router/reference/configuration/telemetry
      description: The tracing.* keys.
    - text: Monitoring a Bondy Cluster
      type: How-to Guide
      link: /router/guides/administration/monitoring
      description: The bundled observability stack this guide's Tempo instance comes from.
---

# Distributed Tracing

This guide turns on OpenTelemetry span export and gets Bondy's spans —
router RPC legs, node-to-node hops, SDK legs and the MCP edge — into
Grafana Tempo. Read [Telemetry](/router/concepts/telemetry) first for what
is traced and why; this page is the operator steps.

## 1. Have an OTLP endpoint

Bondy exports over **OTLP/HTTP (protobuf)**. Any OTLP-native backend or
collector works — Grafana Tempo, Jaeger, an OpenTelemetry Collector. The
`monitoring/` docker-compose stack in the Bondy source ships Tempo with its
OTLP/HTTP ingest on port `4318`, a provisioned Grafana datasource, and
Tempo's metrics generator enabled — the part its Service Graph and Traces
Drilldown views require.

## 2. Enable export

In `bondy.conf`, on **every node** whose spans you want (each node exports
its own):

```
tracing.otlp.enabled  = on
tracing.otlp.endpoint = http://tempo.example.net:4318
tracing.service_name  = bondy-connect
```

The endpoint is the base URL — the exporter appends the `/v1/traces`
signal path itself — and defaults to `http://localhost:4318`, which
matches the bundled stack on the same host. `tracing.service_name` is the
`service.name` every span carries, i.e. how this system is labelled in the
backend.

When `tracing.otlp.enabled` is off (the default) the OpenTelemetry SDK
inside Bondy runs inert: no spans are recorded and no connections are
attempted.

## 3. Trace a call

Propagation is always on, so any caller that attaches a W3C `traceparent`
is already traced — from a `bondy_connect_sdk` client:

```erlang
Ctx = #{traceparent => <<"00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01">>},
Opts = bondy_connect_trace:attach(#{}, Ctx),
bondy_connect_client:call(Conn, Uri, Args, KWArgs, Opts).
```

The trace then shows the caller's own span (if its runtime emits one),
Bondy's `call` and `invocation` legs on whichever nodes served them, the
`forward`/`receive` pair for a cross-node call, and the callee's spans if
it joins via `bondy_connect_trace:extract/1`. A failed call marks its legs
with error status. On the MCP edge nothing needs attaching: an agent's
`_meta.traceparent` is picked up per the MCP specification.

## 4. Trace callers that attach nothing

If your clients do not attach context, make Bondy the trace boundary:

```
tracing.mint.enabled = on
tracing.mint.ratio   = 0.1
```

An untraced CALL now gets a fresh context minted at the caller's node —
`ratio` head-samples which fraction of untraced calls get one (an unsampled
call stays untraced end to end and pays nothing) — and the minted trace is
**rooted**: the call leg is emitted as the trace's root span, so
root-scoped views (Tempo's Traces Drilldown) see it. Calls that already
carry a context are never re-minted, whatever the ratio.

Minting applies to RPC and the MCP edge only; publishes are never minted —
Bondy behaves like a message broker there, carrying publisher context
verbatim.

## 5. Verify

Drive a traced call (step 3) or any call with minting on, then query the
backend — in Grafana, Explore → the Tempo datasource → search by service
name. You should see, per cross-node call, four Bondy spans in one trace:
`call` and `invocation` legs plus the `forward <uri>`/`receive <uri>` pair,
with the invocation nested under `receive`. The Service Graph view draws
one edge per node-to-node hop pair.

Two things that look like faults but are not:

- **A span-less trace id.** Bondy carries any syntactically binary
  `traceparent` verbatim, valid or not — a garbage value propagates fine
  and simply produces no spans.
- **Empty Drilldown right after enabling.** Tempo's TraceQL-metrics views
  only cover spans ingested after its metrics generator was enabled;
  history does not backfill.

## Notes

- The OTLP transport is HTTP/protobuf only; there is no gRPC option.
- Additional resource attributes can be supplied through the standard
  `OTEL_RESOURCE_ATTRIBUTES` environment variable, which the SDK reads
  natively.
- Span export is asynchronous and batched; enabling it does not gate any
  routing path.
