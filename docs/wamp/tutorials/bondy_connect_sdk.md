---
outline: [2,3]
related:
    - text: Bondy Connect SDK
      type: Reference
      link: /wamp/reference/clients/bondy_connect_sdk
      description: The complete, task-grouped API reference for bondy_connect — every function, option, and error shape.
    - text: Connections and Sessions
      type: Concepts
      link: /wamp/concepts/sessions
      description: What a WAMP session is and how it relates to transports, realms, and authentication.
    - text: Routed Remote Procedure Calls (RPC)
      type: Concepts
      link: /wamp/concepts/rpc
      description: The Caller/Callee request-response pattern that registration and calling implement.
    - text: Publish/Subscribe
      type: Concepts
      link: /wamp/concepts/pubsub
      description: The Publisher/Subscriber event pattern that publishing and subscribing implement.
---

# Getting Started with Bondy Connect SDK

Bondy Connect SDK (`bondy_connect`) is Bondy's own WAMP client for the BEAM — the same client Bondy itself would use if it were talking to another Bondy. By the end of this tutorial you will have a small Erlang program that connects to a Bondy router, serves a procedure and calls it, and publishes and receives an event, using nothing but the public `bondy_connect` API.

`bondy_connect` has no dependency on the `bondy` router application, so everything here runs against any Bondy node from an ordinary Erlang shell — you do not need to be inside Bondy's own release to follow along.

## Before you start

You need:

