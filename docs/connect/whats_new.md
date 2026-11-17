---
outline: [2,3]
related:
    - text: "Migrating from a Release Candidate"
      type: "Guide"
      link: "/connect/guides/deployment/migrating_from_a_release_candidate"
      description: "Move a 1.0.0 release candidate deployment to this release."
    - text: "Upgrading to 1.0.0"
      type: "Guide"
      link: "/connect/guides/deployment/upgrading_to_1_0_0"
      description: "Move your data from a release candidate to a new cluster."
---

# What's New in 1.2

This page lists the changes between Bondy Connect 1.0.0 and 1.2. It covers releases 1.0.1, 1.0.2, 1.1.0, 1.2.0 and 1.2.1. Each section starts with the changes that need action from you.

::: tip Coming from a release candidate?
A deployment that runs a 1.0.0 release candidate has more to change: configuration keys, the WAMP and HTTP APIs, and the realm authentication rules. Follow [Migrating from a Release Candidate](/connect/guides/deployment/migrating_from_a_release_candidate). It includes every change on this page.
:::

## 1.2.1

This release needs no action from you. It adds two configuration options, and both have defaults.

### Fixes

- **A node that restarts while its peers are busy rebuilds its routing table without delay.** Such a node could take minutes, and for that time it reported ready and answered calls to procedures registered on other nodes with `wamp.error.no_such_procedure`. The bootstraps that rebuild the table had to fit under [`db.oplog.aae.max_concurrency`](/connect/reference/configuration/data_storage#db.oplog.aae.max_concurrency), and live sync sessions kept that limit full. Bootstraps now have their own limit, the new option [`db.oplog.aae.bootstrap.max_concurrency`](/connect/reference/configuration/data_storage#db.oplog.aae.bootstrap.max_concurrency) (default `4`). A node that recovers can therefore run up to that many sync sessions above `db.oplog.aae.max_concurrency`. The `[bondy_oplog, sync_scheduler, bootstrap_capped]` telemetry event no longer carries the `node_current` and `node_cap` measurements.
- **A node that restarts rebuilds its routing table once per shard.** It rebuilt the table once for every batch of 64 entries it received, and on each pass it wrote again every routing entry it owns. Those writes replicated to the other nodes, and the node applied routing changes from its peers late for as long as the passes lasted. A bootstrap now announces each table once, when the whole transfer for a shard is written.
- **Load yielding no longer stops bootstraps.** With [`db.oplog.aae.load_adaptive`](/connect/reference/configuration/data_storage#db.oplog.aae.load_adaptive) on, a node whose load was at or above the threshold started no bootstrap, so a node that restarted while busy rebuilt no routing table for as long as the load lasted. The setting no longer defers bootstraps. The `[bondy_oplog, sync_scheduler, bootstrap_load_deferred]` telemetry event and the `bootstrap_load_deferred` value of `bondy_oplog_sync_scheduler_events_total` are gone.
- **A node limits the bootstraps it serves.** A node served every bootstrap its peers asked for, so many nodes that recovered at once could all load the same node. A node now serves at most [`db.oplog.aae.bootstrap.serve.max_concurrency`](/connect/reference/configuration/data_storage#db.oplog.aae.bootstrap.serve.max_concurrency) at a time (new option, default `8`). It refuses the next one, and the asking node asks again after its retry backoff. The new metric [`bondy_oplog_bootstrap_serve_refused_total`](/connect/reference/metrics#anti-entropy-sync-bootstrap-frontier-convergence) counts the refusals. A node whose bootstrap fails now tells the serving node at once, so the serving node no longer keeps that bootstrap open for 60 seconds.
- **A graceful stop ends when the clients have left.** A node waited for the whole of [`shutdown.grace_period`](/connect/reference/configuration/startup_shutdown#shutdown.grace_period) (default `30s`), also when it had no client connected. The node now ends the wait when the last client connection closes and, in a cluster, the nodes it is connected to hold the removal of its registrations and subscriptions. `shutdown.grace_period` is the longest it waits. See [Shutdown](/connect/concepts/node_lifecycle#shutdown).
- **`bondy_rpc_promise_timeouts_total` counts only the calls that end with `wamp.error.timeout`.** It also counted every expiry that Bondy answers with a new attempt for a call that set `_retries`, and each wait of such a call that found no callee. On a workload that uses `_retries`, the counter was higher than the number of timeouts callers received.
- **`bondy_oplog_sync_scheduler_load` reports the load with load yielding off.** The gauge read `0` while `db.oplog.aae.load_adaptive` was off, which is the default. The scheduler now samples the load on every tick, so the gauge shows how close a node runs to [`db.oplog.aae.load_run_queue_threshold`](/connect/reference/configuration/data_storage#db.oplog.aae.load_run_queue_threshold) before you turn the setting on.

### Known limitation

Every shard that a Bondy node starts backs the authentication freshness fence, and the scheduler does not throttle, defer or cap the live syncs of such a shard. On a Bondy node `db.oplog.aae.live_sync`, `db.oplog.aae.live_sync.max` and `db.oplog.aae.load_adaptive` therefore have no effect. `db.oplog.aae.max_concurrency` does not limit how many live syncs run; it only sets the size of the batch each session pulls. The bootstrap limits and `db.oplog.aae.max_pages_in_flight` apply as described.

## 1.2.0

### Action required

- **A node that runs 1.2 cannot go back to an earlier release.** 1.2 upgrades the storage engine, and from its first start a node writes stored data in a format that earlier releases cannot read. Before you upgrade, take a [logical export](/connect/guides/administration/backup_and_restore#export-the-database). To go back, deploy a new cluster on the earlier release and [import the export](/connect/guides/administration/backup_and_restore#import-an-export); it holds nothing written after you took it.

### Fixes

- **A RawSocket client gets no message longer than the length it announces.** Bondy ignored this length, and a client that enforces it closed the connection. Bondy now drops an `EVENT` for that subscriber only, and counts the drop in `bondy_wamp_dropped_total`. A caller gets `ERROR` with `wamp.error.payload_size_exceeded` when its `RESULT` is too long for it, or its `INVOCATION` too long for the callee. A progressive call ends, and Bondy interrupts its callee. WebSocket and HTTP clients announce no length, so nothing changes for them. See [RawSocket message length](/connect/reference/protocols/wamp#rawsocket-message-length).
- **A URI that ends in a newline is refused.** Bondy accepted `com.example.thing` followed by a newline under both [`wamp.uri.strictness`](/connect/reference/configuration/wamp#wamp.uri.strictness) settings, so a topic, procedure, realm or grant could carry one and differ from the same URI without it. Bondy now refuses it, as it refuses a URI with any other control character. URI validation is also several times faster.
- **A refused `bondy.*` call names the realm it received.** A call whose realm argument was not the session's realm got `wamp.error.not_authorized`, and the description named the session's realm instead. A realm sent as an Erlang charlist (`"com.example"`) rather than a binary therefore looked like a correct call. The description now shows the realm received as an Erlang term, so its type is visible, and the error's `details` carry it as `requested_realm_uri`.
- **A missing or malformed bearer token gets `bondy.error.token_invalid`.** On the Admin API and on API Gateway `oauth2` paths, a request without an `Authorization: Bearer` header, or with a bearer value that is not a JWT, got `401` with an `internal_error` body. The body now names the refusal. See [OAuth2 Authentication](/connect/reference/api_gateway/specification#oauth2-authentication).
- **The `WWW-Authenticate: Bearer` challenge follows RFC 6750.** This covers the Admin API, API Gateway `oauth2` paths, the credential-verification endpoints and the MCP endpoint. A request with no bearer token gets `Bearer realm="<realm>"`, and a refused token adds `error="invalid_token"`. Before, the API Gateway sent Bondy's own error code and extra parameters, and the MCP endpoint sent a bare `Bearer`. A client that read Bondy's error code from the header reads it from the response body instead. The `Cookie`, `Basic` and `ApiKey` challenges do not change.

## 1.1.0

### Action required

- **A node refuses to start on a key that it does not read.** This covers a renamed key, a removed key and a typo. The error names each such key and up to three similar keys that the release knows. The node also refuses to start on a value that it cannot parse. Earlier releases ignored such a key, so its setting stayed at the default without a message. Run `scripts/migrate_conf.escript check <path>/bondy.conf` before you upgrade.
- **The `db.*` keys are grouped by the component they configure.** Most of them have a new name. For example, `db.aae.*` is `db.oplog.aae.*` and `db.wal.*` is `db.oplog.wal.*`. Values, units and defaults do not change. `scripts/migrate_conf.escript migrate` writes the converted file. [Storage and anti-entropy keys](/connect/guides/deployment/migrating_from_a_release_candidate#storage-and-anti-entropy-keys) lists every rename.

### New features

- **Pack collection settings.** `db.oplog.pack.gc.interval`, `db.oplog.pack.gc.growth_factor` and `db.oplog.pack.gc.min_records` tune the reclamation of a durable table's anti-entropy tree. See [Pack Collection](/connect/reference/configuration/data_storage#pack-collection).

## 1.0.2

### Fixes

- **Anti-entropy tree pages are reclaimed as writes grow.** Release 1.0.1 reclaimed them at most once an hour, and never in a node's first hour. A burst of writes, such as a restore, could fill the data volume first. Reclamation now also runs when the sealed records of a shard's tree reach twice the count that the last run left, counted from at least 10,000 records. See [Pack Collection](/connect/reference/configuration/data_storage#pack-collection).

## 1.0.1

### Action required

- **The Admin HTTP API needs a bearer token.** Every listener that carries `admin_api` needs an OAuth2 access token from the master realm on each request other than `OPTIONS`. A request without one gets `401`. The internal socket needs no token. See [Authenticating to the Admin API](/connect/reference/configuration/listeners#authenticating-to-the-admin-api).
- **Update procedures refuse credentials.** `bondy.user.update`, `bondy.oauth2.client.update` and `bondy.oauth2.resource_owner.update`, and their `PUT` routes, refuse a `password`. The client procedure and route also refuse a `client_secret`. Use [`bondy.user.change_password`](/connect/reference/wamp_api/user#change-the-user-password).
- **`cookie` and `oidcrp` are separate methods.** `cookie` admits a credential that arrives in a cookie. `oidcrp` admits a ticket from the OIDC login flow. A realm that uses OIDC needs both in its `authmethods`, each with a source that allows it.
- **Sources apply to OIDC users without a user record.** Add sources assigned to `all` for `oidcrp` and `cookie`, for the networks your users connect from.
- **The verify route applies the realm's methods and sources.** See [Verify route](/connect/reference/api_gateway/specification#verify-route).
- **`oauth2.refresh_token.limit` is a whole number of tokens.** A value with a unit suffix, or `0`, stops the node at boot.
- **Three OIDC keys are removed.** Delete `security.oidc.providers.enabled`, `security.oidc.providers.<id>.login_path` and `security.oidc.providers.<id>.redirect_path`. No code read them.
- **MCP matches sources against the forwarded client address** when the request comes from a trusted proxy.

[Update realm authentication settings](/connect/guides/deployment/migrating_from_a_release_candidate#_5-update-realm-authentication-settings) describes each authentication change.

### New features

- **OIDC on the Admin API and API Gateway.** The Admin API accepts the master realm's OIDC ticket cookie. An API Gateway path with the `oidc` scheme authenticates with the realm's ticket cookie.
- **Dry-run imports.** `bondy.export.import` takes `dry_run`, and `bondy.export.status` adds an import report. See [Backup and Restore](/connect/guides/administration/backup_and_restore#_4-check-the-file-with-a-dry-run) and the [import report](/connect/reference/wamp_api/export#import-report).
- **The `bondy_auth_fence_closed` alarm.** Bondy raises it when the authentication freshness fence refuses every new authentication for too long. See [Alarms](/connect/reference/alarms#bondy-auth-fence-closed).
- **Alpine images.** Images with the `-alpine` suffix are published again for `linux/amd64` and `linux/arm64`. See [Install using Docker](/connect/guides/install/docker).

### Fixes

The fixes that change a result your clients can see:

- `bondy.user.enable` and `bondy.user.disable` answer `wamp.error.no_such_principal` for an unknown user.
- A reserved user or group name, such as `all` or `anonymous`, gets `bondy.error.invalid_value`.
- `bondy.user.remove_group`, `bondy.group.add_group`, `bondy.group.add_groups` and `bondy.group.remove_group` answer an empty result, not `bondy.error.internal_error`.
- `bondy.user.remove_alias` removes only an alias that the user holds.
- An API Gateway path with the `basic` or `api_key` scheme answers `401`, not `500`.
- A bearer value that is not a JWT gets `401`, not `400`.
- With `security.rate_limit` on, Bondy charges API Gateway, Admin API and OAuth2 token-endpoint requests before authentication, so a flood of refused requests gets `429`. See [Rate Limiting](/connect/reference/configuration/security#rate-limiting).
