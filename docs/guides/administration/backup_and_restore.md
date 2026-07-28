---
outline: [2,3]
related:
    - text: Architecture
      type: Concept
      link: /concepts/architecture
      description: The storage and replication layer — bondy_db, bondy_oplog, and the Merkle Search Tree — that a backup protects.
    - text: Deletion and Reclamation
      type: Concept
      link: /concepts/deletion_and_reclamation
      description: Causal stability and compaction for the same bondy_oplog storage tree.
    - text: Reclamation Configuration Reference
      type: Configuration Reference
      link: /reference/configuration/reclamation
      description: Compaction and reclamation options for the storage tree this guide backs up.
---

# How to Back Up and Restore Bondy's Storage

This guide covers taking a cold backup of a Bondy storage tree with `bondy_mst_admin` and restoring one. It assumes you are comfortable attaching an Erlang shell to a running node and know which `bondy_oplog` instances back the data you care about; see [Architecture](/concepts/architecture) for the model — `bondy_db`, `bondy_oplog`, and the Merkle Search Tree (MST) — if you need it first.

::: warning The `leveled` projection store is not covered by this tool
`bondy_mst_admin` backs up the **WAL**, the **MST pack store**, and the **compaction checkpoint** — the triple that `bondy_oplog` owns. It does **not** touch the `leveled` projection store: Bondy runs `leveled` in head-only mode and keeps it outside `storage_path` by design. If a node's disk is lost, the projection is not recovered from this backup — it is rebuilt from a peer through the catalogue-snapshot bootstrap protocol (see [Architecture](/concepts/architecture)), or from a separate, `leveled`-specific backup of its own data directory. Treat a `bondy_mst_admin:backup/2,3` run as a backup of the **oplog**, never as a full backup of a node's data.
:::

## Prerequisites

* Shell access to the node's release and the ability to attach an Erlang shell to it (`bin/bondy remote_console`) — `bondy_mst_admin`'s functions are Erlang calls, not a separate CLI tool.
* The `bondy_oplog` instance ID(s) whose storage you are protecting. List the running ones from the shell if you don't already track them:

  ```erlang
  bondy_oplog:list_instances().
  ```

* Enough free space at the backup destination for a full, uncompressed copy of the source tree — every backup is a complete copy, never incremental.

## What a backup covers

One `bondy_mst_admin:backup/2,3` call protects everything under a single storage root:

* The **WAL** — the append-only segments, manifest, and consumer offset that are the source of truth for the instance.
* The **MST pack store** — the packfiles, `.idx` files, and pack-store manifest backing the anti-entropy structure.
* The **compaction checkpoint** (`checkpoint.etf`) — the CRDT state folded up to the last compaction watermark.

`backup/2,3` walks the source directory recursively and copies every regular file it finds, so the root you pass must contain exactly the files above and nothing you don't want copied. If your deployment configures the WAL at a separate root from the MST pack store (a custom `wal_dir`), back up each root separately — see [Limits](#limits) below.

## Backing up a storage tree

### 1. Stop the instance(s) under the tree

A backup is cold: nothing may be writing into the source directory while it runs. Stop every instance whose storage lives under the tree you are about to back up.

```erlang
ok = bondy_oplog:stop_instance(InstanceId).
```

### 2. Run the backup

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

### 3. Verify the backup

Not required, but recommended before you consider the backup trustworthy:

```erlang
{ok, _} = bondy_mst_admin:verify(BackupDir).
```

See [Verifying a backup](#verifying-a-backup) below for what this checks and how to read a failure.

### 4. Restart the instance(s)

```erlang
{ok, _} = bondy_oplog:start_instance(InstanceId, Opts).
```

Use the same `Opts` the instance was running with before you stopped it.

## Verifying a backup

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

## Restoring a storage tree

### 1. Stop the instance

If the instance is running against the target directory, stop it first — restoring into a live storage path corrupts it the same way a hot backup would.

```erlang
ok = bondy_oplog:stop_instance(InstanceId).
```

### 2. Confirm the target is empty

`restore/2` refuses a non-empty `StoragePath` by default, for the same reason `backup/2` refuses a non-empty target.

### 3. Run the restore

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

### 4. Restart the instance(s)

```erlang
{ok, _} = bondy_oplog:start_instance(InstanceId, Opts).
```

Use the same `Opts` the instance was running with when you took the backup.

### What happens on restart

* The MST pack store re-opens from the restored files, re-sealing any `incoming-sealing-*` file left behind by an async seal that was in flight when the node stopped — that roll-aside file is part of the byte-for-byte copy, so the reopen completes the seal deterministically and no manifest change is involved. A backup taken mid-seal is still consistent.
* `checkpoint.etf` is read for the compaction watermark and the folded CRDT state.
* The WAL tail past that watermark is replayed.
* The Hybrid Logical Clock is seeded from the restored watermark, so every append after the restore sorts strictly after every pre-backup event.

## Limits

* **Cold only.** This release has no write-barrier primitive (freeze/unfreeze) — the instance must be stopped for the copy to be consistent. For zero-downtime backups, take a filesystem-level snapshot (LVM, ZFS, btrfs, an EBS/disk snapshot) of the storage root instead, then point `backup/2,3` at the stable snapshot mount.
* **One call per tree.** Each `backup/2,3` call copies exactly one source directory. If your deployment keeps the `leveled` projection at a different root — or the WAL at a separate root via a custom `wal_dir` — invoke `backup/2,3` once per root, into distinct subdirectories of your backup destination.
* **Full backups only.** There is no incremental or streaming format; every call is a complete copy of the source tree.
* **No compression or encryption.** Both are out of scope for this tool. Pipe the backup directory through `tar`, `zstd`, and `age` (or your own tooling) afterwards if you need either — nothing about the manifest format depends on how you store the bytes downstream.

## When to back up

| Deployment | Suggested cadence |
|---|---|
| Single-node, security-critical | Hourly cold copy, plus a filesystem snapshot for sub-hour RPO |
| Single-node, routing-only | Daily |
| Multi-node (3 or more peers) | Weekly snapshot for disaster recovery — routine recovery is peer bootstrap, not a backup restore |

For a multi-node cluster, the catalogue-snapshot bootstrap protocol is the *primary* recovery mechanism: a node that loses its disk rejoins by pulling a snapshot from a peer, the same mechanism new replicas use to join in the first place (see [Architecture](/concepts/architecture)). Backups are the secondary safety net for the case where the whole cluster is lost at once.

## Observability

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

## Result

You have a `BackupDir` containing a byte-for-byte copy of a storage tree plus a `manifest.etf` you can verify independently of the source node — or you have restored one of these into an empty `StoragePath` and confirmed the instance restarts and serves the pre-backup state. Either way, remember what this backup does *not* contain: the `leveled` projection, recovered separately as described in the warning above.

## See also

- [Architecture](/concepts/architecture) — `bondy_db`, `bondy_oplog`, and the MST, and how the catalogue-snapshot bootstrap protocol recovers a lost projection from a peer.
- [Deletion and Reclamation](/concepts/deletion_and_reclamation) — causal stability and compaction for the same storage tree.
