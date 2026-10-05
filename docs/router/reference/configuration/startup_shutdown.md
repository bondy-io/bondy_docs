# Shutdown Configuration Reference
Configure what happens when a node shuts down.

## Shutdown

A node shuts down in this order:

1. It stops accepting new connections on its listeners. The listeners that serve liveness, readiness and metrics keep answering until the end.
2. It sends a `GOODBYE` to every client session.
3. It waits for `shutdown.grace_period`, so clients can close their sessions cleanly.
4. It leaves the cluster, if [cluster.automatic_leave](/router/reference/configuration/cluster#cluster.automatic_leave) is on.
5. It closes its client-facing listeners, which terminates every connection still open. As each connection closes, Bondy removes its session along with the session's registrations and subscriptions.
6. It closes the listeners that serve liveness, readiness and metrics.

@[config](shutdown.grace_period,time_duration_units,30s,v0.8.8)

How long a shutting-down node waits, after sending `GOODBYE` to every session, before it closes the connections that remain. The node waits for the full period even when every client has already left, so a process supervisor must allow longer than this before it kills the node. On Kubernetes, set the pod's `terminationGracePeriodSeconds` above this value.
