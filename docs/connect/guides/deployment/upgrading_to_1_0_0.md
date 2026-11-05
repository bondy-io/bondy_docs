---
draft: false
outline: [2,3]
related:
    - text: "Architecture"
      type: "Concept"
      link: "/connect/concepts/architecture"
      description: "Bondy's storage and replication design: bondy_db, bondy_oplog, and bondy_mst."
    - text: "Data Storage & Active Anti-entropy Configuration Reference"
      type: "Reference"
      link: "/connect/reference/configuration/data_storage"
      description: "The db.* configuration surface that replaces store.*."
    - text: "Cluster Configuration Reference"
      type: "Reference"
      link: "/connect/reference/configuration/cluster"
      description: "Partisan peer-plane TLS and the cluster.tls.allow_insecure startup gate."
    - text: "Running a Cluster"
      type: "Guide"
      link: "/connect/guides/deployment/running_a_cluster"
      description: "Form the new 1.0.0 cluster before importing your migrated data."
---

# Upgrading to 1.0.0

Bondy 1.0.0 replaces the storage and replication engine end to end: PlumDB and its RocksDB backend are gone, replaced by `bondy_db`, `bondy_oplog`, and `bondy_mst` (see [Architecture](/connect/concepts/architecture)). The on-disk format changed with it, and there is no in-place migration — a node running a pre-1.0.0 release cannot simply be upgraded and restarted; its data directory is unreadable by 1.0.0.

This guide covers the supported migration path: back up your data using the backup mechanism your current release already has, stand up a fresh 1.0.0 deployment, and import that backup — 1.0.0's importer recognises the old file format and translates it automatically. The configuration and API changes that the upgrade also needs are in [Migrating from a Release Candidate](/connect/guides/deployment/migrating_from_a_release_candidate).

::: warning No in-place upgrade
Starting a 1.0.0 node against a pre-1.0.0 data directory does not migrate it and does not fail loudly — the new storage engine simply doesn't recognise the old files and starts with an empty database. Follow the migration procedure below instead.
:::

