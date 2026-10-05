---
outline: [2,3]
related:
    - text: Bondy Connect SDK
      type: Reference
      link: /router/reference/clients/bondy_connect_sdk
      description: The complete, task-grouped API reference — every function, option, and error shape.
    - text: Getting Started with Bondy Connect SDK
      type: Tutorial
      link: /router/tutorials/wamp/bondy_connect_sdk
      description: Connect, register and call a procedure, then publish and subscribe.
    - text: Connections and Sessions
      type: Concepts
      link: /router/concepts/wamp/sessions
      description: What a WAMP session is and how it relates to transports, realms, and authentication.
    - text: Telemetry
      type: Concepts
      link: /router/concepts/telemetry
      description: Metrics, trace-context propagation, and the spans Bondy reports.
---

# The Bondy Connect SDK

`bondy_connect_sdk` is Bondy's own WAMP client for the BEAM. Its design follows from one decision: **a connection is a supervised process that owns one WAMP session and keeps it alive**. Your code holds a handle to that process. The process does the rest: it speaks the transport, runs the handshake, correlates requests with replies, runs your handlers in workers of their own, and re-establishes the session when the link drops.

This page explains that model and the choices that follow from it. For the functions and options, see the [reference](/router/reference/clients/bondy_connect_sdk). For a first run, see the [tutorial](/router/tutorials/wamp/bondy_connect_sdk).

## A connection is a process

`bondy_connect_client:connect/1,2` starts a connection and blocks until its WAMP session is established. It then returns a **connection handle**.

::: definition Connection handle (`conn()`)
An opaque value that identifies a connection process. You pass it back to the API functions. You do not inspect it. It wraps the connection's pid, or, for a handle from `named/1`, the name given to `connect/2`, which is resolved to a live connection on each use.
:::

The handle is opaque so that its representation can change without an API break. The source names one such change: a registry reference that survives a process restart.

Each connection runs in its own small supervision tree:

```
bondy_connect_sup                 (one_for_one)
├── bondy_connect_manager         names and lifecycle
└── bondy_connect_connections_sup one child per connection
    └── bondy_connect_conn_sup    (one_for_all)
        ├── handler_sup           your handler workers
        └── connection            gen_statem: transport, session, correlation
```

The per-connection supervisor is the unit of fate-sharing. The connection process and the supervisor of its handler workers live and die together, so a connection never outlives the workers it dispatched, and workers never outlive their connection.

All state that belongs to one connection — the pending requests, the registrations and subscriptions, the per-subscription event queues, the load counters — lives in the data of that one `gen_statem`. It is not in a shared ETS table. Two connections cannot interfere through shared state, and when a connection dies, its state goes with it. The session handshake, the registry, the dispatch decisions and the keepalive budget are pure functional modules that the connection process drives; the process is the only place where effects happen.

The manager tracks names and monitors each connection. It does not wait for a handshake; the process that called `connect` waits for that. When a connection process exits — because you called `disconnect/1`, because it gave up reconnecting, or because it crashed — the manager removes its supervision tree and its name. After that, operations on the handle return `not_connected`.

## One API across transports

A connection selects its transport with the `transport` option. The rest of the API does not change.

| `transport` | What it is |
|:---|:---|
| `tcp`, `tls`, `uds` | WAMP raw socket over TCP, TLS, or a Unix domain socket. The three are identical on the wire and share one implementation; they differ only in how they open the socket. |
| `ws`, `wss` | WAMP over WebSocket. Each WebSocket message carries one WAMP message, and the serializer is negotiated as a WebSocket subprotocol. |
| `longpoll`, `longpolls` | WAMP over HTTP long-poll, against Bondy's `/wamp/longpoll` endpoints. |
| `sse`, `sses` | WAMP over Server-Sent Events, against Bondy's `/wamp/sse` endpoints. |
| `local` | An in-VM session with the router running on the same node. |

