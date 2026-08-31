---
outline: [2,3]
related:
    - text: Alarms
      type: Concept
      link: /router/concepts/alarms
      description: What an alarm is and why the API is read-only.
    - text: Alarm Catalogue
      type: Reference
      link: /router/reference/alarms
      description: Every condition, with what to observe and the sanctioned tasks.
    - text: Alarms API
      type: API Reference
      link: /router/reference/wamp_api/alarm
      description: Exact reply shapes for the calls used here.
    - text: Task Catalogue API
      type: API Reference
      link: /router/reference/wamp_api/task
      description: Reading a remediation's impact before running it.
---

# Responding to an Alarm

Take a raised alarm from "something is wrong" to either a sanctioned
remediation or a deliberate decision to escalate. Every call below is made on
the **master realm**, which is where the alarm API answers.

## 1. See what is raised

Call [`bondy.alarm.list`](/router/reference/wamp_api/alarm#bondy.alarm.list).
It answers for the whole cluster:

```json
{
  "alarms": [
    {
      "id": ["mail_relay_down", "smtp1"],
      "catalogue_id": ["mail_relay_down", "_"],
      "node": "bondy1@10.0.0.4",
      "severity": "major",
      "class": "integration",
      "affects_ready": false,
      "details": {"relay": "smtp1", "consecutive_failures": 4},
      "raised_at": 1756640000000,
      "updated_at": 1756640000000
    }
  ],
  "nodes": {"answered": ["bondy1@10.0.0.4", "bondy2@10.0.0.5"], "silent": []}
}
```

**Read `nodes.silent` before you read `alarms`.** A silent node contributed
nothing, so an empty `alarms` list with a non-empty `silent` set does not mean
the cluster is clean — it means part of it did not answer. If a node is silent,
find out why before treating the rest of the reply as complete.

Note `raised_at`: it survives restatement, so it answers "how long has this
been up" even for a condition that re-reports continuously.

## 2. Find the catalogue entry

Take `catalogue_id` from the alarm and look it up in
[`bondy.alarm.catalogue`](/router/reference/wamp_api/alarm#bondy.alarm.catalogue).
Match on `id_pattern`.

The entry gives you four things the alarm itself does not: what the condition
means (`summary`), the configuration that governs it (`config_keys`), where to
look next (`observe_with`), and what you are sanctioned to do (`tasks`).

Do not match the pattern by hand — `catalogue_id` exists so you do not have to.
An alarm's id is concrete; an entry's is a pattern.

## 3. Observe before you act

Run every `observe_with` reference on the entry before acting. Each one is
read-only by construction, so this step is always safe.

For `{mail_relay_down, _}` the entry names two procedures and two metrics:

```
observe_with:
  - {kind: procedure, ref: "bondy.mail.status.get"}
  - {kind: procedure, ref: "bondy.mail.relay.list"}
  - {kind: metric,    ref: "bondy_mail_relay_up"}
  - {kind: metric,    ref: "bondy_mail_failed_total"}
```

Call the procedures on the master realm; scrape the metrics from any node's
`/metrics` endpoint. The metrics give you the shape over time, which the
procedures cannot.

If the entry's `observe_with` list is empty, go to the logs. Every alarm
transition is logged, at `warning` for a raise or update and `notice` for a
clear.

## 4. Check what you may do

Read the entry's `tasks`. **An empty list is an answer**: Bondy has no
sanctioned remediation for that condition, and six of the nine conditions are
in that position. Fix the underlying cause or escalate — do not improvise
against the admin API.

Where a task is named, look it up with
[`bondy.task.describe`](/router/reference/wamp_api/task#bondy.task.describe)
before running it:

```json
{"tasks": [{
  "id": "bondy.mail.test",
  "impact": "benign",
  "blast_radius": "node",
  "idempotent": true,
  "dry_run": false,
  "args": [
    {"type": "string", "description": "The realm whose mail relay sends the message."},
    {"type": "string", "description": "The recipient's email address."}
  ],
  "observe_with": [
    {"kind": "procedure", "ref": "bondy.mail.status.get"},
    {"kind": "procedure", "ref": "bondy.mail.relay.list"}
  ]
}]}
```

Three fields decide how you proceed:

- **`impact`** — what running it does to a live system. Anything above
  `recoverable` interrupts clients.
- **`idempotent`** — whether you may retry after a timeout. `false` means "not
  declared safe", not "declared unsafe".
- **`reverses`** — the task that undoes this one, where one exists.

## 5. Simulate first, where the task supports it

If `dry_run` is `true`, call the task with `dry_run: true` in its KWArgs. The
reply carries `dry_run: true` and a `would` sentence, and nothing has changed:

```json
{
  "dry_run": true,
  "would": "Stop accepting new connections on 2 listener(s).",
  "listeners": ["ct_wamp_tcp", "ct_http_api"]
}
```

A `dry_run` sent to a procedure that does not declare support is **refused**,
not ignored — you cannot silently perform an action you meant to simulate.

## 6. Run the task and confirm

Call the task by its `id`. The permission is `wamp.call` on that URI, so a
denial here means the grant is missing, not that the task is wrong.

Then confirm two things:

1. **The effect**, using the task's `observe_with` procedures.
2. **The alarm**, using
   [`bondy.alarm.get`](/router/reference/wamp_api/alarm#bondy.alarm.get) with
   the wire id from step 1.

An alarm clears when its producer next observes the condition to be false, not
when you act — most producers check on an interval, so allow one cycle. If
`bondy.alarm.get` returns an empty `alarms` list with an empty `silent` set,
the condition is gone cluster-wide.

You now have either a cleared alarm or a specific reason to escalate.

## Watching instead of polling

To react rather than poll, subscribe on the master realm to
`bondy.alarm.raised`, `bondy.alarm.updated` and `bondy.alarm.cleared`. The
event payload is the same alarm shape step 1 returns, so a subscriber can start
at step 2 without a follow-up call.

Publication is demand-gated: with no subscriber, nothing is produced.

## Reading one node's history

[`bondy.alarm.history`](/router/reference/wamp_api/alarm#bondy.alarm.history)
returns the last 100 transitions on the node that serves the call, newest
first, and does **not** fan out. To survey a cluster, call it on each node and
read the `node` field of each reply.

A restatement that changed nothing is not a transition and will not appear. If
you expected an entry and do not see one, the alarm was re-reported with
identical content rather than changing.

::: warning The ring bounds transitions, not time
An alarm flapping on a three-second probe fills all 100 slots in five minutes.
Use history for what just happened; use Prometheus for the durable series.
:::

## When an alarm affects readiness

An alarm declaring `affects_ready` takes the node out of rotation: `/ready`
answers 503 while it is up. Check with
`bondy.alarm.list` and look for `"affects_ready": true`.

No condition in the current catalogue declares it. The one condition that stops
a node serving — `bondy_db_main_unavailable` — reports readiness by a separate
mechanism, so a node that is NOT READY with no `affects_ready` alarm raised is
reporting a failed durable store, not a bug.
