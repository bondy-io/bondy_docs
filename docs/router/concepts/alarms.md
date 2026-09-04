---
outline: [2,3]
related:
    - text: Alarm Catalogue
      type: Reference
      link: /router/reference/alarms
      description: Every condition this build can raise, with its severity, class and runbook.
    - text: Alarms API
      type: API Reference
      link: /router/reference/wamp_api/alarm
      description: The four read procedures and the three event topics.
    - text: Responding to an Alarm
      type: How-to Guide
      link: /router/guides/administration/responding_to_alarms
      description: From a raised alarm to what to observe and the sanctioned remediation.
    - text: Telemetry
      type: Concept
      link: /router/concepts/telemetry
      description: Metrics and tracing — the other two things an operator watches.
---

# Alarms

An alarm is a statement that a **condition is true now**. It is not an event,
not a log line, and not a notification. A condition either holds or it does
not, so an alarm is identified by its id and raising one that is already
raised restates it rather than creating a second alarm. When the condition
stops holding, the alarm clears.

Clearing is the producer's job, and each producer observes its condition on its
own schedule — a probe interval, a sweep, the next request. So an alarm clears
one cycle after the condition goes away rather than at the instant it does, and
"cleared" means "this producer has since looked and found nothing", not
"someone marked it resolved".

That framing decides most of the design. A log line records that something
happened at a moment; an alarm answers "what is wrong with this node right
now", which is the question an operator asks first and the question a
dashboard cannot answer from counters alone.

Bondy replaces OTP's default `alarm_handler` with its own. Existing producers
keep calling `alarm_handler:set_alarm({Id, Description})` — the raw OTP
spelling — and gain severity, class and a runbook from the catalogue without
changing a line.

## The catalogue is the point

An alarm id used to be whatever its producer invented, discovered only when it
fired in production. The **alarm catalogue** is the enumeration of every
condition this build can raise, and each entry declares what the raise site
cannot say about itself:

- **`severity`** — `warning`, `major` or `critical`.
- **`class`** — `node`, `cluster`, `realm` or `integration`: who is expected to
  act.
- **`affects_ready`** — whether the condition should take the node out of the
  load balancer.
- **`config_keys`** — the configuration that governs the condition.
- **`observe_with`** — read-only procedures and metrics that show more.
- **`tasks`** — the procedures sanctioned as a remediation.

The catalogue is verified rather than asserted. A test reads the compiled
bytecode of every module in the build, finds every `set_alarm` and
`clear_alarm` call site, and fails if the id raised there has no entry. A new
producer that invents an id cannot ship. The same test checks that every
`task` names a catalogued task, that every `observe_with` procedure exists and
is *not* a task, and that every declared detail key is actually delivered at the
raise site.

That last check is worth naming precisely, because the guarantee is narrower
than it sounds: three of the nine entries declare detail keys and six declare
none, so the check proves an entry cannot lie about what it declares — not
that every alarm carries structured detail.

### Severity names what you do, not how bad it feels

The vocabulary is three levels rather than syslog's eight, because severity
should name the operator's response: ignore in hours, page in hours, page now.
Syslog's middle levels go unused in practice, and an unused level becomes a
place to park alarms nobody has classified. Three levels force the
classification when the catalogue entry is written, which is the cheapest
moment to argue about it.

### Readiness is a separate declaration

Severity does not decide whether a node leaves the load balancer.
`affects_ready` is its own per-alarm flag, and the reason is that the two
judgements genuinely differ: an unreachable upstream connector is `major` and
must *not* drain the node, because the whole WAMP data plane is unaffected. A
failed durable store is also `major` and must.

Today every catalogue entry declares `affects_ready => false`. That is a
finding rather than an oversight — of the nine conditions, only
`bondy_db_main_unavailable` stops the node serving, and its readiness flag
deliberately does not travel through the alarm at all. Conditions that must
survive an alarm-handler crash are recorded outside the alarm subsystem and
only mirrored as an alarm, so that a crash of the reporting mechanism cannot
erase the report.

## The runbook join

An alarm tells an operator what is wrong. The catalogue also tells them what to
look at and what may be done, which is the part alarm systems usually leave to
tribal knowledge:

- **`observe_with`** names read-only procedures and metrics. Looking is always
  sanctioned, so a mutating procedure may never appear there — a test enforces
  it, because one that did would let an agent act while believing it was only
  looking.

  The field is deliberately not called `signals`. `signal` names a first-class
  Bondy Lang module member — a push-based stream — and Bondy itself has an OS
  signal handler; these references are pulled, not pushed. The
  [task catalogue](/router/reference/wamp_api/task) already used `observe_with`
  for the same kind of thing, and both now carry the same `{kind, ref}` shape.
- a **task** is a `bondy.*` procedure sanctioned as a remediation, and it must
  be an entry in the [task catalogue](/router/reference/wamp_api/task), which
  carries its `impact` and `blast_radius`.

