---
draft: false
outline: [2,3]
related:
    - text: "Architecture"
      type: "Concept"
      link: "/router/concepts/architecture"
      description: "Bondy's storage and replication design: bondy_db, bondy_oplog, and bondy_mst."
    - text: "Data Storage & Active Anti-entropy Configuration Reference"
      type: "Reference"
      link: "/router/reference/configuration/data_storage"
      description: "The db.* configuration surface that replaces store.*."
    - text: "Cluster Configuration Reference"
      type: "Reference"
      link: "/router/reference/configuration/cluster"
      description: "Partisan peer-plane TLS and the cluster.tls.allow_insecure startup gate."
    - text: "Running a Cluster"
      type: "Guide"
      link: "/router/guides/deployment/running_a_cluster"
      description: "Form the new 1.0.0 cluster before importing your migrated data."
---

# Upgrading to 1.0.0

Bondy 1.0.0 replaces the storage and replication engine end to end: PlumDB and its RocksDB backend are gone, replaced by `bondy_db`, `bondy_oplog`, and `bondy_mst` (see [Architecture](/router/concepts/architecture)). The on-disk format changed with it, and there is no in-place migration — a node running a pre-1.0.0 release cannot simply be upgraded and restarted; its data directory is unreadable by 1.0.0.

This guide covers the supported migration path: back up your data using the backup mechanism your current release already has, stand up a fresh 1.0.0 deployment, and import that backup — 1.0.0's importer recognises the old file format and translates it automatically. It ends with a checklist of the other breaking changes in this release worth reviewing before you cut over.

::: warning No in-place upgrade
Starting a 1.0.0 node against a pre-1.0.0 data directory does not migrate it and does not fail loudly — the new storage engine simply doesn't recognise the old files and starts with an empty database. Follow the migration procedure below instead.
:::

::: info Upgrading from a 1.0.0 pre-release
None of the migration below applies to a cluster already running a 1.0.0 pre-release that carries `bondy_db` (for example `1.0.0-rc.olive` or `1.0.0-rc.pear`). Upgrade it with a **full cluster restart**: stop every node, then start them all on the new release. Rolling upgrades are not supported. The registry is held in memory, so the restart loses nothing; clients reconnect and register again.
:::

## Prerequisites

- **Erlang/OTP 28 or later** on every host that will run 1.0.0 (see [Install from Source](/router/guides/install/source) for the full toolchain). This is a hard requirement, up from OTP 24.
- A WAMP session on the old deployment's master realm (`com.leapsight.bondy`) with `wamp.call` permission, to invoke the backup procedures. The examples below use [`wick`](/router/reference/wamp_api/index), the WAMP CLI client used throughout the WAMP API reference.
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

Copy the file named in step 1 (e.g. via `scp` or `rsync`) to a location readable by the new deployment. If you're migrating a cluster, you only need to import it once — see step 7 — but you're free to stage the copy on every new node in advance.

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

### 5. Install 1.0.0 and check `bondy.conf` against its schema

Install the 1.0.0 release (see [Install from Source](/router/guides/install/source), [Install using Docker](/router/guides/install/docker), or your usual packaging) on each new node and carry over your `bondy.conf`. Do not start the node yet.

Check the file before the first start, because a wrong `bondy.conf` does not stop the boot. The release's pre-start hook runs cuttlefish with `--allow_extra --silent`. With `--allow_extra`, cuttlefish skips a key that no schema maps, so an old key is dropped without a message and its subsystem runs on the default. With `--silent`, a value that cuttlefish cannot parse prints nothing; cuttlefish then generates no configuration for the whole file, so none of its settings apply.

The check tool is `scripts/migrate_conf.escript` in the Bondy source tree; the release does not ship it. It needs `escript` (Erlang/OTP) on the `PATH` and finds cuttlefish and the schemas relative to the current directory, so run it from one of two places:

* the root of a 1.0.0 source checkout, after `rebar3 compile`;
* the root of the unpacked 1.0.0 release, with the script copied there. It reads `bin/cuttlefish` and the schemas under `releases/<vsn>/`.

