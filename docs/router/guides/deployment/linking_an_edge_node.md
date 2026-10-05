---
outline: [2,3]
related:
    - text: Bondy Edge (Bridge Relay)
      type: Concept
      link: /router/concepts/bridge_relay
      description: What a bridge relay is, what the realm sync copies, and why it is not clustering.
    - text: Bridge Relay Configuration Reference
      type: Configuration Reference
      link: /router/reference/configuration/bridge_relay
      description: Every bridge.* key, with defaults.
    - text: Bridge Relay WAMP API Reference
      type: WAMP API Reference
      link: /router/reference/wamp_api/bridge_relay
      description: The bondy.router.bridge.* procedures used to verify and remove a bridge.
    - text: Connecting an Edge Node
      type: Tutorial
      link: /router/tutorials/edge/connecting_an_edge_node
      description: The same link on one machine, from the repository's development targets.
---

# Linking an Edge Node to a Remote Router

Link an edge node to a remote Bondy router with a bridge relay: accept bridges
on the remote router, configure the bridge on the edge, verify the link, and
take it down again.

In this guide the **remote router** is the Bondy deployment the edge connects
to, and the **edge** is the node that runs the bridge.

**Prerequisites:**

- A remote router and an edge node, each with admin access to its master
  realm (`com.leapsight.bondy`).
- The realm to share, already provisioned on the remote router. The edge does
  not need it: the bridge copies the realm's security model from the remote
  router when it connects.
- OpenSSL 3, to generate the edge's key pair.
- A server certificate for the remote router's bridge listener, and the CA
  certificate that signed it.

For what a bridge carries and why it is a separate mechanism from clustering,
read [Bondy Edge (Bridge Relay)](/router/concepts/bridge_relay) first.

## 1. Create the edge's identity

The edge authenticates to the remote router with WAMP `cryptosign`, so it needs
an Ed25519 key pair. Generate one, and print the private seed and the public
key as hexadecimal:

```bash
openssl genpkey -algorithm ed25519 -out edge-key.pem
openssl pkey -in edge-key.pem -outform DER | tail -c 32 | xxd -p -c 32
openssl pkey -in edge-key.pem -pubout -outform DER | tail -c 32 | xxd -p -c 32
```

The first printed line is the private seed, the second the public key. Each is
64 hexadecimal characters. Keep the seed secret; the edge reads it at runtime
(step 4).

## 2. Provision the identity on the remote router

In the realm to share, on the remote router:

1. Make sure the realm's `authmethods` include `cryptosign`.
2. Create a user for the edge, with the public key from step 1 in its
   `authorized_keys`.
3. Add a source that allows `cryptosign` for that user from the edge's
   address.

[Authenticating Clients](/router/guides/security/authenticating_clients) walks
through all three for a key-based user.

The bridge session needs no grants of its own to register proxies for the
edge's procedures or to republish the edge's events. The local clients on each
side still need theirs, and the edge enforces them with the users, groups and
grants it copies from the remote router.

The copy does not include group membership: on the edge, every copied user
belongs to no group. A client on the edge therefore has only the grants made
to its user directly. Grant the permissions that edge clients need to their
users, not to a group they belong to.

## 3. Accept bridges on the remote router

Declare a [listener](/router/reference/configuration/listeners) whose protocol
is `bridge_relay` in the remote router's `bondy.conf`:

```
listeners.bridge_relay_tls.transport  = tls
listeners.bridge_relay_tls.protocol   = bridge_relay
listeners.bridge_relay_tls.port       = 18093
listeners.bridge_relay_tls.tls.certfile   = /etc/bondy/ssl/bridge/keycert.pem
listeners.bridge_relay_tls.tls.keyfile    = /etc/bondy/ssl/bridge/key.pem
listeners.bridge_relay_tls.tls.cacertfile = /etc/bondy/ssl/bridge/cacert.pem
```

