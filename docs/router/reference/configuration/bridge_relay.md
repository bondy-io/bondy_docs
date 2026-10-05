---
related:
    - text: Bridge Relay
      type: WAMP API Reference
      link: /router/reference/wamp_api/bridge_relay
      description: Manage bridges at runtime — add, remove, start, stop, and check status.
---
# Bridge Relay Configuration Reference

A bridge relay (Bondy Edge) connects one Bondy node, as a client, to a remote Bondy router, sharing a subset of procedures and topics between the two over a dedicated connection — distinct from [cluster](/router/reference/configuration/cluster) peer connections, which join nodes into the same cluster. Each bridge is named (`$name`) and configured independently; a node can run several bridges to several remote routers at once.

## Enabling a bridge

@[config](bridge.$name,on|off,off,v1.0.0)

Enables or disables the named bridge.

@[config](bridge.$name.endpoint,string,'127.0.0.1:18092',v1.0.0)

The `host:port` of the remote Bondy router's bridge relay listener (see [Accepting bridges](#accepting-bridges) below for the listener side).

@[config](bridge.$name.transport,tcp&#124;tls,tcp,v1.0.0)

The transport for the connection to the remote router.

## TLS

@[config](bridge.$name.tls.certfile,path,'{{platform_etc_dir}}/client/keycert.pem',v1.0.0)

Client certificate for the bridge connection, when `bridge.$name.transport = tls`.

@[config](bridge.$name.tls.keyfile,path,'{{platform_etc_dir}}/client/key.pem',v1.0.0)

Client private key for the bridge connection.

@[config](bridge.$name.tls.cacertfile,path,'{{platform_etc_dir}}/client/cacert.pem',v1.0.0)

CA certificate used to verify the remote router, when `bridge.$name.tls.verify = verify_peer`.

@[config](bridge.$name.tls.verify,verify_peer&#124;verify_none,verify_none,v1.0.0)

Whether the bridge verifies the remote router's certificate against `bridge.$name.tls.cacertfile`.

@[config](bridge.$name.tls.hostname_verification,wildcard&#124;none,wildcard,v1.0.0)

Whether hostname verification accepts a wildcard certificate matching `bridge.$name.endpoint`'s host.

@[config](bridge.$name.tls.versions,string,1.3,v1.0.0)

Comma-separated TLS protocol version(s) — currently `1.2` and/or `1.3`.

## Connection behaviour

@[config](bridge.$name.parallelism,integer,1,v1.0.0)

Number of TCP connections to open to the remote router for this bridge.

@[config](bridge.$name.connect_timeout,duration_time_units,5s,v1.0.0)

How long to wait for the initial connection to the remote router before giving up.

@[config](bridge.$name.network_timeout,duration_time_units,30s,v1.0.0)

Drops the connection once the bridge has been waiting this long for the local network to come back up, checked by counting the host's non-loopback IPv4 interfaces. Set to `infinity` to disable — useful for local development with no real network connection, where this check would otherwise fire spuriously.

@[config](bridge.$name.idle_timeout,duration_time_units,24h,v1.0.0)

Drops the connection after this much inactivity. Set to `infinity` to disable.

@[config](bridge.$name.hibernate,never&#124;idle&#124;always,idle,v1.0.0)

Controls when the bridge connection process hibernates to reclaim memory: `idle` hibernates after a period of inactivity, `always` after every message, `never` disables it.

@[config](bridge.$name.max_frame_size,integer&#124;infinity,4194304,v1.0.0)

The largest frame, in bytes, the bridge is meant to accept. The value must be a positive integer or `infinity`. The default, 4194304 (4 MiB), matches the frame limits of Bondy's other carriers.

`0` is rejected. Use `infinity` for no limit.

::: warning Not enforced in this release
Bondy validates and stores this value, but the bridge connection does not apply it. The connection reads length-prefixed frames with no size limit taken from this key.
:::

## Keepalive

@[config](bridge.$name.ping,on|off,on,v1.0.0)

Whether the edge probes a silent connection with PING control messages. This affects client (edge) initiated pings only; the remote router's pings are always answered regardless.

@[config](bridge.$name.ping.idle_timeout,duration_time_units,20s,v1.0.0)

How long the connection may be silent before the edge probes it. This is not the same as `bridge.$name.idle_timeout`, which is the reap deadline.

@[config](bridge.$name.ping.timeout,duration_time_units,10s,v1.0.0)

How long a probe waits for its answer before counting as a failed attempt.

@[config](bridge.$name.ping.max_attempts,integer,3,v1.0.0)

How many unanswered probes mean a dead connection — after this many the edge drops it (and reconnects, when reconnection is on).

## Reconnection

@[config](bridge.$name.reconnect,on|off,on,v1.0.0)

Whether the bridge automatically retries the connection after it fails — either an unrecognised error, or a remote abort with a recoverable reason (e.g. the target realm doesn't exist yet, because it hasn't been provisioned on the remote router).

@[config](bridge.$name.reconnect.max_retries,integer,100,v1.0.0)

Maximum number of reconnection attempts before the bridge gives up.

@[config](bridge.$name.reconnect.backoff.type,jitter&#124;normal,jitter,v1.0.0)

Backoff strategy between reconnection attempts: `jitter` randomises the delay to avoid many bridges reconnecting in lockstep, `normal` doesn't.

@[config](bridge.$name.reconnect.backoff.min,duration_time_units,5s,v1.0.0)

Initial (and minimum) delay between reconnection attempts.

@[config](bridge.$name.reconnect.backoff.max,duration_time_units,60s,v1.0.0)

Maximum delay between reconnection attempts, once backoff has grown.

## Realm mapping

Each bridge shares one or more realms with the remote router; `$id` names one such mapping within the bridge.

@[config](bridge.$name.realm.$id.uri,string,N/A,v1.0.0)

The realm URI, matching on both this node and the remote router.

@[config](bridge.$name.realm.$id.authid,string,N/A,v1.0.0)

The identity the bridge authenticates as on the remote router for this realm, using `cryptosign` — see below for where the signing itself happens.

### Delegated signing

The bridge never holds the realm's private key directly (except for local testing — see the warning below). Instead, signing a `cryptosign` challenge is delegated to one of:

@[config](bridge.$name.realm.$id.cryptosign.pubkey,string,N/A,v1.0.0)

The public key the remote router verifies the challenge signature against.

@[config](bridge.$name.realm.$id.cryptosign.procedure,string,N/A,v1.0.0)

Not implemented. A bridge configured with this key fails to start. Use `cryptosign.exec` or `cryptosign.privkey_env_var`.

@[config](bridge.$name.realm.$id.cryptosign.exec,string,N/A,v1.0.0)

An external executable that performs the signing. Bondy runs it directly, never through a shell, with two arguments: the public key and the raw challenge bytes. It sends the program's standard output, unchanged, as the signature, and the remote router decodes that signature as hexadecimal, so the program must print the hex-encoded Ed25519 signature and nothing else. The program must answer within 10 seconds. Bondy also runs it once when the bridge starts, to check that it works.

@[config](bridge.$name.realm.$id.cryptosign.privkey_env_var,string,N/A,v1.0.0)

Name of an environment variable holding the hex-encoded Ed25519 private key (the 32-byte seed). Bondy reads the variable when the bridge starts and signs with that key; the bridge fails to start if the variable is unset.

@[config](bridge.$name.realm.$id.cryptosign.privkey,string,N/A,v1.0.0)

::: warning Testing only
Embeds the hex-encoded private key directly in `bondy.conf`. This exists for local testing only — use `cryptosign.privkey_env_var` or `cryptosign.exec` for anything else, so the private key never has to live in a configuration file.
:::

### Sharing procedures and topics

@[config](bridge.$name.realm.$id.procedure.$pid,string,N/A,v1.0.0)

The value is a match spec: `<uri> <match-type> <direction>`, where `<match-type>` is `exact`, `prefix`, or `wildcard`, and `<direction>` is `in`, `out` (the default), or `both`.

::: warning Accepted but not yet enforced
This key is validated but the running bridge does not currently filter procedure sharing by it: every local registration on the realm is proxied to the remote unconditionally, regardless of what (or whether) anything is configured here. Treat it as reserved for a future release rather than as an access control — do not rely on it to keep a procedure off the remote router.
:::

@[config](bridge.$name.realm.$id.topic.$tid,string,N/A,v1.0.0)

Shares a topic URI pattern between the two routers for this realm, using the same match-spec syntax as above. `out` subscribes locally and forwards matching events to the remote router, so remote subscribers can receive them; `in` would do the reverse (subscribing on the remote so local subscribers receive its events).

::: warning direction: in is not yet implemented
Only `out` currently does anything — `in` (and the `in` half of `both`) is accepted by the schema but logs a warning and has no effect; the edge does not yet subscribe on the remote router's side.
:::

## Forwarding guarantees

These two keys apply to every bridge on the node. They mirror the cluster's [`router.forward.*`](/router/reference/configuration/cluster#cross-node-forwarding) keys.

@[config](bridge.forward.ack,on|off,off,v1.0.0)

Meant to request acknowledged delivery for messages forwarded over bridges. Bondy accepts and stores this value, but no part of Bondy reads it in this release, so it has no effect.

@[config](bridge.forward.retransmission,on|off,off,v1.0.0)

Meant to control retransmission of unacknowledged bridge messages. Accepted and stored, not read: it has no effect in this release.

## Accepting bridges

The other side of a bridge relay — the socket that accepts inbound
connections from edge nodes bridging to this one — is an ordinary
[listener](/router/reference/configuration/listeners) whose `protocol` is
`bridge_relay`:

```
listeners.bridge.transport = tcp
listeners.bridge.protocol  = bridge_relay
listeners.bridge.port      = 18092
```

The port is the one a bridging node points its own `bridge.$name.endpoint`
at. All the listener-level settings apply — bind address, acceptor pool,
connection limits, `ping.*`, TLS material for a `tls` transport — plus one
key only this protocol reads:
[`listeners.$name.auth_timeout`](/router/reference/configuration/listeners#listeners.$name.auth_timeout),
how long a connected peer router has to authenticate before the connection
is dropped (5s if unset). A bridge-relay listener is not available over
`uds`, and declaring `services` on one is an error — it serves one
protocol by definition.

@[configDeprecated](bridge.listener.tcp.*,listeners.bridge_relay_tcp.*,v1.0.0)

@[configDeprecated](bridge.listener.tls.*,listeners.bridge_relay_tls.*,v1.0.0)

The removed `bridge.listener.{tcp,tls}.*` keys are no longer read; a file
still setting them starts **no** bridge-relay listener at all. See
[Migrating from the pre-1.0 keys](/router/reference/configuration/listeners#migrating-from-the-pre-1-0-keys).

## See also

- [Bridge Relay WAMP API Reference](/router/reference/wamp_api/bridge_relay) — add, remove, start, stop, and check the status of a bridge at runtime.
- [Cluster Configuration Reference](/router/reference/configuration/cluster) — the separate peer-plane connections that join nodes into one cluster.
