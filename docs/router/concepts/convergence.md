---
outline: [2,3]
related:
    - text: Clustering
      type: Concept
      link: /router/concepts/clustering
      description: How a Bondy cluster forms, and what it replicates.
    - text: Per-Origin Prefix Closure
      type: Concept
      link: /router/concepts/prefix_closure
      description: The ordering property a converging replica must never break.
    - text: Deletion and Reclamation
      type: Concept
      link: /router/concepts/deletion_and_reclamation
      description: The other thing causal stability licenses, and why it is a separate act.
    - text: Verifying Cluster Convergence
      type: How-to Guide
      link: /router/guides/administration/verifying_cluster_convergence
      description: Reading the frontier and the repair counters against a real cluster.
    - text: Data Storage & AAE Configuration Reference
      type: Configuration Reference
      link: /router/reference/configuration/data_storage
      description: Every anti-entropy option and its default.
---

# Convergence

A Bondy cluster replicates its control plane without consensus. Any node
accepts a write, and the cluster reconciles afterwards. This page explains what
"reconciled" means precisely, what a node does to get there, and why the
observable signals are the ones they are — because the interesting question in
an eventually consistent store is never *whether* it converges, but **how you
know it has**.

Read [Clustering](/router/concepts/clustering) first for the shape of the
cluster. This page is about the durability of what it replicates.

## What converges: the applied frontier

Every replicated operation carries a key: a hybrid logical clock, the
**origin** that minted it, and that origin's monotonically increasing
**seq**. A node's **applied frontier** is the per-origin maximum seq it has
applied — a version vector over origins.

The frontier is the unit of comparison because it is the only thing that says
what a node *has*, independently of how it got there. Two nodes holding the
same frontier hold the same operations. This is what
`bondy_oplog_instance_frontier_hash` reports, and why comparing that one gauge
across nodes is the cheapest convergence check available: equal hashes on every
node, at rest, is convergence.

The frontier is a maximum, not a prefix. It records that seq 7 arrived from an
origin; it does not, by itself, record that 5 and 6 did. That gap between "the
frontier looks right" and "the data is there" is what the rest of this page is
about — see
[Per-Origin Prefix Closure](/router/concepts/prefix_closure) for the property
that closes it on the apply path.

## How a replica catches up: the sync round

Replication is **pull-based anti-entropy**, not broadcast. On each tick — every
`db.aae.interval` — a node picks peers and runs a **sync round** against each:

1. **Ask for the peer's frontier.** The peer answers only after draining what it
   has installed, so the frontier it reports counts operations it can actually
   serve, not ones still in flight through its own pipeline.
2. **Ask for the peer's Merkle Search Tree root.** Equal roots mean equal
   content and the round ends there, having moved nothing.
3. **Pull the differing pages.** The tree structure localises the difference, so
   the bytes moved are proportional to the divergence rather than to the data.
4. **Integrate.** The pulled pages are merged into the local tree and their
   operations handed to the applier, which folds them into the projection.

A round that pulled everything it set out to pull is a **complete round**. A
round capped by a page budget is not, and Bondy draws that distinction
carefully: several decisions below are licensed only by a complete round,
because a capped round has not seen enough to justify them.

## Why a completed round is not proof of arrival

The hazard in this design is that each of steps 1–4 can succeed while data goes
missing, and the round still records success. A node that concludes "we agree"
from a round that lost an operation will then act on that conclusion — it will
let the origin reclaim the space, and the loss becomes permanent and invisible.

Three mechanisms exist to prevent exactly that. They are worth knowing by name,
because each has a counter, and each counter is a different question.

### The watermark door

A node truncates history it has confirmed. Its **watermark** is how far it has
truncated. The tempting rule — an operation at or below the watermark has
already been folded, so it can be discarded — is false for an operation that a
peer wrote while the round was in flight. It is at or below the watermark and it
has never been applied here.

The **watermark door** tests that directly rather than inferring it from the
watermark. A never-applied operation arriving at or below the watermark is
accepted: folded into the projection inline, or held for the applier's replay.
Only an operation the applied frontier genuinely witnesses is discarded.

`bondy_oplog_doored_events_total` counts what the door accepted. Under sustained
write load this is a normal steady-state path, not an anomaly — an operation
arriving concurrently with a truncation is ordinary.

### Pinned roots

Pages pulled from a peer are not reachable from the local root until the round
integrates them. Between the pull and the integrate they look like garbage, and
a compaction sweeping in that window would collect them. A merge that then finds
a subtree missing treats it as empty, and the round completes having silently
dropped it.

