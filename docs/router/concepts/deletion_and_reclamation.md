---
related:
    - text: Registry Routing (RIB)
      type: Concept
      link: /router/concepts/registry_routing
      description: How Bondy scales cross-node routing without replicating every registration to every node.
    - text: Reclamation Configuration Reference
      type: Configuration Reference
      link: /router/reference/configuration/reclamation
      description: Every reclamation and origin-retirement option, default, and telemetry event.
---

# Deletion and Reclamation

In a replicated, operation-based store, deleting a value and reclaiming its
space are two different acts, licensed by two different kinds of evidence.
Deletion is an ordinary operation: it converges across the cluster like any
other write, and it must leave a **tombstone** behind, because the tombstone
is the only thing that can reject a concurrent, older write arriving later.
Reclamation — physically removing the cell — is licensed only by **causal
stability**: proof that no operation old enough to care about the tombstone
can ever be delivered again. Bondy's storage layer, `bondy_db`, keeps these
two acts separate on purpose, and this page explains the machinery that
makes the second one safe.

## The problem: you cannot simply erase

Every `bondy_db` table is backed by an operation-based CRDT (see
[Clustering](/router/concepts/clustering)). Replicas converge because every replica
eventually applies the same set of operations, in any order. Erasing a cell
outright would break that: a replica that erased "user alice" and then
received a *concurrent* write to alice — one issued before the delete was
known — would resurrect her, because nothing would remain to say the delete
happened, or to compare timestamps against.

So a register's removal is itself an operation (`clear`), and applying it
leaves the cell in a `cleared` state carrying the removal's Hybrid Logical
Clock (HLC) timestamp. Readers see the value as not found immediately — a
cleared cell and an absent cell are indistinguishable through the read API —
but the cell still occupies a row. Its one remaining job is to reject any
concurrent `set` with a lower HLC that has not arrived yet.

Without reclamation, that row lives forever, and cell count grows
monotonically with every key ever written regardless of how many are live.
The rest of this page is about when the tombstone's job is provably
finished.

## Deleting

Deleting a value hides it immediately and everywhere. Whether — and when —
the cell is physically reclaimed afterwards is the CRDT's business: a
last-writer-wins register discards a tombstone once it is old enough that no
concurrent write can still arrive; a set or map removes its entries
individually; a counter has no removal at all. A table whose CRDT expresses
no opinion on removal simply retains its cells — the sweep described below
treats "no opinion" as "reclaim nothing," never the reverse.

## Causal stability: the licence to reclaim

A timestamp is **causally stable** at a node when every operation that could
ever still be delivered there is newer than it. Once a tombstone's HLC is
causally stable, the concurrent write it exists to reject is impossible by
construction, and the tombstone is pure overhead.

Bondy derives stability from three ingredients, all of which run on the
ordinary anti-entropy machinery (see [Clustering](/router/concepts/clustering)):

**The confirmed-root swap.** When a node completes a pull from a peer, both
sides record the *same* root — the peer's advertised Merkle Search Tree
root, every page of which the puller now demonstrably holds. A root recorded
this way is evidence about what *both* replicas hold, which is what a
stability computation needs; a node's own root would only measure its own
sync recency.

**The strict membership frontier.** The stability point is computed against
**every** member of the cluster — including currently unreachable ones — and
a member leaves that set only by a deliberate membership act, never by
timeout. Each member must have a confirmed root; the frontier is the newest
local event covered by all of them, and its HLC is the stability point. One
silent member holds stability down for the whole cluster. That is the
correct trade: an unreclaimed tombstone costs disk, while a wrongly
reclaimed one costs data, permanently and silently.

**Absorbing clocks.** Every path that delivers remote events — live sync,
direct append, and bootstrap from a peer's snapshot — advances the local HLC
past the delivered timestamps. This is what upgrades "every replica already
holds these events" into "no replica can ever mint an event below this
point": a freshly bootstrapped replica's first write is guaranteed to sort
after everything it received in its snapshot.

A node with no cluster peers is the degenerate case: nothing can contradict
it, so everything it holds is stable, and a solo node reclaims against a
fresh tick of its own clock.

## The sweep

