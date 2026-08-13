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

## Configuration

Routing on the RIB is unconditional; there is nothing to enable. Two optional
settings tune observability and flap control, and neither changes what the
registry replicates. See the
[Registry Routing section](/router/reference/configuration/cluster#registry-routing-rib)
of the Cluster Configuration Reference for the exact keys, defaults, and the
Prometheus metrics the summary machinery exposes.

## See also

- [Clustering](/router/concepts/clustering) — how nodes form a cluster and converge
  replicated state generally.
- [Deletion & Reclamation](/router/concepts/deletion_and_reclamation) — how Bondy
  reclaims space for deleted replicated data, the sibling concern to routing
  scale.
