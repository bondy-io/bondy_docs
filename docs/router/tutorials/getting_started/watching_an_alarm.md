---
outline: [2,3]
related:
    - text: Alarms
      type: Concept
      link: /router/concepts/alarms
      description: The model behind everything you do here.
    - text: Alarm Catalogue
      type: Reference
      link: /router/reference/alarms
      description: Every condition, including the one you raise in this tutorial.
    - text: Responding to an Alarm
      type: How-to Guide
      link: /router/guides/administration/responding_to_alarms
      description: The same sequence, without the teaching.
    - text: Configuring Mail Relays
      type: How-to Guide
      link: /router/guides/administration/configuring_mail_relays
      description: The relay keys used in step 1, in full.
---

# Watching an Alarm from Raise to Clear

You will make a Bondy node raise a real alarm, follow it from "something is
wrong" to a sanctioned remedy, and watch it clear — using nothing but
configuration and WAMP calls.

The condition you will raise is a **failing mail relay**. It is a good one to
learn on because it is entirely under your control, it harms nothing, and it is
one of only three conditions in the catalogue that names a task you may run.

By the end you will have used all four alarm procedures, followed the runbook
join from an alarm to its remedy, and seen the difference between an alarm and
a log line.

## Prerequisites

A single Bondy node you can restart, and a WAMP client that can call procedures
on the **master realm** (`com.leapsight.bondy`). Any client will do; the
examples show the procedure and its arguments rather than a particular library.

You also need Python 3 for a throwaway SMTP server in step 5:

```bash
pip install aiosmtpd
```

## 1. Configure a relay that cannot work

Add a mail relay pointing at a port with nothing behind it, and lower the
failure threshold so the alarm raises on the first failure rather than the
third:

```ini
mail.relay.demo.host                     = 127.0.0.1
mail.relay.demo.port                     = 2525
mail.relay.demo.transport                = tcp
mail.relay.demo.from                     = no-reply@example.com
mail.relay.demo.realms                   = com.leapsight.bondy
mail.relay.demo.health.failure_threshold = 1
mail.relay.demo.health.success_threshold = 1
```

Restart the node.

Nothing is wrong yet. A relay that has never been used is not a relay that has
failed, and Bondy does not probe it speculatively — the condition becomes true
only when a send actually fails.

## 2. Make it fail

Call `bondy.mail.test` on the master realm, with the realm and any address:

```
bondy.mail.test("com.leapsight.bondy", "you@example.com")
```

It fails. Nothing is listening on port 2525, which is the point.

## 3. See the alarm

Call `bondy.alarm.list` on the master realm. You should see one alarm:

```json
{
  "alarms": [
    {
      "id": ["mail_relay_down", "demo"],
      "catalogue_id": ["mail_relay_down", "_"],
      "node": "bondy1@127.0.0.1",
      "severity": "major",
      "class": "integration",
      "affects_ready": false,
      "details": {"relay": "demo", "consecutive_failures": 1},
      "raised_at": 1756640000000,
      "updated_at": 1756640000000
    }
  ],
  "nodes": {"answered": ["bondy1@127.0.0.1"], "silent": []}
}
```

Three things to notice.

`silent` is empty, so this answer covers the whole cluster. On a one-node
cluster that is trivially true; on a real one it is the difference between "no
alarms" and "nobody answered".

`class` is `integration`, and `affects_ready` is `false`. Bondy is fine —
something it talks to is not. The node stays in the load balancer, because the
WAMP data plane is unaffected by a broken mail relay.

`catalogue_id` is the id with its instance replaced by `_`. That is your join
key for the next step.

`details.consecutive_failures` reads `1` because you set
`failure_threshold = 1`, so one failure was the transition. It is the count at
the moment the alarm was raised, and it stays there.

Now call `bondy.mail.test` again, twice. Call `bondy.alarm.list` once more —
still **one** alarm, and unchanged: `consecutive_failures` still reads `1`.

Two things are happening, and they are worth separating.

An alarm is identified by its id, so raising one that is already raised
restates it rather than creating a second one. That is the whole difference
between an alarm and a log line: the alarm says the condition *is true*, not
that a thing *happened*. Three failures, one alarm.

But this relay never even restates. Its producer raises on the *transition* to
down and then stops reporting, so `details` holds the failure count as it was
at the moment the condition became true. Most producers are written this way.
The alarm answers "is this relay down", and it is; "how far down" is what the
`observe_with` references in the next step are for.

## 4. Follow the runbook

Call `bondy.alarm.catalogue` and find the entry whose `id_pattern` matches the
`catalogue_id` from step 3. It carries the part the alarm itself does not:

