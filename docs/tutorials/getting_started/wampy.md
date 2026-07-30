---
outline: [2,3]
related:
    - text: WAMP Client Libraries
      type: Reference
      link: /reference/wamp_clients/index
      description: The full list of client libraries for other languages, and where Wampy fits among them.
    - text: Connections and Sessions
      type: Concepts
      link: /concepts/wamp/sessions
      description: What a WAMP session is and how it relates to transports, realms, and authentication.
    - text: Routed Remote Procedure Calls (RPC)
      type: Concepts
      link: /concepts/wamp/rpc
      description: The Caller/Callee request-response pattern that registration and calling implement.
    - text: Publish/Subscribe
      type: Concepts
      link: /concepts/wamp/pubsub
      description: The Publisher/Subscriber event pattern that publishing and subscribing implement.
---

# Getting Started with Wampy

[Wampy](https://github.com/KSDaemon/wampy.js) is a community-maintained WAMP client for JavaScript that runs in both the browser and Node.js. By the end of this tutorial you will have a small Node.js program that connects to a Bondy router, serves a procedure and calls it, and publishes and receives an event, using nothing but the public Wampy API.

::: tip Community client
Wampy isn't maintained by the Bondy team. It's one of several JavaScript WAMP clients — see [WAMP Client Libraries](/reference/wamp_clients/index) for the full list. Everything below is standard WAMP, so the same steps apply, in shape, to any of them.
:::

## Before you start

You need:

- **Node.js (a recent LTS release)** and **npm**.
- **A running Bondy node** reachable over WebSocket on `127.0.0.1:18080` (Bondy's default `wamp_ws` listener). If you don't have one yet, follow [Get Bondy](/tutorials/getting_started/get_bondy) first.
- **A realm your client can attach to.** This tutorial uses anonymous authentication against a realm named `com.example.realm`. The realm must permit the `anonymous` user and grant `wamp.call`, `wamp.register`, `wamp.subscribe` and `wamp.publish`. See [Realms](/concepts/realms) and the [Realm reference](/reference/wamp_api/realm) if you need to create one.

Everything below is plain JavaScript, typed into a `node` shell one block at a time — copy each block in order and it will work as shown. Node's REPL supports top-level `await`, so there's no wrapping `async` function to write.

## Step 1 — Install Wampy

```bash
mkdir bondy-wampy-quickstart && cd bondy-wampy-quickstart
npm init -y
npm install wampy ws
```

Wampy needs a WebSocket implementation handed to it explicitly when it runs outside a browser — that's what `ws` is for.

## Step 2 — Connect to Bondy

Start a Node shell in the same directory:

```bash
node
```

The `Wampy` constructor takes a URL and an **options** object describing the realm and, for Node.js, which WebSocket module to use:

```javascript
const { Wampy } = require('wampy');
const WebSocket = require('ws');

const wampy = new Wampy('ws://127.0.0.1:18080/ws', {
    realm: 'com.example.realm',
    ws: WebSocket
});

await wampy.connect();
```

> **You should see:** the awaited promise resolves with the session's WELCOME details (roles, features, and — if you authenticated with more than anonymous — your `authid`/`authrole`). Confirm the session is up with `wampy.getSessionId()`, which returns a positive integer once connected and `null` before. Wampy connects anonymously by default — you only pass `authid`/`authmethods` when a realm requires real credentials, which is why this call needed nothing beyond the realm name.

Keep this shell open — `wampy` is reused in every step that follows. Whenever you're done, close it with:

```javascript
await wampy.disconnect();
```

## Step 3 — Serve a procedure and call it

A **Callee** serves a procedure by registering a URI with a **handler**: a function that receives a single object argument — `argsList`, `argsDict`, and `details` — and returns the reply. Register an echo procedure:

```javascript
await wampy.register('com.example.echo', (data) => {
    return { argsList: data.argsList, argsDict: data.argsDict };
});
```

> **You should see:** the promise resolves to `{ topic: 'com.example.echo', requestId: ..., registrationId: ... }`. The handler now runs every time anyone on this realm calls `com.example.echo`, including this same connection.

Now call it, as a **Caller**, from the same connection. A call's payload is a single object: `argsList` for positional arguments, `argsDict` for keyword arguments — both together if you need both:

```javascript
const result = await wampy.call('com.example.echo', {
    argsList: ['hello'],
    argsDict: { lang: 'en' }
});
```

> **You should see:** `result.argsList` is `['hello']` and `result.argsDict` is `{ lang: 'en' }` — exactly what the handler returned. `call()` resolves once the reply arrives (or rejects if the call times out) and hands you back exactly what the callee returned.

A call to a URI nobody has registered fails cleanly rather than hanging:

```javascript
try {
    await wampy.call('com.example.does_not_exist');
} catch (error) {
    error.errorUri; // 'wamp.error.no_such_procedure'
}
```

> **You should see:** the `catch` block runs, and `error.errorUri` is `'wamp.error.no_such_procedure'`. Every rejected call carries a `CallError` with `errorUri`, `details`, `argsList` and `argsDict` — the same shape as a successful result, but for the error case.

## Step 4 — Publish and subscribe

A **Subscriber** registers a handler against a topic; a **Publisher** sends events to that topic. Both roles work the same way whether they're the same connection or two different ones — here, again, one connection plays both.

Subscribe first, so there's a listener in place before anything is published:

```javascript
await wampy.subscribe('com.example.ticks', (event) => {
    console.log('tick:', event.argsList);
});
```

Now publish an event to that topic:

```javascript
await wampy.publish('com.example.ticks', { argsList: ['tock'] });
```

> **You should see:** `publish()` resolves to `{ topic: 'com.example.ticks', requestId: ..., publicationId: ... }`, and — asynchronously, as the event comes back through the router — the subscriber's handler logs `tick: [ 'tock' ]`. Publishing is fire-and-forget by default: the promise resolves once the event is on the wire, without waiting for any subscriber to receive it.

## What you built

In one connection you exercised all four WAMP roles: **Callee** and **Caller** by serving and calling `com.example.echo`, and **Publisher** and **Subscriber** by publishing and receiving `com.example.ticks`. Along the way you saw the shape every Wampy call shares: a payload (or reply) is `{ argsList, argsDict }`, and a rejected call carries that same shape on a `CallError`.

## Next steps

- Read [Routed RPC](/concepts/wamp/rpc) and [Publish/Subscribe](/concepts/wamp/pubsub) for the protocol-level mechanics behind what you just did — pattern-based registrations and subscriptions, call cancellation, retained events, and more.
- If your client needs to authenticate with real credentials rather than anonymously, see the [Security](/concepts/wamp/security) concept page and Wampy's own `authid`/`authmethods`/`onChallenge` options in its [README](https://github.com/KSDaemon/wampy.js).
- For a complete worked application built the same way — RPC and Pub/Sub wiring a web app to backend services — see the [Marketplace](/tutorials/getting_started/marketplace) tutorial.
