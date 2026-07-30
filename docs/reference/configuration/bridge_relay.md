---
related:
    - text: Bridge Relay
      type: WAMP API Reference
      link: /reference/wamp_api/bridge_relay
      description: Manage bridges at runtime — add, remove, start, stop, and check status.
---
# Bridge Relay Configuration Reference

A bridge relay (Bondy Edge) connects one Bondy node, as a client, to a remote Bondy router, sharing a subset of procedures and topics between the two over a dedicated connection — distinct from [cluster](/reference/configuration/cluster) peer connections, which join nodes into the same cluster. Each bridge is named (`$name`) and configured independently; a node can run several bridges to several remote routers at once.

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

@[config](bridge.$name.network_timeout,duration_time_units,60s,v1.0.0)

Drops the connection once the bridge has been waiting this long for the local network to come back up, checked by counting the host's non-loopback IPv4 interfaces. Set to `infinity` to disable — useful for local development with no real network connection, where this check would otherwise fire spuriously.

@[config](bridge.$name.idle_timeout,duration_time_units,24h,v1.0.0)

Drops the connection after this much inactivity. Set to `infinity` to disable.

@[config](bridge.$name.hibernate,never&#124;idle&#124;always,idle,v1.0.0)

Controls when the bridge connection process hibernates to reclaim memory: `idle` hibernates after a period of inactivity, `always` after every message, `never` disables it.

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

A WAMP procedure, registered locally on the realm by a connected callee, that performs the signing. It's called with two positional arguments — the public key and a base64-encoded challenge — and must return the base64-encoded signature. The callee needs `wamp.register` on this procedure and `bondy.callback.register` on `bondy.auth.crytosign.sign`.

@[config](bridge.$name.realm.$id.cryptosign.exec,string,N/A,v1.0.0)

Alternatively, an external executable that performs the signing, invoked directly (never through a shell) with the public key and challenge as its two arguments, returning the base64-encoded signature on stdout. Because it's executed directly rather than via a shell, there's no argument expansion or `PATH` search to worry about as an injection vector.

@[config](bridge.$name.realm.$id.cryptosign.privkey_env_var,string,N/A,v1.0.0)

Name of an environment variable holding the private key, for the executable (or procedure) to read directly rather than receiving it as an argument.

@[config](bridge.$name.realm.$id.cryptosign.privkey,string,N/A,v1.0.0)

::: warning Testing only
Embeds the private key directly in `bondy.conf`. This exists for local testing only — use `cryptosign.procedure` or `cryptosign.exec` for anything else, so the private key never has to live in a configuration file.
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

## Accepting bridges

The other side of a bridge relay: a listener that accepts inbound connections from edge nodes bridging to this one.

@[config](bridge.listener.tcp,on|off,off,v1.0.0)

Enables the bridge relay listener, letting other nodes bridge to this one.

@[config](bridge.listener.tcp.port,port_number,18092,v1.0.0)

TCP port the listener accepts bridge connections on — the same port a bridging node points its own `bridge.$name.endpoint` at.

@[config](bridge.listener.tcp.ip,ip_address,N/A,v1.0.0)

The interface to listen on, when the host has more than one.

@[config](bridge.listener.tcp.ip_version,4&#124;6,4,v1.0.0)

IP version for the listener.

@[config](bridge.listener.tcp.acceptors_pool_size,integer,200,v1.0.0)

Number of acceptor processes for the listener.

@[config](bridge.listener.tcp.max_connections,integer,100000,v1.0.0)

Maximum number of simultaneous bridge connections this listener accepts.

@[config](bridge.listener.tcp.backlog,integer,1024,v1.0.0)

Maximum length of the pending-connections queue.

## See also

- [Bridge Relay WAMP API Reference](/reference/wamp_api/bridge_relay) — add, remove, start, stop, and check the status of a bridge at runtime.
- [Cluster Configuration Reference](/reference/configuration/cluster) — the separate peer-plane connections that join nodes into one cluster.