```json
{
  "id_pattern": ["mail_relay_down", "_"],
  "severity": "major",
  "class": "integration",
  "affects_ready": false,
  "summary": "An outbound mail relay is failing its health check",
  "detail_keys": ["relay", "consecutive_failures"],
  "config_keys": [
    "mail.relay.$name.health.failure_threshold",
    "mail.relay.$name.health.success_threshold"
  ],
  "observe_with": [
    {"kind": "procedure", "ref": "bondy.mail.status.get"},
    {"kind": "procedure", "ref": "bondy.mail.relay.list"},
    {"kind": "metric", "ref": "bondy_mail_relay_up"},
    {"kind": "metric", "ref": "bondy_mail_failed_total"}
  ],
  "tasks": ["bondy.mail.test"]
}
```

Run the two `procedure` references under **`observe_with`**. Each is read-only
by construction, so this is always safe:

```
bondy.mail.relay.list("com.leapsight.bondy")
bondy.mail.status.get("com.leapsight.bondy", <id from step 2>)
```

Then look at the `metric` references. Scrape `/metrics` on the admin listener
(`http://localhost:18081/metrics` by default) and find:

```
bondy_mail_relay_up{relay="demo"} 0
bondy_alarm_active{alarm_id="{mail_relay_down,<<\"demo\">>}"} 1
```

The same fact in three places, on purpose: the alarm for "is it true now", the
metric for "what has it been doing", the procedure for the detail.

Finally, look at `tasks`. It names `bondy.mail.test` — the one thing Bondy
sanctions you to run against this condition. Before running a task, ask what it
costs:

```
bondy.task.describe("bondy.mail.test")
```

```json
{"tasks": [{
  "id": "bondy.mail.test",
  "impact": "benign",
  "blast_radius": "node",
  "idempotent": true,
  "observe_with": [
    {"kind": "procedure", "ref": "bondy.mail.status.get"},
    {"kind": "procedure", "ref": "bondy.mail.relay.list"}
  ]
}]}
```

`benign` and `idempotent` — safe to run, safe to retry. Most conditions in the
catalogue name no task at all, and that empty list is the answer rather than a
gap: it tells you to fix the cause instead of improvising against the admin
API.

## 5. Fix the condition and watch it clear

Start a throwaway SMTP server on the port the relay is pointed at:

```bash
python3 -m aiosmtpd -n -l 127.0.0.1:2525
```

Leave it running. Now run the task:

```
bondy.mail.test("com.leapsight.bondy", "you@example.com")
```

It succeeds, and the terminal running `aiosmtpd` prints the message.

Call `bondy.alarm.list` again:

```json
{"alarms": [], "nodes": {"answered": ["bondy1@127.0.0.1"], "silent": []}}
```

The alarm is gone. You did not clear it — there is no procedure that can. It
cleared because the condition stopped being true, which is the only way an
alarm ever clears.

## 6. Read what happened

The alarm has gone, but the history has not. Call `bondy.alarm.history`:

```json
{
  "node": "bondy1@127.0.0.1",
  "events": [
    {"id": ["mail_relay_down", "demo"], "action": "cleared", "severity": "major", "at": 1756640120000},
    {"id": ["mail_relay_down", "demo"], "action": "raised",  "severity": "major", "at": 1756640000000}
  ]
}
```

Newest first, and only two entries: you called `bondy.mail.test` four times
across steps 2, 3 and 5, and the ring holds one `raised` and one `cleared`.

The ring holds **transitions**, not reports. Two rules produce that. A producer
that restates an alarm whose content has not changed records nothing — a
restatement is a transition only when something in the alarm actually moves.
And this producer does not restate at all, which is why there is no `updated`
here: it reported the condition becoming true, then reported it becoming
false.

This ring is per node and holds the last 100 transitions. It is for the
operator who is already looking; Prometheus holds the durable series.

## 7. Clean up

Stop the SMTP server and remove the relay block from `bondy.conf`, then
restart.

## What to try next

Subscribe on the master realm to `bondy.alarm.raised`, `bondy.alarm.updated`
and `bondy.alarm.cleared`, then repeat steps 2 and 5. The event payload is the
same alarm shape step 3 returned, so a subscriber never needs a follow-up call.
Publication is demand-gated: with nobody subscribed, nothing is produced at
all.

From here:

- [Responding to an Alarm](/router/guides/administration/responding_to_alarms)
  is this sequence as a working procedure, without the teaching.
- [Alarms](/router/concepts/alarms) explains why the API is read-only, why
  alarm state is never replicated, and what Bondy deliberately refuses to do
  about alarms.
- [Giving an Agent Read-Only Access](/router/guides/administration/giving_an_agent_read_only_access)
  puts everything you just did in front of an AI agent over MCP.