**Six of the nine entries have no task, and that is the answer rather than a
gap.** Only the mail relay and the MCP name collision have a remediation in
the WAMP API; nothing in `bondy.*` fixes a stalled drain, an unopenable durable
store, an unwritable retirement set, an oversized sync item or a retention
ceiling. An empty list is what an operator — or an agent — needs: it stops the
search rather than inviting improvisation.

Every rendered alarm carries a `catalogue_id`, because an alarm's id is
concrete (`["mail_relay_down", "smtp1"]`) while a catalogue entry's is a
pattern (`["mail_relay_down", "_"]`). Without the join key a consumer would
have to re-implement the matching.

## The cluster view is a fan-out, not a replicated store

Alarm state is node-local and never replicated. That is deliberate: one of the
conditions Bondy raises is that the durable store is unavailable, so a
subsystem that needed that store in order to report on it would have a hole
exactly where it matters most.

`bondy.alarm.list` therefore asks every cluster member and says which nodes
answered and which did not:

- `alarms: []` with `silent: []` means the cluster is clean.
- `alarms: []` with `silent: ["n2"]` means n2 was not heard from and nothing is
  known about it.

A caller that cannot tell those apart eventually pages on the wrong one. The
local node's alarms are read directly and never depend on the fan-out, so a
total cluster-transport failure still answers for the node in front of you and
reports every peer silent.

## History is a flap budget, not an audit record

Each node keeps a bounded ring of its last 100 **transitions**, newest first.
A restatement that changes nothing is not a transition and does not enter the
ring — without that rule, a producer that restates once per offending item
would evict the whole ring and flood the event topics.

The ring bounds transitions, not time: an alarm oscillating on a three-second
probe fills it in five minutes. It is a convenience for an operator who is
already looking, never the audit record. Every transition is also logged, and
Prometheus holds the durable series.

History reads across the cluster, but it never **merges**. Merging rings from
several nodes would require their clocks to be ordered, and nothing here can do
that. The walk sidesteps the problem rather than solving it: it drains the
serving node's ring, then the next member's, then the next, and concatenates.
Two transitions from different nodes are never compared, so no cross-node clock
ordering is asserted and none is needed — and every event names the node whose
ring recorded it, so sort by `at` yourself if you want a cluster-wide timeline.

The walk is paginated, and it is honest about its own reach. Every page carries
`not_reached`, the members it asked for history and did not hear from, and that
set accumulates across the pages of one walk. A node that could not be asked is
not a node that answered "nothing" — the same distinction `bondy.alarm.list`
draws with `silent`.

## Correlation: which request caused this

An alarm raised on a request path carries `onset_trace_id`, the W3C trace id of
the occurrence that *raised* the condition. It survives restatement exactly as
`raised_at` does — a later occurrence's trace is discarded rather than
overwriting the first.

Most alarms will not have one, and that is a property of what Bondy raises
rather than an omission. Bondy has no ambient trace context: a trace rides in a
message's options, and seven of the nine producers are background probes,
appliers and sweepers with no request to inherit from. The field is absent
there rather than filled with a freshly minted id, which would correlate with
nothing.

See [Telemetry](/router/concepts/telemetry) for how a trace gets into a request
in the first place.

## What Bondy deliberately does not do

**No notification, escalation, on-call schedule or silencing UI.** Alertmanager
and PagerDuty do that better, and every broker that built its own regrets it.
Bondy owns detection, state and a queryable surface, because only Bondy knows
its own invariants — a dangling storage root, anti-entropy divergence, a
frontier stall, peer clock skew. The operator owns what to do about being told.

**No alarm ever sheds load.** RabbitMQ blocks publishers on its memory alarm,
and Bondy's regulator could do the same with better machinery. It will not. The
subsystem observes and reports; acting on what it observes stays an operator
decision taken outside the router. This is the one place Bondy knowingly
declines a capability the prior art has, and the reason is that RabbitMQ's
blocking behaviour is as famous for confusing operators as it is for saving
nodes.

**No acknowledge, no clear, no silence in the API.** The read surface is
read-only by construction. An alarm states a condition that is true now;
clearing one without fixing the condition would make the surface lie.

**No alarm state in the replicated store**, for the reason given above.

## Where alarms surface

| Surface | What it gives you |
|---|---|
| [`bondy.alarm.*` procedures](/router/reference/wamp_api/alarm) | The cluster view, one alarm by id, a page of the cluster's transition history, and the catalogue. |
| [`bondy.alarm.{raised,updated,cleared}` topics](/router/reference/wamp_api/alarm#events) | The same alarm shape, pushed on transition, in the master realm. |
| [Prometheus](/router/reference/metrics) | `bondy_alarms`, `bondy_alarm_active` and `bondy_node_ready`, with the alarm family as a bounded label. |
| Logs | Every transition, at `warning` for a raise or update and `notice` for a clear. |
| `/ready` | 503 while any raised alarm declares `affects_ready`. |
| MCP | The read procedures and the three topics, through the shipped `bondy_sre_read` overlay — see [MCP Gateway](/router/concepts/mcp_gateway). |
