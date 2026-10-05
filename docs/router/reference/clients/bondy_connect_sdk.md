---
outline: [2,3]
related:
    - text: Getting Started with Bondy Connect SDK
      type: Tutorial
      link: /router/tutorials/wamp/bondy_connect_sdk
      description: A hands-on introduction — connect, register and call a procedure, then publish and subscribe.
    - text: Advanced RPC
      type: Concepts
      link: /router/concepts/wamp/advanced/rpc
      description: Call cancelling, call timeouts, pattern-based and shared registrations, and the WAMP model behind progressive calls and results.
    - text: Realms
      type: Concepts
      link: /router/concepts/realms
      description: The routing and administrative domain a connection attaches to.
    - text: WAMP Features Configuration Reference
      type: Reference
      link: /router/reference/configuration/wamp#dealer
      description: How Bondy negotiates progressive_call_results and progressive_calls with each session.
---

# Bondy Connect SDK

Bondy's Erlang-based WAMP client for the BEAM (Bondy, Erlang, Elixir, Gleam). One connection is one WAMP session on one realm; a process opens as many connections as it needs, each running its own supervised process tree. 

`bondy_connect` has no dependency on the `bondy` router application — it embeds in any BEAM service — and supports all four WAMP client roles (Caller, Callee, Publisher, Subscriber), every Bondy transport, every Bondy authentication method, and supports the same features as Bondy Connect.

This page documents the complete public API, grouped by what you use it to do. For a guided first run, see the [tutorial](/router/tutorials/wamp/bondy_connect_sdk).

::: definition Connection handle (`conn()`)
`connect/1,2` returns an **opaque** handle: `{bondy_connect_client, pid() | atom()}`. Treat it as a token — pass it back to the API, never pattern-match on or otherwise depend on its shape. The handle stays valid across the connection's own internal reconnects; you do not get (or need) a new one when a dropped link re-establishes.
:::

## Connecting

### Opening a connection

```erlang
connect(Spec) -> {ok, conn()} | {error, term()}.
connect(Name, Spec) -> {ok, conn()} | {error, term()}.
```

