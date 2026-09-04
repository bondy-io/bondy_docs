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

`CALL.Options._deadline` (milliseconds from now) caps the fan-out budget. A
caller can only *shorten* the wait: a deadline says when to give up, not how
long the router may take. The same applies to `bondy.alarm.get`.

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

#### bondy.alarm.history() -> [page] {.wamp-procedure}

Alarm **transitions** across the cluster, newest first, as a page.

Answers the standard page shape — `values`, `has_more`, and `cursor` only when
there is more — like every paginated Bondy procedure, plus one key of its own:

| Key | Type | Meaning |
|---|---|---|
| `not_reached` | list of string | The members this walk asked for history and did not hear from. Always present, `[]` when the walk heard from everything it asked. |

Each value is a [History event](#history-event), and each names the node whose
ring recorded it.

| Keyword Arg | Type | Meaning |
|---|---|---|
| `limit` | integer | Page size, default 100, maximum 1000. An out-of-range value falls back to the default. |
| `cursor` | string | Resume from a previous page's `cursor`. A cursor this procedure did not mint is refused. |

| CALL Option | Type | Meaning |
|---|---|---|
| `receive_progress` | boolean | Stream instead of paging — see below. |
| `_deadline` | integer | Milliseconds from now after which to give up. Caps the walk's own time budget — see below. |

`limit` and `cursor` are keyword arguments, not `CALL.Options`: they are
arguments to the procedure, and Bondy is the callee for `bondy.*`.
`receive_progress` and `_deadline` stay options because they are instructions
to the router about how the reply is delivered and how long it may take. `limit`
and `cursor` were `CALL.Options` extension keys (`_limit` / `_cursor`) until
2026-09-01; the option form is no longer read.

Raises [`bondy.error.stale`](/router/reference/wamp_api/errors/stale) if
`cursor` was minted under an incompatible cursor schema or walk shape, or
[`bondy.error.malformed`](/router/reference/wamp_api/errors/malformed) if
`cursor` isn't a decodable cursor at all. Either way, restart from the first
page by omitting it — a resume position cannot be guessed.

**The walk is node-at-a-time**, starting with the node serving the call and
reaching its peers only when that node's ring does not fill the page. That is
what makes the common case free: asking for 100 transitions on a node whose
ring holds 100 contacts no peer at all, and the peers are reached only if you
ask for the next page.

It also means a busy node can crowd a quiet peer out of the first page. **The
absence of a node from a page is not evidence that nothing happened on it** —
the walk may simply not have reached that node yet. For a cluster-wide answer
in a single reply, use `bondy.alarm.list`.

**A node the walk asked and did not hear from is named in `not_reached`.** A
peer that cannot answer contributes nothing and the walk continues, but it does
not do so silently: a page that is short because a node was unreachable is not
the same answer as a page that is short, and only the reply can tell you which
you have.

`not_reached` **accumulates**. A node named on one page stays named on every
later page of the same walk — the set rides in the cursor — so the last page of
a walk states the whole truth about it. Nodes the walk has not yet *asked* are
not in the set: they are asked on a later page, and naming them now would mean
un-naming them later, which an accumulating set cannot do.

**A page is bounded in time as well as in size.** The whole page shares one
5 second budget, and `CALL.Options._deadline` caps it. Whatever is left of the
budget is the timeout for the next node, so a walk across several unreachable
peers costs one budget rather than one each.

A page whose budget runs out stops early, and its cursor resumes at the nodes
it did not get to — nothing is skipped. The first node of a page is always
contacted, so a page can be cut short but never emptied, and paging always
advances.

**A node still to be walked that leaves the cluster is dropped, not reported.**
A cursor names the nodes the walk has yet to reach, and they are intersected
with the membership when it is resumed. Nothing failed — history is never
replicated, so a departing node takes its ring with it — and the position the
cursor held in that node's ring goes with it, because a `seq` means nothing on
another node's ring. A node already named in `not_reached` stays named: leaving
does not retract what an earlier page reported.

A page may report `has_more` and be followed by an empty one — the walk cannot
know a node is exhausted without asking it.

A restatement that changes nothing is not a transition and does not appear.
The ring bounds transitions, not time, and is not merged across nodes: within
a page the transitions of one node are contiguous, so sort by `at` if you want
a cluster-wide timeline.

::: tip Streaming instead of paging
A caller that announced `progressive_call_results` in its HELLO and sets
`receive_progress` on the CALL receives the whole walk as **progressive
results** — one WAMP RESULT per page, the last one final — and never handles a
cursor. Each chunk carries the same `values`, `has_more` and `not_reached` keys
a page does, so one parser serves both, and no `cursor`: there is nothing to
resume.

**Set `_deadline` on a stream.** `CALL.Options.timeout` is an inactivity window
that every chunk restarts, so a slowly-dripping stream is otherwise unbounded;
`_deadline` is what bounds the whole of it. The first page always runs and the
deadline is checked only after a chunk has gone out, so it can shorten a stream
and never empty one. A stream that runs out of deadline settles with
[`wamp.error.timeout`](/router/reference/wamp_api/errors/wamp_timeout) rather than a final result: a
truncated stream marked `has_more: false` would claim to be complete. The
chunks already delivered are good as far as they go.
:::

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
| `node` | string | The node whose ring recorded the transition. |
| `seq` | integer | Position in that node's ring: strictly increasing, newest highest. Comparable only against transitions from the **same** node. |

`seq` is what makes the ring pageable — `at` is a millisecond timestamp and is
neither unique nor monotonic. It restarts when a node restarts, along with the
ring itself.

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
