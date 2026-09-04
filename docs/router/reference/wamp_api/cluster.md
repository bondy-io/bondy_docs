---
outline: [2,3]
related:
    - text: Clustering
      type: Concept
      link: /router/concepts/clustering
      description: Masterless clustering, peer discovery, and state replication.
    - text: Running a Cluster
      type: Guide
      link: /router/guides/deployment/running_a_cluster
      description: Form and grow a Bondy cluster using automatic peer discovery.
    - text: Cluster Configuration Reference
      type: Reference
      link: /router/reference/configuration/cluster
      description: Configure cluster formation, peer discovery, and TLS.
---
# Cluster

A cluster forms and grows through Partisan's automatic peer discovery, configured entirely through `bondy.conf` — see [Running a Cluster](/router/guides/deployment/running_a_cluster) — not through a WAMP procedure. This page covers the procedures and topics that let a session observe cluster membership and connectivity.

**Every procedure on this page is master realm only.** `bondy.cluster.members` and `bondy.cluster.info` were not, until 2026-09-02: `bondy.*` procedures are dispatched statically, so those two URIs resolved in any realm and only the absence of an RBAC grant stood between a tenant session and them. `bondy.cluster.info` answers this node's `node_spec`, which carries its listen addresses and ports.

## Procedures

|Name|URI|
|:---|:---|
|[Retrieve cluster members](#retrieve-cluster-members)|`bondy.cluster.members`|
|[Retrieve cluster info](#retrieve-cluster-info)|`bondy.cluster.info`|

### Retrieve cluster members
##### bondy.cluster.members() -> [string()] {.wamp-procedure}
Master realm only. Returns every node Partisan considers part of the cluster's membership, whether or not this node currently has a live connection to it. Compare against [`bondy.cluster.info`](#retrieve-cluster-info)'s `nodes` field, which lists only nodes this node is presently connected to — during a partition, `members` still lists a partitioned-away node; `info`'s `nodes` does not.

The list is **sorted** and free of duplicates, so two calls against a settled cluster return an identical list and a client may diff them directly.

The membership is read from a lock-free table rather than asked of the process that maintains it, so this procedure answers even while that process is busy — which is exactly when an operator asks who is in the cluster.

#### Call

##### Positional Args
None.

##### Keyword Args
None.

#### Result

##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'array',
            'description' : 'The nodenames of every member of the cluster, e.g. [\'bondy1@127.0.0.1\'].',
            'items': { 'type': 'string' }
        }
    })"
/>

##### Keyword Results
None.

#### Errors

| Error | When |
|---|---|
| `wamp.error.not_authorized` | Called from a realm other than the master realm. |

### Retrieve cluster info
##### bondy.cluster.info() -> map() {.wamp-procedure}
Master realm only. Returns this node's own Partisan node specification together with the nodes it currently has a live connection to. The specification names the addresses and ports this node accepts peer connections on, which is why it is not a tenant-visible procedure.

#### Call

##### Positional Args
None.

##### Keyword Args
None.

#### Result

##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'object',
            'description': 'This node\'s cluster info.',
            'properties': {
                'node_spec': {
                    'type': 'object',
                    'description': 'This node\'s own Partisan node specification.',
                    'properties': {
                        'name': { 'type': 'string', 'description': 'This node\'s nodename.' },
                        'listen_addrs': {
                            'type': 'array',
                            'description': 'The addresses this node accepts peer connections on.',
                            'items': {
                                'type': 'object',
                                'properties': {
                                    'ip': { 'type': 'string' },
                                    'port': { 'type': 'integer' }
                                }
                            }
                        }
                    }
                },
                'nodes': {
                    'type': 'array',
                    'description': 'The nodenames this node currently has a live Partisan connection to — a subset of bondy.cluster.members during a partition.',
                    'items': { 'type': 'string' }
                }
            }
        }
    })"
/>

##### Keyword Results
None.

#### Errors

| Error | When |
|---|---|
| `wamp.error.not_authorized` | Called from a realm other than the master realm. |

## Topics

Bondy republishes Partisan's own connection-level events as WAMP events on the Master Realm, so a session can observe connectivity changes in real time rather than polling [`bondy.cluster.info`](#retrieve-cluster-info).

##### bondy.cluster.connection.up{.wamp-topic}
Published whenever this node's Partisan connection to a peer comes up — including the first connection to a newly joined node, and a reconnection after a transient network issue.

##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'string',
            'description' : 'This node\'s own nodename.'
        },
        '1':{
            'type': 'string',
            'description' : 'The peer node the connection came up with.'
        }
    })"
