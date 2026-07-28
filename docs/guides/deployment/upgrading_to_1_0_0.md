---
draft: false
outline: [2,3]
related:
    - text: "Architecture"
      type: "Concept"
      link: "/concepts/architecture"
      description: "Bondy's storage and replication design: bondy_db, bondy_oplog, and bondy_mst."
    - text: "Data Storage Configuration Reference"
      type: "Reference"
      link: "/reference/configuration/data_storage"
      description: "The oplog.* configuration surface that replaces store.*."
    - text: "Cluster Configuration Reference"
      type: "Reference"
      link: "/reference/configuration/cluster"
      description: "Partisan peer-plane TLS and the cluster.tls.allow_insecure startup gate."
    - text: "Running a Cluster"
      type: "Guide"
      link: "/guides/deployment/running_a_cluster"
      description: "Form the new 1.0.0 cluster before importing your migrated data."
---

# Upgrading to 1.0.0

Bondy 1.0.0 replaces the storage and replication engine end to end: PlumDB and its RocksDB backend are gone, replaced by `bondy_db`, `bondy_oplog`, and `bondy_mst` (see [Architecture](/concepts/architecture)). The on-disk format changed with it, and there is no in-place migration — a node running a pre-1.0.0 release cannot simply be upgraded and restarted; its data directory is unreadable by 1.0.0.

This guide covers the supported migration path: back up your data using the backup mechanism your current release already has, stand up a fresh 1.0.0 deployment, and import that backup — 1.0.0's importer recognises the old file format and translates it automatically. It ends with a checklist of the other breaking changes in this release worth reviewing before you cut over.

::: warning No in-place upgrade
Starting a 1.0.0 node against a pre-1.0.0 data directory does not migrate it and does not fail loudly — the new storage engine simply doesn't recognise the old files and starts with an empty database. Follow the migration procedure below instead.
:::

## Prerequisites

- **Erlang/OTP 28 or later** on every host that will run 1.0.0 (see [Install from Source](/guides/install/source) for the full toolchain). This is a hard requirement, up from OTP 24.
- A WAMP session on the old deployment's master realm (`com.leapsight.bondy`) with `wamp.call` permission, to invoke the backup procedures. The examples below use [`wick`](/reference/wamp_api/index), the WAMP CLI client used throughout the WAMP API reference.
- Filesystem access to copy a file from the old node(s) to the new node(s) — the backup is a single file, not a WAMP-transported payload.
- Enough free disk space on the old node for the backup file (proportional to your security, realm, API gateway, bridge, ticket, token, and retained-message data — not your live routing state, which the new deployment rebuilds as clients reconnect and re-register).
- A maintenance window. The backup is a point-in-time snapshot taken while the old deployment keeps running; anything written after it completes will not carry over.

## Migrate your data

### 1. Back up the database on the old node

Your pre-1.0.0 release doesn't have 1.0.0's `bondy_export` module — it has the module it replaces, `bondy_backup`, exposed as `bondy.backup.create`. Call it on the **old** deployment, passing the directory the backup file should be written to. The call is asynchronous — it validates the request, schedules the backup, and returns immediately with the generated filename:

::: code-group

```bash [Call]
./wick --url ws://old-node-host:18080/ws --realm com.leapsight.bondy \
  call bondy.backup.create '{"path": "/var/backups/bondy"}' | jq
```

```json [Result]
{
  "filename": "/var/backups/bondy/bondy_backup.1774598400.bak",
  "timestamp": 1774598400
}
```
:::

The target directory must already exist — the call doesn't create it. The filename is generated for you; a call succeeding only means the backup was *scheduled*, not that it finished, since the actual work happens asynchronously (see the next step).

::: tip Running Bondy in Docker
If the old deployment runs in Docker, `path` is a path *inside the container* (e.g. `/bondy/data/backup`). Mount a host directory there so the resulting file is reachable from outside the container to copy it to the new node.
:::

Only one backup (or restore) can run at a time **per node**. A second `bondy.backup.create` call while one is already in progress on that node fails immediately with the current status rather than queuing.

### 2. Verify the backup finished

Poll `bondy.backup.status`, or subscribe to the completion events — the latter is more reliable for automation, since it doesn't require guessing a poll interval:

