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
**seq**. A node's **applied frontier** is the per-origin seq it reports as
applied — a version vector over origins.

The frontier is the unit of comparison because it is the only thing that says
what a node *has*, independently of how it got there. Two nodes holding the
same frontier hold the same operations. This is what
`bondy_oplog_instance_frontier_hash` reports, and why comparing that one gauge
across nodes is the cheapest convergence check available: equal hashes on every
node, at rest, is convergence.

Each entry is a **prefix bound**, not a maximum: the largest seq below which
nothing from that origin is missing. A report of 7 therefore asserts that 5 and
6 arrived, and that assertion is what makes equal frontiers mean equal
operation sets. An operation folded above a hole is neither lost nor reported:
the node records it in a per-origin **pending set** and adds it to the bound
once the hole closes. A node that carries a hole therefore reports a lower
frontier, and its hash differs until the hole fills. See [Per-Origin Prefix Closure](/router/concepts/prefix_closure) for how
the apply path keeps that bound honest.

The applied frontier changes with every fold. The **durable frontier** is the
applied frontier as the node last checkpointed it; on an in-memory database the
two are the same. Peers exchange durable frontiers, and compaction and
reclamation trust only those.

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
let the cluster truncate history, and the loss becomes permanent.

Three mechanisms exist to prevent exactly that. They are worth knowing by name,
because each has a counter, and each counter is a different question.

### The watermark door

**Compaction** removes from the tree the prefix of operations that every member
has confirmed. That removal is a **truncation**, and a node's **watermark**
records how far it has truncated. The tempting rule — an operation at or below
the watermark has already been folded, so it can be discarded — is false for an
operation that a peer wrote while the round was in flight. It is at or below the
watermark and it has never been applied here.

The **watermark door** tests that directly rather than inferring it from the
watermark. After every merge from a sync round, the door truncates an operation
at or below the watermark only when every compaction witness (below) confirms
it, this node's own durable frontier included. A never-applied operation stays:
it is folded into the projection inline, or held for the applier's replay. The
same door runs on the live-push path. There, a never-applied operation at or
below the watermark is installed like any other, and an already-applied one is
dropped as a duplicate.

`bondy_oplog_doored_events_total` counts what the door accepted. Under sustained
write load this is a normal steady-state path, not an anomaly — an operation
arriving concurrently with a truncation is ordinary.

### Pinned roots

Pages pulled from a peer are not reachable from the local root until the round
integrates them. Between the pull and the integrate they look like garbage, and
a compaction sweeping in that window would collect them. A merge that then finds
a subtree missing treats it as empty, and the round completes having silently
dropped it.

So a sync session **pins** the root it is pulling, and the sweep honours the
pin. A successful integrate releases the pin. A pin that its session never
releases, because the session died, expires after 120 seconds. If the sweep
finds the current root unservable
anyway — pages a live root needs are already gone — it aborts rather than
sweeping, because sweeping around a hole widens it.
`bondy_mst_gc_aborted_total` counts those aborts, labelled by which layer lost
the page.

### The compaction witnesses and the truncation cap

Compaction truncates only operations it has evidence every member holds. Each
cluster **member** is a **witness**, and its evidence is the durable frontier it
last reported. This node's own durable frontier is a witness too. A durable
frontier survives the member's own compaction, so two nodes that both compact
keep confirming each other's prefix.