Reclamation is a sweep over the projection, executed inside the applier: the
one process on each node that writes to that node's local projection for a
shard. Whether an operation originated locally or arrived via replication
from another node, it funnels through this same process before touching the
projection — so the sweep can never interleave with a concurrent apply to
the same cell. This is a per-node serialization guarantee, not a claim about
who may originate writes: most tables — realms, users, RBAC grants, and the
like — accept concurrent writes from any node in the cluster, which is
exactly why the CRDT and causal-stability machinery above exists. The
exception is the [registry](/router/concepts/registry_routing), whose entries are
owned by the node a client is connected to, and so genuinely have only one
node that would ever write a given one. The sweep walks each registered
table's cells, asks the table's CRDT for a verdict, and physically removes
discarded cells, where the storage engine's own compaction can finally
reclaim the bytes.

A tombstone is kept — never discarded — while any operation is still pending
for its key, and while its HLC is not strictly older than the stability
point (a tombstone exactly at the boundary is kept, since a concurrent write
at the same HLC may still be unconfirmed). One visible consequence: a
tombstone that happens to be the newest event on its shard stays in place
until any later write lands on that shard. Under ordinary traffic this is
momentary; on an idle shard the last tombstone persists, bounded to one
cell. It is retained because the proof requires it, not because the sweep
missed it.

The sweep is bounded and resumable: each pass runs in small batches, so
concurrent writes interleave between batches rather than waiting out a
whole-shard scan. A scheduler drives passes on its own cadence, entirely
separate from — and much slower than — the compaction scheduler.

## Origins, retirement, and departed nodes

Because one silent member freezes reclamation, a *permanently* departed node
must be retired, and retirement is a deliberate membership act: removing the
node from the cluster's membership. The moment membership no longer contains
the node, stability computes without it. Nothing ages out on a timer — a
node that is merely partitioned keeps its seat, and keeps reclamation
honest, until an operator decides otherwise.

Retirement has a second, subtler half. Bondy identifies a replica's
*history* by an **origin** — an opaque identity minted with the replica's
storage and destroyed with it — precisely so that a node which loses its
disk and rejoins under the same name cannot collide with its own past. The
corollary is that a node accumulates dead origins over its lifetime, and
their bookkeeping entries linger in cell states.

An origin-retirement pass cleans these up by **complement**: it asks every
current member for the origins it presently claims, and whatever appears in
the local frontiers but is claimed by nobody is a dead epoch, reaped from
every table's cell states. The pass is fail-closed: if any member cannot be
queried, nothing is reaped and the pass retries later. It runs automatically
on membership changes and on a slow periodic tick, the latter covering the
case where an origin epoch turns over with no membership change at all — a
node that loses its volume and rejoins under the same name.

The pass deliberately never bans an origin on its own. Banning a live
origin would silently refuse its writes — divergence, not hygiene — and the
membership plane already refuses connections from non-members.

## Watching stability

Reclamation fails silently in both directions — nothing visibly breaks
whether it is working or wedged — so every attempt that certifies no
stability reports why it didn't, naming the member holding it back when
that's the cause. Two states are worth understanding, because both exist to
keep a converged, quiescent cluster *quiet*:

- **Sync recency is not confirmation.** A steady-state shard nobody writes
  to converges to an *empty* tree on every replica, and a sync round
  between two empty trees completes with no root to swap. Such a round
  still refreshes peer recency, but it confirms nothing: only a concrete
  root is evidence about what both replicas hold.
- **An empty tree has nothing to certify.** When a replica's own tree is
  empty, no event needs a stability proof, and reporting that as a stall
  would be worse than noise — it would recommend reviving or retiring
  members that are alive and converged. This state is counted in
  telemetry but never raised as an operator warning, and it ends the
  moment a local event lands.

One narrow state is left unresolved by design: if cells become reclaimable
on a shard and the whole cluster then goes quiet on that shard before
stability was ever certified past them, those cells sit unreclaimed —
correct, hidden from reads, but still occupying space — until the shard's
next write. This is tolerated because the asymmetry that governs this whole
design holds here too: an unreclaimed cell costs bytes; a wrongly reclaimed
one costs data, permanently and silently. The state is bounded and
self-healing — the first write to the shard regrows a root, the next sync
round confirms it, and one sweep discards the backlog.

## Consequences

- Deleting hides a value immediately and everywhere; space returns later,
  when stability licenses it. The two are decoupled by design.
- Reclamation is quiet when healthy and loud when stalled: a member that
  cannot confirm surfaces within one scheduler interval as telemetry naming
  the missing member. An *actionable* stall is always a fact about
  membership, and the remedy is always a membership decision.
- Everything here is on by default. Every option, including how to disable
  reclamation or retirement, is covered in the
  [reclamation configuration reference](/router/reference/configuration/reclamation).