`connect/1` opens an unnamed connection; `connect/2` additionally registers it under `Name` (an atom) so other processes can reach it via [`named/1`](#named-connections) without holding the handle. Both validate `Spec`, start a supervised connection process, and **block the calling process** until the WAMP session is established — the raw handshake, and then authentication, possibly across one or more reconnect attempts — before returning.

`Spec` is a map. Only `realm` is required; every other key has a default.

| Key | Default | Meaning |
|---|---|---|
| `realm` | — (**required**) | The WAMP realm URI, as a binary. |
| `transport` | `tcp` | `tcp` \| `tls` \| `uds` \| `ws` \| `wss` \| `longpoll` \| `longpolls` \| `sse` \| `sses` \| `local`. The `longpoll` and `sse` transports use Bondy's [HTTP transports](/router/concepts/http_transports), with JSON only; the `s` forms use TLS. |
| `endpoint` | `undefined` | Transport-specific; see below. |
| `auth` | `#{method => <<"anonymous">>}` | Authentication method and credentials — see [Authenticating](#authenticating). |
| `serializers` | `[json]` | Preferred order of `json` \| `msgpack` \| `cbor`. |
| `roles` | the full advanced profile | The WAMP roles and features to advertise in `HELLO`. Advertising is on an *advertise-equals-handle* basis: the default enables every advanced feature the client actually implements, no more. See [Progressive calls and results](#progressive-calls-and-results) for why this default matters there. |
| `agent` | the client's own `bondy_connect/<version>` string | The agent string sent in `HELLO`. Must be a binary if supplied. |
| `reconnect` | see [Resilience](#resilience) | Reconnect and backoff policy. |
| `ping` | see [Resilience](#resilience) | Idle keepalive (ping/pong) policy. |
| `network_timeout` | `60000` | How long (ms) to wait for network recovery in `waiting_for_network` before giving up. Only relevant when Partisan network monitoring is available. |
| `handler` | `#{}` (unlimited) | Callee load regulation — see [Load regulation](#load-regulation). |
| `tls` | `#{verify => verify_peer}` | TLS options for the `tls`/`wss` transports — see [Securing the transport](#securing-the-transport-tls). |
| `ws_path` | `<<"/ws">>` | The HTTP path for the `ws`/`wss` transports. |
| `longpoll_path` | `<<"/wamp/longpoll">>` | The HTTP path for the `longpoll`/`longpolls` transports. |
| `longpoll_poll_timeout` | `60000` | How long, in milliseconds, one long-poll request waits for messages. |
| `sse_path` | `<<"/wamp/sse">>` | The HTTP path for the `sse`/`sses` transports. |
| `peer_service` | `<<"bondy-connect">>` | The name this client reports for the router in its outbound-call telemetry, as the `peer.service` attribute of the exported client span. Set it to the router's service name so a trace backend's service graph links the two. |
| `max_message_length` | `16777216` (16 MB) | Maximum inbound/outbound WAMP message size. |

`endpoint` is interpreted per transport:

```erlang
%% Raw TCP
#{transport => tcp,  endpoint => {"127.0.0.1", 18082}, realm => Realm}

%% Raw TLS
#{transport => tls,  endpoint => {"router.example.com", 18085}, realm => Realm}

%% Unix domain socket
#{transport => uds,  endpoint => {local, "/var/run/bondy/wamp.sock"}, realm => Realm}

%% WebSocket (ws_path defaults to "/ws")
#{transport => ws,   endpoint => {"127.0.0.1", 18080}, realm => Realm}

%% Secure WebSocket
#{transport => wss,  endpoint => {"router.example.com", 18083}, realm => Realm}

%% In-VM — only on a node running the Bondy router; see "The in-VM (local) transport"
#{transport => local, endpoint => local, realm => Realm}
```

**Fails** with `{error, Reason}` without attempting a network connection when `Spec` itself is invalid: `missing_realm`, `{invalid_realm, Uri}`, `{invalid_agent, not_a_binary}`, `missing_authmethod`, `{unsupported_authmethod, Method}`, `invalid_auth`, `invalid_tls`, `{invalid_network_timeout, T}`, `{invalid_option, Group, Key, Value}` or `{unknown_option, Group, Key}` (for an unrecognised key inside `reconnect`, `ping`, or `handler`), or `invalid_spec` if `Spec` is not a map. It also fails with `{error, {already_started, Name}}` from `connect/2` if `Name` is already registered to a live connection.

Once the spec is valid, `connect/1,2` is **fail-fast on the first attempt** by default: a dead endpoint or a rejected handshake fails immediately rather than retrying. See [Resilience](#resilience) for `retry_initial_connect` and what happens once a session has established at least once.

### Named connections

```erlang
named(Name :: atom()) -> conn().
```

Builds a handle for a connection previously opened with `connect/2`, so a process that never held the original handle can still use it. Resolution to the live connection process happens **lazily on every call** through the handle, so it keeps working across the connection's own internal reconnects — there is nothing to refresh.

```erlang
{ok, _} = bondy_connect_client:connect(price_conn, #{
    transport => tcp, endpoint => {"127.0.0.1", 18082}, realm => Realm
}),

%% Elsewhere, from any process:
Conn = bondy_connect_client:named(price_conn),
{ok, _} = bondy_connect_client:call(Conn, <<"com.example.echo">>, [<<"hi">>]).
```

### Connection status

```erlang
status(Conn) -> connecting | establishing | established | reconnecting | down.
```

Reports where the connection is in its lifecycle:

```
connecting → establishing → established
                  ▲              │ (link drops)
                  └── reconnecting ◀┘     … → down (gave up, or closed)
```

`down` is also what you get if `Conn` resolves to no live process at all (for example, a name that was never connected, or a connection that has fully terminated).

### Disconnecting

```erlang
disconnect(Conn) -> ok.
```

Closes the connection: sends `GOODBYE` if a session is established, tears down the transport, and stops the connection's supervision tree. Always returns `ok`, including when called on a connection that is already gone.

## Authenticating

The `auth` key of the connect spec selects the method via `auth.method` and carries that method's credentials. Four methods are supported.

### Anonymous

```erlang
#{method => <<"anonymous">>}
```

No credentials. This is the default when `auth` is omitted entirely.

### WAMP-CRA

```erlang
#{method => <<"wampcra">>, authid => <<"alice">>, password => <<"secret">>}
```

Challenge-response with a shared secret: the client derives the salted response from `password` and the router's challenge parameters using the same primitive the router uses to compute the expected signature.

### Cryptosign

```erlang
#{method => <<"cryptosign">>, authid => <<"alice">>, privkey => <<"A1B2C3…">>}
```

Ed25519 signature authentication. `privkey` is the hex-encoded 32-byte seed; the public key is derived from it automatically and advertised in `HELLO`. Generate a fresh key pair with:

```erlang
#{secret := Seed} = bondy_wamp_cryptosign:generate_key(),
PrivKeyHex = bondy_wamp_cryptosign:encode_hex(Seed).
```

Two further forms cover keys that must never enter the BEAM heap in plaintext, at the cost of the client no longer being able to derive the public key for you — supply it explicitly with `pubkey`:

```erlang
%% Read the private key from an environment variable at connect time
#{method => <<"cryptosign">>, authid => <<"alice">>,
  pubkey => <<"...">>, privkey_env_var => "ALICE_CRYPTOSIGN_KEY"}

%% Sign via an external executable (its stdout is the hex signature)
#{method => <<"cryptosign">>, authid => <<"alice">>,
  pubkey => <<"...">>, exec => "/usr/local/bin/sign-challenge"}
```

### Ticket

```erlang
#{method => <<"ticket">>, authid => <<"alice">>, ticket => <<"…token…">>}
```

A pre-issued bearer token, sent verbatim as the `AUTHENTICATE` signature. `password` is accepted as an alias for `ticket`, so the same map shape doubles as static password authentication where the router is configured for it.

### Unchallenged credentials are refused

A method that carries credentials (`wampcra`, `cryptosign`, `ticket`) exists to be *checked* by the router via a `CHALLENGE`. If the router instead answers `HELLO` with `WELCOME` directly — skipping the challenge — the client treats that as a silent downgrade of the security posture you asked for and aborts the handshake rather than accepting the session. Only `anonymous`, which never carries a credential to check, may be welcomed unchallenged. The connect attempt then fails; see [Errors](#errors).

## Calling procedures

Calling is the Caller role: invoking a procedure some Callee has registered, and getting back its result or error.

### Calling synchronously

```erlang
call(Conn, Uri) -> {ok, map()} | {error, term()}.
call(Conn, Uri, Args) -> {ok, map()} | {error, term()}.
call(Conn, Uri, Args, KWArgs) -> {ok, map()} | {error, term()}.
call(Conn, Uri, Args, KWArgs, Opts) -> {ok, map()} | {error, term()}.
```

Blocks the calling process until the `RESULT` or `ERROR` for the call arrives, or until `Opts`' `timeout` (in ms, default 30000) elapses. On success, returns `{ok, #{args := list(), kwargs := map(), details := map()}}` — exactly the positional and keyword results the callee produced. The three shorter arities fill in `Args = []`, `KWArgs = #{}`, and `Opts = #{}` in that order.

**Fails** with:

- `{error, #{uri := <<"wamp.error.no_such_procedure">>}}` — nothing is registered for `Uri`.
- `{error, #{uri := BusinessErrorUri, args := ..., kwargs := ...}}` — the callee returned `{error, ...}`; see [Handler return values](#registering-a-procedure).
- `{error, timeout}` — the call exceeded its `timeout`.
- `{error, disconnected}` — the link dropped while the call was in flight (fail-fast; see [Resilience](#resilience)).
- `{error, not_connected}` — `Conn` resolves to no live connection.
- `{error, {invalid_option, receive_progress}}` — `Opts` carried `receive_progress => true`. A single synchronous reply cannot represent a stream of progressive results; use `call_async/5` instead — see [Progressive calls and results](#progressive-calls-and-results).

### Calling asynchronously

```erlang
call_async(Conn, Uri, Args) -> {ok, reference()} | {error, term()}.
call_async(Conn, Uri, Args, KWArgs) -> {ok, reference()} | {error, term()}.
call_async(Conn, Uri, Args, KWArgs, Opts) -> {ok, reference()} | {error, term()}.
```

Issues the call and returns immediately with `{ok, Token}`. The reply is delivered later, to the calling process's mailbox, as one message:

```erlang
{bondy_connect_client, Token, {ok, #{args := list(), kwargs := map(), details := map()}}}
{bondy_connect_client, Token, {error, Reason}}
```

`Reason` takes the same shapes as a failed `call/5`. `Opts`' `timeout` still bounds the whole call, delivering `{error, timeout}` if it elapses.

Setting `Opts`' `receive_progress => true` additionally requests **progressive call results**; see [Progressive calls and results](#progressive-calls-and-results) for the extra messages that arrive before the terminal one.

### Cancelling a call

```erlang
cancel(Conn, Token) -> ok | {error, term()}.
cancel(Conn, Token, Mode) -> ok | {error, term()}.
```

Cancels the in-flight call identified by the `Token` an earlier `call_async/3,4,5` or `call_stream/5` returned — a progressive call opened with `call_stream/5` is cancellable exactly like an ordinary asynchronous one. `cancel/2` uses mode `killnowait`; `cancel/3` accepts `skip` | `kill` | `killnowait` — the three modes WAMP call-cancelling defines, differing in whether the callee is asked to abort and whether the caller waits for its acknowledgement. Either way, `cancel/2,3` itself returns as soon as the `CANCEL` message is sent (or fails); the async caller separately still receives its terminating `{bondy_connect_client, Token, {error, #{uri := <<"wamp.error.canceled">>}}}` through the normal `call_async` reply path.

**Fails** with `{error, unknown_call}` if `Token` does not match a call currently in flight, or `{error, invalid_cancel_mode}` if `Mode` is none of the three above.

## Handlers

Registering a procedure ([Registering procedures](#registering-procedures)) and subscribing to a topic ([Subscribing to topics](#subscribing-to-topics)) both take a **handler** — the thing that runs when an `INVOCATION` or `EVENT` arrives. Both roles use the identical handler contract, described once here.

A handler is one of three shapes:

```erlang
%% 1. A fun of arity 3
fun(Args, KWArgs, Details) -> Result end

%% 2. {Module, Function} — invoked as Module:Function(Args, KWArgs, Details)
{my_handlers, echo}

%% 3. {Module, Function, Extra} — invoked as Module:Function(Args, KWArgs, Details, Extra)
{my_handlers, echo, #{tenant => <<"acme">>}}
```

`Args` is the call or event's positional arguments (a list); `KWArgs` its keyword arguments (a map); `Details` a map of WAMP metadata for the invocation or event (for example the disclosed caller/publisher identity, when enabled, and — for a progressive invocation — the `progress` and/or `input` funs described in [Progressive calls and results](#progressive-calls-and-results)). `Result`'s meaning is role-specific: see [Handler return values](#registering-a-procedure) for a callee, and [Subscribing to topics](#subscribing-to-topics) for a subscriber, whose return value is ignored entirely.

**Every handler runs in its own isolated, monitored worker process**, spawned fresh per invocation or event — never on the connection process, and never on the process that called `register`/`subscribe`. Consequences:

- A handler that crashes, blocks, or loops cannot stall or bring down the connection. For a callee it becomes a WAMP `ERROR`; for a subscriber the event is simply dropped after the crash.
- A handler cannot rely on the process dictionary or mailbox of whatever process called `register`/`subscribe` — it runs somewhere else entirely. Pass whatever state a handler needs through a closure, or through the `Extra` argument of the `{Module, Function, Extra}` form.

`register/3,4` and `subscribe/3,4` validate a handler's *shape* before accepting it and fail immediately — without contacting the router — if it is none of the three forms above:

```erlang
{error, {invalid_handler, Other}}
```

## Registering procedures

Registering is the Callee role: publishing a procedure URI backed by a handler, so Callers elsewhere on the realm can invoke it.

### Registering a procedure

```erlang
register(Conn, Uri, Handler) -> {ok, pos_integer()} | {error, term()}.
register(Conn, Uri, Handler, Opts) -> {ok, pos_integer()} | {error, term()}.
```

Registers `Handler` (see [Handlers](#handlers)) against `Uri`. On success returns `{ok, RegistrationId}`. From then on, every `INVOCATION` the router routes to this registration — from any session on the realm, including this one — spawns an isolated worker that runs `Handler` and turns its return value into a `YIELD` or `ERROR`:

| Handler returns | Wire result |
|---|---|
| `{reply, Args}` | `YIELD` with positional args |
| `{reply, Args, KWArgs}` | `YIELD` with positional and keyword args |
| `ok` or `noreply` | An empty `YIELD` |
| `{error, Uri}` | `ERROR` with that URI |
| `{error, Uri, Args}` | `ERROR` with URI and positional args |
| `{error, Uri, Args, KWArgs}` | `ERROR` with URI, positional and keyword args |
| anything else, or an exception | `ERROR` `bondy.error.internal_error` — the handler crash or misbehaviour is contained; the connection is unaffected |

`Opts` carries WAMP registration options, passed through to the router's `REGISTER`:

| Key | Meaning |
|---|---|
| `match` | Matching policy for `Uri`: exact (the default when omitted), `<<"prefix">>`, or `<<"wildcard">>`. Requires the realm to grant pattern-based registration. |
| `invoke` | Invocation policy for a shared registration: `single` (the default), `roundrobin`, `random`, `first`, or `last`. |
| `concurrency` | For a shared registration, how many concurrent invocations this specific registration accepts. |
| `disclose_caller` | Request that the router disclose the caller's identity in `Details`. |
| `force_reregister` | Accepted and passed to the router, which ignores it. A second `single` registration of the same URI still fails with `wamp.error.procedure_already_exists`. |

**Fails** with `{error, {invalid_handler, _}}` for a malformed handler (see [Handlers](#handlers)), or with the router's `ERROR` response — most commonly `{error, #{uri := <<"wamp.error.procedure_already_exists">>}}`.

### Unregistering

```erlang
unregister(Conn, RegRef) -> ok | {error, term()}.
```

`RegRef` is either the `RegistrationId` `register/3,4` returned or the procedure's URI. **Fails** with `{error, no_such_registration}` if `RegRef` matches nothing this connection currently has registered.

## Publishing events

Publishing is the Publisher role: sending an event to a topic for any current Subscribers to receive.

```erlang
publish(Conn, Topic, Args) -> ok | {error, term()}.
publish(Conn, Topic, Args, KWArgs) -> ok | {error, term()}.
publish(Conn, Topic, Args, KWArgs, Opts) -> ok | {error, term()}.

publish_ack(Conn, Topic, Args) -> {ok, pos_integer()} | {error, term()}.
publish_ack(Conn, Topic, Args, KWArgs) -> {ok, pos_integer()} | {error, term()}.
publish_ack(Conn, Topic, Args, KWArgs, Opts) -> {ok, pos_integer()} | {error, term()}.
```

`publish/3,4,5` is **fire-and-forget**: it returns `ok` as soon as the `PUBLISH` message is on the wire, without waiting for the router. It rejects `acknowledge => true` in `Opts` with `{error, badarg}`.

`publish_ack/3,4,5` waits for the router's `PUBLISHED` and returns `{ok, PublicationId}`, or the router's `ERROR` as `{error, #{uri := ..., ...}}`. It always sets `acknowledge`, whatever `Opts` says. The two functions are separate so that each has one return type.

`Opts` also carries WAMP publication options, passed through to the router:

| Key | Meaning |
|---|---|
| `exclude` | Exclude the listed session ids from receiving this event. |
| `exclude_me` | Whether to exclude this connection's own session, if it is also subscribed. Bondy's default is `true`. |
| `eligible` | Restrict delivery to the listed session ids. |
| `exclude_authid` / `exclude_authrole` / `eligible_authid` / `eligible_authrole` | Passed to the router, which accepts and ignores them. See [WAMP Compliance](/router/reference/protocols/wamp#publish-subscribe-1). |
| `disclose_me` | Whether the router discloses this publisher's identity to subscribers. Bondy's default is `true`. |
| `retain` | Ask the router to retain this event for delivery to future subscribers, if the realm's broker supports event retention. |

## Subscribing to topics

Subscribing is the Subscriber role: registering a handler that runs once per event delivered to a topic.

### Subscribing

```erlang
subscribe(Conn, Topic, Handler) -> {ok, pos_integer()} | {error, term()}.
subscribe(Conn, Topic, Handler, Opts) -> {ok, pos_integer()} | {error, term()}.
```

Subscribes `Handler` (see [Handlers](#handlers)) to `Topic`. On success returns `{ok, SubscriptionId}`. Every `EVENT` the router delivers to this subscription spawns an isolated worker that runs `Handler`; **its return value is ignored** — an event has no reply.

`Opts`:

| Key | Meaning |
|---|---|
| `match` | Matching policy for `Topic`: exact (default), `<<"prefix">>`, or `<<"wildcard">>`. |
| `get_retained` | Request delivery of the topic's retained event, if any, immediately on subscribing. |
| `nkey` | Node key used for pattern-based subscription routing metadata. |
| `ordered` | `true` (default) delivers events for this subscription **FIFO**: the next event waits for the current handler to finish. Set `false` to dispatch events concurrently, one worker per event, when throughput matters more than order. |

**Fails** with `{error, {invalid_handler, _}}` for a malformed handler.

### Unsubscribing

```erlang
unsubscribe(Conn, SubRef) -> ok | {error, term()}.
```

`SubRef` is either the `SubscriptionId` `subscribe/3,4` returned or the topic's URI. **Fails** with `{error, no_such_subscription}` if `SubRef` matches nothing this connection currently holds.

## Progressive calls and results

WAMP's Advanced Profile lets a call stream in either direction instead of moving as one message: a Callee can send its result back in pieces (**progressive call results**), and a Caller can send its arguments in pieces (**progressive calls**). `bondy_connect` implements both, on both sides.

Both features are **strict opt-in** at two independent levels:

1. **The session must announce the feature in `HELLO`.** Bondy always offers both features, and has no setting to turn them off, but it grants each one only to a session that announces it. See [how Bondy negotiates them](/router/reference/configuration/wamp#dealer).
2. **The API you call decides whether a given call uses them** — nothing streams silently. Ordinary `call/5` and `call_async/5` behave exactly as before unless you opt in per call, as described below.

Both features are advertised by `bondy_connect`'s default `roles` spec (for both the caller and callee side), paired with `call_canceling` as the WAMP specification requires — a progressive exchange must be cancellable. If you supply your own `roles` map in the connect spec, keep both flags to preserve this.

### Requesting progressive results (caller side)

Pass `receive_progress => true` in `call_async/5`'s `Opts`. Each progressive result the callee produces arrives as its own message, before the terminal reply:

```erlang
{ok, Token} = bondy_connect_client:call_async(
    Conn, <<"com.example.large_query">>, [Query], #{}, #{receive_progress => true}
),
receive
    {bondy_connect_client, Token, {progress, #{args := PartialArgs}}} ->
        handle_partial(PartialArgs);
    {bondy_connect_client, Token, {ok, #{args := FinalArgs}}} ->
        handle_final(FinalArgs);
    {bondy_connect_client, Token, {error, Reason}} ->
        handle_error(Reason)
end.
```

`{bondy_connect_client, Token, {ok, _}}` / `{error, _}` remains the single terminal message — exactly as for a plain `call_async/5` — regardless of how many `{progress, _}` messages preceded it. The call's `timeout` bounds the call as a whole; a progressive result does not extend it, though the router restarts the underlying inter-result inactivity window on each one. `receive_progress => true` is rejected by `call/5` (see [Calling synchronously](#calling-synchronously)) — a single synchronous reply cannot represent a stream.

### Emitting progressive results (callee side)

When — and only when — the caller requested progressive results, the connection injects a `progress` fun into the handler's `Details` map. Calling it emits one progressive `YIELD` immediately, without ending the invocation; the handler's own return value (`{reply, ...}`, `{error, ...}`, and so on — see [Handler return values](#registering-a-procedure)) is still what produces the final result.

```erlang
Handler = fun(Args, KWArgs, Details) ->
    Progress = maps:get(progress, Details, fun(_A, _KW) -> ok end),
    Progress([<<"25%">>], #{}),
    Progress([<<"75%">>], #{}),
    {reply, [<<"100%">>]}
end.
```

Because the fun is only present when the caller opted in, a handler that assumes it exists will crash (safely — as `bondy.error.internal_error` — but incorrectly) against a caller that did not; always look it up with a default, as above, unless the procedure is exclusively called with progressive results requested.

### Streaming arguments to a call (caller side)

```erlang
call_stream(Conn, Uri, Args, KWArgs, Opts) -> {ok, reference()} | {error, term()}.
send_input(Conn, Token, Args, KWArgs) -> ok | {error, term()}.
finish_input(Conn, Token, Args, KWArgs) -> ok | {error, term()}.
```

`call_stream/5` opens a progressive call: it sends the first chunk of arguments as a `CALL` marked as non-final and returns `{ok, Token}`, exactly like `call_async/5`. Send every subsequent chunk except the last with `send_input/4`; send the last chunk with `finish_input/4`, which closes the stream. All three chunks — first, middle, last — reuse the same request; only `finish_input/4`'s chunk is marked final to the router. The reply is delivered to the calling process exactly as for `call_async/5`: `{bondy_connect_client, Token, {ok, _} | {error, _}}`, optionally preceded by `{progress, _}` messages if `Opts` also requested `receive_progress => true`.

```erlang
{ok, Token} = bondy_connect_client:call_stream(Conn, <<"com.example.ingest">>, [Chunk1], #{}, #{}),
ok = bondy_connect_client:send_input(Conn, Token, [Chunk2], #{}),
ok = bondy_connect_client:finish_input(Conn, Token, [Chunk3], #{}),
receive
    {bondy_connect_client, Token, {ok, #{args := Args}}} -> Args
end.
```

**Fails** with `{error, not_a_progressive_call}` if `Token` identifies a call that was never opened with `call_stream/5`, or `{error, unknown_token}` if `Token` matches no in-flight call at all.

### Receiving streamed arguments (callee side)

For an invocation that is part of an argument stream, the connection injects an `input` fun into the handler's `Details` map. The invocation's own `Args`/`KWArgs` are the *first* chunk; call `Input()` to pull each subsequent one. It blocks until the connection forwards the next chunk (bounded by the router's inter-chunk deadline, which aborts the invocation if the caller stalls) and returns `{more, Args, KWArgs}` while the stream continues, or `{last, Args, KWArgs}` for the final chunk:

```erlang
Handler = fun(FirstArgs, FirstKWArgs, Details) ->
    case maps:get(input, Details, undefined) of
        undefined ->
            %% Not a progressive call — FirstArgs/FirstKWArgs is everything.
            {reply, [byte_size(term_to_binary(FirstArgs))]};
        Input ->
            Total = collect(Input, [FirstArgs]),
            {reply, [Total]}
    end
end,

collect(Input, Acc) ->
    case Input() of
        {more, Args, _KWArgs} -> collect(Input, [Args | Acc]);
        {last, Args, _KWArgs} -> length([Args | Acc])
    end.
```

As with `progress`, the `input` fun is only present when the invocation is actually part of an argument stream (`Details` carries `progress => true` on every non-final chunk); a handler registered against a URI that might be called either progressively or normally must check for it rather than assume it.

## Load regulation

A callee can bound how much concurrent work its registered handlers accept, via the `handler` key of the connect spec — protection against a flood of invocations rather than something you call per registration:

```erlang
{ok, Conn} = bondy_connect_client:connect(#{
    transport => tcp, endpoint => {"127.0.0.1", 18082}, realm => Realm,
    handler => #{
        max_concurrency => 50,             %% at most 50 invocations in flight; 0 = unlimited
        rate => #{capacity => 100}         %% a bondy_regulator token-bucket spec
    }
}).
```

`max_concurrency` is a hard in-flight cap; `rate` is an optional token-bucket rate limit. **Both must admit an invocation** for it to be dispatched. When either rejects one, the caller receives `{error, #{uri := <<"wamp.error.unavailable">>}}` — the connection itself stays healthy and continues serving already-admitted work. Load regulation applies only to callee invocations; events delivered to subscriptions are never rate-limited or capped.

## Resilience

### Reconnection and replay

Once a session has established **at least once**, a dropped link is re-established automatically with bounded, backed-off retries, and on re-establishment the connection **replays** its declared registrations and subscriptions — the procedures and topics you set up come back to life without you doing anything.

The `reconnect` key of the connect spec (merged over these defaults):

```erlang
#{reconnect => #{
    enabled               => true,    %% master switch
    retry_initial_connect => false,   %% also retry the very first connect attempt?
    max_retries           => 10,
    interval              => 3000,    %% base delay between attempts, ms
    deadline              => 60000,   %% give up after this long overall, ms (0 = no deadline)
    backoff_enabled       => true,
    backoff_min           => 1000,
    backoff_max           => 60000
}}
```

`connect/1,2` is fail-fast on the *first* attempt by default: a dead endpoint returns `{error, _}` immediately instead of retrying within `connect/1,2`'s own call. Set `retry_initial_connect => true` to retry that first attempt within the same reconnect budget instead. Once the budget (`max_retries` or `deadline`, whichever comes first) is exhausted, the connection gives up and terminates with exit reason `{shutdown, {reconnect_failed, _}}`; `status/1` then reports `down`.

How a failure is retried depends on whether the session had opened:

- **A session that was up and then dropped** starts a fresh reconnect sequence: the budget is reset and the first attempt is immediate.
- **A connection that failed before its session opened** — refused, aborted, or dropped before `WELCOME` — waits out the backoff and consumes the budget, as a failed connect does. A router that accepts every connection and then drops it is therefore never redialled in a tight loop. This includes a refused protocol upgrade while a restarting router's listener comes up.
- **A router `GOODBYE` with `wamp.close.system_shutdown`**, which every session receives during a graceful router restart, is retried after a backoff delay even though the session was up, because the router is saying it is going away. Any other router `GOODBYE` ends the connection.
- **A router `ABORT`** is retried only when it describes a condition that could clear: its `nature` is `transient`, or, from a router that sends no `nature`, its URI is on a short allow-list of transient errors. Any other `ABORT` ends the connection.

### Keepalive (ping/pong)

An idle raw-socket connection is probed with WAMP pings; unanswered pings tear the link down (triggering the reconnect above). The `ping` key of the connect spec:

```erlang
#{ping => #{
    enabled      => true,
    idle_timeout => 30000,   %% send a ping after this much silence, ms
    timeout      => 10000,   %% wait this long for each pong, ms
    max_attempts => 3        %% give up (and reconnect) after this many unanswered pings
}}
```

### Fail-fast on disconnect

When the link drops, every call already in flight fails immediately with `{error, disconnected}` rather than hanging until its timeout, and any new call issued on a connection that is currently down returns `{error, not_connected}`.

## Securing the transport (TLS)

The `tls` and `wss` transports are **secure by default**: peer verification is on (`verify_peer`) against the system or configured CA bundle, with hostname/SNI checks. The `tls` key of the connect spec supplies TLS options for both:

```erlang
%% Verify the server against a specific CA bundle
#{transport => tls, endpoint => {"router.example.com", 18085}, realm => Realm,
  tls => #{cacertfile => "/etc/ssl/certs/ca.pem"}}

%% Mutual TLS — present a client certificate
#{transport => tls, endpoint => {"router.example.com", 18085}, realm => Realm,
  tls => #{cacertfile => "/etc/ssl/certs/ca.pem",
           certfile   => "/etc/ssl/certs/client.pem",
           keyfile    => "/etc/ssl/private/client.key"}}

%% Disable verification — explicit opt-in only
#{transport => tls, endpoint => {"127.0.0.1", 18085}, realm => Realm,
  tls => #{verify => verify_none}}
```

::: warning
Disabling verification (`verify => verify_none`) removes protection against man-in-the-middle attacks. It is logged at `WARNING` level and should be limited to development against a known, trusted endpoint.
:::

## The in-VM (local) transport

On a node that **is** running the Bondy router itself, `transport => local` opens a session in-process — no socket, no serialization, no handshake — while behaving exactly like a remote client to the rest of your code:

```erlang
{ok, Conn} = bondy_connect_client:connect(#{
    transport => local, endpoint => local, realm => <<"com.example.realm">>
}),
{ok, _} = bondy_connect_client:call(Conn, <<"bondy.session.self">>, []).
```

`bondy_connect` stays standalone even here: the local transport holds no reference to any `bondy` module. It defines a handler behaviour and a `persistent_term` registry that the router application implements and registers at boot. On any node where that handler isn't registered — a plain peer that isn't itself a router — the local transport is unavailable and `connect/1,2` fails cleanly with `{error, local_transport_unavailable}` rather than crashing.

Because an in-VM peer is already inside the trusted BEAM, WAMP's challenge-based authentication methods do not apply here: the session opens anonymously, though the realm's authorization (grants and sources) is still fully enforced.

## Errors

Failures a connection can produce, independent of where documented above:

| Error | Where | Meaning |
|---|---|---|
| `{error, not_connected}` | any operation | `Conn` resolves to no live connection process. |
| `{error, disconnected}` | an in-flight call, or `connect/1,2` itself | The link dropped while the operation was outstanding — for `connect/1,2`, this is also what a rejected or aborted handshake currently surfaces as (see note below). |
| `{error, timeout}` | `call/5` | The call exceeded its `timeout` option. |
| `{error, #{uri := <<"wamp.error.no_such_procedure">>}}` | `call`, `call_async` | Nothing is registered for the URI. |
| `{error, #{uri := <<"wamp.error.unavailable">>}}` | `call`, `call_async` | The callee's load regulator rejected the invocation. |
| `{error, #{uri := <<"bondy.error.internal_error">>}}` | `call`, `call_async` | The callee handler crashed, or returned something other than a documented handler result (contained — the connection is unaffected). |
| `{error, #{uri := <<"wamp.error.canceled">>}}` | `call_async`, `call_stream` (terminal message) | The call was cancelled via `cancel/2,3`. |
| `{error, #{uri := Uri, ...}}` | `call`, `call_async` | A business error the callee returned with `{error, Uri, ...}`. |
| `{error, {invalid_handler, _}}` | `register`, `subscribe` | The handler is not a fun of arity 3, `{Module, Function}`, or `{Module, Function, Extra}`. |
| `{error, no_such_registration}` | `unregister` | `RegRef` matches no registration this connection currently holds. |
| `{error, no_such_subscription}` | `unsubscribe` | `SubRef` matches no subscription this connection currently holds. |
| `{error, unknown_call}` | `cancel` | `Token` matches no call currently in flight. |
| `{error, invalid_cancel_mode}` | `cancel` | `Mode` is not `skip`, `kill`, or `killnowait`. |
| `{error, not_a_progressive_call}` | `send_input`, `finish_input` | `Token` identifies a call that was not opened with `call_stream/5`. |
| `{error, unknown_token}` | `send_input`, `finish_input` | `Token` matches no in-flight call at all. |
| `{error, local_transport_unavailable}` | `connect` (`local` transport) | No router handler is registered on this node. |
| `{error, {already_started, Name}}` | `connect/2` | `Name` is already registered to a live connection. |
| `{error, invalid_spec}` \| `missing_realm` \| `{invalid_realm, _}` \| `{invalid_agent, _}` \| `missing_authmethod` \| `{unsupported_authmethod, _}` \| `invalid_auth` \| `invalid_tls` \| `{invalid_network_timeout, _}` \| `{unknown_option, _, _}` \| `{invalid_option, _, _, _}` | `connect` | The connect spec itself failed validation; see [Opening a connection](#opening-a-connection). Returned synchronously, before any network I/O. |
| exit reason `{shutdown, {reconnect_failed, Reason}}` | (the connection process) | The reconnect budget was exhausted; `status/1` reports `down`. |

::: info A credential-bearing method welcomed unchallenged
`bondy_connect` refuses to accept a session the router welcomed without issuing a `CHALLENGE` for a method that carries credentials (see [Unchallenged credentials are refused](#unchallenged-credentials-are-refused)); the handshake is aborted rather than silently downgraded. The connect attempt fails as a result — currently observed as `{error, disconnected}`, the same generic failure any aborted handshake produces, rather than a reason naming the downgrade specifically.
:::
