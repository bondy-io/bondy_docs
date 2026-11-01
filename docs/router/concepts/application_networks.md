---
outline: [2,3]
---
# Application Networks
Bondy Connect builds an application network: one network that connects every part of a distributed application by what each part does, not by where it runs.

::: definition Application network
An [overlay network](https://en.wikipedia.org/wiki/Overlay_network), formed by one or more Bondy nodes, in which application components address each other by named procedures and topics rather than by host and port.
:::

## Two kinds of traffic

A distributed application carries two kinds of traffic.

- **North-South** traffic crosses the boundary of the system: web apps, mobile apps, devices and external API clients talking to the services inside.
- **East-West** traffic stays inside: services talking to each other.

<ZoomImg
  src="/assets/application_network_traffic.png"
  caption="An application network carries both kinds of traffic"
  width="600"/>

Most systems use different machinery for each. North-South traffic goes through an API gateway over HTTP. East-West traffic goes through a service mesh, a message broker, or direct gRPC calls. Each piece has its own protocol, its own client libraries, its own security model and its own place to look when something fails. The split usually comes from history and tooling, not from a difference in what the traffic needs: in both directions, one component wants to ask another to do something, or tell others that something happened.

An application network carries both kinds of traffic with one mechanism.

## Addressing by name

In an IP network, a component reaches another by its address and port, so it must know where the other runs. In an application network, a component reaches another through a name: the URI of a procedure to call or a topic to publish on. Bondy keeps track of which sessions registered each procedure and subscribed to each topic, and routes each message to them.

Naming instead of locating has consequences:

- **Components are independent.** A component can move, restart or be replaced without the others noticing, because they never knew its location.
- **Capacity scales per procedure.** Starting more instances of a service that register the same procedure adds capacity for that procedure. Callers change nothing. See [shared registrations](/router/concepts/wamp/advanced/rpc).
- **Every connection goes out.** Each component connects to Bondy; nothing connects to a component. A component behind a firewall or NAT can still register procedures that others call.

The last point removes a common problem with devices. For a remote system to send commands to a device over HTTP, the device must accept inbound connections. That means an open port, or a reverse VPN to reach it from outside. Both are hard to configure and easy to get wrong, and a small device may be unable to run a VPN client at all. On an application network, the device opens one outbound connection to Bondy and registers the procedures it offers. A remote caller calls those procedures through Bondy, over the device's own connection.

## How Bondy implements it

The core of the network is [WAMP](/router/concepts/wamp/what_is_wamp), which combines routed RPC and publish/subscribe in one session-based protocol. Bondy is a WAMP router. Components that use a WAMP client library connect to it directly.

Not every component speaks WAMP, so Bondy Connect also exposes the network through other interfaces:

- The [API Gateway](/router/concepts/api_gateway) turns HTTP requests into WAMP calls and publications, for clients that only speak HTTP.
- The [HTTP Connector](/router/concepts/http_connector) registers an external HTTP API as WAMP procedures, so WAMP components can call it.
- The [MCP Gateway](/router/concepts/mcp_gateway) exposes a realm's procedures and topics to AI agents as an MCP server.

Three mechanisms shape the network itself:

- **Realms** divide it into isolated tenants. See [Realms](/router/concepts/realms).
- **Clustering** spreads it over several Bondy nodes. A component connected to any node reaches procedures and topics registered on every node. See [Clustering](/router/concepts/clustering).
- **Bridge relays** link a Bondy node at the edge, such as one in a factory or a vehicle, to a remote router. Callers on the remote router reach procedures registered at the edge, and the edge forwards events on chosen topics to the remote router. See [Bondy Edge (Bridge Relay)](/router/concepts/bridge_relay).

## What one network gives you

Because every call and event passes through Bondy, some concerns move out of the components and into the network:

- **Security in one place.** Bondy authenticates every session and authorizes every message against the realm's permissions. Components do not each implement their own access control. See [WAMP Security](/router/concepts/wamp/security).
- **Observability in one place.** Bondy measures the traffic it routes, so one set of [metrics](/router/reference/metrics) covers calls, events and errors across the application.
- **Fewer moving parts.** One protocol, one set of client libraries and one routing layer replace a separate gateway, broker and mesh.

The cost is that Bondy is in the path of every message. Its availability is the application's availability, which is why Bondy runs as a cluster with no single leader; see [Clustering](/router/concepts/clustering).
