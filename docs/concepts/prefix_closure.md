---
related:
    - text: Deletion and Reclamation
      type: Concept
      link: /concepts/deletion_and_reclamation
      description: The other license causal stability grants, and how Bondy reclaims space for deleted replicated data.
    - text: Data Storage & AAE Configuration Reference
      type: Configuration Reference
      link: /reference/configuration/data_storage
      description: Every storage and anti-entropy option, including db.aae.prefix_hold.
---

# Per-Origin Prefix Closure

Every replicated Bondy table converges because every node eventually applies
the same set of operations. The observed-remove (add-wins) tables rely on
something stronger: that each node applies any single origin's operations as
an unbroken prefix — operation 7 never lands where operations 5 and 6 are
missing. This property is **per-origin prefix closure**. Bondy enforces it by
default (`db.aae.prefix_hold`), and this page explains what breaks without
it, how the enforcement works, and what its repair looks like in operation.

## Why a prefix matters

Each operation carries a key `{HLC, Origin, Seq}`: a hybrid logical clock,
the identity of the replica that minted the operation, and that origin's
monotonically increasing sequence number. Two mechanisms read `Seq` as if the
applied set had no holes:

- The **applied frontier** — the per-origin maximum `Seq` a node has
  applied — is the convergence oracle: equal frontiers on two nodes are
  taken to mean the same operations were applied. A maximum identifies a
  set only when the set is a prefix.
- The observed-remove tables decide "did the writer of this remove observe
  that add?" with a compact test that is exact only under prefix closure.
  With a hole beneath the maximum, a skipped add is misreported as
  observed, and the remove deletes an add its writer never saw — a silent,
  convergent loss: every node agrees on the wrong value.

## How a hole forms

Anti-entropy is pull-only: a node integrates a peer's whole tree once it
holds every page of that tree. Compaction, meanwhile, truncates history that
every *confirmed* peer has applied — and the confirmation set is
recency-filtered, so a node silent past `db.aae.peer_timeout` no longer
holds truncation back.

The hazardous interleaving needs three steps. A node falls silent; the live
peers write and then truncate past operations the silent node never pulled;
the peers keep writing, so their trees retain those origins' later
operations. When the silent node rejoins and integrates a peer's tree, it
receives the later operations with the earlier ones gone from every live
tree — a hole beneath the maximum, with nothing left to flag it.

## The hold

With `db.aae.prefix_hold` on (the default), the replay that folds synced
operations into a table's materialised state enforces closure at the fold.
Each batch is partitioned per remote origin into the contiguous run rising
from that origin's applied frontier and the non-contiguous remainder. The
run folds; the remainder is **held**:

- Held operations never reach table state, so no read ever observes an
  operation whose predecessors are missing.
- Held operations are excluded from the frontier advance, so the applied
  frontier never counts past a hole.
- Held operations re-present on every subsequent replay until the gap
  fills — or until the repair below supplies what page sync cannot.

A node's own operations are never held: its local write-ahead log delivers
them in sequence order already.

## The repair

A held remainder means the peer applied operations this node can no longer
obtain by page sync — the pages are truncated everywhere. The hold makes the
existing repair fire deterministically: because the frontier no longer
advances past the hole, the peer's frontier stays ahead after every complete
sync round, the session ends with a frontier-gap verdict, and repeated
verdicts schedule a **catalogue rebootstrap** — the node reinstalls the
peer's materialised cells and adopts its frontier, which supplies both the
missing values and the bookkeeping in one act.

The visible arc of an episode, in the
[cluster-sync metrics](/reference/configuration/data_storage): a burst of
`bondy_oplog_events_held_total` on the rejoining node, then frontier-gap
verdicts, then a scheduled rebootstrap, then quiet. A sustained held rate on
a healthy cluster means a gap is not filling and deserves a look.

## Turning it off

`db.aae.prefix_hold = off` restores the unenforced fold: a rejoining node
integrates a peer's truncated history as-is, the frontier advances past any
hole, and the observed-remove exactness argument no longer holds. The knob
exists as an emergency escape, not as a tuning option. The one cost of
leaving enforcement on is that a permanently missing operation becomes a
catalogue rebootstrap instead of a silent gap — a repair, in place of a
loss.
