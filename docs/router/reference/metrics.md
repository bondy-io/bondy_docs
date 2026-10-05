---
draft: false
outline: [2,3]
related:
    - text: "Monitoring a Bondy Cluster"
      type: "How-to Guide"
      link: "/router/guides/administration/monitoring"
      description: "Bring up the bundled Prometheus + Grafana stack against a dev cluster."
    - text: "Clustering"
      type: "Concept"
      link: "/router/concepts/clustering"
      description: "How Bondy nodes form a cluster and converge replicated state."
    - text: "Registry Routing (RIB)"
      type: "Concept"
      link: "/router/concepts/registry_routing"
      description: "The routing-summary machinery behind the Registry RIB metric family."
---

# Prometheus Metrics Reference

Every Bondy node exposes a Prometheus-format metrics endpoint at `/metrics` on the Admin API HTTP(S) listener (default port `18081`; see the [Network Listeners Reference](/router/reference/configuration/listeners)). This page catalogues the metric families by subsystem &mdash; storage stack, cluster, router/WAMP, the MCP Gateway, the HTTP Connector, mail, and the BEAM VM.

::: info Full detail lives on the endpoint
Every family is self-documenting: `curl http://<host>:18081/metrics` returns, for each family, a `# HELP` line describing it, a `# TYPE` line giving its Prometheus type, and its exact label set. This page groups and explains those families; treat the live endpoint as the authority for an individual metric's precise labels and histogram bucket boundaries.
:::

Two capture patterns are in use, and knowing which applies to a family tells you how to read it:

- **Counters** are cumulative since the emitting process started (or since the last scrape after a restart resets them to zero). Use `rate()` or `increase()` in PromQL rather than reading the raw value.
- **Gauges** are either updated as events happen (e.g. an open-socket count) or computed fresh at every scrape from live runtime state (e.g. registry size, Partisan connection counts). A scrape-time gauge that reads from a slow or wedged source degrades to an absent series rather than failing the scrape.

A metric that identifies a storage shard carries an `instance_id` label; one that identifies a remote node carries `peer` or `node`; low-cardinality classification (stage, kind, outcome, reason) is used freely, but nothing that would let a label set grow unboundedly (e.g. per-key or per-session labels) is exported.

## Storage stack (`bondy_db` / `bondy_oplog` / `bondy_mst`)

These families instrument the replicated storage layer described in [Architecture](/router/concepts/architecture): the per-shard write-ahead log, the applier that turns logged operations into queryable projections, pull-based anti-entropy (AAE) reconciliation, the Merkle Search Tree (MST) page store, and the `leveled` LSM-tree store durable shards persist to.

### Write-ahead log (WAL)

| Metric family | Type | Covers |
|---|---|---|
| `bondy_oplog_wal_appends_total`, `_appended_ops_total`, `_appended_bytes_total` | Counter | Frames, operations and bytes appended to a shard's WAL. |
| `bondy_oplog_wal_fsyncs_total`, `_fsync_bytes_total`, `_fsync_duration_microseconds` | Counter / Histogram | fsync calls, bytes made durable, and fsync latency, by `mode`. |
| `bondy_oplog_wal_rotations_total`, `_retention_deleted_segments_total`, `_retention_freed_bytes_total` | Counter | Segment rotation and retention-sweep reclamation. |
| `bondy_oplog_wal_recoveries_total`, `_recovery_truncated_bytes_total` | Counter | Recovery scans on open, and bytes truncated from a corrupt tail. |
| `bondy_oplog_wal_full_total` | Counter | Hard-backpressure activations (the WAL refused a write), by `reason`. |
| `bondy_oplog_wal_codec_ops_total`, `_codec_input_bytes_total`, `_codec_output_bytes_total` | Counter | Compression/encryption codec operations and their input/output bytes, by `op` and `algorithm`. |
| `bondy_oplog_wal_scrub_runs_total`, `_scrub_frames_checked_total`, `_scrub_corruption_total` | Counter | Background integrity-scrubber activity and corrupt frames found, by `kind`. |
| `bondy_oplog_wal_size_bytes`, `_live_segments`, `_pending_fsync_bytes`, `_waiters`, `_head_lag_milliseconds`, `_consumer_lag_bytes`, `_backpressure` | Gauge | Scrape-time writer state: on-disk size, live segments, unsynced bytes, blocked callers, unfsynced-append age, and the drain (applier) backlog. A converged-looking instance with a growing `consumer_lag_bytes` has a wedged or starved drain. |

### Applier pipeline

| Metric family | Type | Covers |
|---|---|---|
| `bondy_oplog_applier_batch_items_total`, `_batch_duration_microseconds` | Counter / Histogram | Per-stage batch throughput and latency, by `stage` (verify, fold, cell_apply, cell_put, publish, install_cast). |
| `bondy_oplog_applier_applied_total`, `_rejected_total`, `_published_total`, `_publish_skipped_total` | Counter | Apply outcomes and downstream (subscriber) notification delivery. |
| `bondy_oplog_applier_faults_total` | Counter | Fault signals, by `kind` (context regression, verify failure). |
| `bondy_oplog_applier_sweep_cells_total`, `_origins_reaped_total`, `_replayed_cells_total` | Counter | Stable-cell sweep results (the reclamation feed), origin garbage collection, and projection-replay outcomes. |
| `bondy_oplog_applier_validator_refreshes_total` | Counter | Schema/validator refresh attempts, by `outcome`. |
| `bondy_oplog_instance_mst_install_duration_microseconds`, `_mst_install_items_total` | Histogram / Counter | Latency and item count of installing an applied batch into the MST. |

