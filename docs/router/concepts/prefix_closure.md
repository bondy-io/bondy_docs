---
related:
    - text: Deletion and Reclamation
      type: Concept
      link: /router/concepts/deletion_and_reclamation
      description: The other license causal stability grants, and how Bondy reclaims space for deleted replicated data.
    - text: Data Storage & AAE Configuration Reference
      type: Configuration Reference
      link: /router/reference/configuration/data_storage
      description: Every storage and anti-entropy option.
---

# Per-Origin Prefix Closure

Every replicated Bondy table converges because every node eventually applies
the same set of operations. The observed-remove (add-wins) tables rely on
something stronger: that each node applies any single origin's operations as
an unbroken prefix — operation 7 never lands where operations 5 and 6 are
missing. This property is **per-origin prefix closure**, and the fold enforces
it unconditionally. This page explains what breaks without it, how the
enforcement works, and what its repair looks like in operation.

## Why a prefix matters

Each operation carries a key `{HLC, Origin, Seq}`: a hybrid logical clock,
the identity of the replica that minted the operation, and that origin's
monotonically increasing sequence number. Two mechanisms read `Seq` as if the
applied set had no holes:

- The **applied frontier** — the per-origin `Seq` a node reports as
  applied — is the convergence oracle: equal frontiers on two nodes are
  taken to mean the same operations were applied. One number identifies a
  set only when the set is a prefix, so the number a node reports is a
  **prefix bound**: the largest `Seq` below which nothing from that origin
  is missing. An operation folded above a hole is not discarded. The node
  records it in a per-origin **pending set** and adds it to the bound when
  the hole closes. Until then, the node does not report it.
- The observed-remove tables decide "did the writer of this remove observe
  that add?" with a compact test that is exact only under prefix closure.
  With a hole beneath the maximum, a skipped add is misreported as
  observed, and the remove deletes an add its writer never saw — a silent,
  convergent loss: every node agrees on the wrong value.

## How a hole forms

Anti-entropy is pull-only: a node integrates a peer's whole tree once it
holds every page of that tree. Compaction truncates only history every
cluster member has confirmed, however long a member has been silent, so it
opens no hole for a member. A hole forms where a node meets a truncation it did
not witness:

- registry retention (`db.registry.retention.*`, off by default) truncates the
  in-memory registry's history by local policy, without waiting for a silent
  node;
- a node that joins after the members truncated was never one of their
  witnesses.

The hazardous interleaving needs three steps:

1. A node falls silent, or has not joined yet.
2. The other nodes write, and then truncate past operations that node never
   pulled.
3. The other nodes keep writing, so their trees keep the later operations of
   those origins.

When the node integrates a peer's tree, it receives the later operations with
the earlier ones gone from every tree it can reach — a hole beneath operation 7.
A frontier that took the per-origin maximum would advance to 7 and leave nothing
to flag the hole.

A hole also forms with no silent node. Several tables share one shard's
operation log, and each table registers with the shard as it opens. An
operation addressed to a table that has not registered yet cannot be folded,
because there is no materialised state to fold it into. The hold treats it as
a missing sequence number.

## The hold

The replay that folds synced operations into a table's materialised state
enforces closure at the fold.
Each batch is partitioned per remote origin into the contiguous run rising
from that origin's applied frontier and the remainder. The run is drawn only
from operations of registered tables. An operation whose causal context names
an operation that is neither applied nor in the run joins the remainder too.
The run folds; the remainder is **held**:

- Held operations never reach table state, so no read ever observes an
  operation whose predecessors are missing.
- Held operations are excluded from the frontier advance, so the applied
  frontier never counts past a hole.
- Held operations re-present on every subsequent replay until the gap
  fills — or until the repair below supplies what page sync cannot.

A node's own operations are never held: its local write-ahead log delivers
them in sequence order already.

A hole that persists longer than
[`db.frontier.hole_alarm`](/router/reference/configuration/data_storage#db.frontier.hole_alarm)
raises the
[`{bondy_oplog_frontier_hole, _}`](/router/reference/alarms) alarm, and
`bondy_oplog_instance_frontier_holes` reports the holes a shard carries now.

## The repair

A held remainder means the peer applied operations this node can no longer
obtain by page sync — the pages are truncated everywhere. The hold makes the
existing repair fire deterministically: because the frontier no longer
advances past the hole, the peer's frontier stays ahead after every complete
sync round, the session ends with a frontier-gap verdict, and repeated
verdicts schedule a
[**catalogue re-bootstrap**](/router/concepts/convergence#re-bootstrap) — the node reinstalls the
peer's materialised cells and adopts its frontier, which supplies both the
missing values and the bookkeeping in one act.

The visible arc of an episode, in the
[cluster-sync metrics](/router/reference/metrics#anti-entropy-sync-bootstrap-frontier-convergence): a burst of
`bondy_oplog_events_held_total` on the rejoining node, then frontier-gap
verdicts, then a scheduled re-bootstrap, then quiet. A sustained held rate on
a healthy cluster means a gap is not filling and deserves a look.

## Why it is not optional

Without enforcement a rejoining node integrates a peer's truncated history
as-is, a frontier taken as a per-origin maximum merges past any hole, and the
observed-remove exactness argument no longer holds — a removal can drop an
addition the writer never saw. A single maximum cannot represent a hole and
cannot report one either: the loss is silent. The prefix bound and its pending
set stop below the hole, and that stop is what makes the hole visible to the
frontier comparison.

The one cost of enforcement is that a permanently missing operation becomes
a catalogue re-bootstrap instead of a silent gap — a repair, in place of a
loss.
