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
[`bondy.alarm.catalogue`](/router/reference/wamp_api/alarm#bondy-alarm-catalogue-catalogue),
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

Every condition clears when its producer next observes it to be false. Each
producer observes on its own schedule, so an alarm clears one cycle after the
condition goes away rather than at the instant it does — the entry says which
cycle where it is not obvious.

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
- **Observe with** metrics `bondy_http_connector_pool_up`,
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
- **Observe with** `bondy.mail.status.get`, `bondy.mail.relay.list`, metrics
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
- **Observe with** `bondy.mcp.overlay.list`, `bondy.mcp.overlay.get`
- **Tasks** `bondy.mcp.overlay.load`, `bondy.mcp.overlay.delete`

Both sides are withheld rather than one being picked, so a collision is always
visible as absence rather than as a silently wrong binding. The alarm clears on
the first manifest rebuild in which the collision is gone. See
[MCP Gateway](/router/concepts/mcp_gateway).

### `{retained_messages_count_limit, _}`

A realm's retained messages have reached the configured count limit; further
messages are not retained.

- **Severity** `warning` · **Readiness** unaffected
- **Details** `limit` · **Configuration** `wamp.message_retention.max_messages`
- **Observe with** none · **Tasks** none

Publishing continues normally; only retention stops. This is one of two alarms
raised on a request path, so it may carry an `onset_trace_id` naming the
publication that first crossed the ceiling.

The ceiling is a node-wide *value*, but it is applied to each realm's own
counters — so the condition is per realm and the id names the realm it holds
for. One realm at its ceiling says nothing about another.

Cleared by the retained-message eviction pass, which re-evaluates the ceiling
for every realm currently holding one of these alarms. That pass runs once a
minute, so expect up to a minute between a realm dropping back under its
ceiling and the alarm clearing.

### `{retained_messages_memory_limit, _}`

A realm's retained messages have reached the configured memory limit; further
messages are not retained.

- **Severity** `warning` · **Readiness** unaffected
- **Details** `limit` · **Configuration** `wamp.message_retention.max_memory`
- **Observe with** none · **Tasks** none

Per realm and cleared on the same cycle as the count limit above.

::: tip A memory limit of `0` means no limit
Unlike `max_messages`, this key accepts `0`, and `0` disables the ceiling
rather than setting it to zero.
:::

## Node — this node cannot do something

### `bondy_db_main_unavailable`

The durable `main` database could not be opened.

- **Severity** `critical` · **Readiness** the node reports **NOT READY**, but
  not through this alarm — readiness is read from
  `bondy_namespace_catalog:main_status/0`
- **Details** none
- **Configuration** `platform_data_dir`
- **Observe with** none · **Tasks** none

The readiness flag deliberately bypasses the alarm subsystem. A condition
this severe must survive a crash of the handler reporting it, so it is recorded
outside the alarm state and only mirrored as an alarm. Durable operations fail
while this holds.

### `{bondy_oplog_instance_down, _}`

A storage shard instance is not running, so its tables are unavailable on this
node.

- **Severity** `critical` · **Readiness** the node reports **NOT READY**, but
  not through this alarm — readiness is read from
  `bondy_oplog_instance_keeper:not_running/0`
- **Details** `instance_id`
- **Configuration** none
- **Observe with** none · **Tasks** none

A shard instance restarts in place after a crash. When its supervisor gives up
after repeated crashes, the instance is stopped, this alarm is raised, and the
instance is started again with its original options after a backoff: 1 s,
doubling to 60 s per consecutive failure, reset once the instance stays up for
60 s. The alarm clears when the instance is running again, or when it was
stopped on purpose (its table was closed). Like `bondy_db_main_unavailable`,
the readiness signal is recorded outside the alarm subsystem and only mirrored
as an alarm.

### `bondy_memory_high`

The node's memory use is above the high watermark of its limit, and admission
gates refuse new work.

- **Severity** `major` · **Readiness** unaffected
- **Details** `usage_bytes`, `limit_bytes`, `source`
- **Configuration** `load_regulation.memory_monitor.high_watermark`,
  `load_regulation.memory_monitor.low_watermark`,
  `load_regulation.memory_monitor.limit`
- **Observe with** none · **Tasks** none

While it holds, a new session open or token issue is refused with a retryable
error; work already admitted is not shed. It clears when sampled use falls to
the low watermark, each crossing held for three consecutive samples. Inside a
cgroup the limit is the cgroup's; otherwise it is
`load_regulation.memory_monitor.limit`, and with neither the monitor never
raises this alarm. See
[Overload Protection](/router/reference/configuration/overload_protection#memory-monitor).

### `{bondy_oplog_frontier_hole, _}`

A storage shard instance has carried a gap in its applied frontier for longer
than the alarm threshold.

- **Severity** `major` · **Readiness** unaffected
- **Details** `instance_id`, `held_for_ms`, `holes`, `origins`
- **Configuration** `db.frontier.hole_alarm` (default `5m`)
- **Observe with** none · **Tasks** none

`origins` carries, per origin, the sequence number the gap starts at and how
much is stranded above it. The standing condition is also exported as the
`bondy_oplog_instance_frontier_holes` and
`bondy_oplog_instance_frontier_pending_seqs` metrics. The check runs every
10 s and keeps running when anti-entropy is off.

### `{bondy_oplog_bucket_unroutable, _}`

A storage shard instance received replicated data for a table it does not
declare, and withheld the peer's frontier.

- **Severity** `major` · **Readiness** unaffected
- **Details** `instance_id`, `buckets`
- **Configuration** none
- **Observe with** none · **Tasks** none

`buckets` names exactly the tables to declare. Until they are, each
anti-entropy round leaves this instance behind the peer and schedules another
catalogue re-bootstrap; the alarm is what marks that cycle as this cause rather
than a peer that compacted history.

### `{bondy_oplog_frontier_receipt_derived, _}`

A storage shard instance restored an applied frontier that an earlier release
derived from receipt rather than from applying.

- **Severity** `major` · **Readiness** unaffected
- **Details** `instance_id`, `origins`, `claimed`
- **Configuration** none
- **Observe with** none · **Tasks** none

Such a frontier may claim an applied prefix over data that was never applied,
which hides a real gap from the convergence checks and lets the unapplied
events be truncated. No merge can lower a frontier entry, so this cannot be
repaired in place: wipe this instance's data directory and let it
re-bootstrap from a peer.

### `{bondy_oplog_drain_stalled, _}`

A write-ahead-log drain is processing frames without committing a new position.

- **Severity** `major` · **Readiness** unaffected
- **Details** `instance_id`, `stalled_for_ms`, `committed_position`
- **Configuration** `db.drain.stall_alarm`
- **Observe with** none · **Tasks** none

## Cluster — convergence is affected

### `bondy_oplog_retirement_not_persistent`

The origin retirement set cannot be read or written; frontier reaping is
disabled cluster-wide.

- **Severity** `major` · **Readiness** unaffected
- **Details** none · **Configuration** `db.origin_retirement.path`
- **Observe with** none · **Tasks** none

Replication continues. What stops is the reclamation of retired origins, so
metadata grows until the path is writable again.

### `bondy_oplog_sync_oversized_items`

Anti-entropy is skipping stored values larger than the inter-node frame cap;
they cannot converge.

- **Severity** `major` · **Readiness** unaffected
- **Details** none · **Configuration** `cluster.max_message_size`
- **Observe with** metrics `bondy_oplog_sync_oversized_item_total`,
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
