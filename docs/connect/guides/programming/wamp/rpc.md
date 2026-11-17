---
related:
    - text: Advanced RPC
      type: Concept
      link: /connect/concepts/wamp/advanced/rpc
      description: The protocol-level mechanics behind every feature below.
    - text: Routed RPC
      type: Concept
      link: /connect/concepts/wamp/rpc
      description: The fundamentals of Remote Procedure Calls in WAMP.
---
# Remote Procedure Calls

This guide shows how to program RPC against Bondy in Python and in Erlang. It assumes you already know what a registration, a call, and a routed RPC are. Each example has one tab per language, and the site keeps the language you pick. For the protocol-level mechanics of each advanced feature (why it works the way it does, its wire behaviour, its cluster-wide semantics), see [Advanced RPC](/connect/concepts/wamp/advanced/rpc); this guide only shows how to reach for it in code.

## Requirements

- **Python:** Python 3.7+ (3.10 recommended) and the [Autobahn|Python](https://github.com/crossbario/autobahn-python) WAMP client library.
- **Erlang:** Erlang/OTP 29 or later and the Bondy Connect SDK. [Getting Started with Bondy Connect SDK](/connect/tutorials/wamp/bondy_connect_sdk) shows how to add the dependency.

## Establishing a connection

In Erlang, `connect/1` blocks until the session is established. It returns the connection handle that the other examples name `Conn`.

::: code-group sdk

```python [Python]
import os
import signal
import sys

from autobahn.asyncio.component import Component
from autobahn.asyncio.component import run

BONDY_URL = os.getenv("BONDY_URL", "ws://localhost:18080/ws")
REALM = os.getenv("REALM", "com.example.realm")
AUTHMETHOD = os.getenv("AUTHMETHOD", "anonymous")
AUTHENTICATION_CONFIG = {"anonymous": None}

class Connect:

    # Creation of the autobahn component
    def __init__(self):
        transport = {
            "type": "websocket",
            "url": BONDY_URL,
            "serializers": ["json"],
        }
        auth_config = AUTHENTICATION_CONFIG[AUTHMETHOD]
        self._component = Component(
            transports=[transport],
            authentication=auth_config,
            realm=REALM
        )

        # Register session lifecycle callbacks
        self._component.on("join", self._on_join)
        self._component.on("leave", self._on_leave)

        self._session = None

    def start(self):
        run([self._component])
        print("Done.")

    def _on_join(self, session, details):
        self._session = session

    def _on_leave(self, session, details):
        self._session = None


# Start of the script when called from prompt
if __name__ == "__main__":

    # Handle Ctrl+C gracefully
    def signal_handler(sig, frame):
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)

    connect = Connect()
    connect.start()
```

```erlang [Erlang]
{ok, _} = application:ensure_all_started(bondy_connect_sdk),

{ok, Conn} = bondy_connect_client:connect(#{
    transport => ws,
    endpoint  => {"127.0.0.1", 18080},
    realm     => <<"com.example.realm">>,
    auth      => #{method => <<"anonymous">>}
}).
```

:::





## How Registrations Work

A registration binds a procedure URI to your session on the router; Bondy routes any matching call to it, rather than a caller connecting to your process directly. See [Routed RPC](/connect/concepts/wamp/rpc) for why WAMP works this way.

## Basic Registrations

Register your procedures as soon as the session is established. In Python, do it in the session's `on_join` callback. In Erlang, do it after `connect/1` returns; the SDK registers them again after a reconnect.

In the following snippet we register the procedure `com.example.add` which takes two integers as arguments.

::: code-group sdk

```python [Python]
async def _on_join(self, session, details):
    self._session = session
    self._session.register(self.add, "com.example.add")


# Call handler for procedure 'com.example.add'
def add(self, x, y):
    """Add 2 numbers."""

    try:
        z = float(x) + float(y)

    except Exception as error:
        print(f"Invalid input: {error.args[0]}")
        raise

    else:
        return z
```

```erlang [Erlang]
%% Handler for procedure 'com.example.add'
Add = fun
    ([X, Y], _KWArgs, _Details) when is_number(X), is_number(Y) ->
        {ok, #{args => [X + Y]}};
    (_Args, _KWArgs, _Details) ->
        {error, #{uri => <<"com.example.error.invalid_argument">>}}
end,

{ok, _RegistrationId} = bondy_connect_client:register(
    Conn, <<"com.example.add">>, Add
).
```

:::

## Making a Call

::: code-group sdk

```python [Python]
# The user provides and input for x and y
try:
    z = await self._session.call("com.example.add", x, y)

except Exception as error:
    print(f"RPC failed: {error.args[0]}")

else:
    print(f"{x} + {y} = {z}")
```

```erlang [Erlang]
case bondy_connect_client:call(Conn, <<"com.example.add">>, [X, Y]) of
    {ok, #{args := [Z]}} ->
        io:format("~p + ~p = ~p~n", [X, Y, Z]);
    {error, Error} ->
        io:format("RPC failed: ~p~n", [Error])
end.
```

:::


## Call Timeouts

Pass `timeout` in the call options to bound how long the call can run. Bondy reads `timeout` in milliseconds, as WAMP defines it, and accepts only a non-negative integer. Autobahn|Python and the Bondy Connect SDK send the value unchanged, so pass milliseconds:

::: code-group sdk

```python [Python]
from autobahn.wamp.types import CallOptions

try:
    z = await self._session.call(
        "com.example.add", x, y,
        options=CallOptions(timeout=5000)  # 5 seconds
    )
except Exception as error:
    print(f"Call timed out or failed: {error.args[0]}")
```

```erlang [Erlang]
Options = #{timeout => 5000},  %% 5 seconds

case bondy_connect_client:call(Conn, <<"com.example.add">>, [X, Y], #{}, Options) of
    {ok, #{args := [Z]}} ->
        Z;
    {error, Error} ->
        io:format("Call timed out or failed: ~p~n", [Error])
end.
```

:::

A timed-out call fails with `wamp.error.timeout`. Without `timeout`, Bondy applies the node default; with a `timeout` of `0`, it applies the node maximum. The Bondy Connect SDK also runs its own timer for the same duration, or for 30 seconds without `timeout`. When that timer fires first, the error is `#{kind := client, reason := timeout}`. See [Call Timeout](/connect/reference/configuration/wamp#call-timeout).

## Caller Identification

Bondy discloses the caller to the callee by default. To read the caller's identity, read `caller`, `caller_authid` and `caller_authrole` from the invocation details. In Python, register with `RegisterOptions(details_arg=...)` to receive the details. In Erlang, the details are the handler's third argument:

::: code-group sdk

```python [Python]
from autobahn.wamp.types import RegisterOptions

# Callee: read the caller's identity
def handle_sensitive_op(x, y, details=None):
    print("Called by session:", details.caller)
    print("Authenticated as:", details.caller_authid)
    return x + y

self._session.register(
    handle_sensitive_op, "com.example.sensitive_op",
    options=RegisterOptions(details_arg="details")
)

# Caller: no option is needed
await self._session.call("com.example.sensitive_op", x, y)
```

```erlang [Erlang]
%% Callee: read the caller's identity
SensitiveOp = fun([X, Y], _KWArgs, Details) ->
    io:format("Called by session: ~p~n", [maps:get(caller, Details)]),
    io:format("Authenticated as: ~p~n", [maps:get(caller_authid, Details)]),
    {ok, #{args => [X + Y]}}
end,

{ok, _} = bondy_connect_client:register(
    Conn, <<"com.example.sensitive_op">>, SensitiveOp
),

%% Caller: no option is needed
{ok, _} = bondy_connect_client:call(Conn, <<"com.example.sensitive_op">>, [X, Y]).
```

:::

Bondy omits the caller only when the registration sets `disclose_caller` to `false` and the call sets `disclose_me` to `false`. See [Caller Identification](/connect/concepts/wamp/advanced/rpc#caller-identification).

## Progressive Call Results

A callee streams partial results by calling the progress callback Bondy hands it before returning its final result; a caller opts in and receives each one before the terminal result:

::: code-group sdk

```python [Python]
from autobahn.wamp.types import RegisterOptions, CallOptions

# Callee: stream rows as they're produced
async def large_query(query, details=None):
    total = 0
    async for row in execute_query(query):
        total += 1
        if details.progress:
            details.progress(row)
    return {"total_rows": total}

self._session.register(
    large_query, "com.example.large_query",
    options=RegisterOptions(details_arg="details")
)

# Caller: request progress and handle each chunk
def on_progress(row):
    print("Row:", row)

result = await self._session.call(
    "com.example.large_query", query,
    options=CallOptions(on_progress=on_progress)
)
```

```erlang [Erlang]
%% Callee: stream rows as they are produced
LargeQuery = fun([Query], _KWArgs, Details) ->
    %% `progress` is present only when the caller asked for progressive results
    Progress = maps:get(progress, Details, fun(_, _) -> ok end),
    Total = lists:foldl(
        fun(Row, Count) ->
            ok = Progress([Row], #{}),
            Count + 1
        end,
        0,
        execute_query(Query)
    ),
    {ok, #{args => [#{total_rows => Total}]}}
end,

{ok, _} = bondy_connect_client:register(
    Conn, <<"com.example.large_query">>, LargeQuery
),

%% Caller: request progress and handle each chunk
{ok, Token} = bondy_connect_client:call_async(
    Conn, <<"com.example.large_query">>, [Query], #{},
    #{receive_progress => true}
),

Receive = fun Loop() ->
    receive
        {bondy_connect_client, Token, {progress, #{args := [Row]}}} ->
            io:format("Row: ~p~n", [Row]),
            Loop();
        {bondy_connect_client, Token, {ok, #{args := [Summary]}}} ->
            Summary;
        {bondy_connect_client, Token, {error, Error}} ->
            error(Error)
    end
end,

Result = Receive().
```

:::

Bondy always offers this feature and negotiates it silently. The feature is active only when the caller announced `progressive_call_results` and the callee announced both `progressive_call_results` and `call_canceling`. Otherwise the callee sees a plain call and returns once. See [Progressive Call Results](/connect/concepts/wamp/advanced/rpc#progressive-call-results) for the cluster-wide ordering and timeout semantics, and the [Bondy Connect SDK reference](/connect/reference/clients/bondy_connect_sdk#progressive-calls-and-results) for the Erlang messages in full. In Erlang, only `call_async/5` accepts `receive_progress`; `call/5` rejects it.

## Pattern-based Registrations

Register a URI prefix or wildcard instead of an exact URI to handle a whole family of procedures from one registration:

::: code-group sdk

```python [Python]
from autobahn.wamp.types import RegisterOptions

async def users_handler(*args, details=None, **kwargs):
    operation = details.procedure.split(".")[-1]
    if operation == "get":
        return get_user(*args)
    elif operation == "list":
        return list_users(**kwargs)
    raise Exception(f"Unknown operation: {operation}")

self._session.register(
    users_handler, "com.example.users.",
    options=RegisterOptions(match="prefix", details_arg="details")
)

# com.example.users.get and com.example.users.list both route here
```

```erlang [Erlang]
UsersHandler = fun
    (Args, _KWArgs, #{procedure := <<"com.example.users.get">>}) ->
        {ok, #{args => [get_user(Args)]}};
    (_Args, KWArgs, #{procedure := <<"com.example.users.list">>}) ->
        {ok, #{args => [list_users(KWArgs)]}};
    (_Args, _KWArgs, #{procedure := Procedure}) ->
        {error, #{
            uri => <<"com.example.error.unknown_operation">>,
            args => [Procedure]
        }}
end,

{ok, _} = bondy_connect_client:register(
    Conn, <<"com.example.users.">>, UsersHandler, #{match => <<"prefix">>}
).

%% com.example.users.get and com.example.users.list both route here
```

:::

The `procedure` detail carries the exact URI a caller invoked, so one registration can dispatch on it. See [Pattern-based Registrations](/connect/concepts/wamp/advanced/rpc#pattern-based-registrations) for `prefix` vs. `wildcard` matching and RESTful-resource patterns built on it.

## Shared Registrations

More than one callee can register the same procedure URI; the `invoke` registration option controls how Bondy distributes calls across them:

::: code-group sdk

```python [Python]
from autobahn.wamp.types import RegisterOptions

# Each instance registers the same URI with the same policy
self._session.register(
    process_handler, "com.example.process",
    options=RegisterOptions(invoke="roundrobin")
)
```

```erlang [Erlang]
%% Each instance registers the same URI with the same policy
{ok, _} = bondy_connect_client:register(
    Conn, <<"com.example.process">>, ProcessHandler,
    #{invoke => <<"roundrobin">>}
).
```

:::

`roundrobin` and `random` spread load across every registered callee; `first`/`last` give an active/standby or canary-deployment pattern; `single` rejects a second registration outright. When a callee disconnects, Bondy removes its registration and redistributes across whatever remains — no manual failover step. See [Shared Registrations](/connect/concepts/wamp/advanced/rpc#shared-registrations) for each policy's behaviour in depth.

## Registration Meta Events and Procedures

Bondy publishes a registration's lifecycle as WAMP meta-events, and lets a session introspect the registry directly, both under the reserved `wamp.registration.*` namespace:

::: code-group sdk

```python [Python]
# Watch registration/unregistration on this realm
await self._session.subscribe(
    on_registered, "wamp.registration.on_register"
)
await self._session.subscribe(
    on_unregistered, "wamp.registration.on_unregister"
)

# Find the registration that serves calls to a procedure URI
reg_id = await self._session.call("wamp.registration.match", "com.example.users.get")
```

```erlang [Erlang]
%% Watch registration/unregistration on this realm
{ok, _} = bondy_connect_client:subscribe(
    Conn, <<"wamp.registration.on_register">>, OnRegistered
),
{ok, _} = bondy_connect_client:subscribe(
    Conn, <<"wamp.registration.on_unregister">>, OnUnregistered
),

%% Find the registration that serves calls to a procedure URI.
%% The result has no argument when no registration matches.
{ok, #{args := Match}} = bondy_connect_client:call(
    Conn, <<"wamp.registration.match">>, [<<"com.example.users.get">>]
).
```

:::

Use this for operational visibility — knowing when a shared registration gains or loses a callee — rather than as part of your application's own call path. Bondy does not publish [`wamp.registration.on_create` or `wamp.registration.on_delete`](/connect/reference/wamp_api/registration#topics). To learn whether a procedure still has a callee, call `wamp.registration.lookup` or `wamp.registration.match`.

