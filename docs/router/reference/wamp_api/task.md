---
outline: [2,4]
related:
    - text: Alarms
      type: Concept
      link: /router/concepts/alarms
      description: Where the runbook join comes from — an alarm's `tasks` list names entries here.
    - text: Alarms API
      type: API Reference
      link: /router/reference/wamp_api/alarm
      description: The alarms these tasks remediate.
    - text: Responding to an Alarm
      type: How-to Guide
      link: /router/guides/administration/responding_to_alarms
      description: Reading a task's grades before running it.
---

# Task Catalogue

The declared set of `bondy.*` procedures an operator — human or agent — may be
told to run in response to a condition, annotated with the operational
judgement no compiler can infer: what running it does to a live system, whether
it can be retried, what undoes it, and where to look afterwards.

**This API runs nothing.** It tells a caller what is sanctioned; the caller
then invokes the task's own `id`, which goes through the ordinary `wamp.call`
authorisation. That separation matters: an agent that ignores
`impact: destructive` still meets an RBAC denial. The catalogue informs; RBAC
enforces.

Both procedures are read-only and require admin authority. Call them from the
master realm.

## Procedures

#### bondy.task.catalogue() -> [catalogue] {.wamp-procedure}

Every declared task, with the vocabularies its grades are drawn from and the
procedure families deliberately left out.

| Key | Type | Meaning |
|---|---|---|
| `tasks` | list | Every entry, in id order. |
| `vocabularies.impact` | list of string | The `impact` values, **weakest first**. |
| `vocabularies.blast_radius` | list of string | The `blast_radius` values, **narrowest first**. |
| `out_of_scope` | map | Procedure family → the reason it carries no tasks. |

The vocabularies are returned alongside the entries because an agent policy is
a bound on `impact` ("never above `recoverable` without a human"), and a bound
needs the *order* of the vocabulary — not just the values that happen to appear
in today's rows. A grade with no entry today must not become an unknown word
the moment one is added.

#### bondy.task.describe(uri) -> [result] {.wamp-procedure}

Whether one procedure is a sanctioned task, as `{"tasks": [...]}`.

A miss is an **empty list, not an error**. "Is this procedure a task?" is a
normal question with a normal negative answer, and that answer is not "no such
procedure" — an uncatalogued procedure may exist and simply not be sanctioned.
Making it an error would put the question on a caller's exception path.

## Task entry

| Key | Type | Meaning |
|---|---|---|
| `id` | string | The procedure URI. This is also what you call to run the task, and the permission is `wamp.call` on this URI. |
| `title` | string | Short human-readable name. |
| `summary` | string | What running it does. |
| `impact` | string | See below. |
| `blast_radius` | string | See below. |
| `idempotent` | boolean | Whether retrying after a timeout is sanctioned. |
| `dry_run` | boolean | Whether the procedure accepts a `dry_run` KWArg. |
| `args` | list of map | One JSON Schema per positional argument, in order. |
| `observe_with` | list | Where to look to see whether the task took effect, each as `{kind, ref}` with `kind` either `procedure` or `metric`. The [alarm catalogue](/router/reference/wamp_api/alarm) uses the same field name and shape. |
| `reverses` | string | The task that undoes this one. Present only where one exists. |

`idempotent` is a **claim**, and `false` means "not declared safe to retry"
rather than "declared unsafe". A `true` is written only where a test pins it —
an unpinned `true` would be exactly the sanction nobody checked.

`observe_with` says *where to look*, not what to expect. A condition language
is a separate mechanism and does not exist yet.

`args` describes the call for a caller building it. Bondy does not validate a
call against these schemas; what is verified is that each list has one entry
per positional argument the procedure actually accepts.

### The `dry_run` convention

A task declaring `dry_run` accepts `dry_run: true` in its KWArgs, performs
every check the real call performs, stops before the first act that changes
anything, and replies with `dry_run: true` plus a `would` sentence describing
what it would have done.

Opting out is **enforced, not documented**: a `dry_run` sent to a `bondy.*`
procedure that does not declare support is refused before dispatch rather than
ignored. A caller who believed it was simulating can never have performed the
thing instead.

A malformed `dry_run` value is refused rather than defaulted. Reading it as
`false` would perform a call that asked not to be; reading it as `true` would
refuse work that was asked for.

## Vocabularies

### `impact` — what running it does to a live system

Weakest first. This is the field an agent policy is written against.

| Value | Meaning |
|---|---|
| `benign` | No client-visible change. |
| `recoverable` | State changed, and a named task restores it. |
| `disruptive` | Client-visible interruption, no data loss. |
| `destructive` | Possible data loss, or no way back. |

`recoverable` names the *shape* of the reversal, not its cost: `add` restores a
removed bridge, but only for a caller that still holds the specification.

### `blast_radius` — how far the effect reaches

Narrowest first. Orthogonal to `impact`: stopping a bridge relay is
`recoverable` *and* `cluster`-wide.

| Value | Reach |
|---|---|
| `session` | One session. |
| `realm` | One realm's surface. |
| `node` | This node. |
| `cluster` | Every node. |

## The declared tasks

| Id | Impact | Radius | Idempotent | Dry run | Reverses |
|---|---|---|---|---|---|
| `bondy.listener.suspend` | disruptive | node | no | yes | `bondy.listener.resume` |
| `bondy.listener.resume` | recoverable | node | yes | yes | `bondy.listener.suspend` |
| `bondy.router.bridge.check_spec` | benign | node | yes | — | — |
| `bondy.router.bridge.add` | recoverable | cluster | no | yes | `bondy.router.bridge.remove` |
| `bondy.router.bridge.remove` | recoverable | cluster | no | — | `bondy.router.bridge.add` |
| `bondy.router.bridge.start` | recoverable | cluster | no | — | `bondy.router.bridge.stop` |
| `bondy.router.bridge.stop` | disruptive | cluster | no | — | `bondy.router.bridge.start` |
| `bondy.mcp.overlay.load` | recoverable | realm | yes | yes | `bondy.mcp.overlay.delete` |
| `bondy.mcp.overlay.delete` | recoverable | realm | no | — | `bondy.mcp.overlay.load` |
| `bondy.mail.test` | benign | node | yes | — | — |
| `bondy.cluster.leave` | **destructive** | cluster | no | yes | — |

`bondy.mail.test` is `benign` because it changes nothing in Bondy — but it does
send a real message to a real recipient. `impact` grades client-visible change,
not effects on the world.

`bondy.router.bridge.check_spec` predates the `dry_run` convention and is the
older shape of the same idea: a separate procedure that validates without
acting. It remains available; new procedures use `dry_run`.

[`bondy.cluster.leave`](/router/reference/wamp_api/cluster) is the only
`destructive` entry, and the grade is about what the removal **releases**
rather than about anything the call writes. Membership is what the storage
layer counts for reclamation, so removing a node makes its origins unclaimed
and a node rejoining under the same name is handed a new one. Nothing reverses
that, which is why it has no `reverses` where the bridge and overlay pairs do.

## Coverage is deliberately partial

Unlike the [alarm catalogue](/router/reference/alarms), this table does not
cover everything it could. It carries the incident-response families. Security
and identity administration — users, groups, grants, sources, realms, OAuth2 —
is administration rather than incident response, and grading its impact is a
security judgement to be made deliberately rather than in bulk.

What is enforced instead is that no family is uncatalogued *by accident*: every
`bondy.<family>.*` procedure family is either represented here or listed in
`out_of_scope` with a reason, and a new family fails the build until someone
decides which. `out_of_scope` is returned by `bondy.task.catalogue` so that a
caller can tell "not sanctioned" from "not yet considered".
