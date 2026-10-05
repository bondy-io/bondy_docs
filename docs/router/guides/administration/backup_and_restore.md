---
outline: [2,3]
related:
    - text: Architecture
      type: Concept
      link: /router/concepts/architecture
      description: The storage and replication layer — bondy_db, bondy_oplog, and the Merkle Search Tree — that a backup protects.
    - text: Deletion and Reclamation
      type: Concept
      link: /router/concepts/deletion_and_reclamation
      description: Causal stability and compaction for the same bondy_oplog storage tree.
    - text: Reclamation Configuration Reference
      type: Configuration Reference
      link: /router/reference/configuration/reclamation
      description: Compaction and reclamation options for the storage tree this guide backs up.
    - text: Export & Backup
      type: WAMP API Reference
      link: /router/reference/wamp_api/export
      description: The bondy.export.create, bondy.export.status and bondy.export.import procedures and their topics.
    - text: Upgrading to 1.0.0
      type: Guide
      link: /router/guides/deployment/upgrading_to_1_0_0
      description: Import a backup written by a release older than 1.0.0.
---

# How to Back Up and Restore Bondy

Bondy has two backup procedures. A **logical export** writes the records of the durable database to one file while the node keeps running, and imports them into any 1.0.0 deployment as new writes. A **cold copy** stops a `bondy_oplog` instance and copies its storage tree byte for byte with `bondy_mst_admin`. This guide covers both. See [Architecture](/router/concepts/architecture) for the storage model — `bondy_db`, `bondy_oplog`, and the Merkle Search Tree (MST) — if you need it first.

## Choose a procedure

Use the logical export to keep a portable copy of your realms, security data and API Gateway specs, to move that data into a new cluster, or to bring data over from a release older than 1.0.0. Use the cold copy when you need an exact image of one node's storage tree, replication metadata included, and you can stop the instance while it runs. An export does not keep clocks or causal history, and a cold copy does not include the `leveled` projection store.

## Logical export and import

### What an export contains

An export holds the tables of the durable `main` database, read from the global band and from the band of every realm that exists on the node:

* realms and their key material
* users, groups, group membership, user and group grants, and sources
* API Gateway specs and bridge relay definitions
* tickets and OAuth2 tokens
* retained messages
* interface metadata, MCP gateway documents and MCP upstream tool pins

It does not hold the registry: live registrations, subscriptions and sessions are never exported, because clients recreate them when they reconnect. It does not hold storage metadata either. Each record is written as its decoded value, and an import applies it as a fresh write.

::: warning Treat an export file as a secret
The file contains user credentials and the realms' key material. Store and transfer it with the same care as the node's data directory.
:::