Restart the remote router. Its log shows
`description="Started listener" … listener=bridge_relay_tls`.

Variations:

- **Require a client certificate from the edge (mTLS).** Add these two keys,
  and give the edge a certificate signed by the CA in `tls.cacertfile`
  (step 4):

  ```
  listeners.bridge_relay_tls.tls.verify               = verify_peer
  listeners.bridge_relay_tls.tls.fail_if_no_peer_cert = on
  ```

  An edge without a certificate then fails the TLS handshake with
  `certificate_required` and retries.

- **Plain TCP.** Use `transport = tcp` and drop the `tls.*` keys only when the
  edge reaches the remote router over a network you already trust. The
  challenge-response authentication does not send the private key, but
  everything after it, including the realm sync, travels unencrypted.

- **Authentication deadline.** `listeners.$name.auth_timeout` (default `5s`)
  is how long a connected edge has to authenticate before the remote router
  drops the connection.

A `bridge_relay` listener cannot use the `uds` transport and takes no
`services` key.

## 4. Configure the bridge on the edge

Add the bridge to the edge's `bondy.conf`. The name after `bridge.` (here
`core`) is your choice; it is the name you pass to the `bondy.router.bridge.*`
procedures later.

```
bridge.core = on
bridge.core.endpoint  = 203.0.113.10:18093
bridge.core.transport = tls

bridge.core.tls.verify     = verify_peer
bridge.core.tls.cacertfile = /etc/bondy/ssl/bridge/cacert.pem
bridge.core.tls.versions   = 1.3

bridge.core.realm.1.uri    = com.example.factory
bridge.core.realm.1.authid = edge-plant-7
bridge.core.realm.1.cryptosign.pubkey          = <public key from step 1>
bridge.core.realm.1.cryptosign.privkey_env_var = BONDY_EDGE_PRIVKEY

bridge.core.realm.1.topic.1 = com.example.factory.telemetry. prefix out
```

Then start the edge with the private seed from step 1 in the variable named by
`privkey_env_var`:

```bash
BONDY_EDGE_PRIVKEY=<private seed from step 1> bin/bondy foreground
```

How you set that variable depends on how you run Bondy: a systemd
`EnvironmentFile`, a Kubernetes Secret mapped to an environment variable, or
your secrets manager's injector.

The settings that need a decision:

- **Endpoint and certificate.** Bondy resolves the host in
  `bridge.$name.endpoint` to an IP address once, when it loads `bondy.conf`. A
  name that does not resolve stops the node from starting, and a DNS change
  takes effect only after a restart. With `tls.verify = verify_peer` the edge
  then checks the remote router's certificate against that IP address, not the
  host name, so the certificate must list the address as an IP
  `subjectAltName`. A certificate that names only the host fails with
  `hostname_check_failed`, and `bridge.$name.tls.hostname_verification = none`
  does not change that.

- **Client certificate.** If the listener requires one (step 3), add
  `bridge.$name.tls.certfile` and `bridge.$name.tls.keyfile`. The bridge sends
  no client certificate unless both are set.

- **Private key.** `cryptosign.privkey_env_var` must name a variable holding
  the 32-byte Ed25519 seed as 64 hexadecimal characters. A 64-byte value
  (seed and public key together, 128 characters) fails with
  `Couldn't get EDDSA private key`. Of the other signing keys,
  `cryptosign.procedure` is not implemented and the bridge fails with
  `not_implemented`, and `cryptosign.privkey` puts the key in `bondy.conf`,
  which is for testing only.

- **One realm per bridge.** A bridge opens a session for one realm mapping
  only, even when several `realm.$id` entries are configured. To share several
  realms, configure one bridge per realm.

- **Network timeout.** `bridge.$name.network_timeout` defaults to `30s`. The
  bridge decides the network is down when the host has no non-loopback IPv4
  interface; on a host that has none, set it to `infinity`.