```bash
./wick --url ws://old-node-host:18080/ws --realm com.leapsight.bondy \
  call bondy.backup.status '{"filename": "/var/backups/bondy/bondy_backup.1774598400.bak"}' | jq
```

While the backup is running, the call reports the operation and elapsed time. Once it has finished, the old release publishes `bondy.backup.finished` (or `bondy.backup.failed` on error) on the master realm, each carrying the backup's filename. Don't proceed to the next step until you've seen one of these two signals — a scheduled backup can still fail (for example, if the target directory turned out not to exist).

::: tip Once you're on 1.0.0
`bondy.backup.create`, `.status`, and `.restore` are kept in 1.0.0 as deprecated aliases of `bondy.export.create`, `.status`, and `.import` — same procedures, same argument shape. Use `bondy.export.*` for any backup automation you set up after the upgrade; reach for `bondy.backup.*` only because it's what your current, pre-1.0.0 release actually has.
:::

### 3. Copy the backup file to the new node(s)

Copy the file named in step 1 (e.g. via `scp` or `rsync`) to a location readable by the new deployment. If you're migrating a cluster, you only need to import it once — see step 6 — but you're free to stage the copy on every new node in advance.

### 4. Retire the old on-disk data

If you're reusing the same hosts for the 1.0.0 release, remove the old storage engine's data before starting it — 1.0.0 does not read it, and leaving it in place only wastes disk space. The path is whatever `platform_data_dir` was set to on the old node (`./data` relative to the release, by default):

```bash
# On each host being reused for 1.0.0, after the backup above is confirmed
bin/bondy stop
rm -rf /path/to/bondy/data
```

::: warning Do this only after step 2 has confirmed the backup succeeded
This step is irreversible. 1.0.0's storage engine writes its own layout under `<platform_data_dir>/bondy_db/` on first boot, so there's no need to pre-create anything — just make sure the directory doesn't still hold stale pre-1.0.0 files.
:::

If you're moving to new hosts instead, there's nothing to do here — just point the new nodes at a fresh `platform_data_dir`.

### 5. Install and boot the new 1.0.0 node(s)

Install the 1.0.0 release (see [Install from Source](/guides/install/source), [Install using Docker](/guides/install/docker), or your usual packaging) on each new node, carry over your `bondy.conf` (checking it against the breaking-changes checklist below first), and start it.

If you're running (or moving to) more than one node, join them into a cluster now, before importing — see [Running a Cluster](/guides/deployment/running_a_cluster).

::: warning Auto-clustering nodes with an insecure Partisan peer plane
If `cluster.peer_discovery.enabled = on` and the Partisan peer plane isn't secured (TLS off, or TLS on without peer certificate verification), 1.0.0 **refuses to start** rather than cluster over an unauthenticated connection. Configure `cluster.tls.enabled = on` with `verify_peer` and a private cluster CA, or set `cluster.tls.allow_insecure = on` to acknowledge the risk explicitly. See the [Cluster Configuration Reference](/reference/configuration/cluster).
:::

### 6. Import the backup file

Call `bondy.export.import` on the new deployment with the path to the file you copied over. This is 1.0.0's importer, and it recognises the pre-1.0.0 file format by its header: it transparently translates each old record into a write against the new storage engine as it reads, so you don't need to convert anything yourself.

Run it against a single node — every core table (security, realms, API gateway specs, bridges, tickets, tokens, retained messages) is fully replicated, so once the imported data lands on one node it converges to the rest of the cluster through the normal anti-entropy path, the same way any other write does. There's no need to import separately on every member.

```bash
./wick --url ws://new-node-host:18080/ws --realm com.leapsight.bondy \
  call bondy.export.import '{"filename": "/data/imports/bondy_backup.1774598400.bak"}' | jq
```

This returns immediately; the import itself runs asynchronously. Watch for `bondy.export.import_finished` or `bondy.export.import_failed` (filename-bearing events on the master realm), or poll `bondy.export.status`, to confirm it actually completed. Writes are batched (500 records per transaction) rather than fsynced individually, so a large dataset imports in a fraction of the time a naive per-record write would take.

The import is a set of fresh writes, not a byte-for-byte restore: replication metadata (clocks, causal history) from the old deployment is not — and should not be — preserved. Because you're importing an old-format backup rather than a 1.0.0-to-1.0.0 export, a couple of domains translate rather than carrying over unchanged:

