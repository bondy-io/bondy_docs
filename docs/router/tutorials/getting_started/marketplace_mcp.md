---
outline: [2,3]
related:
    - text: Marketplace
      type: Tutorial
      link: /router/tutorials/getting_started/marketplace
      description: The demo this tutorial extends — Python microservices and a VueJS app on one realm.
    - text: MCP Gateway
      type: Concept
      link: /router/concepts/mcp_gateway
      description: The model — eras, the manifest, RBAC projection, security.
    - text: Interface Metadata & Reflection API
      type: API Reference
      link: /router/reference/wamp_api/interface
      description: The bondy.interface.* procedures this tutorial calls.
    - text: MCP Gateway WAMP API
      type: API Reference
      link: /router/reference/wamp_api/mcp
      description: The bondy.mcp.overlay.* procedures step 3 calls.
    - text: MCP Gateway Configuration Reference
      type: Configuration Reference
      link: /router/reference/configuration/mcp
      description: Every mcp.* key used here.
---

# Marketplace for AI Agents (MCP)

The [Marketplace tutorial](/router/tutorials/getting_started/marketplace)
builds an auction market out of Python microservices: a **Market** service
written with [Autobahn|Python](https://github.com/crossbario/autobahn-python)
registers six WAMP procedures on the `com.market.demo` realm, and bots, a
CLI and a web app call them. This tutorial adds one more kind of
participant: an **AI agent** speaking the
[Model Context Protocol](https://modelcontextprotocol.io).

The point to watch is what does *not* change: `market.py` is not modified,
not restarted, and never learns MCP exists. Bondy's
[MCP Gateway](/router/concepts/mcp_gateway) exposes the already-registered
procedures as MCP *tools*; an agent's tool call is authenticated and
authorized like any other WAMP call and routed to the same Autobahn
handler the bots and the web app use.

You will:

1. Declare an MCP listener.
2. Describe the market's procedures in an interface document and load it.
3. Expose them as tools with an overlay — the step that decides what
   agents may see, and where tools get agent-friendly names.
4. Connect an MCP client and trade.

Every step is a `bondy.conf` edit or a WAMP call — no console, no code
changes.

## Prerequisites

The marketplace demo running locally, per its
[tutorial](/router/tutorials/getting_started/marketplace) — Bondy with the
demo's realm configuration, and the market service connected. You also
need Python 3 with `autobahn` installed for the loader script in step 2
(the demo's own virtualenv works).

## 1. Declare the MCP listener

The demo's Bondy serves WAMP-over-WebSocket on port `18080`. Add an MCP
endpoint by declaring listeners in the demo's `bondy.conf`:

```
listeners.public_http.transport = tcp
listeners.public_http.protocol  = http
listeners.public_http.port      = 18080
listeners.public_http.services  = api_gateway, wamp_ws, wamp_sse, wamp_longpoll

listeners.agents.transport = tcp
listeners.agents.protocol  = http
listeners.agents.port      = 18093
listeners.agents.services  = mcp
```

::: warning Declare every listener you need
Declaring *any* `listeners.*` key switches the node onto the declared
inventory — the built-in defaults are then gone, which is why the existing
public listener is restated above rather than only the new one added. The
reserved `admin` listener (port 18081) is always injected and needs no
declaration. See
[Network Listeners](/router/reference/configuration/listeners).
:::

Restart the Bondy container. The MCP endpoint for the demo realm is now
`http://localhost:18093/mcp/realm/com.market.demo`. The default
[origin policy](/router/reference/configuration/mcp#listeners.$name.mcp.allowed_origins)
(`local`) suits a local demo; non-browser agents send no `Origin` header
and are served regardless.

## 2. Describe and load the market's interface

Descriptions and schemas come from **interface metadata** — documents
describing the procedures, loaded through
[`bondy.interface.load`](/router/reference/wamp_api/interface). Describing
is not exposing: under Bondy's default
[`mcp.manifest.mode = curated`](/router/reference/configuration/mcp#mcp.manifest.mode)
nothing becomes a tool until step 3's overlay names it. Save this as
`market_interface.json`. The signatures mirror `market.py`'s handlers;
an MCP tool call's `arguments` object arrives at the callee as WAMP
keyword arguments, which Python applies to the handler's named parameters
— which is why no Autobahn code changes:

```json
{
  "id": "com.market.demo.interface",
  "version": "1.0.0",
  "entries": [
    {
      "realm": "com.market.demo",
      "kind": "procedure",
      "uri": "com.market.get",
      "description": "List every item currently on offer, with its name, current price, deadline and current winner if any.",
      "result_args_schema": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "price": { "type": "number" },
            "deadline": { "type": "string" },
            "winner": { "type": "string" }
          }
        }
      }
    },
    {
      "realm": "com.market.demo",
      "kind": "procedure",
      "uri": "com.market.item.get",
      "description": "Return one item's details by name, or null if it is not listed.",
      "kwargs_schema": {
        "type": "object",
        "properties": { "name": { "type": "string" } },
        "required": ["name"]
      }
    },
    {
      "realm": "com.market.demo",
      "kind": "procedure",
      "uri": "com.market.item.sell",
      "description": "List a new item for sale at a starting price. Bids are accepted for the given number of minutes. Returns false if an item with that name is already listed.",
      "kwargs_schema": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "price": { "type": "number" },
          "deadline": { "type": "number", "description": "Minutes the item stays on offer." }
        },
        "required": ["name", "price", "deadline"]
      }
    },
    {
      "realm": "com.market.demo",
      "kind": "procedure",
      "uri": "com.market.item.bid",
      "description": "Bid on a listed item. The bidder must have joined the market first. Returns true when the bid was accepted (higher than the current price), false otherwise.",
      "kwargs_schema": {
        "type": "object",
        "properties": {
          "item_name": { "type": "string" },
          "bid": { "type": "number" },
          "bidder_name": { "type": "string" }
        },
        "required": ["item_name", "bid", "bidder_name"]
      }
    },
    {
      "realm": "com.market.demo",
      "kind": "procedure",
      "uri": "com.market.bidder.add",
      "description": "Join the market as a bidder under a unique name. Returns false when the name is taken.",
      "kwargs_schema": {
        "type": "object",
        "properties": { "name": { "type": "string" } },
        "required": ["name"]
      }
    },
    {
      "realm": "com.market.demo",
      "kind": "procedure",
      "uri": "com.market.bidder.gone",
      "description": "Leave the market. Open bids by this bidder are cancelled.",
      "kwargs_schema": {
        "type": "object",
        "properties": { "name": { "type": "string" } },
        "required": ["name"]
      }
    }
  ]
}
```

Load it with a few lines of Autobahn — the same library the demo already
uses. The document is loaded on the **master realm**
(`com.leapsight.bondy`), which the demo's permissive local configuration
lets an anonymous session call; a production deployment would use admin
credentials here.

```python
#!/usr/bin/env python3
import json

from autobahn.asyncio.component import Component, run

component = Component(
    transports=[{"url": "ws://localhost:18080/ws"}],
    realm="com.leapsight.bondy",
)


@component.on_join
async def joined(session, details):
    with open("market_interface.json") as f:
        document = json.load(f)
    await session.call("bondy.interface.load", document)
    print("Interface loaded.")
    session.leave()


if __name__ == "__main__":
    run([component])
```

Loading the same `id` again **replaces** the document, so iterating on
descriptions and schemas is just editing the file and re-running the
script. Every node's MCP manifests rebuild from the change within about a
second.

You can verify the metadata layer from any WAMP session on the realm:

```
wamp.reflection.procedure.list("com.market.demo")
```

## 3. Expose the tools with an overlay

The **overlay** is the explicit act of exposing procedures to agents:
under the default curated mode, exactly the entries it names exist — so
this is where you decide that agents may see all six market procedures,
or only some. It is also where tools get agent-friendly names. It is
managed exactly like the interface document: a JSON file loaded over
WAMP, through [`bondy.mcp.overlay.load`](/router/reference/wamp_api/mcp).
Save this as `market_overlay.json`:

```json
{
  "id": "com.market.demo.mcp",
  "entries": [
    {"realm": "com.market.demo", "kind": "tool",
     "name": "list_items",   "wamp_procedure": "com.market.get"},
    {"realm": "com.market.demo", "kind": "tool",
     "name": "get_item",     "wamp_procedure": "com.market.item.get"},
    {"realm": "com.market.demo", "kind": "tool",
     "name": "sell_item",    "wamp_procedure": "com.market.item.sell"},
    {"realm": "com.market.demo", "kind": "tool",
     "name": "place_bid",    "wamp_procedure": "com.market.item.bid"},
    {"realm": "com.market.demo", "kind": "tool",
     "name": "join_market",  "wamp_procedure": "com.market.bidder.add"},
    {"realm": "com.market.demo", "kind": "tool",
     "name": "leave_market", "wamp_procedure": "com.market.bidder.gone"}
  ]
}
```

and extend the loader script from step 2 with one more call:

```python
    with open("market_overlay.json") as f:
        overlay = json.load(f)
    await session.call("bondy.mcp.overlay.load", overlay)
```

Each entry joins its procedure's interface entry, so descriptions and
schemas fall through from step 2 and are written once. Dropping an entry
from this file and re-loading it *unexposes* that tool — re-loading the
same `id` replaces the overlay, so widening or narrowing what agents see
is editing the file and re-running the script. (In `derived` mode, the
development convenience, described procedures also appear as URI-named
tools, and an overlay entry claiming one replaces it — agents see
`place_bid`, never both names.)

## 4. Connect an agent

Point any MCP client at:

```
http://localhost:18093/mcp/realm/com.market.demo
```

Both generations of the official TypeScript SDK work against the endpoint
— the current sessionless (`2026-07-28`) client and the v1.x
`initialize`-handshake client — and the endpoint negotiates per client.
The demo realm admits anonymous sessions, so no credentials are needed
locally. (In a real deployment the agent would present a **role-restricted
delegation ticket** as its Bearer credential instead — see
[Credentials for agents](/router/guides/administration/exposing_an_mcp_endpoint#credentials-for-agents).)

`tools/list` answers the six tools named in step 3, carrying the
descriptions and schemas from step 2 — which is exactly what an LLM needs
to plan calls. A typical agent
exchange:

1. `join_market` with `{"name": "claude"}` — registers the agent as a
   bidder (`market.py`'s `_on_new_bidder` runs, same as for any bot).
2. `list_items` — the agent reads the current offers.
3. `place_bid` with
   `{"item_name": "bike", "bid": 45.0, "bidder_name": "claude"}` — a
   `true` result means the bid was accepted, and every other participant
   sees the `com.market.item.new_price` event exactly as before.

If a tool call answers a "no such procedure" error, the catalogue is fine
and the market service is simply not connected — the manifest declares the
surface, the registry decides liveness.

## What you built

One listener declaration and two JSON documents — one describing, one
exposing — turned a two-year-old Autobahn|Python microservice into an MCP
server — with Bondy's RBAC in front of every tool call (the demo grants
anonymous callers everything; a real deployment would grant an agent
principal `wamp.call` on exactly the procedures it should see, and the
agent's `tools/list` would shrink to match). The same pattern applies to
any WAMP microservice in any language: describe it once, and both
[reflection](/router/reference/wamp_api/interface) consumers and AI agents
get the catalogue.