1. **Check the file.** Nothing is written.

   ```bash
   ./scripts/migrate_conf.escript check /etc/bondy/bondy.conf
   ```

   From a source checkout, `just conf-check /etc/bondy/bondy.conf` runs the same command. To check against another schema set, add `--schema-dir DIR` (repeatable).

   The report has one section per kind of finding, and the `RESULT` line comes last:

   ```text
   /etc/bondy/bondy.conf
     4 keys, schemas: schema schema/hidden _build/default/lib/riak_sysmon/priv

     KEYS: 3 of 4 are set but this release maps none of them, so each
     is dropped in silence at boot and the setting does not apply.

     RENAME -- same setting, new key (2)
       oplog.aae.interval                             = 1m             ->  db.aae.interval
       oplog.core.shard_count                         = 16             ->  db.main.shard_count

     DROP -- no equivalent on this release (1)
       store.rocksdb.max_open_files                   = 1000
           the RocksDB tuning surface; this release has no equivalent

     INVALID VALUE (1) -- this release reads this key, but cannot parse the value.
     ...
       db.wal.fsync_mode                              = sometimes
           not a valid one of per_write, batched. Generation stops at phase
           transform_datatypes.

     LISTENERS: this file writes no listeners.* key, so the node
     starts the built-in default inventory and nothing else:
       admin
       api_gateway_http
       wamp_tcp

   RESULT  3 keys not read, 1 invalid value, 0 listener findings -- see above
   ```

   | Section | Meaning |
   |---|---|
   | `KEYS` | Keys that 1.0.0 does not read, grouped by what to do: `RENAME` (same setting, new key), `CONTESTED` (the rename changes behaviour), `ALREADY SET` (the new key is also in the file with another value), `DROP` (no equivalent), `BY HAND` (no mechanical equivalent; the tool names candidates), `NOT ON THIS RELEASE`, and `NO RULE`. `KEYS: all recognised` means none. |
   | `INVALID VALUE` | Keys that 1.0.0 reads but whose value it cannot parse. One such value discards the whole file, so fix these first. |
   | `CHANGED MEANING` | Keys still read, but not as before. Confirm each value still says what you meant. These do not affect the exit code. |
   | `LISTENERS` | The listeners the file will start, and any listener finding. |

   If an `advanced.config` sits next to the file, the tool checks it too and reports stanzas that no longer take effect. The exit code is `0` when `RESULT` reads `clean`, `1` when there are findings, and `2` when the check could not run (for example, the file does not exist or cuttlefish cannot be found).

2. **Write a converted file.** If the check reports findings, let the tool apply the mechanical renames:

   ```bash
   ./scripts/migrate_conf.escript migrate /etc/bondy/bondy.conf \
     --out /etc/bondy/bondy.conf.new
   ```

   `migrate` never edits the input and refuses an `--out` file that already exists (exit `2`). In the new file, renamed keys carry their new names. Dropped keys and keys that need a decision are commented out, each under `## migrate_conf:` lines that say why. Search the new file for `## migrate_conf: needs a decision` and resolve each one by hand. The exit code reports the check of the file just written, not whether the rewrite ran.

3. **Check the result.** Run `check` on the new file until `RESULT` reads `clean -- every key is read, every value parses, every listener is declared` and the exit code is `0`. Then put it in place as the node's `bondy.conf`.

From a source checkout, `./scripts/migrate_conf.escript selftest` checks the tool's own rules against the schemas it runs with and prints `selftest OK` on success. It needs the source tree's shipped configuration files, so it does not run from a release root.

The release also contains `bin/validate-config`. It does not check keys or values: the pre-start hook runs it on every start to confirm that `bondy.conf` (or `bondy.conf.template`) and `vm.extra.args` exist in the `etc` directory. Do not use it as a schema check.

### 6. Boot the new 1.0.0 node(s)

Start each node.

If you're running (or moving to) more than one node, join them into a cluster now, before importing — see [Running a Cluster](/router/guides/deployment/running_a_cluster).

::: warning Auto-clustering nodes with an insecure Partisan peer plane
If `cluster.peer_discovery.enabled = on` and the Partisan peer plane isn't secured (TLS off, or TLS on without peer certificate verification), 1.0.0 **refuses to start** rather than cluster over an unauthenticated connection. Configure `cluster.tls.enabled = on` with `verify_peer` and a private cluster CA, or set `cluster.tls.allow_insecure = on` to acknowledge the risk explicitly. See the [Cluster Configuration Reference](/router/reference/configuration/cluster).
:::

