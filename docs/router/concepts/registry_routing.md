---
related:
    - text: Clustering
      type: Concept
      link: /router/concepts/clustering
      description: How Bondy nodes form a cluster and stay available during partitions and failures.
    - text: Cluster Configuration Reference
      type: Configuration Reference
      link: /router/reference/configuration/cluster
      description: Configure cluster formation, peer discovery, and Registry Routing (RIB) observability.
---

# Registry Routing (RIB)

Bondy's registry holds every WAMP **registration** (a callee offering a
procedure) and **subscription** (a subscriber interested in a topic). To route
a call or an event across a cluster, a node must know which other nodes can
serve a given procedure or topic.

Bondy answers that question from a **Routing Information Base (RIB)**: a set
of compact, replicated *summary cells* — one per `(realm, match policy, URI,
node)` — rather than by replicating every full registry entry to every node.
Each node keeps its own full entries in node-local memory and publishes only
the summary of what it can serve. Cross-node routing is decided from the
merged summaries.

The payoff is scale. A registration's replicated footprint is **one small
cell per node that owns it**, not a full copy of the entry on every node in
the cluster. A cluster with many short-lived registrations replicates far
less state and does far less anti-entropy work.

This is how the registry always works — there is no mode to select and
nothing to configure to turn it on.

## How routing works

- **Local registrations and subscriptions** live only in the owning node's
  memory. They are never replicated.
- Each node maintains a **summary cell** per `(realm, match policy, URI)` it
  serves, and those cells replicate cluster-wide by anti-entropy (see
  [Clustering](/router/concepts/clustering)). A peer compiles the merged cells into
  a **stub view** of who can serve what.
- **Dealer (calls).** To route a call whose callee is remote, a node picks
  the owning node from the stub view and forwards the call
  **node-addressed**. The receiving node then re-selects the callee among
  *its own* live local registrations (owner-side completion) rather than
  acting on the sender's possibly-stale choice of entry. If the chosen
  node's summary was momentarily stale, a bounded pre-invocation retry
  reroutes to another candidate before the call fails with
  `wamp.error.no_eligible_callee`.
- **Broker (events).** To publish to remote subscribers, a node discovers
  the subscriber *nodes* from the subscription stubs and relays one
  `PUBLISH` per such node; the receiving node matches and delivers to its
  own local subscribers.

Local calls and events never leave the node — they resolve against the local
registry directly.

## Restarts and clocks

A summary cell carries its node's latest *reading* of how many live entries it
has, stamped from a node-wide hybrid logical clock. On every replica the
highest-stamped reading wins, so a reading left over from before a restart is
replaced by the node's next one, never added to or subtracted from.

The registry lives in memory, in the node's `registry` database. Every open of
that database is followed by a restore that rewrites the node's summary cells
from its registry. It opens at boot, and again whenever one of its processes
dies in a running node: the node then closes and reopens the whole database
and logs `A process of the bondy_db registry DB died; reopening the DB` at
error level.

This relies on one operational rule: **a node's wall clock must not go back,
across a restart, past the last stamp the node issued.** A node restarted with
its clock stepped far enough back writes readings that lose to its own older
ones, and a peer may keep routing to callees the node no longer has. Keep node
clocks synchronised (NTP or equivalent) and never step a clock backwards
across a restart.

## When a node leaves

Only a node writes its own summary cells, so a node that is gone cannot remove
them. The surviving nodes reclaim them, and the stubs built from them, after
the node leaves the cluster membership: through
[`bondy.cluster.leave`](/router/reference/wamp_api/cluster), or the node's own
graceful shutdown under
[`cluster.automatic_leave`](/router/reference/configuration/cluster#cluster.automatic_leave).
A node that has crashed or is partitioned, and has not left, stays in the
membership and keeps its cells and stubs. It can come back, and it needs its
routing when it does. Bondy therefore never deletes a stub on membership loss
alone; it deletes a stub only once the cell behind it is gone.

Reclamation on each surviving node runs in three stages, each on its own
schedule:

1. The origin-retirement pass removes the departed node's entries from its
   summary cells, so each cell reads a count of `0`. The pass runs on every
   membership change and every
   [`db.origin_retirement.interval`](/router/reference/configuration/reclamation#db.origin_retirement.interval).
2. The reclamation sweep discards the emptied cells once they are
   [causally stable](/router/reference/glossary#causal-stability). It runs every
   [`db.reclaim.interval`](/router/reference/configuration/reclamation#db.reclaim.interval).
   See [Deletion and Reclamation](/router/concepts/deletion_and_reclamation).
3. The RIB consistency sweep deletes each stub whose cell is gone. It runs every
   [`registry.rib.check_interval`](/router/reference/configuration/cluster#registry.rib.check_interval).
   With that interval set to `0`, the sweep never runs, so a departed node's
   stubs are never removed.

Until its stubs are gone, a departed node still counts as a subscriber node:
a `PUBLISH` that matches its subscriptions is relayed to it, and the meta API
walks it. When the dealer chooses a node for a call, it prefers reachable
nodes, so a departed node's registrations do not take calls while a reachable
callee exists.

## Configuration

Routing on the RIB is unconditional; there is nothing to enable. One optional
setting tunes observability; it does not change what the registry
replicates. See the
[Registry Routing section](/router/reference/configuration/cluster#registry-routing-rib)
of the Cluster Configuration Reference for the exact keys, defaults, and the
Prometheus metrics the summary machinery exposes.

## See also

- [Clustering](/router/concepts/clustering) — how nodes form a cluster and converge
  replicated state generally.
- [Deletion & Reclamation](/router/concepts/deletion_and_reclamation) — how Bondy
  reclaims space for deleted replicated data, the sibling concern to routing
  scale.