This works because the transport boundary is **record-oriented**. A transport owns the socket, the framing and the serializer. The connection process and the session state machine see only decoded WAMP records. A malformed frame or payload comes back from the transport as a protocol error, not as a crash.

The transports that are not socket-shaped adapt themselves to that boundary, so the connection needs no knowledge of them:

- **Long-poll** is request/response in both directions. The transport runs a poller process that loops on the receive endpoint and forwards each message to the connection, so the connection sees the same inbound flow it sees from a socket. The poller uses its own HTTP connection, because on HTTP/1.1 a receive request held open by the server would block every send queued behind it.
- **SSE** is one-way, server to client. The transport holds the event stream open on one HTTP connection and posts outbound messages on another, for the same reason.

Both HTTP transports accept only the `json` serializer, because that is the only one the server offers for them. They refuse any other serializer at the handshake, not later on the wire.

Keepalive also adapts per transport. Raw sockets send ping frames, and WebSocket uses its own ping and pong control frames. Long-poll and SSE have no client-to-server ping, so the transport answers a ping locally; the evidence of a live link is the poll loop itself, or the server's keepalive comments on the SSE stream.

The secure transports (`tls`, `wss`, `longpolls`, `sses`) build their TLS options in one shared module, so the security settings cannot differ between them. Peer verification is on by default, against your CA certificates or the operating system's trust store, with hostname checking and a TLS 1.2 floor. Turning verification off is possible and is logged as a warning.

### The `local` transport

`transport => local` opens a session with the router in the same Erlang node. There is no network, no socket and no transport handshake. Records go to the router without serialization, and the router delivers its messages straight to the connection's mailbox. The transport synthesizes the router's `WELCOME` when the connection sends `HELLO`, so the session state machine runs exactly as it does for a remote router.

The SDK does not depend on the router application. The `local` transport defines a handler behaviour, and the router registers its implementation when it starts. On a node that runs no router, nothing is registered, and `connect` fails with `local_transport_unavailable`. Retrying cannot help, so the connection does not retry.

A local session is opened **anonymous**: code in the same node is already inside the router's trust boundary, so WAMP's challenge methods do not apply. The realm's authorization rules still apply to everything the session does.

## Losing and regaining the session

The connection process moves through these states:

```
connecting --> handshaking --> establishing --> established
    ^                                               |
    +-----------------------------------------------+   (drop -> reconnect)
    |
waiting_for_network
```

`status/1` reports a simpler view: `connecting`, `establishing`, `established`, `reconnecting` (back in `connecting` after a session was up, or waiting for the network), or `down`.

When the link drops, the session is re-established **inside the same process**. The handle you hold stays valid, and you do not reconnect yourself.

### What survives a reconnect

The connection keeps two views of your registrations and subscriptions:

- **Declared** — what you asked for: the URI, the handler and the options. `register` and `subscribe` record it. It survives a reconnect.
- **Established** — what the router confirmed, keyed by the registration or subscription id that the router assigned. Inbound `INVOCATION` and `EVENT` messages are routed against this view. It is cleared when the session drops.

When the new session is established, the connection sends `REGISTER` and `SUBSCRIBE` again for everything declared. The router assigns new ids. A registration id or subscription id that you kept from before the drop no longer identifies anything; `unregister/2` and `unsubscribe/2` also accept the URI.

Everything else that belonged to the old session ends with it:

- In-flight requests fail at once with `disconnected`. They are not resent on the new session.
- Handler workers still running for invocations of the old session are stopped.
- The session is new: it has a new session id, and authentication runs again.

While the connection is not established, it rejects requests with `not_established`. It does not queue them.

### When to retry, and when to give up

Reconnection uses a retry budget with exponential backoff and an overall deadline. A successful establish resets the budget. When the budget runs out, the connection stops, and `status/1` reports `down`.

