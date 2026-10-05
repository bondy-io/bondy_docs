---
outline: [2,3]
related:
    - text: Bondy Edge (Bridge Relay)
      type: Concept
      link: /router/concepts/bridge_relay
      description: What a bridge relay is, and why it is not a cluster connection.
    - text: Linking an Edge Node to a Remote Router
      type: How-to Guide
      link: /router/guides/deployment/linking_an_edge_node
      description: The same link in production, with your own keys, TLS material and realm.
    - text: Bridge Relay Configuration Reference
      type: Configuration Reference
      link: /router/reference/configuration/bridge_relay
      description: Every bridge.* key, with defaults.
    - text: Bridge Relay WAMP API Reference
      type: WAMP API Reference
      link: /router/reference/wamp_api/bridge_relay
      description: The bondy.router.bridge.* procedures used in this tutorial.
---

# Connecting an Edge Node

In this tutorial you run two Bondy nodes on your own machine: a **core** node,
and an **edge** node that connects to it through a bridge relay. When you are
done, an event published on the edge reaches a subscriber on the core, and a
call made on the core runs a procedure that lives only on the edge.

Both nodes come from development targets in the Bondy source repository, so
everything runs locally. It takes about twenty minutes, most of it spent
building the two releases.

## Before you start

You need:

- **The Bondy source repository**, cloned from
  [github.com/bondy-io/bondy](https://github.com/bondy-io/bondy), with the
  build requirements listed in its README under *Building from source*:
  Erlang/OTP, Rebar3, `just`, and the native libraries.
- **Node.js and npm**, for the command-line WAMP client.
- **Four terminal windows.** Each step says which one to use.

Run every command in this tutorial from the root of the repository unless the
step says otherwise.

## 1. Start the core node

In the first terminal, set the environment variables that the core node's
configuration template expects, then build and start the node:

```bash
export OIDC_PROVIDER_ID=none \
       OIDC_PROVIDER_URL=http://localhost:9999 \
       OIDC_CLIENT_ID=none \
       OIDC_CLIENT_SECRET=none \
       OIDC_REDIRECT_URI=http://localhost:9999/callback \
       OIDC_COOKIE_DOMAIN=localhost
just node1
```

The core node's configuration also sets up single sign-on, which this
tutorial does not use. These placeholder values are enough for the node to
start.

The first build takes several minutes. When it finishes, the node starts in a
console and prints its log. Among the lines, you should see the listener that
accepts bridges:

```
… level=notice … description="Started listener" … listener=bridge_relay_tls …
```

This is a `bridge_relay` listener on port `18093`. It is the socket the edge
node will dial.

Leave this terminal running.

The core node loads the realm `com.leapsight.test` from the repository's
example security configuration. Three users in that realm matter here:

| User | Credential | Role in this tutorial |
|:---|:---|:---|
| `device1` | an Ed25519 public key | The identity the edge uses to connect |
| `peer1` | password `changethispassword` | Your client on the edge |
| `peer2` | password `changethispassword` | Your client on the core |

## 2. Configure the edge node

Open `config/test/edge_1_bondy.conf.template`. Near the end of the file is the
bridge the edge node starts at boot:

```
bridge.edge = on
bridge.edge.endpoint = 127.0.0.1:18093
bridge.edge.transport = tls
...
bridge.edge.realm.1.uri = com.leapsight.test
bridge.edge.realm.1.authid = device1
bridge.edge.realm.1.cryptosign.pubkey = 1766c9e6ec7d7b354fd7a2e4542753a23cae0b901228305621e5b8713299ccdd
bridge.edge.realm.1.cryptosign.privkey_env_var = EDGE1_DEVICE1_PRIVKEY
```

Read it this way: a bridge named `edge` dials the core's listener over TLS,
joins the realm `com.leapsight.test` as the user `device1`, and signs the
authentication challenge with the private key it reads from the environment
variable `EDGE1_DEVICE1_PRIVKEY`.

Make two changes to the file.

First, find this commented line:

```
# bridge.edge.realm.1.topic.1 = com.example. prefix out
```

Remove the leading `# ` so the line reads:

```
bridge.edge.realm.1.topic.1 = com.example. prefix out
```

This tells the bridge to forward events published on the edge, to any topic
that starts with `com.example.`, out to the core.

Second, add this line at the end of the file:

```
security.admin_user.password = edge-admin-secret
```

This sets the password of the edge node's `admin` user, which you will use to
manage the bridge. Bondy applies it when the node first creates its data, so
if you have run the `edge1` target before, delete `_build/edge1/rel/bondy/data`
now.

Save the file.

## 3. Start the edge node

In the second terminal, build the edge release:

```bash
env -u CFLAGS -u CXXFLAGS -u CPPFLAGS -u LDFLAGS -u LDLIBS \
  CMAKE_POLICY_VERSION_MINIMUM=3.5 \
  rebar3 as edge1 release
```

Then start it, giving it the private key that matches `device1`'s public key:

```bash
EDGE1_DEVICE1_PRIVKEY=4ffddd896a530ce5ee8c86b83b0d31835490a97a9cd718cb2f09c9fd31c4a7d7 \
ERL_DIST_PORT=27784 \
_build/edge1/rel/bondy/bin/bondy console
```

The key is the 32-byte Ed25519 seed, written as 64 hexadecimal characters.

Within a few seconds of starting, the edge node logs three lines from the
bridge:

```
… description="Starting bridge-relay client" … endpoint={{127,0,0,1},18093} … transport=tls
… description="Established connection with remote router." id=edge …
… description="AAE sync finished" id=edge …
```

The first line is the bridge starting. The second is the TLS connection to
the core. The third means the edge authenticated as `device1` and copied the
realm's users, groups and grants from the core. That copy is why `peer1` can
log in to the edge in the next steps, although you never created it there.

Leave this terminal running.

## 4. Install the WAMP client

In the third terminal, create a working directory outside the repository and
install [Wampy](https://github.com/KSDaemon/wampy.js), which includes a
command-line client:

```bash
mkdir ~/bondy-edge-tutorial && cd ~/bondy-edge-tutorial
npm init -y
npm install wampy
```

Then ask the edge node for the status of its bridges. This call goes to the
edge's administrative realm, `com.leapsight.bondy`, as the `admin` user:

```bash
npx wampy call bondy.router.bridge.status \
  --url ws://localhost:19080/ws --realm com.leapsight.bondy \
  --authid admin --secret edge-admin-secret
```

You should see:

```
Connected to router at ws://localhost:19080/ws
Received call results:
{
  "details": {},
  "argsList": [
    {
      "edge": {
        "status": "running"
      }
    }
  ]
}
```

The core listens for WAMP clients on port `18080`, and the edge on port
`19080`. Every command from here on uses one or the other, and that port is
how you tell which node you are talking to.

## 5. Send an event from the edge to the core

In the third terminal, subscribe on the **core** as `peer2`:

```bash
npx wampy subscribe com.example.temperature \
  --url ws://localhost:18080/ws --realm com.leapsight.test \
  --authid peer2 --secret changethispassword
```

You should see the subscription confirmed:

```
Connected to router at ws://localhost:18080/ws
Successfully subscribed to topic:
 {
  "topic": "com.example.temperature",
  ...
}
```

Leave it running. In the fourth terminal, go to the same working directory and
publish on the **edge** as `peer1`:

```bash
cd ~/bondy-edge-tutorial
npx wampy publish com.example.temperature --args 21.5 \
  --url ws://localhost:19080/ws --realm com.leapsight.test \
  --authid peer1 --secret changethispassword
```

The publisher reports `Successfully published to topic`. Back in the third
terminal, the subscriber on the core prints the event:

```
Received topic event:
 {
  "details": {
    "topic": "com.example.temperature"
  },
  "argsList": [
    21.5
  ]
}
```

The event crossed the bridge. The bridge subscribed on the edge to
`com.example.` when it connected, because of the line you uncommented in
step 2, and it sent each matching event to the core, which delivered it to its
own subscribers.

Stop the subscriber with <kbd>Ctrl</kbd>+<kbd>C</kbd>.

## 6. Call a procedure on the edge from the core

In the third terminal, register a procedure on the **edge** as `peer1`. The
`--mirror` option makes it return whatever arguments it receives:

```bash
npx wampy register com.example.echo --mirror \
  --url ws://localhost:19080/ws --realm com.leapsight.test \
  --authid peer1 --secret changethispassword
```

You should see:

```
Connected to router at ws://localhost:19080/ws
Successfully registered procedure:
 {
  "topic": "com.example.echo",
  ...
}
```

Leave it running.

The bridge tells the core about the registrations it finds on the edge when
it connects. Your procedure did not exist when the bridge connected in
step 3, so in the fourth terminal, restart the bridge:

```bash
npx wampy call bondy.router.bridge.stop --args edge \
  --url ws://localhost:19080/ws --realm com.leapsight.bondy \
  --authid admin --secret edge-admin-secret

npx wampy call bondy.router.bridge.start --args edge \
  --url ws://localhost:19080/ws --realm com.leapsight.bondy \
  --authid admin --secret edge-admin-secret
```

Each call answers with an empty result, `{ "details": {} }`. In the edge
node's console you see the bridge connect again, ending with
`AAE sync finished`.

Now call the procedure on the **core** as `peer2`:

```bash
npx wampy call com.example.echo --args hello --args 42 \
  --url ws://localhost:18080/ws --realm com.leapsight.test \
  --authid peer2 --secret changethispassword
```

You should see the arguments come back:

```
Received call results:
{
  "details": {},
  "argsList": [
    "hello",
    42
  ]
}
```

In the third terminal, the callee on the edge prints the invocation it
served:

```
Received call invocation:
 {
  "details": {
    "caller_authid": "peer2",
    "procedure": "com.example.echo",
    ...
  },
  "argsList": [
    "hello",
    42
  ]
}
```

The core has no callee for `com.example.echo` of its own. It routed the call
over the bridge to the edge, and the edge invoked `peer1`'s procedure.

## 7. Stop the bridge

In the fourth terminal, stop the bridge:

```bash
npx wampy call bondy.router.bridge.stop --args edge \
  --url ws://localhost:19080/ws --realm com.leapsight.bondy \
  --authid admin --secret edge-admin-secret
```

Call the procedure on the core again, with the same command as in step 6 plus
`--verbose`:

```bash
npx wampy call com.example.echo --args hello --args 42 --verbose \
  --url ws://localhost:18080/ws --realm com.leapsight.test \
  --authid peer2 --secret changethispassword
```

This time the core answers with an error. Among the details, you should see:

```
      uri: 'wamp.error.no_such_procedure'
Call error:CallError: Wamp error
```

With the bridge stopped, the core no longer knows a route to the edge's
procedure. Ask the edge for the bridge status again, with the command from
step 4, and it reports `"status": "stopped"`.

To finish, stop the callee with <kbd>Ctrl</kbd>+<kbd>C</kbd>. Then stop each
node: type `q().` in its console and press <kbd>Enter</kbd>.

## What you built

You ran a core node with a `bridge_relay` listener and an edge node that
dialled it as a client, authenticating with an Ed25519 key. You watched the
edge copy the realm's users, groups and grants from the core. You then sent an
event from the edge to a subscriber on the core, served a call from the core
with a procedure registered only on the edge, and managed the bridge from the
edge with the `bondy.router.bridge.*` procedures.

## Next steps

- [Bondy Edge (Bridge Relay)](/router/concepts/bridge_relay) explains why a
  bridge is a separate mechanism from clustering, and what the realm sync
  copies.
- [Linking an Edge Node to a Remote Router](/router/guides/deployment/linking_an_edge_node)
  sets up the same link in production, with your own key pair, TLS
  certificates and realm.
- The [Bridge Relay Configuration Reference](/router/reference/configuration/bridge_relay)
  lists every `bridge.*` key used in step 2.