Every member is a witness on every database, the in-memory registry included.
A member that is down or partitioned keeps the frontier it last confirmed.
Compaction does not truncate past that frontier, however long the member stays
silent: **there is no timeout**. A member that has never confirmed holds compaction the same way.
A member stops holding compaction only when it leaves the cluster, through
[`bondy.cluster.leave`](/router/reference/wamp_api/cluster) or
[`cluster.automatic_leave`](/router/reference/configuration/cluster#cluster.automatic_leave).
Until then, history grows on every shard: on disk for the durable database, in
memory for the registry. The only bound on the registry's history is
[`db.registry.retention.*`](/router/reference/configuration/data_storage), off
by default. Retention truncates by local policy, without the witnesses, so it
is one of the ways a hole forms.

A node with no other member truncates on its own frontier only when it runs with
[`cluster.enabled = off`](/router/reference/configuration/cluster#cluster.enabled).
With clustering enabled and no other member listed, it truncates nothing, and
the compaction scheduler logs a "GC stalled" warning with reason `no_members`.

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
projection and the local one is re-derived from it (see
[Re-bootstrap](#re-bootstrap)). This is correct in the case
that matters — history compacted past this replica cannot be recovered by
syncing, because the operations are gone — and it is expensive, which is why a
single transient must never trigger it. `bondy_oplog_rebootstraps_scheduled_total`
counts the schedulings.

The cost of the debounce is one round of detection delay. That is the deliberate
trade: detection is delayed, never lost, because a standing gap cannot heal by
syncing and so strikes again immediately.

Frontier **adoption** is separate and stricter. A node adopts a peer's
frontier only at the end of a re-bootstrap, and only when the install claimed
every cell the peer shipped. A sync round compares the peer's frontier with
its own but never merges it: a peer's frontier says nothing about which of the
peer's operations reached this node.

### Healing an unservable own root

The remaining case is a node whose *own* tree has lost pages. It cannot serve
its root to anyone, and it cannot repair by pulling, because the missing pages
are its own. Anti-entropy on that node advertises the root as empty, so peers
pull nothing from it. Its compaction truncates nothing while the tree walk
meets a missing page. A peer whose frontier is behind recovers what the node
applied from the node's projection, by re-bootstrap. The peer schedules one
after three consecutive refusals of the root, each within two minutes of the
previous one.

Once every member's durable frontier covers what the node applied, its
compaction rebuilds the tree: it truncates the tree past every lost page, but
never past the first operation the node has not applied, and anti-entropy
resumes on what is left. `bondy_oplog_mst_rebuilt_total` counts that rebuild.
It should be zero. Any occurrence means pages went missing, and the question
worth asking is not whether the heal worked but why they went missing.

## Re-bootstrap

A **re-bootstrap** replaces the state of one shard with a peer's snapshot of
that shard. The sync scheduler dispatches one when:

- a frontier gap stands (two strikes, above);
- a peer cannot serve pages this node needs, because it reclaimed them;
- a peer's root is persistently unservable while its frontier is ahead;
- a shard owes an install that no session has completed, for example after a
  crash during one.

The session streams the peer's snapshot into a spool file,
`catalogue_install.spool`, in the write-ahead-log directory of the shard. The
projection does not change until the stream ends. The spool grows to the
encoded size of the peer's snapshot of that shard, and is deleted when the
install is written or abandoned.

When the stream ends, the shard installs it in one step, so that no other write
folds in between:

1. Every snapshot cell replaces the local cell. A local cell is deleted when the
   snapshot covers its table but does not contain the cell.
2. When every cell the peer shipped was installed, the shard sets its applied
   frontier to the frontier the peer reported before the stream.
3. The shard re-folds its retained local history, so local writes the peer had
   not received are kept.

Until the shard's own frontier claims what the install adopted, it holds a
**re-fold mark**. While it holds the mark, it refuses to serve its snapshot or
its frontier to a peer, and compaction truncates nothing. A shard that is
serving its own snapshot to a peer does not start an install. It refuses the
session, which is retried later. A failed stream or a failed projection write adopts
nothing, and the scheduler dispatches another re-bootstrap.

A node refuses an install, before writing anything, when the peer's frontier
does not cover operations the node has already truncated
(`source_behind_truncation`): those operations are in neither the snapshot nor
the local tree. The node keeps serving and compacting, and logs the refusal on
every retry. A refusal that repeats means both nodes truncated history on their
own before they were joined; see
[Enabling clustering](/router/reference/configuration/cluster#enabling-clustering)
for the recovery.

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