The first connect is different. By default it fails fast: a wrong endpoint, a wrong realm or a bad credential returns an error from `connect` instead of disappearing into a backoff loop. The `retry_initial_connect` option makes the first connect retry as well.

The connection decides whether a failure is worth retrying, instead of retrying everything:

- A dropped link, a missed keepalive, a send failure or a protocol error is retried.
- A router `ABORT` is retried only if the router marked it **transient**: its `nature` says that the same request could succeed later. A **permanent** abort fails at once. The connection trusts the router's own classification, so a client also handles transient conditions that the router adds after the client was written. For a router that sends no `nature`, a short allow-list of URIs applies, and anything not on it is treated as permanent.
- A transient abort is retried **even on the first connect**. The main case is a router that sheds new sessions under load with `wamp.error.unavailable`. Fail-fast exists to surface misconfiguration; a transient abort says the request is correct, and giving up would make every client stop at the moment that retrying matters most.
- A router `GOODBYE` is retried only when the router is shutting down.

When Partisan network monitoring is available, a failure caused by the network being down moves the connection to `waiting_for_network`. It waits there for the network to return, for up to `network_timeout`, and then reconnects. If the network does not return in time, the connection gives up.

An idle link is checked with ping and pong. After a period of inbound silence the connection pings; if several pings go unanswered, it treats the link as dead and reconnects. Any inbound traffic counts as proof that the link is alive.

## How handlers run

A handler is the function you give to `register` or `subscribe`: a fun of arity 3, `{Module, Function}`, or `{Module, Function, Extra}`. It receives the positional arguments, the keyword arguments and the message details.

The connection never runs a handler itself. For each inbound `INVOCATION` and each inbound `EVENT`, it starts one short-lived worker under the connection's handler supervisor. The worker runs the handler once and exits. The connection monitors the worker but is not linked to it, so a crashing handler cannot take the connection down. A crash, or a return value that does not match the handler contract, becomes a WAMP `ERROR` (`bondy.error.internal_error`) for the caller.

Because handlers run in their own processes, a slow handler does not stop the connection from servicing other requests. A handler can also use the same connection to make calls of its own.

Invocations and events are scheduled differently:

- **Invocations** run concurrently. Admission is controlled per connection by two optional limits: `max_concurrency` (the number of invocations being serviced at the same time) and `rate` (a token bucket). When admission is refused, the handler does not run, and the connection replies to the router with `wamp.error.unavailable`. When the router interrupts an invocation, the connection kills its worker.
- **Events** are delivered **in order per subscription** by default. At most one worker runs for a subscription at a time, and later events wait in a queue. With `ordered => false`, each event gets its own worker at once, with no ordering. Events never count against the invocation limits.

On the caller side, `call` blocks only the process that calls it. The connection stores the request and replies when the result arrives. `call_async` returns a token at once, and the reply arrives later in the calling process's mailbox.

## Two ways to publish

`publish` and `publish_ack` are separate functions because they answer different questions and so have different return types.

- `publish` is **fire-and-forget**. It returns `ok` when the message is on the wire. It does not tell you whether the router accepted the publication.
- `publish_ack` asks the router to acknowledge, waits for `PUBLISHED`, and returns `{ok, PublicationId}`, or an error if the router refused the publication.

`publish` rejects `acknowledge => true` in its options with `{error, badarg}`. If it honoured that option, one function would return two different shapes depending on an option value, and every caller would have to handle both. Making the choice by function name makes the return type follow from the code you wrote.

## Progressive calls and results are opt-in

A synchronous `call` returns one result. Progressive results are a sequence, so they need a mailbox:

- **Progressive results.** A caller requests them with `receive_progress => true` on `call_async`. Each partial result arrives as a `progress` message, and the single terminal reply comes last. `call` rejects the option. On the callee side, a handler receives a `progress` fun in its details only when the caller asked for progressive results, so a handler must check for it before it uses it.
- **Progressive calls.** A caller streams the arguments of a call in chunks with `call_stream`, `send_input` and `finish_input`. The callee's handler receives an `input` fun in its details and pulls each chunk from it until the last one. Both the router and the callee must announce the `progressive_calls` feature.