- **Erlang/OTP 28 or later** and **rebar3**.
- **A running Bondy node** reachable over raw TCP on `127.0.0.1:18082` (Bondy's default `wamp_tcp` listener). If you don't have one yet, follow [Get Bondy](/router/tutorials/getting_started/get_bondy) first.
- **A realm your client can attach to.** This tutorial uses anonymous authentication against a realm named `com.example.realm`. The realm must permit the `anonymous` user and grant `wamp.call`, `wamp.register`, `wamp.subscribe` and `wamp.publish`. See [Realms](/router/concepts/realms) and the [Realm reference](/router/reference/wamp_api/realm) if you need to create one.

Everything below is plain Erlang, typed into a `rebar3 shell` (or a project's own shell) one block at a time — copy each block in order and it will work as shown.

## Step 1 — Add the dependency

`bondy_connect` ships inside the Bondy umbrella repository. Depend on it with `git_subdir` in `rebar.config`:

```erlang
{deps, [
    {bondy_connect,
        {git_subdir, "https://github.com/bondy-io/bondy.git",
            {branch, "master"}, "apps/bondy_connect"}}
]}.
```

It is an ordinary OTP application, so start it (and the applications it depends on) before opening a connection:

```erlang
{ok, _} = application:ensure_all_started(bondy_connect).
```

## Step 2 — Connect to Bondy

`connect/1` takes a **spec** map describing the transport, the realm, and how to authenticate. It blocks until the WAMP session is established (handshake and authentication) and hands back an opaque connection handle.

```erlang
{ok, Conn} = bondy_connect:connect(#{
    transport => tcp,
    endpoint  => {"127.0.0.1", 18082},
    realm     => <<"com.example.realm">>,
    auth      => #{method => <<"anonymous">>}
}).
```

> **You should see:** `{ok, {bondy_connect, <0.xxx.0>}}`. Treat `Conn` as a token — pass it back to every other `bondy_connect` call, but never pattern-match on or otherwise depend on its internal shape. It stays valid across reconnects; you don't get a new handle when the underlying link drops and re-establishes. For now, anonymous authentication is enough — the full set of authentication methods is in the [reference](/wamp/reference/clients/bondy_connect_sdk#authenticating).

Confirm the session is up:

```erlang
established = bondy_connect:status(Conn).
```

Keep this shell open — `Conn` is reused in every step that follows. Whenever you're done, close it with:

```erlang
ok = bondy_connect:disconnect(Conn).
```

## Step 3 — Serve a procedure and call it

A **Callee** serves a procedure by registering a URI with a **handler**: a fun of arity 3 that receives the call's positional arguments, keyword arguments, and a details map, and returns a reply. Register an echo procedure:

```erlang
Echo = fun(Args, KWArgs, _Details) ->
    {reply, Args, KWArgs}
end,
{ok, _RegId} = bondy_connect:register(Conn, <<"com.example.echo">>, Echo).
```

> **You should see:** `{ok, RegistrationId}`, where `RegistrationId` is a positive integer assigned by the router. The handler now runs — in its own isolated worker process — every time anyone on this realm calls `com.example.echo`, including this same connection.

Now call it, as a **Caller**, from the same connection:

```erlang
{ok, Result} = bondy_connect:call(
    Conn, <<"com.example.echo">>, [<<"hello">>], #{lang => <<"en">>}
),
[<<"hello">>] = maps:get(args, Result),
#{lang := <<"en">>} = maps:get(kwargs, Result).
```

> **You should see:** both pattern matches succeed silently — `Result` is `#{args := [<<"hello">>], kwargs := #{lang := <<"en">>}, details := #{...}}`. `call/2,3,4,5` blocks until the reply arrives (or the call times out) and hands you back exactly what the callee returned.

A call to a URI nobody has registered fails cleanly rather than hanging:

```erlang
{error, #{uri := <<"wamp.error.no_such_procedure">>}} =
    bondy_connect:call(Conn, <<"com.example.does_not_exist">>, []).
```

We define the handler as a plain fun here for the shortest possible example; the [reference](/wamp/reference/clients/bondy_connect_sdk#handlers) covers the other two handler shapes (`{Module, Function}` and `{Module, Function, Extra}`), which are what you'll reach for once a handler needs to be a named, testable function.

## Step 4 — Publish and subscribe

A **Subscriber** registers a handler against a topic; a **Publisher** sends events to that topic. Both roles work the same way whether they're the same connection or two different ones — here, again, one connection plays both.

Subscribe first, so there's a listener in place before anything is published:

```erlang
Self = self(),
OnTick = fun(Args, _KWArgs, _Details) ->
    Self ! {tick, Args}
end,
{ok, _SubId} = bondy_connect:subscribe(Conn, <<"com.example.ticks">>, OnTick).
```

Now publish an event to that topic:

```erlang
ok = bondy_connect:publish(Conn, <<"com.example.ticks">>, [<<"tock">>]).
```

`publish/3` is fire-and-forget by default — it returns as soon as the event is on the wire, without waiting for the router. The subscriber's handler runs in its own worker process and forwards the event to your shell process as an ordinary message:

```erlang
receive
    {tick, Args} -> Args
after 5000 ->
    error(timeout)
end.
```

> **You should see:** `[<<"tock">>]`. If you need to know the event actually reached the router before moving on, publish with `#{acknowledge => true}` instead — the [reference](/wamp/reference/clients/bondy_connect_sdk#publishing-events) covers the acknowledged form and the rest of the publish options (excluding or targeting specific recipients, retained events).

## What you built

In one connection you exercised all four WAMP roles: **Callee** and **Caller** by serving and calling `com.example.echo`, and **Publisher** and **Subscriber** by publishing and receiving `com.example.ticks`. Along the way you saw the two contracts that hold for every role: a handler runs isolated from your calling code, and a plain, well-typed reply or error comes back through the API rather than a raw WAMP message.

You didn't have to write any of it defensively against the network: `bondy_connect` reconnects automatically after a dropped link and replays your registration and subscription, so `com.example.echo` and `com.example.ticks` come back to life on their own. That resilience, along with TLS, the Unix-domain-socket and in-VM transports, and load regulation for callees, is covered in the reference rather than here, since none of it changes how you call the API — only how you configure it.

## Going further: a first look at progressive calls

Every call so far has been all-or-nothing: the caller waits, and one message comes back. Bondy's dealer can also stream a result back in pieces as the callee produces them — **progressive call results** — which is worth a first look before you move on, because it changes the shape of the callee's handler and the caller's reply.

::: warning Requires a dealer feature flag
Progressive call results are off by default on the router. Before running this section, set [`wamp.dealer.progressive_call_results = on`](/router/reference/configuration/wamp#dealer) on the Bondy node you're connected to (a plain `bondy.conf` edit and restart, or the equivalent in your deployment). Without it, the call still completes normally but the callee's progressive updates are dropped — only the final result arrives.
:::

A callee that wants to emit progress receives a `progress` fun in its details map — but only when the caller asked for it, so a well-behaved handler falls back to a no-op when the fun isn't there:

```erlang
Countdown = fun(_Args, _KWArgs, Details) ->
    Progress = maps:get(progress, Details, fun(_A, _KW) -> ok end),
    [Progress([N], #{}) || N <- [3, 2, 1]],
    {reply, [<<"liftoff">>]}
end,
{ok, _} = bondy_connect:register(Conn, <<"com.example.countdown">>, Countdown).
```

A caller asks for progress by setting `receive_progress => true` on `call_async/5` — which means the reply now arrives as a sequence of messages to the calling process instead of a single return value:

```erlang
{ok, Token} = bondy_connect:call_async(
    Conn, <<"com.example.countdown">>, [], #{}, #{receive_progress => true}
),

Collect =
    fun Collect() ->
        receive
            {bondy_connect, Token, {progress, #{args := Args}}} ->
                io:format("progress: ~p~n", [Args]),
                Collect();
            {bondy_connect, Token, {ok, #{args := Args}}} ->
                io:format("final: ~p~n", [Args])
        after 5000 ->
            error(timeout)
        end
    end,
Collect().
```

> **You should see:** three `progress: [N]` lines counting down, followed by `final: [<<"liftoff">>]`.

That's one half of the feature. The other half — **progressive calls**, where the *caller* streams its arguments to the callee in chunks via `call_stream/5`, `send_input/4` and `finish_input/4` — works the same way in reverse, and both directions share the same opt-in rule: nothing streams unless the caller explicitly asks for it, and the dealer feature must be enabled on the node. The full contract for both, including every message shape and failure mode, is in [Progressive calls and results](/wamp/reference/clients/bondy_connect_sdk#progressive-calls-and-results) in the reference.

## Next steps

- Read the [Bondy Connect SDK reference](/wamp/reference/clients/bondy_connect_sdk) for the complete API: every function, every option map, and every error shape.
- If your client needs to authenticate with real credentials rather than `anonymous`, see [Authenticating](/wamp/reference/clients/bondy_connect_sdk#authenticating) for WAMP-CRA, Cryptosign, and ticket auth.
- For production deployments, see [Resilience](/wamp/reference/clients/bondy_connect_sdk#resilience) (reconnect and keepalive), [Securing the transport](/wamp/reference/clients/bondy_connect_sdk#securing-the-transport-tls) (TLS and mutual TLS), and [Load regulation](/wamp/reference/clients/bondy_connect_sdk#load-regulation) (bounding how much work a callee accepts at once).
