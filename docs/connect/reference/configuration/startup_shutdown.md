# Shutdown Configuration Reference
Configure what happens when a node shuts down.

## Shutdown

A node shuts down in this order:

1. It stops accepting new connections on its listeners. The listeners that serve liveness, readiness and metrics keep answering until the end.
2. It sends a `GOODBYE` to every client session.
3. It waits until the last client connection closes, and for `shutdown.grace_period` at the longest.
4. In a cluster, it waits until the nodes it is connected to hold the removal of its registrations and subscriptions. This wait ends when `shutdown.grace_period` ends. The node skips this wait when the period ended in step 3.
5. It leaves the cluster, if [cluster.automatic_leave](/connect/reference/configuration/cluster#cluster.automatic_leave) is on.
6. It closes its client-facing listeners, which terminates every connection still open. As each connection closes, Bondy removes its session along with the session's registrations and subscriptions.
7. It closes the listeners that serve liveness, readiness and metrics.

@[config](shutdown.grace_period,time_duration_units,30s,v1.0.0-rc.1)

The longest time a node that shuts down waits for steps 3 and 4 together, counted from the `GOODBYE` it sends to every session. A node with no client connected, or whose clients all disconnect, does not wait for the whole period. At the end of the period the node closes the connections that remain. A process supervisor has to allow longer than this value before it kills the node. On Kubernetes, set the pod's `terminationGracePeriodSeconds` above this value.