### 7. Import the backup file

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

### 8. Verify and decommission the old deployment

Spot-check that realms, users, and API gateway specs are present on the new deployment before you decommission the old one. Once you're satisfied, take the old nodes out of service.

## Other breaking changes to check

Review these before you finalise your `bondy.conf` and cutover plan — none of them are part of the export/import procedure above, but each can stop the new release from starting or behaving as your existing configuration or clients expect.

### Storage and AAE key renames

Every storage-related `bondy.conf` key changed name as part of the storage-engine replacement. Bondy does not refuse to boot on a key it doesn't recognise: the release's pre-start hook runs cuttlefish with `--allow_extra`, so an old key carried over unchanged is dropped without a message and its setting does not apply. The check in [step 5](#_5-install-1-0-0-and-check-bondy-conf-against-its-schema) reports every such key and its replacement.

The `oplog.` prefix is now `db.`, unconditionally. If you didn't customise any of these, there's nothing to do — the defaults are unchanged:

| Old key (≤ 1.0.0-rc.65) | New key |
|---|---|
| `oplog.aae` | `db.aae` |
| `oplog.aae.interval` | `db.aae.interval` |
| `oplog.aae.live_sync` | `db.aae.live_sync` |
| `oplog.aae.live_sync.max` | `db.aae.live_sync.max` |
| `oplog.aae.max_concurrency` | `db.aae.max_concurrency` |
| `oplog.aae.max_pages_in_flight` | `db.aae.max_pages_in_flight` |
| `oplog.aae.load_adaptive` | `db.aae.load_adaptive` |
| `oplog.aae.load_run_queue_threshold` | `db.aae.load_run_queue_threshold` |
| `oplog.aae.fanout` | `db.aae.fanout` |
| `oplog.aae.fence.max_lag` | `db.aae.fence.max_lag` |
| `oplog.aae.fence.on_isolation` | `db.aae.fence.on_isolation` |

Four more keys move from `oplog.core.*` to a bare `db.*` — the `core.` segment drops because these settings were never specific to one database; they govern every replicated table node-wide:

| Old key | New key |
|---|---|
| `oplog.core.gc_interval` | `db.gc_interval` |
| `oplog.core.gc_heap_delta` | `db.gc_heap_delta` |
| `oplog.core.pack_auto_seal_bytes` | `db.pack_auto_seal_bytes` |
| `oplog.core.pack_seal_mode` | `db.pack_seal_mode` |

Bondy's durable database itself is renamed: `core` is now `main`, to stop it being confused with the unrelated `bondy_oplog_core` substrate module. If your `bondy.conf` sets any of the durable database's topology, rename these too:

| Old key | New key |
|---|---|
| `oplog.core.shard_count` | `db.main.shard_count` |
| `oplog.core.partition_strategy` | `db.main.partition_strategy` |
| `oplog.core.realm_prefix_depth` | `db.main.realm_prefix_depth` |
| `oplog.core.on_topology_mismatch` | `db.main.on_topology_mismatch` |

The value and its meaning are identical for every rename above — only the key name moved. The on-disk directory for the durable database is also renamed, from `<platform_data_dir>/bondy_db/core` to `<platform_data_dir>/bondy_db/main` — irrelevant if you wiped the data directory per step 4 above, but worth knowing if you scripted anything against the old path. The [Data Storage & Active Anti-entropy Configuration Reference](/router/reference/configuration/data_storage#deprecated-and-removed-keys) also lists every old key inline, greyed out, linking to its replacement.

### Removed keys

These keys have no replacement — remove them from your `bondy.conf` rather than renaming them:

- `oplog.catalog` — never had a consumer; setting it did nothing in any released version.
- `oplog.core.scan_max_concurrency` — same; never wired to any code path.
- Any `store.*` key (RocksDB tuning) — RocksDB is gone. The `leveled` backend that replaced it has no equivalent `bondy.conf` tuning surface yet; if you relied on `store.*` for capacity planning, there is currently nothing to replace it with.

### advanced.config application names

Two application identifiers changed. Both are silently inert under the old name rather than a boot error, which makes them easy to miss — Erlang doesn't fail when configuring an application that isn't loaded, it just stops taking effect:

- **`bondy` → `bondy_router`.** The router's OTP application changed name (source now lives under `apps/bondy_router`). This is transparent to normal operation — the release name, node name, `bondy.conf` file, and every WAMP URI are unchanged. It only matters if you reach into the application name directly: a custom `sys.config`/`advanced.config` stanza keyed on `{bondy, [...]}`, or a release hook or health check that calls `application:get_env(bondy, ...)`. Rename those stanzas to `{bondy_router, [...]}`.
- **`plum_db` removed.** If you have an `advanced.config` with a `{plum_db, [...]}` stanza (for `store.*` settings that had no `bondy.conf` mapping, or anything else), delete it. The `plum_db` application no longer exists in 1.0.0, so the stanza does nothing — but it's dead weight and worth removing so it doesn't look like it's still taking effect.

### New optional keys

None of these existed at 1.0.0-rc.65 in any form — there's nothing to migrate, and the defaults are safe to run with unchanged, but they're worth knowing about: `db.registry.shard_count` (the ephemeral registry's shard count); `db.wal.fsync_mode`, `db.wal.max_segment_bytes`, `db.wal.batched_fsync_interval`, `db.wal.batched_fsync_bytes` (write-ahead log durability and batching); `db.reclaim`, `db.reclaim.interval`, `db.reclaim.batch_cells`, `db.origin_retirement`, `db.origin_retirement.interval`, `db.gc_max_concurrency`, `db.compaction.peer_timeout` (previously internal-only reclamation/retirement tuning, now real `bondy.conf` keys — see the [Reclamation Configuration Reference](/router/reference/configuration/reclamation)); `cluster.max_message_size` (Partisan inter-node frame size cap); and `load_regulation.aae_reactor.pool.size`, `load_regulation.router.flow_pool.capacity` (see the [Overload Protection](/router/reference/configuration/overload_protection) reference).

### Other changes

- **Erlang/OTP 28 minimum.** Up from OTP 24. Upgrade the Erlang runtime on every host before installing 1.0.0.
- **Cowboy 2.17's query-string/form-field cap.** Cowboy was upgraded from 2.13.0 to 2.17.0, which rejects any request carrying more than 100 query-string parameters or `application/x-www-form-urlencoded` form fields — a Cowboy 2.17 default that Bondy does not override. This affects API Gateway routes that read query parameters, the OAuth2 token endpoint, and the OIDC login/callback endpoints. Audit any client that sends unusually wide query strings or large forms before cutting over.
- **Partisan peer-plane TLS gate.** Covered in step 6 above — an auto-clustering node with an insecure peer plane now refuses to start instead of clustering insecurely. Only relevant if `cluster.peer_discovery.enabled = on`.
- **HTTP/2 on every listener.** All four HTTP listeners now negotiate HTTP/2 automatically (ALPN on the HTTPS listeners, `h2c`/prior-knowledge on the HTTP listeners) — there's no setting to opt out. Nothing to configure, but revisit capacity planning: one HTTP/2 connection can carry up to `max_concurrent_streams` (default 100) requests concurrently, so connection-count-based alarms will now undercount request-level load.

Not a breaking change, but worth considering while you're already re-provisioning nodes: realm private keys can now be encrypted at rest via `security.master_key.*`. See [Security Configuration Reference → Realm Signing Keys](/router/reference/configuration/security#realm-signing-keys).

If you're building from source rather than installing a packaged release, `config/bondy.conf.defaults` (regenerate it with `make conf`) lists every current key and its default, and is a useful diff target against your existing `bondy.conf`.

## Result

You now have a 1.0.0 deployment running on the new storage engine: your realms recreated, and the users, groups, grants, sources, API gateway specs, bridges, tickets, tokens, and retained messages from your pre-1.0.0 deployment imported into them, with the old nodes decommissioned.

## See also

- [Architecture](/router/concepts/architecture) — the storage and replication model behind `bondy_db`, `bondy_oplog`, and `bondy_mst`.
- [Data Storage & Active Anti-entropy Configuration Reference](/router/reference/configuration/data_storage) — the `db.*` configuration surface that replaces `store.*` and `oplog.*`.
- [Running a Cluster](/router/guides/deployment/running_a_cluster) — forming the new cluster before you import.
- [Cluster Configuration Reference](/router/reference/configuration/cluster) — the Partisan peer-plane TLS options and the `cluster.tls.allow_insecure` gate.