/>

##### Keyword Results
None.

##### bondy.cluster.connection.down{.wamp-topic}
Published whenever this node's Partisan connection to a peer goes down — a graceful departure or an unreachable peer look identical from this event alone; check [`bondy.cluster.members`](#retrieve-cluster-members) to tell a temporarily unreachable member from one that has actually left.

##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'string',
            'description' : 'This node\'s own nodename.'
        },
        '1':{
            'type': 'string',
            'description' : 'The peer node the connection went down with.'
        }
    })"
/>

##### Keyword Results
None.

### List peer connections
##### bondy.cluster.connections() -> map() {.wamp-procedure}

The peer-plane connections this node currently holds. Master realm only.

| Key | Type | Meaning |
|---|---|---|
| `node` | string | The node answering. Connections are per node, so this call is not a cluster view. |
| `connections` | list | One entry per open connection: `node`, `channel`, and `listen_addr` as `{ip, port}`. |

A node may hold several connections to one peer — one per Partisan channel —
so a peer appears once per channel.

### Remove a node from the cluster
##### bondy.cluster.leave(node) -> map() {.wamp-procedure}

Removes `node` from the Partisan membership. Master realm only, and the only
[task](/router/reference/wamp_api/task) graded `destructive`.

`node` is the name as it appears in `bondy.cluster.members`, and must be
given even when removing the node serving the call. Naming the target is the
point of the procedure.

Supports `dry_run: true`, which runs the survey below and reports without
removing anything.

::: danger Leaving is a decommission, not a pause
Membership is what the storage layer counts for reclamation: a node in the
membership is one the rest of the cluster waits on, and removing it is what
releases them. The same removal makes the node's origins unclaimed, so the
retirement pass may reap them — and a node rejoining under the same name is
handed a **new** origin, with its former history foreign and its frontier
entries gone.

There is no procedure that undoes this. Run the dry run first.
:::

**The survey.** Before removing anything, Bondy asks every member that will
remain whether it is ready, and refuses the removal when any of them is
**silent** or reports itself **not ready**. Both are the same hazard: the
retirement pass that follows reaps origins no live member claims, is
fail-closed on a member it cannot ask, and cannot tell a member that is up but
not fully started from one that has genuinely relinquished its origins.

The reply carries the survey either way:

| Key | Type | Meaning |
|---|---|---|
| `node` | string | The node named for removal. |
| `safe` | boolean | Whether the survey permits the removal. |
| `members` | list | Each remaining member's `node`, `ready` flag and `oplog_instances` count. |
| `silent` | list of string | Members that did not answer within the survey's budget. |
| `not_ready` | list of string | Members that answered and are not ready. |

**The survey is bounded in time.** It waits 5 seconds for the members it asks,
and `CALL.Options._deadline` (milliseconds from now) caps that — a caller can
shorten the wait, never lengthen it. A caller whose deadline is already spent
gets the fail-closed reading: every remaining member is reported `silent` and
`safe` is `false`. "I ran out of time" and "everyone answered" must not produce
the same verdict when the verdict authorises a decommission.

`oplog_instances` is **reported, not enforced**. A member with fewer
registered instances than its peers is the under-advertising case the survey
cannot rule out by itself, and a cluster may be heterogeneous by design — so
the count is put in front of the operator rather than turned into a refusal
Bondy would be guessing at.

#### Errors

| Error | When |
|---|---|
| `bondy.error.not_a_member` | `node` is not in the current membership. The name is resolved without creating an atom, so an unknown name is refused rather than interned. |
| `bondy.error.unsafe_to_leave` | The survey found a silent or not-ready member. The payload names which. |
| `wamp.error.not_authorized` | Called from a realm other than the master realm. |

## Not implemented

`bondy.cluster.join` is a reserved URI and raises
`wamp.error.no_such_procedure`. Joining needs a full Partisan node
specification — name, listen addresses and channels — which a procedure
argument conveys poorly, and the peer-discovery configuration in
[Running a Cluster](/router/guides/deployment/running_a_cluster) already forms
and grows clusters.

## See also

- [Clustering](/router/concepts/clustering) — masterless clustering, peer discovery, and replication.
- [Running a Cluster](/router/guides/deployment/running_a_cluster) — forming a cluster with automatic peer discovery.
- [Cluster Configuration Reference](/router/reference/configuration/cluster) — `cluster.peer_discovery.*` and the TLS peer-plane settings.