- **Only the latest, still-valid OAuth2 refresh token per (realm, user) survives.** Expired tokens are dropped; the retained one is transparently upgraded to the current token format the first time a client uses it to refresh.
- **Realms themselves are not recreated.** The old release's realm record has no upgrade path, so it's intentionally skipped — but each realm's *data* (its users, groups, grants, sources, tickets, tokens, and retained messages, all banded by realm URI) imports regardless of whether the realm entity exists yet.

::: warning Recreate your realms separately
Recreate each realm from your configuration or with `bondy.realm.create` calls, the same way you provisioned it originally — before or after the import, it doesn't matter for the data. It does matter for your clients, though: they can't attach to a realm, and so can't exercise the imported users and grants, until it exists again.
:::

### 7. Verify and decommission the old deployment

Spot-check that realms, users, and API gateway specs are present on the new deployment before you decommission the old one. Once you're satisfied, take the old nodes out of service.

## Other breaking changes to check

Review these before you finalise your `bondy.conf` and cutover plan — none of them are part of the export/import procedure above, but each can stop the new release from starting or behaving as your existing configuration or clients expect.

- **App rename: `bondy` → `bondy_router`.** The router's OTP application changed name (source now lives under `apps/bondy_router`). This is transparent to normal operation — the release name, node name, `bondy.conf` file, and every WAMP URI are unchanged. It only matters if you reach into the application name directly: a custom `sys.config`/`advanced.config` stanza keyed on `{bondy, [...]}`, or a release hook or health check that calls `application:get_env(bondy, ...)`. Update those to `bondy_router`.
- **`store.*` configuration removed.** The entire PlumDB `store.*` namespace (and the `plum_db` broadcast wiring behind it) is gone. Remove any `store.*` keys from your `bondy.conf` — 1.0.0 doesn't recognise them and they have no effect. The equivalent surface for the new storage engine lives under `oplog.*`; see the [Data Storage](/reference/configuration/data_storage) and [Active Anti-entropy](/reference/configuration/aae) configuration references.
- **Erlang/OTP 28 minimum.** Up from OTP 24. Upgrade the Erlang runtime on every host before installing 1.0.0.
- **Cowboy 2.17's query-string/form-field cap.** Cowboy was upgraded from 2.13.0 to 2.17.0, which rejects any request carrying more than 100 query-string parameters or `application/x-www-form-urlencoded` form fields — a Cowboy 2.17 default that Bondy does not override. This affects API Gateway routes that read query parameters, the OAuth2 token endpoint, and the OIDC login/callback endpoints. Audit any client that sends unusually wide query strings or large forms before cutting over.
- **Partisan peer-plane TLS gate.** Covered in step 5 above — an auto-clustering node with an insecure peer plane now refuses to start instead of clustering insecurely. Only relevant if `cluster.peer_discovery.enabled = on`.
- **HTTP/2 on every listener.** All four HTTP listeners now negotiate HTTP/2 automatically (ALPN on the HTTPS listeners, `h2c`/prior-knowledge on the HTTP listeners) — there's no setting to opt out. Nothing to configure, but revisit capacity planning: one HTTP/2 connection can carry up to `max_concurrent_streams` (default 100) requests concurrently, so connection-count-based alarms will now undercount request-level load.

Not a breaking change, but worth considering while you're already re-provisioning nodes: realm private keys can now be encrypted at rest via `security.master_key.*`. See [Security Configuration Reference → Realm Signing Keys](/reference/configuration/security#realm-signing-keys).

## Result

You now have a 1.0.0 deployment running on the new storage engine: your realms recreated, and the users, groups, grants, sources, API gateway specs, bridges, tickets, tokens, and retained messages from your pre-1.0.0 deployment imported into them, with the old nodes decommissioned.

## See also

- [Architecture](/concepts/architecture) — the storage and replication model behind `bondy_db`, `bondy_oplog`, and `bondy_mst`.
- [Data Storage Configuration Reference](/reference/configuration/data_storage) — the `oplog.core.*` options that replace `store.*`.
- [Running a Cluster](/guides/deployment/running_a_cluster) — forming the new cluster before you import.
- [Cluster Configuration Reference](/reference/configuration/cluster) — the Partisan peer-plane TLS options and the `cluster.tls.allow_insecure` gate.
