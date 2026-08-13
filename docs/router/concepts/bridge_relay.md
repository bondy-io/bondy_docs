---
outline: [2,3]
related:
    - text: Bridge Relay Configuration Reference
      type: Configuration Reference
      link: /router/reference/configuration/bridge_relay
      description: Every bridge.* configuration key, with defaults and versions.
    - text: Bridge Relay WAMP API Reference
      type: WAMP API Reference
      link: /router/reference/wamp_api/bridge_relay
      description: Add, remove, start, stop, and check the status of a bridge at runtime.
    - text: Clustering
      type: Concept
      link: /router/concepts/clustering
      description: The peer-plane connections a bridge relay is deliberately distinct from.
---

# Bondy Edge (Bridge Relay)
A bridge relay connects one Bondy node, as a client, to a remote Bondy router — sharing a subset of a realm's procedures and topics over a single dedicated connection, without the two joining the same cluster. Running in this mode is what Bondy calls **Bondy Edge**: a node placed at a network boundary (an office, a factory floor, a home) that extends a subset of a core deployment's routing to wherever it sits, while remaining administratively and operationally its own node.

## Why not just join the cluster?
[Clustering](/router/concepts/clustering) and a bridge relay solve different problems, and Bondy keeps them as two entirely separate mechanisms rather than variations on one:

- **Cluster peers** are equals. Every node in a Partisan cluster holds (a share of) the same realms, replicates the same state, and is expected to stay reachable on a trusted network.
- **A bridge relay** connects two *independent* deployments — often across an untrusted network, and often with the edge side having no fixed address or public port at all. It shares only what's explicitly configured, in one connection, rather than merging the two into one routing domain.

The bridge is always the one that dials out. An edge node behind a NAT, a home router, or a corporate firewall never needs an inbound port open — it connects outward to the remote router's [bridge relay listener](/router/reference/configuration/bridge_relay#accepting-bridges) the same way any WAMP client dials a router. This is the same problem — and the same solution — described in [What is an Application Network](/router/concepts/application_networks#key-characteristics) as the "reverse VPN problem": no VPN client, no exposed port, no reachability requirement on the edge side at all.

A node can run several named bridges to several remote routers at once, each configured and reconnected independently — see the [Configuration Reference](/router/reference/configuration/bridge_relay) for the connection, TLS, and reconnection-backoff settings.

## Authenticating without shipping a private key
The edge authenticates to the remote router as a normal WAMP client, using `cryptosign` — a public-key challenge, not a shared secret sent over the wire. What's distinctive is where the corresponding private key lives: rather than embedding it in the edge's `bondy.conf` (an option that exists, but is explicitly documented as testing-only), signing can be delegated to a callee registered locally on the edge, or to an external executable invoked with the public key and challenge as arguments. Either way, the private key stays wherever it was provisioned — a Secure Element, an HSM, a secrets manager — and never has to pass through, or be stored by, Bondy's own configuration. See [Delegated signing](/router/reference/configuration/bridge_relay#delegated-signing) for the exact keys.

## What happens when a realm mapping connects
Each `bridge.$name.realm.$id` mapping opens its own WAMP session on the shared connection, and that session's opening triggers two things:

**The realm's security model is synced from the remote to the edge.** The remote router ships its copy of the realm record, its groups, users, sources, and grants — everything [RBAC](/router/reference/wamp_api/rbac) needs to authorize a session locally on the edge without a round-trip to the remote for every check. If the realm has a [prototype](/router/guides/administration/simplifying_realm_management_using_prototypes), the prototype realm is synced first, since the target realm's groups/sources/grants may be inherited from it. The realm's own private signing and encryption keys are stripped before shipping — the edge gets the public keys it needs to verify locally, never the private material.

::: warning User passwords are currently included in this sync
The sync above does not yet split a user's password out before shipping it to the edge. Until it does, treat an edge node as holding a full copy of the realm's password hashes, not merely its public verification material — factor that into which realms you bridge to less-trusted edges.
:::

::: tip SSO realms are not synced automatically
If the bridged realm authenticates through an [SSO realm](/router/concepts/single_sign_on), that SSO realm's own users, groups, and grants are not pulled in as part of this sync — only the bridged realm's own security tables are. Request the SSO realm explicitly (as its own realm mapping) if the edge needs to authenticate against it directly.
:::

**Every existing local registration and subscription on the realm is proxied to the remote router**, and every one created or removed afterward is proxied live as it happens — so a caller on the remote router can reach a procedure that's only ever registered on the edge, and a subscriber on the remote router can receive events published on the edge. This happens automatically for the whole realm; there is currently no way to hold part of it back.

::: warning procedure/topic sharing config is not yet enforced
The [`procedure.$pid`](/router/reference/configuration/bridge_relay#sharing-procedures-and-topics) match-spec entries are validated but have no effect on what's shared today — registrations proxy unconditionally regardless of what's configured there. `topic.$tid` entries do have an effect, but only for `direction: out` (subscribe locally, forward events to the remote); `direction: in` — receiving events published on the remote router — is accepted by the schema but not yet implemented. Don't rely on either as an access control until this lands.
:::

## Running a bridge in a cluster
The manager process that reads `bondy.conf` and starts configured bridges has no cross-node coordination yet. If the same `bondy.conf` — with a bridge defined in it — is deployed to every node of a cluster, every node starts its own copy of that bridge, each opening its own independent connection to the remote router. That's harmless for a single node, but not what you want from a cluster, where you'd normally want exactly one bridge running for a given remote.

Until leader election for bridges exists, the workaround is to create the bridge at runtime instead of through `bondy.conf`: [`bondy.router.bridge.add`](/router/reference/wamp_api/bridge_relay#add-a-bridge) starts the bridge only on the node that receives the call, giving you a singleton bridge by choosing which node to call it on.

## The other side: accepting bridges
A remote router doesn't need to be told about each edge that bridges to it — it just needs its [bridge relay listener](/router/reference/configuration/bridge_relay#accepting-bridges) enabled, and it accepts any edge that authenticates successfully for a realm it hosts. Managing bridges at runtime — adding, removing, starting, stopping, checking status — is a [WAMP API](/router/reference/wamp_api/bridge_relay), so either side of a bridge can be operated the same way you operate anything else in Bondy.

## See also
- [Bridge Relay Configuration Reference](/router/reference/configuration/bridge_relay) — every `bridge.*` key, including TLS, reconnection, and delegated signing.
- [Bridge Relay WAMP API Reference](/router/reference/wamp_api/bridge_relay) — add, remove, start, stop, and check the status of a bridge at runtime.
- [Clustering](/router/concepts/clustering) — the peer-plane mechanism a bridge relay is deliberately not.
- [What is an Application Network](/router/concepts/application_networks) — the reverse-VPN problem a bridge relay solves.