So a sync session **pins** the root it is pulling for the life of the round, and
the sweep honours the pin. If the sweep finds the current root unservable
anyway — pages a live root needs are already gone — it aborts rather than
sweeping, because sweeping around a hole widens it.
`bondy_mst_gc_aborted_total` counts those aborts, labelled by which layer lost
the page.

### Capped truncation

Compaction truncates operations it has evidence every replica holds. That
evidence is a peer's root **or** its recorded applied frontier — the frontier
alone is enough, and admitting it is what lets a peer that has itself compacted
still constrain the decision.

Separately, a node will not truncate past an operation its own projection has
not folded yet. The truncation point is capped below the first such operation,
so a cycle may truncate less than its frontier would allow, or nothing at all.
`bondy_oplog_compaction_holds_total` counts the capped cycles. Occasional holds
are the cap doing its job; sustained growth means the applier's replay is not
keeping up with delivery on that instance.

## When a replica really is behind

With those mechanisms in place, a complete round that leaves a peer's frontier
strictly ahead of the local one — after settling — is evidence, not noise. That
is a **frontier gap verdict**, counted by
`bondy_oplog_frontier_gap_verdicts_total` per instance and peer.

A single verdict is still not enough to act on. When a peer accepts an operation
through its own door, its frontier advances past what its truncated tree can
serve, and a third replica syncing inside that window sees a legitimate deficit
that the origin covers on the next round. So Bondy debounces: a gap must strike
**twice for the same instance and peer inside two minutes** before it triggers a
remedy. A successful round clears the count.

The remedy is a **catalogue re-bootstrap**: the peer streams its whole
projection and the local one is re-derived from it. This is correct in the case
that matters — history compacted past this replica cannot be recovered by
syncing, because the operations are gone — and it is expensive, which is why a
single transient must never trigger it. `bondy_oplog_rebootstraps_scheduled_total`
counts the schedulings.

The cost of the debounce is one round of detection delay. That is the deliberate
trade: detection is delayed, never lost, because a standing gap cannot heal by
syncing and so strikes again immediately.

### Healing an unservable own root

The remaining case is a node whose *own* tree has lost pages. It cannot serve
its root to anyone, and it cannot repair by pulling, because the missing pages
are its own.

Such a node drops the tree and resumes anti-entropy on a fresh one — but only
after proving that no peer depends on the tree it is discarding.
`bondy_oplog_mst_rebuilt_total` counts that self-heal. It should be zero. Any
occurrence means pages went missing, and the question worth asking is not
whether the heal worked but why they went missing.

## How long convergence takes

Convergence is not instantaneous and Bondy does not pretend otherwise. After a
node returns from a fault, the path back has a shape you can reason about:

- Ordinary lag closes on the **next round that instance gets** — the scheduler
  ticks every `db.aae.interval`, but `db.aae.max_concurrency` caps how many
  sessions run at once, and instances rotate for the free slots so none is
  starved. On a node with many shards, a given instance is reached every few
  ticks rather than every tick.
- A gap needing the remedy costs the **two-strike detection delay** first: two
  complete rounds against that peer, plus the settle between them.
- The re-bootstrap itself then costs a **full projection transfer** for the
  affected instance.

The practical consequence for operators: after a combined fault — a node killed
while partitioned, say — replicas that are still missing data seconds later are
not yet evidence of a bug. They are evidence of a cluster in the detection
window. The signal that something is genuinely wrong is a verdict count that
keeps climbing, or a re-bootstrap that does not finish.

See [Verifying Cluster
Convergence](/router/guides/administration/verifying_cluster_convergence) for
how to read that against a running cluster.

## What is not replicated

Convergence applies to replicated control-plane state: realms, users, groups,
grants, sources, and API Gateway specifications. It does not apply to:

- **WAMP routing.** Registrations and subscriptions are not replicated; each
  node publishes a compact summary instead — see [Registry Routing
  (RIB)](/router/concepts/registry_routing).
- **Sessions.** A session lives on the node that holds its connection and dies
  with it.
- **Alarm history.** Each node keeps its own ring; reading across the cluster is
  a walk, not a merge — see [the alarms
  API](/router/reference/wamp_api/alarm#bondy-alarm-history-page).

## See also

- [Verifying Cluster Convergence](/router/guides/administration/verifying_cluster_convergence)
  — the operator procedure.
- [Metrics Reference](/router/reference/metrics#storage-stack-bondy-db-bondy-oplog-bondy-mst)
  — every series named above, with its labels.
- [Deletion and Reclamation](/router/concepts/deletion_and_reclamation) — the
  other decision causal stability licenses.
- [Data Storage & AAE Configuration Reference](/router/reference/configuration/data_storage#active-anti-entropy)
  — `db.aae.interval`, fanout, concurrency and the freshness fence.