### Anti-entropy sync, bootstrap & frontier convergence

| Metric family | Type | Covers |
|---|---|---|
| `bondy_oplog_sync_sessions_total`, `_sync_duration_microseconds` | Counter / Histogram | AAE sync session outcomes and duration, by `peer` and `outcome`. |
| `bondy_oplog_bootstrap_sessions_total`, `_bootstrap_duration_microseconds`, `_bootstrap_cells_total` | Counter / Histogram | Catalogue bootstrap (new or recovering node) sessions and cell-transfer outcomes. |
| `bondy_oplog_sync_scheduler_events_total`, `_gc_scheduler_events_total` | Counter | Scheduler tick activity, by `event` (dispatch, backoff, capped, load-deferred, and similar). |
| `bondy_oplog_sync_scheduler_enabled`, `_interval_milliseconds`, `_load`, `_yielding`, `_inflight` | Gauge | Live scheduler state: on/off, tick interval, run-queue load sample, load-yielding flag, in-flight sync/bootstrap sessions. |
| `bondy_oplog_aae_enabled` | Gauge | `1` when AAE is enabled on this node. |
| `bondy_oplog_instance_frontier_hash`, `_frontier_origins`, `_frontier_seq_total` | Gauge | The per-instance applied-frontier version vector: a stable hash for cross-node convergence comparison (`count_values` in PromQL &mdash; no scrape-time cross-node calls), its origin count, and its summed sequence number (monotone; a cross-node gap shows replication lag). |
| `bondy_oplog_instance_frontier_holes` | Gauge | Per-origin contiguity holes the instance carries now, by `instance_id`: sequence runs this replica never received, with later sequences of the same origin already folded above them. `0` on a healthy replica. A standing hole holds the applied frontier below it, so peers keep re-offering the origin and the MST cannot truncate past it; the `bondy_oplog_frontier_hole` alarm fires on the age of this condition. |
| `bondy_oplog_instance_frontier_pending_seqs` | Gauge | Sequence numbers the instance has folded but cannot yet claim in its frontier because they sit above a hole, by `instance_id`. Nothing is lost or re-fetched; they are reported to peers once the hole closes. This grows with traffic behind a stuck hole while the hole count stays flat. |
| `bondy_oplog_sync_oversized_item_total` | Counter | Sync items whose serialized size alone exceeds the sync response ceiling (derived from Partisan's `max_message_size`), by `kind`. A `page` is left out of the response, so the instance makes no anti-entropy progress until `cluster.max_message_size` is raised; a `cell` (catalogue bootstrap) is shipped in parts and still converges, at the cost of extra rounds. Both series are present at `0` from boot. While the count grows, the `bondy_oplog_sync_oversized_items` alarm is raised. |
| `bondy_oplog_sync_oversized_item_last_bytes` | Gauge | Serialized size in bytes of the most recent oversized sync item, by `kind` &mdash; how high `cluster.max_message_size` must go. Use `max_over_time` for the worst case. |
| `bondy_oplog_peer_last_sync_age_seconds`, `_peer_last_seen_age_seconds`, `_peer_state_entries`, `_peer_exclusions_total` | Gauge / Counter | Per-(instance, peer) sync recency, and exclusion of stale peers from a sync round. |
| `bondy_oplog_doored_events_total` | Counter | Never-applied peer operations at or below the local watermark that the **watermark door** accepted instead of discarding &mdash; folded into the projection inline, or held for the applier's replay, by `action`. A steady rate under write load is the door doing its job; see [Convergence](/router/concepts/convergence#the-watermark-door). |
| `bondy_oplog_frontier_gap_verdicts_total` | Counter | Completed sync rounds that left the peer's applied frontier strictly ahead of ours after settle, by `peer`. A single verdict per (instance, peer) is a benign transient that heals on the next round; repeats trip the re-bootstrap remedy. |
| `bondy_oplog_rebootstraps_scheduled_total` | Counter | Catalogue re-bootstraps scheduled, by `peer` &mdash; because a peer reclaimed pages this replica needs, or because a frontier gap struck twice. Streams the peer's whole projection, so a climbing count for one pair means the remedy is not fixing the cause. |
| `bondy_oplog_mst_rebuilt_total` | Counter | Unservable-own-root self-heals: the instance dropped a tree whose own root had lost pages (after proving no peer is stranded) and resumed anti-entropy on a fresh one, by `reason`. Should be zero; any occurrence means pages went missing. |
| `bondy_aae_merge_conflicts_total` | Counter | Remote AAE merges that overwrote a concurrently-edited local security cell (an LWW conflict over-approximation), by `table`. |
| `bondy_oplog_reclamation_stalled_total`, `_retirements_total` | Counter | Space-reclamation attempts stalled (naming the blocking members) and origin-retirement outcomes &mdash; see [Deletion and Reclamation](/router/concepts/deletion_and_reclamation). |
| `bondy_oplog_events_held_total` | Counter | Operations a replay held because an earlier operation from the same origin is missing. A burst on a node rejoining after truncation is the mechanism working; a sustained rate on a healthy cluster means a gap is not filling &mdash; see [Per-Origin Prefix Closure](/router/concepts/prefix_closure). |
| `bondy_oplog_prefix_holes_total` | Counter | Contiguity gaps that *materialised* into a fold. Only transient own-origin gaps from concurrent local commit reordering should register; exclude those before alerting. Any remote-origin count warrants investigation. |
| `bondy_oplog_seqs_burned_total`, `_seqs_filled_total` | Counter | Sequence numbers a rejected write-ahead append could not return to the counter, and the burned seqs whose no-op backfill landed durably. Healthy operation keeps the two equal; a persistent shortfall is a permanent gap that converts into a catalogue rebootstrap on peers. |

### MST & page store

| Metric family | Type | Covers |
|---|---|---|
| `bondy_mst_merges_total`, `_merges_abandoned_total`, `_merge_duration_microseconds` | Counter / Histogram | Merkle Search Tree reconciliation merges: outcome and duration. |
| `bondy_mst_gc_runs_total` | Counter | MST store GC runs, by `result`. |
| `bondy_mst_gc_aborted_total` | Counter | GC sweeps abandoned because the current root was unservable (pages a live root needs were missing at sweep time). Aborting stops the sweep amplifying a hole into subtree loss. `classification` names the layer that lost the page: `deleted` (store), `tombstoned` (freed but readable), `transient` (readable on re-probe, nothing lost). Per-hash evidence outlives the log &mdash; read it with `bondy_oplog_instance:gc_aborts/0,1`. |
| `bondy_mst_broadcasts_total`, `_broadcast_bytes_total` | Counter | CRDT gossip message and byte counts, by `direction`. |
| `bondy_mst_seals_total`, `_seal_records_total`, `_seal_bytes_total`, `_seal_duration_microseconds` | Counter / Histogram | Pack-store seal operations: records and bytes sealed, and seal latency, by `kind`. |
| `bondy_mst_page_store_ops_total`, `_page_store_bytes_total` | Counter | Page store read/write operations and bytes, by `op`. |
| `bondy_mst_page_store_gc_runs_total`, `_gc_pages_dropped_total`, `_gc_packs_retired_total`, `_gc_freed_bytes_total` | Counter | Page store GC sweep outcomes. |
| `bondy_mst_page_store_recoveries_total`, `bondy_mst_pack_idx_rebuilds_total` | Counter | Incoming-pack recovery and sealed-pack index rebuild outcomes, by `result`. |
| `bondy_oplog_compactions_total`, `_compaction_duration_microseconds` | Counter / Histogram | MST compaction runs and duration. |
| `bondy_oplog_compaction_holds_total` | Counter | Compaction cycles whose truncation point was **capped** below an operation the projection has not folded yet, so the cycle truncated less than its frontier allowed &mdash; or nothing. Sustained growth means the applier's replay is not keeping up with delivery for that instance; convergence is protected, but disk grows. |
| `bondy_oplog_gc_scheduler_inflight` | Gauge | MST GC and compaction runs currently executing. |

### Secondary indexes

| Metric family | Type | Covers |
|---|---|---|
| `bondy_oplog_secondary_flush_ops_total`, `_secondary_flush_duration_microseconds` | Counter / Histogram | Secondary-index write-behind flush throughput and latency, by `namespace` and `index`. |
| `bondy_oplog_secondary_saturated_dropped_total` | Counter | Index operations dropped because the flush writer was saturated. |
| `bondy_oplog_secondary_rebuilds_total` | Counter | Full index rebuilds. |

### Core substrate (reads, cache & registry)

| Metric family | Type | Covers |
|---|---|---|
| `bondy_oplog_core_reads_total`, `bondy_oplog_core_ranges_total` | Counter | Substrate point reads and range reads, by `namespace`. |
| `bondy_oplog_core_range_pages_total` | Counter | Projection pages read by range reads, by `namespace`. A range reads pages until it has `limit` live rows, so this running ahead of `bondy_oplog_core_ranges_total` counts the extra pages spent reading past cleared cells. |
| `bondy_oplog_core_cache_hits_total`, `bondy_oplog_core_cache_misses_total` | Counter | Point reads served from, and missed by, the ETS point-read cache, by `namespace`. Every point read increments exactly one of the two. |
| `bondy_oplog_core_read_rps`, `bondy_oplog_core_range_rps` | Gauge | Point and range read rates over the last refresh interval, by `namespace`. |
| `bondy_oplog_core_cache_hit_ratio` | Gauge | Per-namespace ETS point-read cache hit ratio. |
| `bondy_oplog_core_ae_lag_milliseconds`, `_freshness_lag_max_milliseconds` | Gauge | Per-shard and per-namespace anti-entropy freshness lag &mdash; the signal behind the authentication freshness fence (see the [Data Storage & Active Anti-entropy Configuration Reference](/router/reference/configuration/data_storage#active-anti-entropy)). |
| `bondy_oplog_core_subscribers` | Gauge | Pub/sub subscriber count per namespace. |
| `bondy_oplog_write_readable_latency_microseconds` | Gauge | Write-to-readable latency quantiles over a rolling window, by `instance_id` and `quantile`. |
| `bondy_oplog_instances`, `_instance_lifecycle_code`, `_instance_live_size` | Gauge | Instance counts by bootstrap lifecycle state; per-instance lifecycle code (`0` starting, `1` pre_bootstrap, `2` live); live (unapplied overlay) size. |
| `bondy_oplog_instance_appends_total`, `_instance_backpressure_total`, `_remote_appends_total`, `_apply_events_total`, `_overlay_backpressure_drops_total` | Counter | Local and remote append acceptance, backpressure rejections, and overlay drops. |

### Leveled projection store (LSM)

Durable shards persist through `leveled`; these gauges are read from `leveled_bookie:book_status/1` at scrape time and deduplicated per shared Bookie process (several shards may share one), labelled by a representative `(namespace, shard)`.

| Metric family | Type | Covers |
|---|---|---|
| `bondy_leveled_penciller_backlog` | Gauge | Penciller work backlog &mdash; the LSM write-stall signal. |
| `bondy_leveled_penciller_cache_size`, `_penciller_pending`, `_ledger_cache_size` | Gauge | In-memory (L0) cache size, a pending L0-flush/manifest-change flag, and ledger write-cache entries. |
| `bondy_leveled_level_files` | Gauge | SST file count per LSM level, by `level`. |
| `bondy_leveled_active_journal_files`, `_journal_compaction_score` | Gauge | Journal (CDB) file count and the last journal compaction score. |
| `bondy_leveled_fetches` | Gauge | Sampled fetches by resolution level &mdash; read amplification / cache-hit distribution. |
| `bondy_leveled_mean_op_time_microseconds` | Gauge | Mean sampled `leveled` operation time, by `op` (get, head, put_ink, put_mem, put_prep). |

## Cluster (Partisan) & node health

These families track cluster membership and inter-node connectivity &mdash; the same signals the `bondy_observer_cli` Cluster pane shows &mdash; plus node-level health flags.

| Metric family | Type | Covers |
|---|---|---|
| `bondy_cluster_members`, `_connected_peers`, `_all_members_connected`, `_peer_connected` | Gauge | Partisan membership size, connected-peer count, whether every member is currently reachable, and per-peer connectivity. |
| `bondy_cluster_membership_changes_total`, `_membership_size` | Counter / Gauge | Membership churn, by `direction` (added/removed). |
| `bondy_cluster_connections`, `_channel_connections`, `_channel_connections_target` | Gauge | Live connection count per peer and per channel, and the configured target parallelism per peer/channel &mdash; a channel below target is under-provisioned. |
| `bondy_cluster_connection_up_total`, `_connection_down_total` | Counter | Connection establishment and teardown, by `peer`, `channel` and (for teardown) exit `reason`. |
| `bondy_cluster_connect_latency_milliseconds`, `_tls_handshake_milliseconds` | Histogram | Outbound connection latency and inbound TLS handshake latency, by `result`; a spike in handshake errors is the slowloris signal. |
| `bondy_cluster_peer_rtt_milliseconds`, `_peer_send_pending_bytes` | Histogram / Gauge | Inter-node heartbeat round-trip time and send-queue backpressure, by `peer`, `channel` and `side`. |
| `bondy_alarms`, `_alarm_active` | Gauge | Active alarm count, and a `1` per active alarm labelled by `alarm_id`. The label is the alarm's id rendered whole, so a per-instance condition contributes one series per instance (`{mail_relay_down,<<"smtp1">>}`), not one per family. See the [Alarm Catalogue](/router/reference/alarms). |
| `bondy_node_ready` | Gauge | `1` when the node reports ready &mdash; the same oracle the `/ready` probe serves: boot complete, durable store open, every storage shard running, and no raised alarm declaring `affects_ready`. |

## Router & WAMP

### WAMP sessions & sockets

| Metric family | Type | Covers |
|---|---|---|
| `bondy_sockets_total`, `bondy_sockets_opened_total`, `bondy_sockets_closed_total`, `bondy_socket_errors_total`, `bondy_socket_duration_seconds` | Gauge / Counter / Histogram | Active socket count, opens, closes, errors and socket lifetime, by `protocol`, `transport` and `node`. |
| `bondy_sessions_total`, `bondy_sessions_opened_total`, `bondy_sessions_closed_total`, `bondy_session_duration_seconds` | Gauge / Counter / Histogram | Active session count, opens, closes and session lifetime, by `realm` and `node`. `_closed_total` additionally carries the WAMP close-reason URI as `reason` &mdash; the "why are my clients dropping" diagnostic. |
| `bondy_ping_rtt_milliseconds` | Histogram | Round-trip time of router-initiated transport-level pings, by `protocol` and `transport`. |

### WAMP messaging & RPC

| Metric family | Type | Covers |
|---|---|---|
| `bondy_wamp_messages_total`, `_wamp_message_bytes` | Counter / Histogram | Total routed WAMP messages and their size distribution, by `frame_type`, `encoding`, `protocol`, `transport` and `realm_type`. |
| `bondy_wamp_<type>_messages_total` | Counter | One counter per WAMP message type: `abort`, `authenticate`, `call`, `cancel`, `challenge`, `error`, `event`, `goodbye`, `hello`, `interrupt`, `invocation`, `publish`, `published`, `register`, `registered`, `result`, `subscribe`, `subscribed`, `unregister`, `unregistered`, `unsubscribe`, `unsubscribed`, `welcome`, `yield`. The `call` and `register` families additionally carry `procedure_uri`, `publish` and `subscribe` carry `topic_uri`, and `error` carries `error_uri`. |
| `bondy_wamp_dropped_total` | Counter | Messages or events Bondy declined to deliver, by `reason` (e.g. `shed` for load shedding) and `family` (the class of dropped work). |
| `bondy_wamp_call_latency_milliseconds`, `_invocation_latency_milliseconds` | Histogram | Routed RPC latency, by `procedure_uri`. The call family measures the full round trip (dealer receipt of `CALL` to first `RESULT`/`ERROR`); the invocation family measures only the `INVOCATION`&rarr;`YIELD`/`ERROR` leg. The difference between the two is router overhead. |
| `bondy_rpc_promises_inflight`, `bondy_rpc_inflight_invocations` | Gauge | Pending RPC promises awaiting a yield or error, in aggregate and per `procedure_uri` &mdash; a rising value means callee saturation. |
| `bondy_rpc_promise_timeouts_total` | Counter | RPC promises evicted on expiry (the caller received a WAMP timeout), by `type`. |
| `bondy_registry_events_total` | Counter | Registration and subscription lifecycle events, by `realm`, `type` and `action`. |
| `bondy_registry_size`, `bondy_registry_memory` | Gauge | Registry substrate size (approximate entry count) and memory. |
| `bondy_registry_ptrie_cas_retries_total` | Counter | Pattern-index (ptrie) write rounds that lost the root compare-and-swap to a concurrent writer and were retried, by `node`. All pattern writes of a realm contend on one root per (type, match policy), so a sustained rate means pattern registrations or subscriptions are contending. Zero when writes do not overlap. |
| `bondy_registry_ptrie_cas_exhausted_total` | Counter | Pattern-index writes that used up their compare-and-swap retry budget and failed, by `node`. The budget guards against livelock; any non-zero value is an incident. |
| `bondy_registry_projection_miss_total` | Counter | Index entries whose backing registry record was already gone when the match result was resolved. No labels. Expected under subscribe/unsubscribe churn (a subscriber left between the index snapshot and the resolve), so a single occurrence is not a fault; watch the rate relative to publish throughput. |
| `bondy_realm_events_total`, `bondy_user_events_total` | Counter | Realm lifecycle (created/updated/deleted) and user lifecycle (added/updated/deleted/credentials_updated) events, by `realm` and `action`. |

### Session establishment latency

These histograms split the time a client waits between `HELLO` and `WELCOME` into connection-process time and session-manager time. Each carries a `node` label.

| Metric family | Type | Covers |
|---|---|---|
| `bondy_wamp_hello_duration_microseconds` | Histogram | In-process time the connection process spent handling a `HELLO`: realm lookup, auth context build and, when no challenge is required, the full session open up to the encoded `WELCOME`. |
| `bondy_session_manager_open_queue_microseconds` | Histogram | Time a session-open request waited in a session manager pool worker's mailbox before the worker served it. A high value relative to the service time means opens are queued behind other worker work, such as crashed-session cleanup, not that opening is slow. |
| `bondy_session_manager_open_service_microseconds` | Histogram | Time a session manager pool worker spent serving a session open (store, monitor, procedure registration). |
| `bondy_session_manager_cleanup_microseconds` | Histogram | Time a session manager pool worker spent tearing down a session, by `kind`: `down` (the connection process died), `close` (an explicit close) or `error` (rollback of a failed open). This work shares the worker mailbox with opens, so its duration is latency the next queued open pays. |

### Event delivery path

These histograms measure each hop a published event takes, so a slow delivery can be attributed to a hop. Each carries a `node` label. A delivery tail visible in none of them is the socket, the network or the client.

| Metric family | Type | Covers |
|---|---|---|
| `bondy_broker_publish_match_microseconds` | Histogram | Time a `PUBLISH` spent finding matching subscriptions in the registry, measured inline in the publisher's connection process. It grows with subscription count and pattern breadth, not with fanout. |
| `bondy_broker_publish_fanout_microseconds` | Histogram | Time a `PUBLISH` spent delivering: one send per local subscriber plus one relayed `PUBLISH` per peer node that holds a subscriber. |
| `bondy_router_flow_queue_microseconds` | Histogram | Time a task waited in a router flow pool worker's mailbox before it ran, by `family` (`relay` for messages arriving from cluster peers, `bridge_relay` for bridge-relay ingress, `router` for anything else). Ordered flows cannot turn queue depth into throughput, so sustained growth is latency every task behind it pays. Records nothing for tasks a peer delivers straight into the mailbox, which carry no local dispatch timestamp; `bondy_router_flow_queue_depth` covers those. |
| `bondy_router_flow_service_microseconds` | Histogram | Execution time of one router flow pool task (for a `PUBLISH`: authorize, match and fan out), by `family`. Pool throughput is bounded by pool size divided by this duration. |
| `bondy_router_flow_queue_depth` | Histogram | Mailbox depth of a router flow pool worker at the moment it dequeued a message relayed from a peer node. Recorded only for `family="relay"`, where no queue wait can be measured. A flow is FIFO on its worker, so depth &times; service time estimates the wait of every message behind this one. |
| `bondy_wamp_egress_queue_depth` | Histogram | Mailbox depth of a subscriber's connection process at the moment it dequeued an outbound WAMP message, by `transport`. This is the last hop before the wire; depth &times; service time estimates the wait of every message behind this one. |
| `bondy_wamp_egress_service_microseconds` | Histogram | In-process time a subscriber's connection process spent handling one outbound WAMP message, by `transport`. For WebSocket this is the encode only, because the socket write happens after the handler returns; for a transport whose handler writes to the socket itself, the write is included. Compare across transports accordingly. |

### Registry RIB &mdash; cross-node routing

Backs [Registry Routing (RIB)](/router/concepts/registry_routing): the compact per-`(realm, match policy, URI, node)` routing summaries that let cross-node call and event routing scale without replicating every registration and subscription to every node.

| Metric family | Type | Covers |
|---|---|---|
| `bondy_registry_rib_members`, `_stub_cells` | Gauge | Live local registry entries feeding this node's routing summaries, and remote routing-summary stubs held by this node, by registry type. |
| `bondy_registry_rib_divergences` | Gauge | Keys where the routing summaries disagree with the registry's own ground truth, as of the last periodic consistency sweep (`registry.rib.check_interval`). |
| `bondy_rpc_rib_retries_total` | Counter | Pre-invocation retries of cluster calls after an owner-side completion miss, by `outcome` (node / local / exhausted). |
| `bondy_rpc_rib_completions_total` | Counter | Owner-side completions of node-addressed cluster calls, by `outcome` (ok / miss). |

### Rate limiting & inbound protection

| Metric family | Type | Covers |
|---|---|---|
| `bondy_rate_limited_total` | Counter | Inbound requests denied by the rate limiter, by `class` (handshake / auth / connection / http / message) and `scope` (node / listener / realm / realm_total — which budget refused). |
| `bondy_rate_limiter_buckets` | Gauge | Live rate-limiter table entries &mdash; keyspace growth and GC health. |
| `bondy_oidc_flows_inflight` | Gauge | Pending OIDC/PKCE login flows awaiting the callback. |

### HTTP API gateway

| Metric family | Type | Covers |
|---|---|---|
| `bondy_http_requests_total`, `_spawned_processes_total`, `_errors_total` | Counter | HTTP requests, handler processes spawned, and request errors, by `route`, `method`, `reason` and `status_class`. |
| `bondy_http_request_duration_microseconds`, `_receive_body_duration_microseconds` | Histogram | Request duration and request-body receive duration, with the same label set. |
| `bondy_http_early_errors_total` | Counter | Errors occurring before a request was fully received. |
| `bondy_protocol_upgrades_total` | Counter | HTTP connections upgraded to WebSocket. |

### Router internals

| Metric family | Type | Covers |
|---|---|---|
| `bondy_listener_connections`, `_max_connections`, `_accepts_total`, `_terminates_total` | Gauge / Counter | Active vs. maximum connections, and cumulative accept/terminate counts, per Ranch `listener`. |
| `bondy_jobs_queue_depth`, `_enqueued_total` | Gauge / Counter | Queue depth and cumulative enqueue count per load-regulation pool shard &mdash; the router's async-work backpressure signal. |
| `bondy_process_message_queue_len` | Gauge | Mailbox depth of critical singleton processes (`name`), e.g. `bondy_event_manager`, `bondy_registry`. |

## MCP Gateway

The [MCP Gateway](/router/concepts/mcp_gateway), from `bondy_mcp`. Empty on
a node with no listener declaring the `mcp` service. Families carry a
`realm` label; call and read **counters** additionally carry the tool or
resource `name`, while the duration **histograms** carry it only when
[`mcp.metrics.label_by_name`](/router/reference/configuration/mcp#mcp.metrics.label_by_name)
is on, so histogram cardinality stays independent of the manifest size.
Client-controlled label sources (protocol version, request method) are
sanitized to closed sets at the emission site — an unknown value is
recorded as `other` rather than minting an attacker-chosen series.

| Metric family | Type | Covers |
|---|---|---|
| `bondy_mcp_request_duration_microseconds` | Histogram | End-to-end handling of one MCP request, by `method`. |
| `bondy_mcp_tool_calls_total`, `_tool_call_duration_microseconds` | Counter / Histogram | Tool calls, by `status` (`success` \| `input_required` \| `tool_error` \| `internal_error`). |
| `bondy_mcp_resource_reads_total`, `_resource_read_duration_microseconds` | Counter / Histogram | Resource reads. |
| `bondy_mcp_upstream_calls_total`, `_upstream_call_duration_microseconds` | Counter / Histogram | Calls Bondy makes to upstream MCP servers, by upstream. |
| `bondy_mcp_upstream_drift_blocked_total` | Counter | Upstream tool definitions refused because their content drifted from the pinned hash. Anything counted here is blocked until approved. |
| `bondy_mcp_manifest_rebuilds_total`, `_manifest_rebuild_duration_microseconds` | Counter / Histogram | Per-realm manifest compilations, by `trigger` (`demand` \| `db_event`). |
| `bondy_mcp_manifest_entries` | Gauge | The census of compiled manifest entries per realm and kind, written absolutely at each rebuild. |
| `bondy_mcp_manifest_collisions_total` | Counter | Catalogue entries skipped over a name collision. Each also raises a `major` alarm naming the `(realm, name)`. |
| `bondy_mcp_rbac_denied_total` | Counter | Authorization denials — a hidden listing entry, a refused call. |
| `bondy_mcp_version_refused_total` | Counter | Requests refused over protocol-version negotiation, by (sanitized) `version`. |
| `bondy_mcp_session_opened_total`, `_session_closed_total`, `bondy_mcp_active_sessions` | Counter / Gauge | Handshake-era session lifecycle; closes carry a `reason` (`client_close` \| `idle_timeout` \| `stored_session_closed` \| `server_shutdown` \| `crash` \| `other`). Modern-era requests are sessionless and appear only in the request families. |
| `bondy_mcp_inflight_calls` | Gauge | Currently executing MCP-originated WAMP calls. At rest this is `0`; a resting non-zero value indicates a leak. |
| `bondy_mcp_notifications_emitted_total`, `_resource_subscribes_total` | Counter | Notifications delivered on `subscriptions/listen` streams, and resource subscriptions accepted. |

## HTTP Connector

The [HTTP Connector](/router/concepts/http_connector), from `bondy_http_connector`: WAMP procedures forwarded to upstream HTTP services. Every family carries a `service` label naming the configured service; the call and retry families also carry the WAMP `procedure_uri`. Durations are in milliseconds. A family appears only once its first event has fired, so a node with no connector services exports none of them.

| Metric family | Type | Covers |
|---|---|---|
| `bondy_http_connector_requests_total` | Counter | Completed WAMP-to-HTTP forwarded calls, by `service`, `procedure_uri` and `outcome`. `outcome` is the class of the response's HTTP status: `ok` (2xx), `redirect` (3xx), `client_error` (4xx), `server_error` (5xx), or `unknown` when the response carries no status. The connector's own error responses (missing path variable, pending authentication, upstream connection failure, internal error) also carry a status, so they are classified the same way. |
| `bondy_http_connector_request_duration_milliseconds` | Histogram | Duration of a forwarded call, from the WAMP invocation to the WAMP response, by `service` and `procedure_uri`. |
| `bondy_http_connector_retries_total` | Counter | Upstream HTTP retry attempts, by `service` and `procedure_uri`. |
| `bondy_http_connector_token_cache_total` | Counter | Access-token cache lookups, by `service` and `result`: `hit` when served from the cache table without a call to the cache process, `miss` otherwise. |
| `bondy_http_connector_token_fetch_total` | Counter | Token acquisition calls to the identity provider, by `service` and `outcome` (`ok` \| `error`). |
| `bondy_http_connector_token_fetch_duration_milliseconds` | Histogram | Duration of a token acquisition call, by `service`. |
| `bondy_http_connector_token_refresh_total` | Counter | Token refreshes, preemptive (before expiry) or reactive, by `service` and `outcome`. The trigger is not exported as a label. |
| `bondy_http_connector_secret_resolution_total` | Counter | Attempts to resolve a service's secrets from its configured external provider, by `service` and `outcome`. |
| `bondy_http_connector_service_ready` | Gauge | `1` when the last secret resolution for a service succeeded and it can serve calls, `0` when it failed, by `service`. Present only for services with a secrets provider configured. |
| `bondy_http_connector_pool_status_changes_total` | Counter | Up/down transitions of a service's upstream HTTP pool, by `service` and `status` (`up` \| `down`). |
| `bondy_http_connector_pool_up` | Gauge | `1` when a service's upstream HTTP pool is up, `0` when down, by `service`. |
| `bondy_http_connector_liveness_probes_total` | Counter | Periodic liveness probes against a service's upstream endpoint, by `service` and `outcome`, whether or not the probe changed the pool's state. |
| `bondy_http_connector_liveness_probe_duration_milliseconds` | Histogram | Duration of a liveness probe, by `service`. |

## Mail

Outbound email, from `bondy_mail`. Empty on a node with no `mail.relay.*` configured &mdash; that is the [dormant state](/router/concepts/mail#dormant-until-configured), not a fault. Every family carries a `relay` label; **none carries a realm**, because relay names are bounded by `bondy.conf` and realms are not. Per-realm attribution lives in the logs and in the telemetry events these families are derived from.

| Metric family | Type | Covers |
|---|---|---|
| `bondy_mail_accepted_total` | Counter | Messages validated, authorized and queued, by `relay` and `surface` (`rpc` \| `bridge`). Accepted is not delivered. |
| `bondy_mail_sent_total` | Counter | Messages a relay accepted. |
| `bondy_mail_failed_total` | Counter | Messages that will not be delivered, by `nature` (`permanent` \| `transient`) and `reason_class`. A transient failure counted here has exhausted its attempts or its deadline. |
| `bondy_mail_retried_total` | Counter | Delivery retries, by `reason_class`. Only transient failures are retried. |
| `bondy_mail_dead_letter_total` | Counter | Failed messages with no caller waiting to be told, by `reason_class`. Every message the broker bridge sends is in this category if it fails. |
| `bondy_mail_rejected_total` | Counter | Messages refused *before any delivery was attempted*, by `reason` (`queue_full` \| `not_permitted` \| `oversized` \| `expired` \| `shutdown`). Nothing counted here was offered to a relay, so none of it counts against relay health. |
| `bondy_mail_rate_limited_total` | Counter | Messages refused by a relay's own rate limit. |
| `bondy_mail_send_duration_milliseconds` | Histogram | The SMTP conversation once a worker had the message, including retries and the backoff between them. Excludes time spent queued. |
| `bondy_mail_queue_wait_milliseconds` | Histogram | How long a message waited in front of a worker. |
| `bondy_mail_queue_depth` | Gauge | Messages queued for a relay and not yet taken by a worker, summed across its pool. This is the counter `queue.max_size` is enforced against rather than a separate observation of it, so the gauge and the bound cannot disagree. |
| `bondy_mail_relay_up` | Gauge | `1` when a relay's recent deliveries are succeeding, `0` when consecutive transient failures marked it down. Permanent failures do not change it: a rejected recipient says nothing about the relay. |

Three of these distinctions decide what an operator does next, and are worth keeping straight:

- **`failed` versus `rejected`.** `failed` means a relay declined a message it was shown. Nothing in `rejected` ever reached a relay &mdash; it was refused by a full queue, by authority, or by the size limit. Conflating them makes a saturated queue look like a broken relay.
- **`nature`.** `permanent` means offering the message again produces the same answer, so somebody has to change something; `transient` means the relay or the network is the problem and it may succeed later. This is the single number that decides whether to page someone or wait.
- **Two clocks.** Rising `queue_wait` with flat `send_duration` means the pool is too small for the load. Rising `send_duration` means the relay itself is slow. One end-to-end number would move for either and distinguish neither.

A relay marked down also raises an alarm, visible as `bondy_alarm_active{alarm_id="{mail_relay_down,<relay>}"}`. Delivery recovers on the first success; the alarm clears after `health.success_threshold` successes, so a flapping relay does not flap the page.

## BEAM VM

| Metric family | Type | Covers |
|---|---|---|
| `erlang_vm_msacc_*_seconds_total` | Counter | Microstate-accounting scheduler time, one family per accounting state (`emulator`, `gc`, `gc_full`, `alloc`, `sleep`, `ets`, `nif`, `bif`, `send`, `check_io`, `port`, `aux`, `busy_wait`, `timers`, and so on), by scheduler. Requires `erlang:system_flag(microstate_accounting, true)`, which Bondy enables at boot. |
| `bondy_sysmon_events_total` | Counter | BEAM system-monitor events, by `type` (`long_gc`, `long_schedule`, `large_heap`, `busy_port`, `busy_dist_port`) &mdash; previously logged and discarded, now counted. |
| `erlang_vm_memory_*`, `erlang_vm_statistics_*`, `erlang_vm_system_info_*` | Gauge / Counter | Standard Erlang VM metrics (memory by type, run queue, reductions, process/port/atom counts, scheduler counts) from the underlying `prometheus_erlang` VM collectors &mdash; not Bondy-specific, but exposed on the same endpoint. |

::: tip There is no WAMP metrics procedure
`bondy.telemetry.metrics` is a reserved URI, not a working procedure — calling it raises `wamp.error.no_such_procedure`. Metrics are only exposed over this Prometheus endpoint.
:::

## See also

- [Monitoring a Bondy Cluster](/router/guides/administration/monitoring) &mdash; bring up the bundled Prometheus + Grafana stack, pre-wired to these families.
- [Clustering](/router/concepts/clustering) &mdash; the concepts behind the cluster and anti-entropy families.
- [Deletion and Reclamation](/router/concepts/deletion_and_reclamation) &mdash; the model behind the reclamation and retirement families.
