---
outline: [2,3]
related:
    - text: MCP Gateway
      type: Concept
      link: /router/concepts/mcp_gateway
      description: Why the manifest is empty by default and what a shipped overlay is for.
    - text: Exposing an MCP Endpoint
      type: How-to Guide
      link: /router/guides/administration/exposing_an_mcp_endpoint
      description: Standing up the listener this guide assumes.
    - text: Alarms API
      type: API Reference
      link: /router/reference/wamp_api/alarm
      description: The procedures and topics the shipped overlay names.
    - text: Task Catalogue API
      type: API Reference
      link: /router/reference/wamp_api/task
      description: What the agent reads to recommend a remediation.
---

# Giving an Agent Read-Only Access

Let an SRE agent observe a Bondy cluster over MCP — read alarms, correlate them
with the catalogue, watch transitions, and recommend a remediation — without
giving it the ability to change anything, and without handing it an operator's
credential.

The result is an agent that answers "what is wrong and what would you do about
it", where the doing stays with a human.

## Before you start

You need an [MCP endpoint](/router/guides/administration/exposing_an_mcp_endpoint)
whose listener can serve the **master realm**, because that is the only realm
the alarm and task APIs answer in. You also need a master-realm session for
yourself to run the steps below.

::: warning This is a master-realm grant
The agent will hold a credential for the most privileged realm Bondy has.
Everything below narrows what that credential can do, but the narrowing is the
protection — review it as you would any master-realm grant, not as a monitoring
convenience.
:::

## 1. Get the shipped overlay document

Call [`bondy.mcp.overlay.suggested`](/router/reference/wamp_api/mcp). It takes
no arguments and returns the documents Bondy ships:

```json
{"documents": [{"id": "bondy_sre_read", "version": "1.0.0", "entries": [ ... ]}]}
```

`bondy_sre_read` names six tools and three resources in the master realm:

| Entry | Kind | What it gives the agent |
|---|---|---|
| `bondy.alarm.list` | tool | Every alarm raised across the cluster, plus which nodes were silent. |
| `bondy.alarm.get` | tool | One alarm by its wire id, and where it holds. |
| `bondy.alarm.history` | tool | The serving node's last 100 transitions. |
| `bondy.alarm.catalogue` | tool | Every condition this build can raise, with what to observe and the sanctioned tasks. |
| `bondy.task.catalogue` | tool | Every sanctioned remediation, with its impact, blast radius and arguments. |
| `bondy.task.describe` | tool | Whether one procedure is a sanctioned task. |
| `bondy.alarm.raised` / `.updated` / `.cleared` | resources | The transition stream, as MCP resources the agent can subscribe to. |

Returning the document has not exposed anything. Nothing is loaded yet.

## 2. Load it

Pass the document to
[`bondy.mcp.overlay.load`](/router/reference/wamp_api/mcp) unchanged. Under the
default `curated` manifest mode, the master realm's MCP manifest now holds
exactly these nine entries and nothing else.

To expose less, delete entries before loading — it is an ordinary overlay
document once you hold it. Give a trimmed document its own `id` so a later
`suggested` does not read as the same thing.

## 3. Create the agent's role

Create a group for the tier and grant it only what the overlay names.

```json
{
  "name": "sre_readonly",
  "meta": {"description": "Read-only alarm and task catalogue access for SRE agents."}
}
```

Then grant, on the master realm:

- `wamp.call` on each of the six procedure URIs, `exact` match.
- `wamp.subscribe` on `bondy.alarm.raised`, `bondy.alarm.updated` and
  `bondy.alarm.cleared`, `exact` match.

Grant the URIs individually rather than a `bondy.alarm.` prefix. A prefix grant
would also cover procedures added to the family later, which is the opposite of
what this tier is for.

Nothing here grants a task. `bondy.task.catalogue` tells the agent that
`bondy.mail.test` exists and what it costs; calling it needs a `wamp.call`
grant on that URI, which this group does not have.

## 4. Issue the agent a role-restricted ticket

From your own master-realm session, call
[`bondy.ticket.issue`](/router/reference/wamp_api/ticket) with `authroles` set
to the group you just created, and a short expiry:

```json
{"authroles": ["sre_readonly"], "expiry_time_secs": 3600}
```

`authroles` must be a subset of the roles your session holds, so add yourself
to `sre_readonly` first if you are not already in it.

A session authenticating with this ticket gets **exactly** those roles. The
bearer may request fewer at establishment but can never widen past them, and a
request entirely outside them is refused. The agent never sees your credential,
and revoking the ticket revokes the agent.

## 5. Point the agent at the endpoint

The agent presents the ticket as a `Bearer` credential against the master
realm's MCP path. Bondy tells a ticket from an OAuth2 JWT by its claims, so no
extra configuration is needed.

## 6. Verify the projection

Have the agent call `tools/list` and `resources/list`.

You should see **six tools and three resources**, and nothing else. `tools/list`
is RBAC-projected: an entry whose procedure the caller may not call is absent,
and asking for it by name answers exactly as if it did not exist.

Two checks worth doing explicitly:

- **Drop one grant and re-list.** The tool disappears. That is the projection
  working, and it is the control that matters — the overlay decides what
  *could* be visible, RBAC decides what is.
- **Have the agent call a task URI directly**, for example
  `bondy.mail.test`. It is refused. An agent that ignores the catalogue's
  grades still meets an RBAC denial; the catalogue informs, RBAC enforces.

You now have an agent that can observe the cluster and recommend, and cannot
act.

## Letting the agent act, later

If you decide an agent should run a remediation, that is a second, deliberate
change and Bondy ships nothing for it. Write your own overlay document naming
the specific procedures you sanction, grant a second group `wamp.call` on
exactly those URIs, and issue the agent a ticket carrying that group.

Read [`bondy.task.catalogue`](/router/reference/wamp_api/task) first. It gives
you each procedure's `impact`, `blast_radius`, whether it is `idempotent`, what
`reverses` it, and whether it supports `dry_run` — which is the material for
deciding which ones you are prepared to sanction, and the reason Bondy does not
decide it for you.
