---
outline: [2,3]
related:
    - text: Distributed Tracing
      type: How-to Guide
      link: /router/guides/administration/distributed_tracing
      description: Enable OTLP export, point it at Tempo, and make Bondy the trace boundary.
    - text: Telemetry Configuration Reference
      type: Configuration Reference
      link: /router/reference/configuration/telemetry
      description: The tracing.* keys.
    - text: Prometheus Metrics Reference
      type: Reference
      link: /router/reference/metrics
      description: Every metric family the /metrics endpoint exposes.
    - text: Monitoring a Bondy Cluster
      type: How-to Guide
      link: /router/guides/administration/monitoring
      description: The bundled Prometheus + Grafana + Tempo stack.
    - text: Alarms
      type: Concept
      link: /router/concepts/alarms
      description: The third thing an operator watches — conditions that are true now.
---

# Telemetry

Bondy's observability is built on one internal mechanism — **telemetry
events** — with two consumers an operator sees: **Prometheus metrics**,
scraped from every node's `/metrics` endpoint, and **distributed tracing**,
exported as OpenTelemetry spans over OTLP. Instrumented code emits an event
and moves on; what becomes a metric sample, a span, or nothing at all is
decided by the consumers, so the cost of *not* observing something is close
to zero and turning observation on changes no routing behaviour.

## Metrics

Every node serves a Prometheus-format endpoint at `/metrics` on any
listener whose services include `metrics` — the reserved `admin` listener
carries it by default (port 18081). The
[Metrics Reference](/router/reference/metrics) catalogues the families:
storage, cluster, router/WAMP, MCP, mail and the BEAM VM. Hot-path families
are backed by a wait-free, ETS-based recording primitive, which is why
per-message counters and histograms are affordable on the routing path.

## Distributed tracing

Tracing answers a different question than metrics: not *how much, how
fast*, but *what happened to this one request as it crossed clients, Bondy
nodes and services*. Bondy's tracing follows the
[W3C Trace Context](https://www.w3.org/TR/trace-context/) standard end to
end, in three layers.

### Propagation: context rides the messages

A caller attaches `traceparent` — and optionally `tracestate` and
`baggage` — to a CALL or PUBLISH as WAMP extension options
(`_traceparent`, `_tracestate`, `_baggage`). Bondy copies them
**verbatim** onto the INVOCATION a callee receives and the EVENT a
subscriber receives, on the same node and across the cluster. Bondy never
parses or rewrites the values it carries, with one deliberate exception:
at a cluster forward the router adds its own entry to `tracestate` (the
W3C-sanctioned vendor mechanism) so the two sides of the hop can be paired
into a service-graph edge. Response legs (RESULT, ERROR) carry no trace
context — W3C propagation is request-direction.

Propagation is always on and costs a map copy; it needs no configuration.

The client SDK (`bondy_connect_sdk`) exposes it explicitly —
`bondy_connect_trace:attach/2` on the way out, `bondy_connect_trace:extract/1`
inside a handler — with no ambient per-process context: what is traced is
what you attached. On the [MCP edge](/router/concepts/mcp_gateway) the same
context maps to and from the protocol's `_meta` keys (`traceparent`,
`tracestate`, `baggage`, per the MCP specification), in both directions —
an agent's trace context reaches WAMP callees, and calls Bondy makes to
upstream MCP servers carry it onward.

### Spans: what Bondy itself reports

With `tracing.otlp.enabled = on`, Bondy exports **retroactive spans** — a
span is emitted when a unit of work completes, timed by its measured
duration, so a crash can never orphan a half-open span. The span seats:

- **Router RPC legs** — one span per settled call promise: the caller-side
  `call` leg (SERVER) and the callee-side `invocation` leg (CLIENT), on
  whichever nodes they ran. A failed leg (WAMP ERROR) carries OTel error
  status.
- **Cluster forwards** — a `forward`/`receive` CLIENT–SERVER span pair per
  node-to-node hop, which is what draws real node-to-node edges in a
  tracing backend's service graph.
- **SDK legs** — a client built on `bondy_connect_sdk` emits the mirror
  image: its own `call` (CLIENT) and `invocation` (SERVER) spans.
- **MCP edge** — one span per tool call, resource read and upstream call,
  named `tools/call <name>`, `resources/read <name>`, `upstream <id>`.

All spans parent to the propagated context, so Bondy's spans appear inside
the trace the calling system started. An untraced request produces no
spans and pays no export cost.

The publish/subscribe plane deliberately has no span seat: fan-out would
multiply spans by subscriber count. Events still *carry* the publisher's
context verbatim, so subscriber-side instrumentation can join the trace.

### Minting: Bondy as the trace boundary

By default Bondy only ever **joins** a trace: a call arriving without
`traceparent` stays untraced end to end. Deployments whose clients attach
no context can make Bondy the trace boundary — the behaviour API gateways
implement — with `tracing.mint.enabled = on`: an untraced CALL gets a
fresh, sampled context minted at the caller's node (head-sampled by
`tracing.mint.ratio`), and the trace's root span is the call leg itself,
so the backend sees a complete, rooted trace. A context the caller
attached is always honoured and never re-minted; pub/sub is excluded from
minting for the same fan-out reason as above.

### Correlation with alarms

An [alarm](/router/concepts/alarms) raised on a request path carries
`onset_trace_id`, the trace id of the occurrence that raised the condition, so
an operator holding an alarm can jump to the exact request that tripped it.

The field is absent on most alarms, and that follows from the propagation model
above rather than from an omission: a trace rides in a message's options, so a
producer with no request to inherit from has none. Seven of the nine conditions
Bondy can raise are background probes, appliers and sweepers. Bondy leaves the
field absent there rather than minting an id that would correlate with nothing.

`onset_trace_id` names the **first** occurrence and survives restatement, the
same way `raised_at` does — an alarm up for an hour points at the request that
started it, not at the most recent one.

### Export

Spans leave the node over **OTLP/HTTP (protobuf)** — the transport Grafana
Tempo, Jaeger and OTLP-native collectors consume directly; gRPC transport
is deliberately not offered. `tracing.service_name` is the `service.name`
resource attribute every span carries. The export machinery lives in its
own OTP application (`bondy_telemetry_exporter`), which also owns the
Prometheus reporting — instrumented applications emit events and hold no
dependency on either backend.

See [Distributed Tracing](/router/guides/administration/distributed_tracing)
for the operator walkthrough, and the
[Telemetry Configuration Reference](/router/reference/configuration/telemetry)
for the keys.