::: info Upgrading from a 1.0.0 pre-release
None of the migration below applies to a cluster already running a 1.0.0 pre-release that carries `bondy_db` (for example `1.0.0-rc.olive`, `1.0.0-rc.pear` or `1.0.0-rc.pistachio`). Follow [Upgrade from a `bondy_db` pre-release](#upgrade-from-a-bondy-db-pre-release) instead.
:::

## Prerequisites

- **Erlang/OTP 29 or later** on every host that builds or runs 1.0.0 from source (see [Install from Source](/connect/guides/install/source) for the full toolchain). This is a hard requirement. The Docker images include their own Erlang runtime, OTP 29.1.2.
- A WAMP session on the old deployment's master realm (`com.leapsight.bondy`) with `wamp.call` permission, to invoke the backup procedures. The examples below use [`wick`](/connect/reference/wamp_api/index), the WAMP CLI client used throughout the WAMP API reference.
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

The target directory has to exist already — the call doesn't create it. The filename is generated for you; a call succeeding only means the backup was *scheduled*, not that it finished, since the actual work happens asynchronously (see the next step).

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
bin/bondy-connect stop
rm -rf /path/to/bondy/data
```

::: warning Do this only after step 2 has confirmed the backup succeeded
This step is irreversible. 1.0.0's storage engine writes its own layout under `<platform_data_dir>/bondy_db/` on first boot, so there's no need to pre-create anything — just make sure the directory doesn't still hold stale pre-1.0.0 files.
:::

If you're moving to new hosts instead, there's nothing to do here — just point the new nodes at a fresh `platform_data_dir`.

### 5. Install 1.0.0 and check `bondy.conf` against its schema

Install the 1.0.0 release (see [Install from Source](/connect/guides/install/source), [Install using Docker](/connect/guides/install/docker), or your usual packaging) on each new node and carry over your `bondy.conf`. Do not start the node yet.

Check the file before the first start, because on 1.0.x a wrong `bondy.conf` does not stop the boot; from 1.1.0, a node refuses to start on an unknown key. The release's pre-start hook runs cuttlefish with `--allow_extra --silent`. With `--allow_extra`, cuttlefish skips a key that no schema maps, so an old key is dropped without a message and its subsystem runs on the default. A value that cuttlefish cannot parse stops the boot: cuttlefish generates no configuration for the whole file, and the error names the key and the reason.

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
       oplog.aae.interval                             = 1m             ->  db.oplog.aae.interval
       oplog.core.shard_count                         = 16             ->  db.main.shard_count

     DROP -- no equivalent on this release (1)
       store.rocksdb.max_open_files                   = 1000
           the RocksDB tuning surface; this release has no equivalent

     INVALID VALUE (1) -- this release reads this key, but cannot parse the value.
     ...
       db.oplog.wal.fsync_mode                              = sometimes
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

If you're running (or moving to) more than one node, join them into a cluster now, before importing — see [Running a Cluster](/connect/guides/deployment/running_a_cluster).

::: warning Set `cluster.enabled = off` on a single node
`cluster.enabled` defaults to `on`. A node that runs alone with clustering on never compacts its history. Under the default fence policy (`db.oplog.aae = on`, `db.oplog.aae.fence.on_isolation = refuse`), it also refuses every authentication, anonymous included, once its security tables stay unconfirmed for longer than `db.oplog.aae.fence.max_lag`. Set `cluster.enabled = off` in the `bondy.conf` of a node meant to run alone, and keep the default `on` on every member of a cluster. See [Enabling clustering](/connect/reference/configuration/cluster#enabling-clustering), which also explains why a node that ran with `off` can later join only nodes with empty data directories.
:::

::: warning Auto-clustering nodes with an insecure Partisan peer plane
If `cluster.peer_discovery.enabled = on` and the Partisan peer plane isn't secured (TLS off, or TLS on without peer certificate verification), 1.0.0 **refuses to start** rather than cluster over an unauthenticated connection. Configure `cluster.tls.enabled = on` with `verify_peer` and a private cluster CA, or set `cluster.tls.allow_insecure = on` to acknowledge the risk explicitly. See the [Cluster Configuration Reference](/connect/reference/configuration/cluster).
:::

### 7. Import the backup file

Call `bondy.export.import` on the new deployment with the path to the file you copied over. This is 1.0.0's importer, and it recognises the pre-1.0.0 file format by its header: it transparently translates each old record into a write against the new storage engine as it reads, so you don't need to convert anything yourself.

Run the import on one node only. Every table it writes is replicated, so the imported data reaches the other members through anti-entropy, as any other write does.

```bash
./wick --url ws://new-node-host:18080/ws --realm com.leapsight.bondy \
  call bondy.export.import '{"filename": "/data/imports/bondy_backup.1774598400.bak"}' | jq
```

To check the file before you write anything, run the same call with `"dry_run": true` added to the object first, as described in [Backup and Restore](/connect/guides/administration/backup_and_restore#_4-check-the-file-with-a-dry-run).

This returns immediately; the import itself runs asynchronously. Watch for `bondy.export.import_finished` or `bondy.export.import_failed` (filename-bearing events on the master realm), or poll `bondy.export.status`, to confirm it actually completed. Writes are batched (500 records per transaction) rather than fsynced individually, so a large dataset imports in a fraction of the time a naive per-record write would take.

The import is a set of fresh writes, not a byte-for-byte restore: replication metadata (clocks, causal history) from the old deployment is not — and should not be — preserved. From an old-format backup, the importer translates only these domains: users, groups, user and group grants, sources, API Gateway specifications, and OAuth2 refresh tokens. It skips every other record and counts it by reason. These rules apply to the translated domains:

- **Only the latest, still-valid OAuth2 refresh token per (realm, user) survives.** Expired tokens are dropped; the retained one is transparently upgraded to the current token format the first time a client uses it to refresh.
- **Realms are not recreated.** The old realm record has no upgrade path, so the importer skips it. The users, groups, grants, sources and refresh tokens of each realm still import, because they are keyed by the realm URI.
- **Tickets, bridge relays and retained messages are not imported.** Clients request new tickets and publish again. Recreate each bridge relay from your configuration.

::: warning Recreate your realms separately
Recreate each realm from your configuration or with `bondy.realm.create` calls, the same way you provisioned it originally — before or after the import, it doesn't matter for the data. It does matter for your clients, though: they can't attach to a realm, and so can't exercise the imported users and grants, until it exists again.
:::

::: warning Change the `admin` password after the import
The import writes the old deployment's master-realm `admin` user, old password included, over the one the new node created at first boot. `security.admin_user.password` does not change it: Bondy reads that key only when it creates the master realm, at a node's first boot. Change the password with `bondy.user.change_password` on `com.leapsight.bondy` once the import has finished. While it is still the former default, `bondy-admin`, every boot logs a warning.
:::

::: warning Old passwords authenticate with the `password` method only
The import keeps each password in the format it was stored in. A password stored in a format older than 1.2 (a `1.0` or `1.1` record) authenticates with the `password` method and the OAuth2 password grant. Bondy does not offer such a user `wampcra` or `wamp-scram`, because a challenge needs data that the old record does not hold. Change the password with `bondy.user.change_password` to store it in the current format, which both challenge methods accept.
:::

The import counts each record it did not write, by reason. The `skipped` object of the [import report](/connect/reference/wamp_api/export#import-report) holds the counts, and the node logs them in one `notice`, `"Import skipped some legacy records by reason"`, when the import finishes:

| Reason | Record |
| --- | --- |
| `tombstone` | A record deleted on the old deployment. |
| `realm_recreate_from_config` | A realm. Recreate it, as described above. |
| `security_status_dead` | A security-status flag. A realm's `security_enabled` replaces it. |
| `legacy_source_format` | A source stored in the format before 1.1, which the importer does not translate. Recreate it if no 1.1-format entry covers it. |
| `token_expired` | An OAuth2 refresh token that has expired. |
| `oauth_token_unparsable` | An OAuth2 refresh token in a shape the importer does not recognise. |
| `{token_import, Reason}` | A refresh token the importer recognised but could not store. |
| `{user_import, Reason}` | A user cell the importer recognised but could not store. |
| `{table_not_provisioned, Table}` | A record for a table this node does not provision. |
| `{unsupported_prefix, Prefix}` | A record of a domain the importer does not translate (see the list above). |
| `import_error` | A record the importer failed to translate. Each one is also logged at `warning` as `"Skipping a legacy record that could not be imported"`. |
| `unrecognised_term` | Something in the file that is not a record. |

A refresh token older than the one kept for the same user is dropped without being counted.

### 8. Verify and decommission the old deployment

Spot-check that realms, users, and API gateway specs are present on the new deployment before you decommission the old one. Once you're satisfied, take the old nodes out of service.

## Other breaking changes to check

The data procedure above is one part of the upgrade. Release 1.0.0 also renames and removes configuration keys, changes the arguments of several WAMP procedures, adds authentication to the Admin HTTP API and makes the API Gateway refuse unknown specification keys. Each one can stop a node from starting, or a client from working, after the cut-over.

Follow [Migrating from a Release Candidate](/connect/guides/deployment/migrating_from_a_release_candidate) before you put the new deployment in service. It also applies to an upgrade from a `bondy_db` pre-release.

## Upgrade from a `bondy_db` pre-release

Follow these steps for a cluster that runs a 1.0.0 pre-release that already carries `bondy_db`, such as `1.0.0-rc.olive`, `1.0.0-rc.pear` or `1.0.0-rc.pistachio`. The data directories stay in place, and nothing is exported or imported.

1. **Check `bondy.conf`.** Run the check in [step 5](#_5-install-1-0-0-and-check-bondy-conf-against-its-schema) against each node's file, and fix every finding.

2. **Remove `db.compaction.peer_timeout`.** The key does not exist in 1.0.0. Compaction on every database, the in-memory registry included, waits for every cluster member however long it stays silent. A member stops holding compaction only when it leaves the cluster. A `bondy.conf` that still sets the key boots, because the release ignores keys that no schema maps, and the key has no effect. See [Convergence](/connect/concepts/convergence#the-compaction-witnesses-and-the-truncation-cap).

3. **Set `cluster.enabled = off` on a node that runs alone.** The key is new in 1.0.0 and defaults to `on`. A single node left on `on` never compacts its history, and it logs a ["GC stalled"](/connect/reference/logging#gc-stalled) warning with reason `no_members`. With the defaults `db.oplog.aae = on` and `db.oplog.aae.fence.on_isolation = refuse`, the node also refuses every authentication with `temporarily_unavailable` once its security tables have gone uncertified for longer than `db.oplog.aae.fence.max_lag` (default `60s`). Keep the default on every member of a cluster. See [Enabling clustering](/connect/reference/configuration/cluster#enabling-clustering).

4. **Stop every node, then start them all on 1.0.0.** Rolling upgrades are not supported. The registry is held in memory, so it starts empty on every node; clients reconnect, and register and subscribe again.

5. **Update dashboards and alerts.**
   - `bondy_oplog_peer_exclusions_total` is not exported. Remove the queries and alerts that use it.
   - `bondy_oplog_gc_scheduler_events_total` carries a `scheduler` label as well as `event`. A query that selects by `event` without aggregating over `scheduler` returns one series per scheduler.
   - `bondy_cluster_channel_connections` is labelled by `peer` and `channel`. Aggregate over `peer` for a per-channel total.

   See the [Metrics Reference](/connect/reference/metrics).

6. **Update remote-console calls to renamed modules.** If you call Bondy modules from a remote console or a script, use these names:

   | Pre-release module | Module in 1.0.0 |
   |---|---|
   | `bondy` | `bondy_router_peer` |
   | `bondy_app` | `bondy_router_app` |
   | `bondy_sup` | `bondy_router_sup` |
   | `bondy_utils` | `bondy_router_utils` |
   | `bondy_stdlib` | `bondy_connect_lib` |
   | `bondy_consult`, `bondy_error`, `bondy_humanized`, `bondy_interval_set`, `bondy_itc`, `bondy_retry`, `bondy_secret_resolver`, `bondy_table_manager`, `bondy_uuidv7` | The same name with `bondy_connect_` in place of `bondy_`, in the `bondy_connect_lib` application (`bondy_stdlib` in the pre-release) |
   | `bondy_secret_resolver_aws_sm` | `bondy_connect_secret_resolver_aws_sm`, in the `bondy_http_connector` application |
   | `bondy_oplog_hlc` | `bondy_connect_hlc` |
   | `bondy_oplog_wal_codec`, `_frame`, `_idx`, `_key_registry`, `_manifest`, `_reader`, `_recovery`, `_scrubber`, `_segment`, `_state` | `bondy_log_codec`, `bondy_log_frame`, and so on, in the `bondy_log` application |

   `bondy_oplog_wal`, `bondy_oplog_wal_mem` and `bondy_oplog_wal_mem_reader` keep their names.

You now have the cluster running 1.0.0 on its existing data.

## Result

You now have a 1.0.0 deployment that runs on the new storage engine. Your realms are recreated, and the users, groups, grants, sources, API Gateway specifications and OAuth2 refresh tokens from your pre-1.0.0 deployment are imported into them. The old nodes are decommissioned.

## See also

- [Architecture](/connect/concepts/architecture) — the storage and replication model behind `bondy_db`, `bondy_oplog`, and `bondy_mst`.
- [Data Storage & Active Anti-entropy Configuration Reference](/connect/reference/configuration/data_storage) — the `db.*` configuration surface that replaces `store.*` and `oplog.*`.
- [Running a Cluster](/connect/guides/deployment/running_a_cluster) — forming the new cluster before you import.
- [Cluster Configuration Reference](/connect/reference/configuration/cluster) — the Partisan peer-plane TLS options and the `cluster.tls.allow_insecure` gate.
