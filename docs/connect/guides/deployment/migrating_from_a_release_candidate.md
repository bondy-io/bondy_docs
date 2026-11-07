---
outline: [2,3]
related:
    - text: "What's New in 1.2"
      type: "Overview"
      link: "/connect/whats_new"
      description: "What changed between 1.0.0 and this release."
    - text: "Upgrading to 1.0.0"
      type: "Guide"
      link: "/connect/guides/deployment/upgrading_to_1_0_0"
      description: "Move your data from a release candidate to a new 1.x cluster."
    - text: "Network Listeners"
      type: "Reference"
      link: "/connect/reference/configuration/listeners"
      description: "The listeners.$name.* keys that replace the fixed per-scheme listeners."
    - text: "WAMP Administration API"
      type: "Reference"
      link: "/connect/reference/wamp_api/index"
      description: "The arguments, results and errors of every bondy.* and wamp.* procedure."
---

# Migrating from a Release Candidate

This guide takes a deployment that runs a 1.0.0 release candidate to the current release. It covers the changes that you make in your configuration, in your WAMP and HTTP clients, in your realms' security settings, and in your monitoring.

The guide does not move data. How you move data depends on the release candidate you run:

| You run | Your data | Follow |
|---|---|---|
| `1.0.0-rc.65` or an earlier numbered release candidate | This release cannot read PlumDB data. You build a new cluster and import a backup. | [Upgrading to 1.0.0](/connect/guides/deployment/upgrading_to_1_0_0) for the data, and this guide for everything else. |
| A named pre-release that carries `bondy_db`, such as `1.0.0-rc.olive`, `1.0.0-rc.pear` or `1.0.0-rc.pistachio` | The data directories stay in place. | [Upgrade from a `bondy_db` pre-release](/connect/guides/deployment/upgrading_to_1_0_0#upgrade-from-a-bondy-db-pre-release), and this guide for everything else. |

Every section below applies to both paths. A named pre-release already carries some of these changes, so some steps can have nothing for you to do. Each change says the release that made it. A change marked 1.0.1 or 1.1.0 also applies to a deployment that already runs 1.0.0.

## Prerequisites

- Your current `bondy.conf`, and your `advanced.config` if you have one.
- A list of the clients that call `bondy.*` or `wamp.*` procedures, and of the clients that call the Admin HTTP API.
- Your API Gateway specifications, as JSON files.
- Erlang/OTP 29 or later on every host that builds a release. A release tarball and the Docker images include their own runtime.

## 1. Update release, image and repository names

*Changed in 1.0.0.*

The release and its start script are named `bondy-connect`.

- Run `bin/bondy-connect` in place of `bin/bondy`. The tarball is `bondy-connect-<version>.tar.gz`.
- Pull `leapsight/bondy-connect` from Docker Hub or `ghcr.io/bondy-io/bondy-connect` from GHCR. The images start `bondy-connect foreground`. The `leapsight/bondy` and `ghcr.io/bondy-io/bondy` images get no new tags.
- Point your git remotes at `github.com/bondy-io/bondy-connect`.

The `/bondy` paths, the node names, the `BONDY_*` environment variables and `etc/bondy.conf` keep their names.

## 2. Convert `bondy.conf`

Most configuration keys that a release candidate used changed name, and many were removed. Since 1.1.0, a node refuses to start when `bondy.conf` sets a key that the release does not read. The error names each such key and up to three similar keys that the release knows. The node also refuses to start on a value that it cannot parse. Earlier releases ignored an unknown key, so its setting stayed at the default without a message.

`scripts/migrate_conf.escript` in the Bondy source tree checks a file against the release's schemas and rewrites the renamed keys. Run it from the root of a source checkout of the release you move to, after `rebar3 compile`:

```bash
./scripts/migrate_conf.escript check /etc/bondy/bondy.conf
./scripts/migrate_conf.escript migrate /etc/bondy/bondy.conf --out /etc/bondy/bondy.conf.new
```

`migrate` never edits its input, and refuses an `--out` file that already exists. In the new file, each key that the tool cannot convert is commented out under a `## migrate_conf:` line that gives the reason: `dropped`, `NOT renamed to …` or `needs a decision`. Resolve each one, then run `check` on the new file until its `RESULT` line reads `clean`. [Step 5 of Upgrading to 1.0.0](/connect/guides/deployment/upgrading_to_1_0_0#_5-install-1-0-0-and-check-bondy-conf-against-its-schema) explains each section of the report.

The tool applies the renames below. Read them to know what the converted file says and why.

### Listeners

*Changed in 1.0.0.*

The fixed per-scheme listener keys are removed: `admin_api.{http,https}.*`, `api_gateway.{http,https}.*`, `wamp.{tcp,tls}.*` and `bridge.listener.{tcp,tls}.*`. You declare each listener by name under `listeners.$name.*`, with its own transport, protocol and services:

```properties
listeners.api_gateway_http.transport = tcp
listeners.api_gateway_http.protocol  = http
listeners.api_gateway_http.port      = 18080
listeners.api_gateway_http.services  = api_gateway, wamp_ws, wamp_sse, wamp_longpoll
```

- A file with no `listeners.*` key starts three plaintext TCP listeners: `admin` (18081, on loopback), `api_gateway_http` (18080) and `wamp_tcp` (18082). The node always adds the internal `admin_local` socket, and adds `admin` when your file does not declare it. Any other listener that you do not declare does not exist, so declare every TLS listener and every bridge relay listener.
- Every enabled `transport = tls` listener sets `tls.certfile` and `tls.keyfile`. No default certificate path applies. A disabled listener skips this check, but not the others. One refused listener stops the node from starting.
- `listeners.$name.linger.timeout` is in seconds. A release candidate read a value with a unit suffix as milliseconds and passed the number on as seconds, so `1s` lingered for 1000 seconds.
- `listeners.$name.ip` takes a literal IP address, not a host name.
- The global `wamp.websocket.*`, `wamp.sse.*` and `wamp.longpoll.*` blocks are removed. Set these options on each listener that serves the carrier, as `listeners.$name.websocket.*`, `listeners.$name.sse.*` and `listeners.$name.longpoll.*`.

[Migrating from the pre-1.0 keys](/connect/reference/configuration/listeners#migrating-from-the-pre-1-0-keys) gives the listener name that each removed block maps to, and where each option moves.

### Storage and anti-entropy keys

*Changed in 1.0.0, and again in 1.1.0.*

The `oplog.*` keys of a release candidate are now under `db.*`. Release 1.1.0 then grouped the `db.*` keys by the component they configure. The table gives the name that the current release reads. Values, units and defaults did not change.

| Release candidate key | Current key |
|---|---|
| `oplog.aae`, `oplog.aae.*` | `db.oplog.aae`, `db.oplog.aae.*` |
| `oplog.core.gc_interval` | `db.oplog.heap_gc.interval` |
| `oplog.core.gc_heap_delta` | `db.oplog.heap_gc.delta` |
| `oplog.core.pack_auto_seal_bytes` | `db.oplog.pack.auto_seal_bytes` |
| `oplog.core.pack_seal_mode` | `db.oplog.pack.seal_mode` |
| `oplog.core.shard_count` | `db.main.shard_count` |
| `oplog.core.partition_strategy` | `db.main.partition_strategy` |
| `oplog.core.realm_prefix_depth` | `db.main.realm_prefix_depth` |
| `oplog.core.on_topology_mismatch` | `db.main.on_topology_mismatch` |

The durable database is named `main`, not `core`. Its directory is `<platform_data_dir>/bondy_db/main`.

A named pre-release used the 1.0.0 names. Release 1.1.0 renamed these:

| 1.0.0 key | Current key |
|---|---|
| `db.aae`, `db.aae.*` | `db.oplog.aae`, `db.oplog.aae.*` |
| `db.wal.*` | `db.oplog.wal.*` |
| `db.pack_auto_seal_bytes` | `db.oplog.pack.auto_seal_bytes` |
| `db.pack_seal_mode` | `db.oplog.pack.seal_mode` |
| `db.gc_interval` | `db.oplog.heap_gc.interval` |
| `db.gc_heap_delta` | `db.oplog.heap_gc.delta` |
| `db.gc_max_concurrency` | `db.oplog.compaction.max_concurrency` |
| `db.frontier.hole_alarm` | `db.oplog.frontier.hole_alarm` |
| `db.drain.stall_alarm` | `db.oplog.drain.stall_alarm` |
| `db.reclaim`, `db.reclaim.*` | `db.oplog.reclaim`, `db.oplog.reclaim.*` |
| `db.origin_retirement`, `db.origin_retirement.*` | `db.oplog.origin_retirement`, `db.oplog.origin_retirement.*` |
| `db.journal_trim_interval` | `db.leveled.journal.trim_interval` |
| `db.primary_scan_limit` | `db.index.primary_scan_limit` |

The keys under `db.main.*`, `db.registry.*` and `db.leveled.*` keep their names. See the [Data Storage & Active Anti-entropy Configuration Reference](/connect/reference/configuration/data_storage).

### Other renamed keys

| Release candidate key | Current key | Changed in |
|---|---|---|
| `rpc_gateway.*` | `http_connector.*`, with the same sub-keys | 1.0.0 |
| `wamp.transport_queue.transport_ttl` | `wamp.http_transport.idle_timeout` | 1.0.0 |
| `wamp.transport_queue.*` (the other keys) | `wamp.http_transport.queue.*` | 1.0.0 |
| `erlang.async_threads` | `vm.async_thread.number` | before `1.0.0-rc.65` |
| `erlang.process_limit` | `vm.process.limit` | before `1.0.0-rc.65` |
| `erlang.max_ports` | `vm.port.limit` | before `1.0.0-rc.65` |
| `erlang.distribution_buffer_size` | `vm.distribution.buffer_size` | before `1.0.0-rc.65` |
| `erlang.dirty_io_schedulers.number` | `vm.io.dirty_scheduler.number` | before `1.0.0-rc.65` |
| `erlang.time_correction`, `erlang.time_correction.warp_mode` | `vm.time_correction`, `vm.time_correction.warp_mode` | before `1.0.0-rc.65` |
| `erlang.sbwt` | `vm.cpu.scheduler.busy_wait_threshold` | before `1.0.0-rc.65` |

See the [HTTP Connector Configuration Reference](/connect/reference/configuration/http_connector) and [HTTP Transports](/connect/reference/configuration/wamp#http-transports-long-poll-and-sse).

### Removed keys

Delete these keys. None has a replacement.

| Key | Why | Removed in |
|---|---|---|
| `store.*` | RocksDB is gone. The current storage engine has no equivalent keys. | 1.0.0 |
| `oplog.catalog`, `oplog.core.scan_max_concurrency` | No code read them. | 1.0.0 |
| `db.compaction.peer_timeout` | Compaction waits for every cluster member until the member leaves the cluster. | 1.0.0 |
| `wamp.dealer.pattern_based_registration`, `wamp.broker.pattern_based_subscription` | Pattern-based registration and subscription are always on. | 1.0.0 |
| The `wamp.broker.*` and `wamp.dealer.*` feature keys | A WAMP feature is a capability of the build, not a setting. A client asks for features in `HELLO`. | 1.0.0 |
| `wamp.transport_queue.overflow_strategy` | A full queue always evicts its oldest entry. | 1.0.0 |
| `security.oidc.providers.enabled`, `security.oidc.providers.<id>.login_path`, `security.oidc.providers.<id>.redirect_path` | No code read them. You configure OIDC providers on the realm, in `oidc_providers`. The API Gateway specification gives the login and callback routes. | 1.0.1 |

Files written for a release candidate before `1.0.0-rc.65` can also set `erlang.kernel_polling`, `platform_etc_dir`, `nodename` or `distributed_cookie`. The current release does not read them. Set the node name and the cookie in `vm.args`. The `log.console.*`, `log.syslog`, `log.error.redirect` and `log.async_threshold.*` keys have no direct replacement. Configure each log handler under `log.handlers.$id.*`. The `check` report names a candidate key for each of these.

### Changed values

- `oauth2.refresh_token.limit` is a whole number of tokens, 1 or more. A value with a unit suffix, such as `25KB`, or `0` stops the node at boot with an error that names the key. *Changed in 1.0.1.*
- `security.ticket.authmethods` and a realm's `authmethods` refuse `oidc`. That method named a module that does not exist. OIDC sign-in uses `oidcrp`. *Changed in 1.0.0.*

### A single node

*Changed in 1.0.0.*

A node that runs alone sets `cluster.enabled = off`. The key defaults to `on`. A single node left on `on` never compacts its history. Under the default fence settings, it also refuses every authentication from its first boot: only an anti-entropy round that reaches a peer confirms its security tables, and a node with no peer never completes one. Keep the default on every member of a cluster. See [Enabling clustering](/connect/reference/configuration/cluster#enabling-clustering).

A node with `cluster.peer_discovery.enabled = on` refuses to start on a peer plane without TLS and peer verification, unless you set `cluster.tls.allow_insecure = on`. See the [Cluster Configuration Reference](/connect/reference/configuration/cluster).

### `advanced.config`

*Changed in 1.0.0.*

- Rename a `{bondy, [...]}` stanza to `{bondy_router, [...]}`. The router's OTP application is `bondy_router`. Erlang ignores a stanza for an application that it does not load, so the old name does not fail the boot. Its settings do not apply.
- Delete a `{plum_db, [...]}` stanza. The `plum_db` application no longer exists.
- If you wrote a `bondy_oplog_cache_adapter` for a named pre-release, implement `ticket/1` and `fill/5` in place of `put/4`. Numbered release candidates had no such behaviour.
- A remote-console call or a script uses the new module names. [Step 6 of the pre-release upgrade](/connect/guides/deployment/upgrading_to_1_0_0#upgrade-from-a-bondy-db-pre-release) lists them.

`migrate_conf.escript check` also reports `advanced.config` stanzas that no longer apply when the file sits next to `bondy.conf`.

## 3. Update your WAMP clients

### Pass the realm argument where it is required

*Changed in 1.0.0.*

Bondy's administration procedures (`bondy.*`) take the realm URI as their first positional argument. A caller in the master realm, `com.leapsight.bondy`, can name any realm. Any other caller can name only its own realm.

Most of these procedures still let you omit the realm. Bondy then uses the caller's realm. This works only for a procedure whose argument count tells the two forms apart. Three procedures also take an optional last argument, so an omitted realm made a call readable two ways. These three now require the realm:

| Procedure | Arguments |
|---|---|
| [`bondy.user.change_password`](/connect/reference/wamp_api/user#change-the-user-password) | `realm_uri, username, new_password[, old_password]` |
| [`bondy.source.match`](/connect/reference/wamp_api/source) | `realm_uri, username[, ip_address]` |
| [`bondy.registration.callee.list`](/connect/reference/wamp_api/registration#list-callees) | `realm_uri[, procedure_uri]` |

A call to one of these without the realm fails with `wamp.error.invalid_argument`, and the description says that the count includes the realm.

```bash
# Release candidate: the realm was taken from the session.
wick --realm com.example.app call bondy.user.change_password "alice" "n3w-s3cret"

# Current release: name the realm.
wick --realm com.example.app call bondy.user.change_password \
  "com.example.app" "alice" "n3w-s3cret"
```

### Drop the realm argument from WAMP meta procedures

*Changed in 1.0.0.*

The `wamp.registration.*`, `wamp.subscription.*`, `wamp.session.get` and `wamp.reflection.*` procedures take the arguments that the WAMP specification gives. Each one reads the caller's realm and takes no realm argument. A call that still passes the realm as its first argument has one argument too many, and fails with `wamp.error.invalid_argument`. `lookup` is the exception: it reads the realm as the URI and the URI as the options, and the call fails with `bondy.error.internal_error`.

| Procedure | Arguments now |
|---|---|
| `wamp.registration.list`, `wamp.subscription.list` | none |
| `wamp.registration.lookup`, `wamp.subscription.lookup` | `uri[, options]` |
| `wamp.registration.match` | `uri`. The result is one registration id, the best match, or no result when nothing matches. |
| `wamp.subscription.match` | `uri`. The result is a list of subscription ids, or no result when nothing matches. |
| `wamp.registration.get`, `wamp.subscription.get` | `id`. The `details` argument is removed. |
| `wamp.registration.list_callees`, `wamp.registration.count_callees` | `registration_id` |
| `wamp.subscription.list_subscribers`, `wamp.subscription.count_subscribers` | `subscription_id` |
| `wamp.session.get` | `session_id` |

A master-realm session that reads another realm calls the `bondy.*` procedure instead. Each one takes the realm first:

| Instead of | Call |
|---|---|
| `wamp.registration.get` | [`bondy.registration.get`](/connect/reference/wamp_api/registration#get-a-registration-in-a-realm) |
| `wamp.registration.list_callees` | [`bondy.registration.list_callees`](/connect/reference/wamp_api/registration#list-a-registration-s-callees-in-a-realm) |
| `wamp.registration.count_callees` | [`bondy.registration.count_callees`](/connect/reference/wamp_api/registration#count-a-registration-s-callees-in-a-realm) |
| `wamp.subscription.get` | [`bondy.subscription.get`](/connect/reference/wamp_api/subscription) |
| `wamp.subscription.list_subscribers` | [`bondy.subscription.list_subscribers`](/connect/reference/wamp_api/subscription) |
| `wamp.subscription.count_subscribers` | [`bondy.subscription.count_subscribers`](/connect/reference/wamp_api/subscription) |

The `on_create` and `on_delete` registration and subscription meta events are no longer published. A cluster cannot tell a URI's first and last registration without coordination between its nodes.

### Set passwords and secrets with their own procedure

*Changed in 1.0.1.*

`bondy.user.update`, `bondy.oauth2.client.update` and `bondy.oauth2.resource_owner.update` refuse a `password` with `wamp.error.invalid_argument`. `bondy.oauth2.client.update` also refuses a `client_secret`. A release candidate answered success, left the credential unchanged and closed the user's sessions. Set a password or a client secret with `bondy.user.change_password`.

### Replace removed procedures

*Changed in 1.0.0.*

- `bondy.oauth2.token.get`, `bondy.oauth2.token.refresh` and `bondy.telemetry.metrics` are removed. No release implemented them. A call gets `wamp.error.no_such_procedure`.
- `bondy.security.find_source` answers `bondy.error.deprecated_procedure`.
- `bondy.backup.create`, `bondy.backup.status` and `bondy.backup.restore` are deprecated aliases of `bondy.export.create`, `bondy.export.status` and `bondy.export.import`. Use the `bondy.export.*` names. See [Export](/connect/reference/wamp_api/export).

### Update CALL, REGISTER and PUBLISH options

*Changed in 1.0.0.*

- `REGISTER.Options.invoke` accepts only `single`, `roundrobin`, `random`, `first` and `last`. For any other value, such as `jump_consistent_hash`, `queue_least_loaded`, `queue_least_loaded_sample`, `jch`, `qll` or `qlls`, Bondy ends the session with `ABORT` and `wamp.error.protocol_violation`.
- The `_routing_key` option of `CALL`, `CANCEL` and `PUBLISH` is removed. A partitioned call sets `runmode = "partition"` and names its key with `rkey`. Bondy routes it by a consistent hash of `rkey`. Without `rkey`, the call fails with `wamp.error.invalid_argument`.
- A peer announces `call_canceling` in `HELLO` to get it. Bondy no longer assumes a feature that the peer did not announce. A `CANCEL` in `kill` or `killnowait` mode to a callee that did not announce `call_canceling` acts as `skip`.
- A `CANCEL` in `kill` mode that the caller is not allowed to make gets no reply, and the call continues.
- `PUBLISH` applies `eligible_authid`, `eligible_authrole`, `exclude_authid` and `exclude_authrole`. An empty `eligible` list delivers to no subscriber.

### Check serialization and subprotocols

*Changed in 1.0.0.*

- The WebSocket listener does not negotiate the batched subprotocols, such as `wamp.2.json.batched`. A client that offers one of them gets its next offer, or a refused handshake.
- Every serializer decodes nil as absent. A `null` option, such as `timeout`, is treated as if the client did not send it.
- Over CBOR, Bondy sends a valid UTF-8 string as a text string, not a byte string. Other binaries stay byte strings.
- MessagePack is encoded by Bondy's own codec. Four behaviours change. See [Serialization](/connect/reference/serialization#messagepack).

### Check the error URIs your clients match

Some procedures answer with a different error. A client that matches on error URIs needs updating.

| Case | Error now | Changed in |
|---|---|---|
| `wamp.error.not_authorized` over HTTP | HTTP `403` | 1.0.0 |
| `wamp.error.authorization_failed` over HTTP | HTTP `500` | 1.0.0 |
| Inconsistent values, such as a grant whose `uri` and `match` disagree, or a realm's `is_prototype` and `prototype_uri` | `bondy.error.inconsistency_error`. A release candidate answered `invalid_argument`. | 1.0.0 |
| `bondy.user.enable` or `bondy.user.disable` for an unknown user | `wamp.error.no_such_principal` | 1.0.1 |
| A user, group, client or resource owner call that names a reserved name, such as `all` or `anonymous` | `bondy.error.invalid_value` | 1.0.1 |
| `bondy.user.remove_group`, `bondy.group.add_group`, `bondy.group.add_groups`, `bondy.group.remove_group` | An empty result. A release candidate stored the change and then answered `bondy.error.internal_error`. | 1.0.1 |

The [Error Reference](/connect/reference/errors) gives every error and its HTTP status.

## 4. Update your HTTP clients

### Authenticate to the Admin HTTP API

*Changed in 1.0.1.*

Every listener that carries `admin_api`, except the internal socket, needs an OAuth2 bearer token from the master realm on each request other than `OPTIONS`. A request without one gets `401`. To use the Admin API over the network:

1. Add `oauth2` to the master realm's `authmethods`.
2. Add an `oauth2` source for the network your administrators connect from.
3. Get a token from `/oauth/token` on the same listener, and send it as `Authorization: Bearer <token>`.

The internal socket, `<platform_runtime_dir>/bondy_admin.sock`, needs no token. A browser can use the master realm's OIDC ticket cookie instead. See [Authenticating to the Admin API](/connect/reference/configuration/listeners#authenticating-to-the-admin-api).

### Update the Admin HTTP API routes

*Changed in 1.0.0, and in 1.0.1.*

| Route | Change |
|---|---|
| `GET /realms/:realm_uri/registrations_summary`, `GET /realms/:realm_uri/subscriptions_summary` | Removed. `GET /realms/:realm_uri/registrations` and `GET /realms/:realm_uri/subscriptions` answer with the first page, up to 100 entries, as `values`, `has_more` and `cursor`. Each entry has `id`, `uri`, `match` and `created`, and a registration also has `invoke`. |
| `GET /realms/:realm_uri/registrations/:id` | Calls `bondy.registration.get`. |
| `GET /realms/:realm_uri/registrations/:id/callees` | Calls `bondy.registration.list_callees`. |
| `POST /services/create_backup`, `GET /services/backup_status`, `POST /services/restore_backup` | Call `bondy.export.create`, `bondy.export.status` and `bondy.export.import`. |
| `PUT /realms/:realm_uri/users/:id`, `PUT /realms/:realm_uri/clients/:id`, `PUT /realms/:realm_uri/resource_owners/:id` | Refuse a `password` with `400`. `PUT /realms/:realm_uri/clients/:id` also refuses a `client_secret`. Use `POST /realms/:realm_uri/users/:id/change_password`. (1.0.1) |

See the [Admin HTTP API Reference](/connect/reference/http_api/index).

### Fix your API Gateway specifications

*Changed in 1.0.0, and in 1.0.1.*

- The gateway refuses a specification that contains a key it does not know. This applies at the host, version, path, method, action and response levels, in `defaults`, and in a security scheme. A release candidate dropped a misspelt key and applied its default.
- A security scheme refuses `scopes`. The gateway checks no OAuth2 scope.
- The `wamp_call` action has no `retry_timeout`. When the action's `options` set no `_retries`, the action's `retries` becomes the CALL option `_retries`. The dealer retries only a registration that set `_idempotent`.
- The `forward` action sends the upstream's body and content type as received. A release candidate decoded and encoded JSON again, and labelled every body `application/json`.
- An upstream that does not answer gets `bondy.error.gateway_timeout` (`504`). `bondy.error.bad_gateway` answers `502`, not `503`.
- A path with the `oidc` scheme authenticates with the realm's OIDC ticket cookie. A request other than `GET`, `HEAD` or `OPTIONS` also sends the CSRF token in `x-csrf-token`. A release candidate answered `500` on such a path. (1.0.1)
- A path with the `basic` or `api_key` scheme answers `401`. Bondy does not enforce these schemes. A release candidate answered `500`. (1.0.1)
- The `status_codes` map at the host and version levels overrides the built-in defaults. An `on_error` response uses it only when its `status_code` reads it. Otherwise the status comes from the error URI.

Load each specification on a test node before the cut-over. See the [API Gateway Specification Reference](/connect/reference/api_gateway/specification).

### Check request limits

*Changed in 1.0.0.*

- A request with more than 100 query-string parameters or form fields gets `400`. The limit is Cowboy's default, and Bondy does not change it. It applies to API Gateway routes, the Admin API, the OAuth2 token endpoint and the OIDC endpoints.
- Every `http` listener offers HTTP/2. Set `listeners.$name.http.versions = 1.1` to turn it off on one listener. One HTTP/2 connection carries many requests, so an alarm that counts connections counts fewer than the requests.
- An `http` listener honours forwarding headers only when `listeners.$name.proxy_protocol = on` and the socket peer is inside `listeners.$name.proxy_protocol.trusted_proxies`. See [Proxy protocol and forwarded headers](/connect/reference/configuration/listeners#trusted-proxies).

## 5. Update realm authentication settings

*Changed in 1.0.1.*

On a realm with security enabled, Bondy now applies the realm's `authmethods` and sources everywhere a credential arrives. A release candidate skipped this check in several places. Review each realm that uses OIDC, tickets or cookies.

- **`cookie` and `oidcrp` are separate methods.** `cookie` means that a credential may arrive in a cookie. `oidcrp` admits a ticket that the OIDC login flow issued. `ticket` admits a ticket from `bondy.ticket.issue`. A ticket sent in the ticket cookie needs `cookie` as well as its own method, each with a source that allows it.
- **Sources apply to OIDC users without a user record.** This is the case when the provider does not set `auto_provision`. Such a user is matched only by a source assigned to `all`, in the realm or in its prototype. Add sources such as `{"usernames": "all", "authmethod": "oidcrp", "cidr": "0.0.0.0/0"}` and the same with `cookie`, scoped to the networks your users connect from.
- **The OIDC callback checks the realm first.** The realm must admit `oidcrp` for the user from the client's address. Otherwise the callback answers `403` with `no_authmethod`, and `auto_provision` creates no user.
- **The verify route applies the realm's methods and sources.** See [Verify route](/connect/reference/api_gateway/specification#verify-route).
- **MCP requests behind a trusted proxy match sources against the client's address**, not the proxy's address. Write sources for your clients' networks.

For now, `cookie` still admits an OIDC ticket that `oidcrp` does not. Bondy logs a warning that starts "The realm admitted an OIDC credential through the 'cookie' method", once per realm on each node until the node restarts. A later release removes this. Add `oidcrp` to the realm's `authmethods` now.

See [OIDC Authentication](/connect/concepts/oidc_authentication) and [Sources](/connect/reference/wamp_api/source).

## 6. Update dashboards, alerts and log searches

*Changed in 1.0.0, unless marked.*

These metrics and log messages existed only in the named pre-releases. A numbered release candidate, `1.0.0-rc.65` included, did not export them, so a dashboard built for one has nothing to change here.

- `bondy_oplog_peer_exclusions_total` is removed.
- `bondy_oplog_gc_scheduler_events_total` has a `scheduler` label as well as `event`. A query that selects by `event` without aggregation over `scheduler` returns one series for each scheduler.
- `bondy_cluster_channel_connections` is labelled by `peer` and `channel`, and is exported once per scrape.
- The log message "Prefix-closure hold" is "Causal hold", and "Reclamation stalled" is "GC stalled".

These changed in 1.0.1:

- The master-realm hardening warnings no longer contain the identifiers "(D-1)" and "(D-2)". A log alert that matched them needs updating.
- New alarm `bondy_auth_fence_closed`, severity critical. Bondy raises it when the authentication freshness fence refuses every new authentication for longer than `db.oplog.aae.fence.alarm` (default `5m`, `0` disables). See [Alarms](/connect/reference/alarms#bondy-auth-fence-closed).

See the [Metrics Reference](/connect/reference/metrics) and the [Logging Reference](/connect/reference/logging).

## Result

Your configuration passes `migrate_conf.escript check`, and your clients call procedures and routes in the shape that the current release accepts. Your realms admit each credential through the methods and sources that you intend.

## See also

- [What's New in 1.2](/connect/whats_new) — the changes between 1.0.0 and this release.
- [Upgrading to 1.0.0](/connect/guides/deployment/upgrading_to_1_0_0) — move your data from a release candidate.
- [Network Listeners](/connect/reference/configuration/listeners) — every `listeners.$name.*` key.
- [WAMP Administration API](/connect/reference/wamp_api/index) — the arguments of every procedure.
