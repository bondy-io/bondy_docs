---
features:
  - text: Install using Docker
    link: /router/guides/install/docker
    description: Run the official image. The fastest way to get a single node.
  - text: Install from Source
    link: /router/guides/install/source
    description: Build a release yourself, to contribute or to target a platform without an image.
  - text: Install using Kubernetes
    link: /router/guides/install/kubernetes
    description: Run a cluster as a StatefulSet that forms itself through peer discovery.
---

# Get Bondy
The tutorials need a running Bondy node. Pick the installation that fits how you work, follow it, and come back with a node listening on the default ports below.

<Features class="VPHomeFeatures" :features="$frontmatter.features"/>

## Default listeners

A node whose `bondy.conf` declares no `listeners.*` key starts these listeners. The tutorials assume them.

|Listener|Port|Serves|
|:---|---|:---|
|`api_gateway_http`|`18080`|API Gateway specifications, and WAMP over WebSocket (`/ws`), Server-Sent Events and long-poll.|
|`wamp_tcp`|`18082`|WAMP over RawSocket.|
|`admin`|`18081`|The Admin HTTP API, WAMP over WebSocket, the `/ping` and `/ready` health endpoints, and `/metrics`. Bound to loopback.|

The node also opens port `18086` for connections from other nodes in its cluster; see [`cluster.peer_port`](/router/reference/configuration/cluster#cluster.peer_port).

None of the default listeners uses TLS. To add TLS listeners or change ports, declare your own listeners; see [Network Listeners](/router/reference/configuration/listeners). Declaring any listener replaces this set, except `admin`, which a node always has.