## Errors say whether retrying can help

Every operation that can fail returns `{error, Error}`, and `Error` has one of two kinds:

- `kind => wamp` — the router sent an `ERROR`. The value is Bondy's structured error, the same shape the router uses internally, extended with the message's raw `args` and `kwargs`.
- `kind => client` — the failure happened locally, and `reason` holds the Erlang term: `timeout`, `disconnected`, `not_established`, and so on.

A structured error has three identifiers. The `uri` is the normative identity; use it to tell errors apart. The `code` exists only for compatibility with older error payloads. The `handle` (for example `C010`) is for people to quote in support requests, not for software.

The structured error also carries a **nature**: `transient` means that retrying the operation unchanged could succeed; `permanent` means the request itself is at fault and will fail the same way every time. This lets your code decide whether to retry without a table of URIs. The connection applies the same rule to the router's `ABORT` when it decides whether to reconnect.

## Telemetry and tracing

The SDK propagates trace context, but it creates no spans.

**Propagation.** A trace context is the W3C `traceparent`, `tracestate` and baggage values, carried unchanged. `bondy_connect_trace:attach/2` adds a context to the options of a call or a publication. The router copies it into the details of the `INVOCATION` or `EVENT` it delivers, and `bondy_connect_trace:extract/1` reads it back in the handler. A handler that calls onward continues the trace by passing what it extracted to `attach/2`.

**Telemetry.** The SDK emits a `[bondy_connect, rpc, latency]` telemetry event once for each settled RPC leg, in the same shape as the router's `[bondy, rpc, latency]` event, so one handler can serve both:

- `kind => call` measures the round trip of an outbound call, from the send to the router's `RESULT` or `ERROR`. A call that times out or is cut off by a disconnect emits nothing, because the router never answered it.
- `kind => invocation` measures a callee handler run, from worker start to the handler's return, including a crash that was caught. A worker killed by an interrupt emits nothing.

The event carries the duration, the procedure URI, the outcome (`success` or `error`), the call's trace context and a `peer_service`.

**Spans.** An exporter attached to this event, such as Bondy's own, builds a span after the fact: it ends when the event is emitted and starts `duration` earlier, parented to the carried trace context. An untraced call produces no span. The SDK's `call` leg is a CLIENT span and its `invocation` leg is a SERVER span — the reverse of the router's legs, because the router sees the same exchange from the other side.

**`peer_service`.** A trace backend draws the edges of its service graph from CLIENT spans, using their `peer.service` attribute. When the router's own spans are not exported, that attribute is the only thing that names the other end of the edge. The SDK sets it on the `call` leg to the connection's `peer_service` option, default `bondy-connect`. Set it to the router's service name so the graph joins the two. On the `invocation` leg it is unset, because a SERVER span's peer attribute has no effect in trace backends.

## See also

- [Bondy Connect SDK reference](/router/reference/clients/bondy_connect_sdk) — every function and option, including [resilience settings](/router/reference/clients/bondy_connect_sdk#resilience), [load regulation](/router/reference/clients/bondy_connect_sdk#load-regulation) and the [error table](/router/reference/clients/bondy_connect_sdk#errors).
- [Getting Started with Bondy Connect SDK](/router/tutorials/wamp/bondy_connect_sdk) — the model in use.
- [Connections and Sessions](/router/concepts/wamp/sessions) — the WAMP session the connection maintains.
- [WAMP HTTP Transports](/router/concepts/http_transports) — the server side of `longpoll` and `sse`.
- [Advanced RPC](/router/concepts/wamp/advanced/rpc) — the WAMP model behind progressive calls and results.
- [Telemetry](/router/concepts/telemetry) — the spans the router reports and how propagation works across the cluster.