The file is an Erlang `disk_log` (halt format), not JSON. Bondy names it `bondy_export.<unix_seconds>.bondy` and writes it into the directory you pass. Its header records the format (`bondy_db_export`), the format version (`2.0.0`), the node that wrote it and the start time; [`bondy.export.status`](/router/reference/wamp_api/export#check-status) reads that header for you.

An export or import runs on **one node**: the node that serves the call. Over WAMP that is the node your session is attached to; over HTTP it is the node whose `admin` listener receives the request. An export reads that node's replica and writes the file to that node's filesystem. An import writes into that node's database, and the writes replicate to the rest of the cluster like any other write.

Each node runs at most one export or import at a time. A second `create` or `import` call on a busy node fails, and the operation already running continues. The caller observes `bondy.error.internal_error` (over HTTP, status `500` with `code` set to `bondy.error.internal_error`); the error does not say which operation is running. Call `bondy.export.status` with an empty object to find out.

### Prerequisites

* A WAMP session on the master realm (`com.leapsight.bondy`) allowed to call `bondy.export.*`, or HTTP access to the node's `admin` listener (port `18081` by default). The examples use [`wick`](/router/reference/wamp_api/index) and `curl`. See the [Admin HTTP API](/router/reference/http_api/index) for how the `/services/*` routes map onto the procedures, and keep that listener off public networks.
* For an export: a directory on the node that already exists and that the Bondy OS user can write. Bondy does not create it.
* For an import: the export file on the importing node, readable by the Bondy OS user.

### Export the database

#### 1. Confirm the node is idle

```bash
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
  call bondy.export.status '{}' | jq
```

The result is `null` when nothing is running, or `"export_in_progress"` / `"import_in_progress"`.

#### 2. Start the export

::: code-group

```bash [WAMP]
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
  call bondy.export.create '{"path": "/var/backups/bondy"}' | jq
```

```bash [HTTP]
curl -X POST http://localhost:18081/services/create_backup \
  -H 'Content-Type: application/json' \
  -d '{"path": "/var/backups/bondy"}'
```

```json [Result]
{
  "filename": "/var/backups/bondy/bondy_export.1774598400.bondy",
  "timestamp": 1774598400
}
```
:::

The call returns as soon as the export has started. A successful reply does not mean the file was written: an export into a missing or unwritable directory fails after the reply.

#### 3. Wait for the export to finish

Subscribe to `bondy.export.finished` and `bondy.export.failed` on the master realm before you start, or poll the status with the filename from step 2:

::: code-group

```bash [WAMP]
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
  call bondy.export.status \
  '{"filename": "/var/backups/bondy/bondy_export.1774598400.bondy"}' | jq
```

```bash [HTTP]
curl 'http://localhost:18081/services/backup_status?filename=/var/backups/bondy/bondy_export.1774598400.bondy'
```
:::

While the export runs, the result is `{"status": "export_in_progress", "elapsed_time_secs": N}`. After it stops, the result is the file's header with `status` set to `ok`, `invalid_format`, `corrupt` or `blocked`.

`status: ok` means only that the file has a readable header. Bondy writes the header first, so an export that failed half-way leaves a file whose status is also `ok`. Confirm success from the `bondy.export.finished` topic, or from the node log line `Finished creating export`. A failure publishes `bondy.export.failed` and logs `Error creating export` with the reason.

#### 4. Move the file off the node

Copy the file to the storage you keep backups in. An export that stays on the node it describes does not survive the loss of that node.

### Import an export

#### 1. Prepare the target deployment

Start the target node or cluster and form the cluster first; see [Running a Cluster](/router/guides/deployment/running_a_cluster). You import into one node only.

An import applies every record in the file as a write. A record whose key already exists on the target is replaced. A record that exists on the target but not in the file is left in place: an import never deletes.

#### 2. Copy the file to the importing node

Place the file on the node you will call, at a path the Bondy OS user can read.

#### 3. Confirm the node is idle

Call `bondy.export.status` with `{}` as in the export procedure. The result must be `null`.

#### 4. Start the import

::: code-group

```bash [WAMP]
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
  call bondy.export.import \
  '{"filename": "/data/imports/bondy_export.1774598400.bondy"}' | jq
```

```bash [HTTP]
curl -X POST http://localhost:18081/services/restore_backup \
  -H 'Content-Type: application/json' \
  -d '{"filename": "/data/imports/bondy_export.1774598400.bondy"}'
```
:::

The call returns as soon as the import has started, with the filename and the start time. It does not check that the file exists or is valid first: a missing file or an unrecognised header fails after the reply.

#### 5. Wait for the import to finish

Watch for `bondy.export.import_finished` or `bondy.export.import_failed` on the master realm. Both carry only the filename. The node log carries the detail: `Import finished` with `read_count` and `written_count`, or `Import failed` with the reason.

The importer reads two file formats. A file whose header says `bondy_db_export` with version `2.0.0` or later imports record for record. A file written by the `bondy_backup` module of a release older than 1.0.0 (header format `dvvset_log`) is translated as it is read: users, groups, grants, sources, API Gateway specs and the latest unexpired OAuth2 refresh token per user carry over, and realm records are skipped. The node logs `Import skipped some legacy records by reason` with a count per reason. Any other header fails the import. See [Upgrading to 1.0.0](/router/guides/deployment/upgrading_to_1_0_0) for the full legacy procedure.

#### 6. Verify the data

Spot-check that realms, users and API Gateway specs are present, on the importing node and on one other member of the cluster.

### Export limits

* **Not an atomic snapshot.** The export reads one table and band at a time while the node keeps serving writes. A write made during the export can appear for one table and be absent for another.
* **Full exports only.** Every export writes the whole database. There is no incremental format.
* **No progress counts over the API.** The status call and the topics report the filename and state. Record counts appear only in the node log.

### Result

You have an export file stored away from the node that wrote it, and you know how to import it into a running deployment and confirm from the topics and the node log that the import finished.

## Cold copy of the storage tree

This procedure copies one storage tree with `bondy_mst_admin` and restores it. It assumes you are comfortable attaching an Erlang shell to a running node and know which `bondy_oplog` instances back the data you care about.

::: warning The `leveled` projection store is not covered by this tool
`bondy_mst_admin` backs up the **WAL**, the **MST pack store**, and the **compaction checkpoint** — the triple that `bondy_oplog` owns. It does **not** touch the `leveled` projection store: Bondy runs `leveled` in head-only mode and keeps it outside `storage_path` by design. If a node's disk is lost, the projection is not recovered from this backup — it is rebuilt from a peer through the catalogue-snapshot bootstrap protocol (see [Architecture](/router/concepts/architecture)), or from a separate, `leveled`-specific backup of its own data directory. Treat a `bondy_mst_admin:backup/2,3` run as a backup of the **oplog**, never as a full backup of a node's data.
:::

### Prerequisites

* Shell access to the node's release and the ability to attach an Erlang shell to it (`bin/bondy remote_console`) — `bondy_mst_admin`'s functions are Erlang calls, not a separate CLI tool.
* The `bondy_oplog` instance ID(s) whose storage you are protecting. List the running ones from the shell if you don't already track them:

  ```erlang
  bondy_oplog:list_instances().
  ```

* Enough free space at the backup destination for a full, uncompressed copy of the source tree — every backup is a complete copy, never incremental.

### What a backup covers

One `bondy_mst_admin:backup/2,3` call protects everything under a single storage root:

* The **WAL** — the append-only segments, manifest, and consumer offset that are the source of truth for the instance.
* The **MST pack store** — the packfiles, `.idx` files, and pack-store manifest backing the anti-entropy structure.
* The **compaction checkpoint** (`checkpoint.etf`) — the CRDT state folded up to the last compaction watermark.

`backup/2,3` walks the source directory recursively and copies every regular file it finds, so the root you pass must contain exactly the files above and nothing you don't want copied. If your deployment configures the WAL at a separate root from the MST pack store (a custom `wal_dir`), back up each root separately — see [Limits](#limits) below.

### Backing up a storage tree

#### 1. Stop the instance(s) under the tree

A backup is cold: nothing may be writing into the source directory while it runs. Stop every instance whose storage lives under the tree you are about to back up.

```erlang
ok = bondy_oplog:stop_instance(InstanceId).
```

#### 2. Run the backup

```erlang
{ok, Manifest} = bondy_mst_admin:backup(StoragePath, BackupDir).
```

This copies `StoragePath` into `BackupDir` and writes a `manifest.etf` there recording every copied file's size and SHA-256. By default, `backup/2` refuses a non-empty `BackupDir`, so a misconfigured call can't silently trample an unrelated directory. If you are backing up into a directory that already has content — for example, a filesystem snapshot mount with its own metadata — call the three-argument form instead:

```erlang
{ok, Manifest} = bondy_mst_admin:backup(
    StoragePath,
    BackupDir,
    #{allow_nonempty_target => true}
).
```

#### 3. Verify the backup

Not required, but recommended before you consider the backup trustworthy:

```erlang
{ok, _} = bondy_mst_admin:verify(BackupDir).
```

See [Verifying a backup](#verifying-a-backup) below for what this checks and how to read a failure.

#### 4. Restart the instance(s)

```erlang
{ok, _} = bondy_oplog:start_instance(InstanceId, Opts).
```

Use the same `Opts` the instance was running with before you stopped it.

### Verifying a backup

Verification re-hashes every file listed in `manifest.etf` and confirms it still matches. Run it any time — not only right after a backup — and always run it on a backup that has been transported (copied to object storage, moved between hosts, pulled off tape) before you trust it:

```erlang
{ok, Manifest} = bondy_mst_admin:verify(BackupDir).
```

| Error | Meaning |
|---|---|
| `{manifest, not_found}` | `manifest.etf` is missing from `BackupDir` — this isn't a backup produced by this tool, or it never finished writing. |
| `{manifest, {corrupted, _}}` | `manifest.etf` exists but couldn't be decoded. |
| `{manifest, {unexpected_term, _}}` | Decoded fine but wasn't the expected `backup_v1` shape. |
| `{file, RelPath, missing}` | A file the manifest lists isn't on disk — the transport dropped it. |
| `{file, RelPath, size_mismatch}` | The file's size no longer matches the manifest. |
| `{file, RelPath, hash_mismatch}` | The file's content no longer matches the manifest — treat the backup as untrustworthy. |

### Restoring a storage tree

#### 1. Stop the instance

If the instance is running against the target directory, stop it first — restoring into a live storage path corrupts it the same way a hot backup would.

```erlang
ok = bondy_oplog:stop_instance(InstanceId).
```

#### 2. Confirm the target is empty

`restore/2` refuses a non-empty `StoragePath` by default, for the same reason `backup/2` refuses a non-empty target.

#### 3. Run the restore

```erlang
{ok, _} = bondy_mst_admin:restore(BackupDir, StoragePath).
```

If you are intentionally restoring on top of existing files, call the three-argument form instead:

```erlang
{ok, _} = bondy_mst_admin:restore(
    BackupDir,
    StoragePath,
    #{allow_nonempty_target => true}
).
```

`restore/2,3` calls `verify/1` on `BackupDir` before copying anything, so it never installs a tampered or truncated backup into a live data directory — a failed verify aborts the restore with the same error shapes listed above.

#### 4. Restart the instance(s)

```erlang
{ok, _} = bondy_oplog:start_instance(InstanceId, Opts).
```

Use the same `Opts` the instance was running with when you took the backup.

#### What happens on restart

* The MST pack store re-opens from the restored files, re-sealing any `incoming-sealing-*` file left behind by an async seal that was in flight when the node stopped — that roll-aside file is part of the byte-for-byte copy, so the reopen completes the seal deterministically and no manifest change is involved. A backup taken mid-seal is still consistent.
* `checkpoint.etf` is read for the compaction watermark and the folded CRDT state.
* The WAL tail past that watermark is replayed.
* The Hybrid Logical Clock is seeded from the restored watermark, so every append after the restore sorts strictly after every pre-backup event.

### Limits

* **Cold only.** This release has no write-barrier primitive (freeze/unfreeze) — the instance must be stopped for the copy to be consistent. For zero-downtime backups, take a filesystem-level snapshot (LVM, ZFS, btrfs, an EBS/disk snapshot) of the storage root instead, then point `backup/2,3` at the stable snapshot mount.
* **One call per tree.** Each `backup/2,3` call copies exactly one source directory. If your deployment keeps the `leveled` projection at a different root — or the WAL at a separate root via a custom `wal_dir` — invoke `backup/2,3` once per root, into distinct subdirectories of your backup destination.
* **Full backups only.** There is no incremental or streaming format; every call is a complete copy of the source tree.
* **No compression or encryption.** Both are out of scope for this tool. Pipe the backup directory through `tar`, `zstd`, and `age` (or your own tooling) afterwards if you need either — nothing about the manifest format depends on how you store the bytes downstream.

### When to back up

| Deployment | Suggested cadence |
|---|---|
| Single-node, security-critical | Hourly cold copy, plus a filesystem snapshot for sub-hour RPO |
| Single-node, routing-only | Daily |
| Multi-node (3 or more peers) | Weekly snapshot for disaster recovery — routine recovery is peer bootstrap, not a backup restore |

For a multi-node cluster, the catalogue-snapshot bootstrap protocol is the *primary* recovery mechanism: a node that loses its disk rejoins by pulling a snapshot from a peer, the same mechanism new replicas use to join in the first place (see [Architecture](/router/concepts/architecture)). Backups are the secondary safety net for the case where the whole cluster is lost at once.

### Observability

`bondy_mst_admin` emits telemetry on every call, under `[bondy_mst, admin, ...]`:

| Event | When | Measurements | Metadata |
|---|---|---|---|
| `[bondy_mst, admin, backup, start]` | A `backup/2,3` call begins. | — | `source`, `target` |
| `[bondy_mst, admin, backup, complete]` | The backup succeeded. | `file_count`, `total_bytes`, `duration_us` | `source`, `target` |
| `[bondy_mst, admin, backup, failed]` | A pre-check or the copy failed. | `duration_us` | `source`, `target`, `reason` |
| `[bondy_mst, admin, verify, start]` | A `verify/1` call begins. | — | `target` |
| `[bondy_mst, admin, verify, complete]` | Every file matched the manifest. | `file_count`, `total_bytes`, `duration_us` | `target` |
| `[bondy_mst, admin, verify, failed]` | The manifest or a file failed to validate. | `duration_us` | `target`, `reason` |
| `[bondy_mst, admin, restore, start]` | A `restore/2,3` call begins. | — | `source`, `target` |
| `[bondy_mst, admin, restore, complete]` | The restore succeeded. | `file_count`, `total_bytes`, `duration_us` | `source`, `target` |
| `[bondy_mst, admin, restore, failed]` | The internal verify failed, or the copy raised. | `duration_us` | `source`, `target`, `reason` |

### Result

You have a `BackupDir` containing a byte-for-byte copy of a storage tree plus a `manifest.etf` you can verify independently of the source node — or you have restored one of these into an empty `StoragePath` and confirmed the instance restarts and serves the pre-backup state. Either way, remember what this backup does *not* contain: the `leveled` projection, recovered separately as described in the warning above.

## See also

- [Architecture](/router/concepts/architecture) — `bondy_db`, `bondy_oplog`, and the MST, and how the catalogue-snapshot bootstrap protocol recovers a lost projection from a peer.
- [Deletion and Reclamation](/router/concepts/deletion_and_reclamation) — causal stability and compaction for the same storage tree.
