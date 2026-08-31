---
outline: [2,3]
related:
    - text: Alarms
      type: Concept
      link: /router/concepts/alarms
      description: What an alarm is, why the catalogue exists, and what Bondy deliberately does not do about alarms.
    - text: Alarms API
      type: API Reference
      link: /router/reference/wamp_api/alarm
      description: Reading alarms, history and this catalogue over WAMP.
    - text: Responding to an Alarm
      type: How-to Guide
      link: /router/guides/administration/responding_to_alarms
      description: The steps from a raised alarm to a sanctioned remediation.
---

# Alarm Catalogue

Every condition this build of Bondy can raise. The same table is readable at
runtime through
[`bondy.alarm.catalogue`](/router/reference/wamp_api/alarm#bondy.alarm.catalogue),
which is authoritative for the node you are talking to.

Entries are grouped by **class** — who is expected to act. An alarm id is
either an atom or a tuple; a tuple id has one variable element per instance,
written `_` below and rendered on the wire as a list of strings.

## Reading an entry

| Field | Meaning |
|---|---|
| **Id** | The id pattern. `_` matches any value in that position, so one entry covers every instance of a per-service, per-relay or per-shard condition. |
| **Severity** | `warning`, `major` or `critical`. Names the operator's response, not the feeling: ignore in hours, page in hours, page now. |
| **Readiness** | Whether the condition takes the node out of the load balancer. Independent of severity. |
| **Details** | The keys the alarm carries under `details`. An entry declaring none may still carry some; it promises nothing. |
| **Configuration** | The keys that govern the condition. |
| **Observe with** | Read-only procedures and metrics that show more, each as `{kind, ref}` with `kind` either `procedure` or `metric`. Never a mutating procedure. The [task catalogue](/router/reference/wamp_api/task) uses the same field name and shape. |
| **Tasks** | Procedures sanctioned as a remediation, from the [task catalogue](/router/reference/wamp_api/task). An empty list means Bondy has no remediation for this condition. |

Most conditions clear when their producer next observes them to be false. Two
do not — both retention limits latch until the node restarts, and each says so
at its entry.

## Integration — an external dependency is failing

The node is healthy; something it talks to is not. Neither condition drains the
node, because the WAMP data plane is unaffected.

### `{http_connector_service_down, _}`

An HTTP connector service is failing its liveness probe.

- **Severity** `major` · **Readiness** unaffected
- **Details** `service`, `endpoint`, `reason`
- **Configuration** `http_connector.services.$service.liveness.interval`,
  `http_connector.services.$service.liveness.failure_threshold`,
  `http_connector.services.$service.liveness.success_threshold`
- **Signals** metrics `bondy_http_connector_pool_up`,
  `bondy_http_connector_liveness_probes_total`
- **Tasks** none

Calls routed to this service fail while the alarm is up. The alarm clears when
`success_threshold` consecutive probes succeed.

### `{mail_relay_down, _}`

An outbound mail relay is failing its health check.

- **Severity** `major` · **Readiness** unaffected
- **Details** `relay`, `consecutive_failures`
- **Configuration** `mail.relay.$name.health.failure_threshold`,
  `mail.relay.$name.health.success_threshold`
- **Signals** `bondy.mail.status.get`, `bondy.mail.relay.list`, metrics
  `bondy_mail_relay_up`, `bondy_mail_failed_total`
- **Tasks** [`bondy.mail.test`](/router/reference/wamp_api/task)

## Realm — one realm's surface is affected

### `{bondy_mcp_name_collision, _, _}`

Two MCP manifest entries in a realm resolve to the same name; **neither is
exposed**.

- **Severity** `major` · **Readiness** unaffected
- **Details** none — the realm and the colliding name are carried in the id
  itself, which renders as `["bondy_mcp_name_collision", "<realm>", "<name>"]`
- **Configuration** none
- **Signals** `bondy.mcp.overlay.list`, `bondy.mcp.overlay.get`
- **Tasks** `bondy.mcp.overlay.load`, `bondy.mcp.overlay.delete`

Both sides are withheld rather than one being picked, so a collision is always
visible as absence rather than as a silently wrong binding. The alarm clears on
the first manifest rebuild in which the collision is gone. See
[MCP Gateway](/router/concepts/mcp_gateway).

## Node — this node cannot do something

### `bondy_db_main_unavailable`

The durable `main` database could not be opened.

- **Severity** `critical` · **Readiness** the node reports **NOT READY**, but
  not through this alarm — readiness is read from
  `bondy_namespace_catalog:main_status/0`
- **Details** none
- **Configuration** `platform_data_dir`
- **Signals** none · **Tasks** none

The readiness flag deliberately bypasses the alarm subsystem. A condition
this severe must survive a crash of the handler reporting it, so it is recorded
outside the alarm state and only mirrored as an alarm. Durable operations fail
while this holds.

### `{bondy_oplog_drain_stalled, _}`

A write-ahead-log drain is processing frames without committing a new position.

- **Severity** `major` · **Readiness** unaffected
- **Details** `instance_id`, `stalled_for_ms`, `committed_position`
- **Configuration** `db.drain.stall_alarm`
- **Signals** none · **Tasks** none

### `retained_messages_count_limit`

Retained messages have reached the configured count limit; further messages are
not retained.

- **Severity** `warning` · **Readiness** unaffected
- **Details** none · **Configuration** `wamp.message_retention.max_messages`
- **Signals** none · **Tasks** none

Publishing continues normally; only retention stops. This is one of two alarms
raised on a request path, so it may carry an `onset_trace_id` naming the
publication that first crossed the ceiling.

::: warning This alarm latches
Nothing clears it. Retention has no path that observes the count falling back
under the limit, so once raised the alarm stays raised until the node restarts —
including after messages are taken and the realm is well under its ceiling
again. Read it as "this node hit the ceiling since it started", not as "this
node is at the ceiling now". Use the realm's retained-message counters to
answer the second question.
:::

### `retained_messages_memory_limit`

Retained messages have reached the configured memory limit; further messages
are not retained.

- **Severity** `warning` · **Readiness** unaffected
- **Details** none · **Configuration** `wamp.message_retention.max_memory`
- **Signals** none · **Tasks** none

::: warning This alarm latches
As with the count limit above, nothing clears it; it stays raised until the
node restarts.
:::

## Cluster — convergence is affected

### `bondy_oplog_retirement_not_persistent`

The origin retirement set cannot be read or written; frontier reaping is
disabled cluster-wide.

- **Severity** `major` · **Readiness** unaffected
- **Details** none · **Configuration** `db.origin_retirement.path`
- **Signals** none · **Tasks** none

Replication continues. What stops is the reclamation of retired origins, so
metadata grows until the path is writable again.

### `bondy_oplog_sync_oversized_items`

Anti-entropy is skipping stored values larger than the inter-node frame cap;
they cannot converge.

- **Severity** `major` · **Readiness** unaffected
- **Details** none · **Configuration** `cluster.max_message_size`
- **Signals** metrics `bondy_oplog_sync_oversized_item_total`,
  `bondy_oplog_sync_oversized_item_last_bytes`
- **Tasks** none

The affected data cannot converge until the cap is raised above the item's
size. The `..._last_bytes` metric and the warning logs name the size and
identity of the offending item.

## Vocabularies

### Severity

| Value | Meaning |
|---|---|
| `warning` | A limit has been reached and something is being skipped. Handle in hours. |
| `major` | A subsystem or dependency is not working. Page in hours. |
| `critical` | The node cannot perform durable work. Page now. |

### Class

| Value | Who acts |
|---|---|
| `node` | Whoever operates this node. |
| `cluster` | Whoever operates the cluster; the condition is not local. |
| `realm` | The affected realm carries `realm_uri`; the condition is scoped to one tenant's surface. |
| `integration` | An external dependency, reachable from configuration. |

A `realm` alarm names its tenant in `realm_uri`. That field labels the affected
realm for an operator — it does not grant that tenant access to the API, which
stays master-realm only.