- **One node.** Every node that loads this `bondy.conf` starts its own copy of
  the bridge. In a clustered edge, declare the bridge on one node only. See
  [Running a bridge in a cluster](/router/concepts/bridge_relay#running-a-bridge-in-a-cluster).

### What crosses the bridge

| Traffic | Crosses? |
|:---|:---|
| Events published on the edge to a topic matched by a `topic.$tid … out` entry | Yes, to subscribers on the remote router |
| Calls on the remote router to procedures registered on the edge when the bridge connected | Yes |
| Calls to procedures registered on the edge after the bridge connected | No, until the bridge reconnects; restart it with `bondy.router.bridge.stop` and `bondy.router.bridge.start` |
| Events published on the remote router, to subscribers on the edge | No |
| Calls made on the edge to procedures registered on the remote router | No |

The `procedure.$pid` entries are not applied: the bridge proxies every
registration on the realm, whether or not one matches. A `topic.$tid` entry
with direction `in` logs a warning and does nothing.

These keys are accepted but have no effect in this release:

- `bridge.$name.max_frame_size`: the bridge does not limit frame size.
- `bridge.$name.parallelism`: the bridge opens one connection.
- `bridge.forward.ack` and `bridge.forward.retransmission`: no part of Bondy
  reads them.

## 5. Verify the link

The edge logs three lines as the bridge comes up:

```
… description="Starting bridge-relay client" … endpoint={{203,0,113,10},18093} …
… description="Established connection with remote router." id=core …
… description="AAE sync finished" id=core …
```

`AAE sync finished` means the edge authenticated and copied the realm's
security model. A bridge that connects but never logs it did not
authenticate: check the key pair, the user's `authorized_keys`, and the
source on the remote router.

Then ask the edge for its bridges' status, from a session on its master realm
as a member of `bondy.administrators`. With the Wampy command-line client:

```bash
npx wampy call bondy.router.bridge.status \
  --url ws://localhost:18080/ws --realm com.leapsight.bondy \
  --authid admin --secret <admin password>
```

The result maps each bridge name to its status:

```json
{ "core": { "status": "running" } }
```

`bondy.router.bridge.status` is the procedure to use for a bridge declared in
`bondy.conf`. For such a bridge, `bondy.router.bridge.get` and
`bondy.router.bridge.list` fail in this release with
`wamp.error.invalid_argument`.

## 6. Stop or remove the bridge

To stop the bridge without forgetting it, call `bondy.router.bridge.stop` with
its name. The remote router drops the routes it held for the edge's
procedures, and calls to them return `wamp.error.no_such_procedure`.
`bondy.router.bridge.start` with the same name brings it back.

To remove it:

1. Call `bondy.router.bridge.stop` with the name. Removing a running bridge
   fails; in this release the error is `bondy.error.internal_error`.
2. Call `bondy.router.bridge.remove` with the name. It returns an empty result
   on success, and also for a name the edge does not know, so a typo is not
   reported.
3. Delete the bridge's keys from the edge's `bondy.conf`, or set
   `bridge.<name> = off`. Bondy reloads the bridges declared in `bondy.conf`
   every time the node starts, so a bridge removed only at runtime comes back
   on the next restart.

## Result

The edge holds one TLS connection to the remote router, authenticated with its
own key. Events it publishes under the shared topics reach the remote router's
subscribers, and the remote router routes calls to the procedures the edge
serves.

## See also

- [Bridge Relay Configuration Reference](/router/reference/configuration/bridge_relay)
  — every `bridge.*` key.
- [Bridge Relay WAMP API Reference](/router/reference/wamp_api/bridge_relay)
  — the `bondy.router.bridge.*` procedures.
- [Configuring Network Listeners](/router/guides/administration/configuring_listeners)
  — TLS material and mTLS on any listener.
- [Connecting an Edge Node](/router/tutorials/edge/connecting_an_edge_node) —
  the same link on one machine.
