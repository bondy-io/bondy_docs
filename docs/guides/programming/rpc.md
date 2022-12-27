---
draft: true
---
# Remote Procedure Calls


## Requirements


<tabs cache-lifetime="1000">
    <tab name="Python">
        <ul>
            <li>Python 3.7+ (Recommended python 3.10)</li>
            <li>WAMP Client library: <a href="https://github.com/crossbario/autobahn-python">Autobhan|Python</a></li>
        </ul>
    </tab>
    <tab name="JS">
        First tab content
    </tab>
    <tab name="Erlang">
        Third tab content
    </tab>
</tabs>

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

<tabs cache-lifetime="1000">
    <tab name="Python">
        First tab content
    </tab>
    <tab name="JS">
        Second tab content
    </tab>
    <tab name="Erlang">
        Third tab content
    </tab>
</tabs>

## Caller Identification

<tabs cache-lifetime="1000">
    <tab name="Python">
        First tab content
    </tab>
    <tab name="JS">
        Second tab content
    </tab>
    <tab name="Erlang">
        Third tab content
    </tab>
</tabs>

## Progressive Call Results

<tabs cache-lifetime="1000">
    <tab name="Python">
        First tab content
    </tab>
    <tab name="JS">
        Second tab content
    </tab>
    <tab name="Erlang">
        Third tab content
    </tab>
</tabs>

## Pattern-based Registrations

<tabs cache-lifetime="1000">
    <tab name="Python">
        First tab content
    </tab>
    <tab name="JS">
        Second tab content
    </tab>
    <tab name="Erlang">
        Third tab content
    </tab>
</tabs>

## Shared Registrations

<tabs cache-lifetime="1000">
    <tab name="Python">
        First tab content
    </tab>
    <tab name="JS">
        Second tab content
    </tab>
    <tab name="Erlang">
        Third tab content
    </tab>
</tabs>

## Registration Meta Ebents and Procedures

<tabs cache-lifetime="1000">
    <tab name="Python">
        First tab content
    </tab>
    <tab name="JS">
        Second tab content
    </tab>
    <tab name="Erlang">
        Third tab content
    </tab>
</tabs>
