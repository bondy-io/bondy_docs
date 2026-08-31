---
outline: [2,4]
related:
    - text: Alarms
      type: Concept
      link: /router/concepts/alarms
      description: What an alarm is, and why this API is read-only.
    - text: Alarm Catalogue
      type: Reference
      link: /router/reference/alarms
      description: Every condition this build can raise.
    - text: Task Catalogue API
      type: API Reference
      link: /router/reference/wamp_api/task
      description: The procedures an alarm's `tasks` list names.
    - text: Responding to an Alarm
      type: How-to Guide
      link: /router/guides/administration/responding_to_alarms
      description: These procedures in sequence, against a real condition.
---

# Alarms

Read access to the alarm subsystem: the conditions currently true across the
cluster, one condition by id, this node's transition history, and the
[catalogue](/router/reference/alarms) of everything this build can raise.

**Read-only by construction.** There is no acknowledge, no silence and no
clear. An alarm states a condition that is true now; clearing one without
fixing the condition would make the surface lie, and silencing belongs in
Alertmanager rather than in the router.

**Master realm only.** All four procedures require admin authority. A
`class = realm` alarm still carries `realm_uri`, but that field names the
affected tenant for an operator — it does not grant that tenant access.

Authorisation is the ordinary `wamp.call` permission the dealer applies to
every call, so these procedures are grantable and revocable like any other.

## Procedures

### Reading the current state

#### bondy.alarm.list() -> [envelope] {.wamp-procedure}

Every alarm raised across the cluster.

Returns one **envelope**:

| Key | Type | Meaning |
|---|---|---|
| `alarms` | list | Every raised alarm, from every node that answered. |
| `nodes.answered` | list of string | The members that replied. |
| `nodes.silent` | list of string | The members that did not, within a 5 second budget for the whole fan-out. |

`answered` and `silent` partition the cluster membership; no member falls out
of both. An empty `alarms` with an empty `silent` means the cluster is clean.
An empty `alarms` with a non-empty `silent` means nothing is known about those
nodes — the two are different answers and a caller that conflates them
eventually pages on the wrong one.

This node's own alarms are read directly and never depend on the fan-out, so a
total cluster-transport failure still answers for the node you are talking to
and reports every peer silent.

#### bondy.alarm.get(id) -> [envelope] {.wamp-procedure}

The same envelope, filtered to one alarm id.

`id` is the **wire id**: a string for an atom id, or a list of strings for a
tuple id (`["mail_relay_down", "smtp1"]`). The argument is compared against the
rendered id rather than decoded back into a term, which avoids creating atoms
from caller-supplied input.

One id may be raised on several nodes at once, so the reply says *where* the
condition holds. A miss is an ordinary empty `alarms` list rather than an
error: with a non-empty `silent` set, "no node reports it" is genuinely
uncertain, and an error would state the opposite.

#### bondy.alarm.history() -> [history] {.wamp-procedure}

The last 100 alarm **transitions** on the node serving the call, newest first.

| Key | Type | Meaning |
|---|---|---|
| `node` | string | The node this history belongs to. |
| `events` | list | The transitions. |

Does **not** fan out. The ring is per-node by design, and merging rings from
several nodes would require their clocks to be ordered. Call it on each node
you care about.

A restatement that changes nothing is not a transition and does not appear.
The ring bounds transitions, not time.

#### bondy.alarm.catalogue() -> [catalogue] {.wamp-procedure}

Every alarm condition this build can raise, as `{"entries": [...]}`. This is
the runtime form of the [Alarm Catalogue](/router/reference/alarms) and is
authoritative for the node answering.

Takes no arguments and contacts no peer.

## Payloads

### Alarm

The shape returned by `list` and `get`, and published on the three event
topics. One shape for both, so a subscriber and a poller parse the same map.

| Key | Type | Meaning |
|---|---|---|
| `id` | string \| list | The concrete alarm id. |
| `catalogue_id` | string \| list \| `null` | The id **pattern** of the catalogue entry this alarm matches — the join key into the catalogue. `null` only for an id no entry declares. |
| `node` | string | The node the condition holds on. |
| `description` | any | The producer's description. Rendered readable if it is not directly encodable. |
| `severity` | string | `warning`, `major` or `critical`. |
| `class` | string | `node`, `cluster`, `realm` or `integration`. |
| `affects_ready` | boolean | Whether this alarm takes the node out of rotation. |
| `details` | map | Structured detail. The keys a catalogue entry declares are delivered; a producer may carry more. |
| `raised_at` | integer | Milliseconds since the epoch, of the **first** raise. Survives every restatement. |
| `updated_at` | integer | Milliseconds since the epoch, of the last content change. |
| `realm_uri` | string | Present on `class = realm` alarms; names the affected tenant. |
| `onset_trace_id` | string | Present when the raising occurrence carried a W3C trace. Names the **first** occurrence and survives restatement. |

Any value a producer supplies that a JSON encoder could not represent is
rendered readable rather than allowed to reach the encoder, so a reply about
one fault cannot fail on another.

### History event

| Key | Type | Meaning |
|---|---|---|
| `id` | string \| list | The alarm id. |
| `action` | string | `raised`, `updated` or `cleared`. |
| `severity` | string | The severity at the moment of the transition. |
| `at` | integer | Milliseconds since the epoch. |

### Catalogue entry

| Key | Type | Meaning |
|---|---|---|
| `id_pattern` | string \| list | The pattern this entry matches. `"_"` in a list position matches any value. |
| `severity`, `class`, `affects_ready` | | Joined onto every alarm this entry matches, at raise time. |
| `summary` | string | What the condition is. |
| `detail_keys` | list of string | The `details` keys this entry promises. |
| `config_keys` | list of string | The configuration governing the condition. |
| `observe_with` | list | `{"kind": "procedure"\|"metric", "ref": ...}` — where to look. The [task catalogue](/router/reference/wamp_api/task) uses the same field name and shape. |
| `tasks` | list of string | Sanctioned remediations, as task catalogue ids. |
| `readiness_via` | string | Present only when readiness is reported by a mechanism other than this alarm. |

## Events

Three topics carry every transition, published **in the master realm**. The
payload is the Alarm shape above, so an agent reacting to an event can act on
it without a follow-up call.

| Topic | Published when |
|---|---|
| `bondy.alarm.raised` | An alarm not currently raised is raised. |
| `bondy.alarm.updated` | A raised alarm's content changes. A producer restating an unchanged alarm publishes nothing. |
| `bondy.alarm.cleared` | A raised alarm is cleared. The payload is the alarm as it was, so a subscriber learns how urgent the resolved condition had been. |

The three feed from the same transitions as the history ring, so a subscriber's
view and `bondy.alarm.history` cannot disagree.

Publication is **demand-gated**: with no subscriber, nothing is produced.
Transitions of one alarm id are ordered relative to each other.

::: info Tenant realms do not receive alarm events
Publishing into an affected tenant's own realm is not done. The `details` map
is operator-oriented and is exactly where an internal error string would reach
an audience it was not written for.
:::
