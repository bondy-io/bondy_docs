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

## Procedures

|Name|URI|
|:---|:---|
|[Retrieve cluster members](#retrieve-cluster-members)|`bondy.cluster.members`|
|[Retrieve cluster info](#retrieve-cluster-info)|`bondy.cluster.info`|

### Retrieve cluster members
##### bondy.cluster.members() -> [string()] {.wamp-procedure}
Returns every node Partisan considers part of the cluster's membership, whether or not this node currently has a live connection to it. Compare against [`bondy.cluster.info`](#retrieve-cluster-info)'s `nodes` field, which lists only nodes this node is presently connected to — during a partition, `members` still lists a partitioned-away node; `info`'s `nodes` does not.

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
None documented.

### Retrieve cluster info
##### bondy.cluster.info() -> map() {.wamp-procedure}
Returns this node's own Partisan node specification together with the nodes it currently has a live connection to.

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
None documented.

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

## Not yet implemented

`bondy.cluster.join`, `bondy.cluster.leave`, and `bondy.cluster.connections` are reserved URIs with no working implementation — calling any of them raises `wamp.error.no_such_procedure`. This is deliberate, not an oversight in progress: retiring a node from a cluster is a causally significant act — [Deletion and Reclamation](/router/concepts/deletion_and_reclamation) only licenses space reclamation once every member has certified a tombstone stable, so a `leave` call that merely replied "success" without actually retiring the member through Partisan would leave reclamation permanently stalled on a member that was never really removed. Until that path is implemented, refusing the call outright is safer than a call that appears to work but silently corrupts an invariant elsewhere. Use the peer-discovery configuration in [Running a Cluster](/router/guides/deployment/running_a_cluster) to join and grow a cluster today.

## See also

- [Clustering](/router/concepts/clustering) — masterless clustering, peer discovery, and replication.
- [Running a Cluster](/router/guides/deployment/running_a_cluster) — forming a cluster with automatic peer discovery.
- [Cluster Configuration Reference](/router/reference/configuration/cluster) — `cluster.peer_discovery.*` and the TLS peer-plane settings.
