---
related:
    - text: Advanced RPC
      type: Concept
      link: /concepts/wamp/advanced/rpc
      description: The protocol-level mechanics behind every feature below.
    - text: Routed RPC
      type: Concept
      link: /concepts/wamp/rpc
      description: The fundamentals of Remote Procedure Calls in WAMP.
---
# Remote Procedure Calls

This guide shows the practical, Python side of RPC programming against Bondy — assuming you already know what a registration, a call, and a routed RPC are. For the protocol-level mechanics of each advanced feature (why it works the way it does, its wire behaviour, its cluster-wide semantics), see [Advanced RPC](/concepts/wamp/advanced/rpc); this guide only shows how to reach for it in code.

## Requirements

- Python 3.7+ (3.10 recommended)
- A WAMP client library: [Autobahn|Python](https://github.com/crossbario/autobahn-python)

## Establishing a connection

::: code-group
```Python
import os
import signal

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
:::





## How Registrations Work

A registration binds a procedure URI to your session on the router; Bondy routes any matching call to it, rather than a caller connecting to your process directly. See [Routed RPC](/concepts/wamp/rpc) for why WAMP works this way.

## Basic Registrations

Typically, you will place you procedure registration on the session's `on_join` callback, that way as soon as the session has been established your component will register the procedures it offers.

In the following snippet we register the procedure `com.example.add` which takes two integers as arguments.

::: code-group
```Python
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
:::

## Making a Call

::: code-group
```Python
# The user provides and input for x and y
try:
    z = await self._session.call("com.example.add", x, y)

except Exception as error:
    print(f"RPC failed: {error.args[0]}")

else:
    print(f"{x} + {y} = {z}")

```
:::


## Call Timeouts

Pass `timeout` (in seconds) via `CallOptions` to bound how long you'll wait for a result:

::: code-group
```Python
from autobahn.wamp.types import CallOptions

try:
    z = await self._session.call(
        "com.example.add", x, y,
        options=CallOptions(timeout=5)
    )
except Exception as error:
    print(f"Call timed out or failed: {error.args[0]}")
```
:::

A timed-out call raises `wamp.error.timeout`. This is the client-requested timeout; see [Call Timeout](/reference/configuration/wamp#call-timeout) for the node-wide default and maximum Bondy enforces regardless of what a caller requests.

## Caller Identification

A callee that wants to know who's calling it requests disclosure with `RegisterOptions(details_arg=...)`, reading `details.caller` on invocation; the caller must separately opt in with `CallOptions(disclose_me=True)`, or nothing is disclosed:

::: code-group
```Python
from autobahn.wamp.types import RegisterOptions, CallOptions

# Callee: request caller disclosure and read it
def handle_sensitive_op(x, y, details=None):
    print("Called by session:", details.caller)
    return x + y

self._session.register(
    handle_sensitive_op, "com.example.sensitive_op",
    options=RegisterOptions(details_arg="details")
)

# Caller: consent to being identified
await self._session.call(
    "com.example.sensitive_op", x, y,
    options=CallOptions(disclose_me=True)
)
```
:::

Both sides must agree — a callee that requests disclosure still sees nothing if the caller didn't set `disclose_me`. See [Caller Identification](/concepts/wamp/advanced/rpc#caller-identification) for how Bondy's RBAC can use this for authorization beyond the basic grant check.

## Progressive Call Results

A callee streams partial results by calling the progress callback Bondy hands it before returning its final result; a caller opts in and receives each one before the terminal result:

::: code-group
```Python
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
:::

This is off by default on the router (`wamp.dealer.progressive_call_results`) and negotiates silently — if either side didn't opt in, the callee just sees a plain call and returns once. See [Progressive Call Results](/concepts/wamp/advanced/rpc#progressive-call-results) for the cluster-wide ordering and timeout semantics, and the [`bondy_connect` reference](/reference/wamp_clients/bondy_connect) for the equivalent Erlang API.

## Pattern-based Registrations

Register a URI prefix or wildcard instead of an exact URI to handle a whole family of procedures from one registration:

::: code-group
```Python
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
:::

`details.procedure` carries the exact URI a caller invoked, so one registration can dispatch by suffix. See [Pattern-based Registrations](/concepts/wamp/advanced/rpc#pattern-based-registrations) for `prefix` vs. `wildcard` matching and RESTful-resource patterns built on it.

## Shared Registrations

More than one callee can register the same procedure URI; `invoke` on `RegisterOptions` controls how Bondy distributes calls across them:

::: code-group
```Python
from autobahn.wamp.types import RegisterOptions

# Each instance registers the same URI with the same policy
self._session.register(
    process_handler, "com.example.process",
    options=RegisterOptions(invoke="roundrobin")
)
```
:::

`roundrobin` and `random` spread load across every registered callee; `first`/`last` give an active/standby or canary-deployment pattern; `single` rejects a second registration outright. When a callee disconnects, Bondy removes its registration and redistributes across whatever remains — no manual failover step. See [Shared Registrations](/concepts/wamp/advanced/rpc#shared-registrations) for each policy's behaviour in depth.

## Registration Meta Events and Procedures

Bondy publishes a registration's lifecycle as WAMP meta-events, and lets a session introspect the registry directly, both under the reserved `wamp.registration.*` namespace:

::: code-group
```Python
# Watch registration/unregistration on this realm
await self._session.subscribe(
    on_registration_created, "wamp.registration.on_create"
)
await self._session.subscribe(
    on_registration_gone, "wamp.registration.on_delete"
)

# Look up who currently serves a procedure
info = await self._session.call("wamp.registration.match", "com.example.users.get")
```
:::

Use this for operational visibility — knowing when a shared registration gains or loses a callee — rather than as part of your application's own call path.

