---
outline: [2,3]
related:
    - text: Realm
      type: WAMP API Reference
      link: /router/reference/wamp_api/realm
      description: Realm records and their keys are part of an export, and are restored on import.
---

# Export & Backup
Bondy can write a logical export of its durable data — realms and their keys, security (users, groups, grants, sources), API Gateway specs, tokens, tickets, bridge relay definitions, and retained messages — to a file, and later import that file back in. This is a **logical** export: each record is dumped as a decoded domain term and re-applied as a fresh write on import, not a byte-level copy of the storage engine. Storage-level metadata (Hybrid Logical Clocks, CRDT lineage) is intentionally not preserved; an import always produces fresh writes, which is the correct behaviour for moving data between nodes or deployments. The ephemeral registry (routing) state — live registrations and subscriptions — is never exported.

::: warning An export contains secrets
An export includes realm records and their key material, along with users, credentials, tickets and tokens. Store and transfer the file as you would the secrets themselves. Only the legacy pre-1.0.0 format skips realm records on import.
:::

`bondy.export.*` is the current API. The older `bondy.backup.*` procedures (`create`, `status`, `restore`) still work — they are deprecated aliases dispatching to the exact same operations — but new integrations should use `bondy.export.*`. An import also transparently reads the legacy file format written by the former `bondy_backup` module, translating what it can (users, groups, grants, sources, API Gateway specs, OAuth refresh tokens) and skipping the rest (realm records, the long-dead `security_status` flag) without misapplying it.

::: warning AUTHORIZATION
Only available to sessions attached to the **Master Realm**. Unlike most `bondy.*` admin procedures, these don't take a realm URI as their first argument — export and import act on the whole node, not one realm, so there is nothing to authorize per-realm against.
:::

Both create and import run **asynchronously**: the call returns as soon as the operation has started, not when it finishes. Poll [`bondy.export.status`](#check-status) or subscribe to the [topics](#topics) below to learn when it completes.

## Procedures

|Name|URI|Deprecated alias|
|:---|:---|:---|
|[Create an export](#create-an-export)|`bondy.export.create`|`bondy.backup.create`|
|[Check status](#check-status)|`bondy.export.status`|`bondy.backup.status`|
|[Import an export](#import-an-export)|`bondy.export.import`|`bondy.backup.restore`|

### Create an export
##### bondy.export.create(info) -> info {.wamp-procedure}
Starts writing an export file to the directory given in `info`, asynchronously, and returns immediately with the filename and start time.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'dict',
            'description' : 'An object with a required `path` key — the directory the export file is written to. The filename itself (`bondy_export.<unix_timestamp>.bondy`) is chosen by Bondy.'
        }
    })"
/>

##### Keyword Args
None.

#### Result
##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'dict',
            'description' : 'An object with `filename` (the full path Bondy is writing to) and `timestamp` (the Unix time, in seconds, the export started).'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
Raises `bondy.error.export_in_progress` or `bondy.error.import_in_progress` if another export or import is already running — only one runs at a time, node-wide. Raises `bondy.error.missing_required_value` if `path` is absent.

### Check status
##### bondy.export.status(info) -> status {.wamp-procedure}
Reports on an export or import: pass an empty object to ask "what is running right now, node-wide", or a `filename` to check a specific file.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'dict',
            'description' : 'An object, either empty or holding a `filename` key.'
        }
    })"
/>

##### Keyword Args
None.

#### Result
##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'dict',
            'description' : 'One of three shapes depending on the request and current state — see below.'
        }
    })"
/>

##### Keyword Results
None.

Three shapes, depending on what was asked:

- **Called with `{}`** — returns the bare node-wide status: the string `export_in_progress`, `import_in_progress`, or `undefined` (idle, nothing running).
- **Called with the `filename` of the operation currently running** — returns `{status, elapsed_time_secs}`, `status` being whichever of the two in-progress values applies.
- **Called with any other `filename`** (including one whose export or import has already finished) — reads that file's own header directly: `{filename, format, vsn, node, mod_vsn, timestamp, status, bad_bytes}`, where this `status` is `ok`, `invalid_format`, `corrupt`, or `blocked` (the file's own integrity, not an in-progress state), and `recovered` is present when the log driver had to repair the file's tail on open.

::: tip Per-record counts aren't queryable over WAMP
How many records were read, written, or skipped during an import is logged server-side (at `notice` level) and is not returned by `bondy.export.status` or published on [`bondy.export.import_finished`](#topics) — both only ever report the filename. Check the node's logs for those counts.
:::

#### Errors
Raises `bondy.error.not_found` if `filename` names a file that doesn't exist.

### Import an export
##### bondy.export.import(info) -> info {.wamp-procedure}
Starts reading `info`'s `filename` and re-applying its records, asynchronously, and returns immediately with the filename and start time. Accepts both the current export format and files written by the legacy `bondy_backup` module.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'dict',
            'description' : 'An object with a required `filename` key — the export file to import.'
        }
    })"
/>

##### Keyword Args
None.

#### Result
##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'dict',
            'description' : 'An object with `filename` and `timestamp` (the Unix time, in seconds, the import started).'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
Raises `bondy.error.export_in_progress` or `bondy.error.import_in_progress` if another export or import is already running. Raises `bondy.error.missing_required_value` if `filename` is absent. Bondy replies before it opens the file, so a file that does not exist or cannot be read is not reported by this call: the import fails afterwards, and [`bondy.export.import_failed`](#topics) is published.

## Topics
Bondy publishes these on the Master Realm as an export or import runs. Each carries only the filename — no elapsed time, record counts, or failure reason — so treat them as a notification to go check [`bondy.export.status`](#check-status) or the node's logs, not as the source of that detail.

##### bondy.export.started{.wamp-topic}
Published when an export begins writing.

##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'string',
            'description' : 'The full path of the file being written.'
        }
    })"
/>

##### Keyword Results
None.

### bondy.export.finished{.wamp-topic}
Published when an export completes successfully.

##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'string',
            'description' : 'The full path of the completed export file.'
        }
    })"
/>

##### Keyword Results
None.

### bondy.export.failed{.wamp-topic}
Published when an export fails. The reason is logged server-side, not published here.

##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'string',
            'description' : 'The full path the export was writing to when it failed.'
        }
    })"
/>

##### Keyword Results
None.

### bondy.export.import_started{.wamp-topic}
Published when an import begins reading.

##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'string',
            'description' : 'The full path of the file being imported.'
        }
    })"
/>

##### Keyword Results
None.

### bondy.export.import_finished{.wamp-topic}
Published when an import completes successfully.

##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'string',
            'description' : 'The full path of the file that was imported.'
        }
    })"
/>

##### Keyword Results
None.

### bondy.export.import_failed{.wamp-topic}
Published when an import fails. The reason is logged server-side, not published here.

##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'string',
            'description' : 'The full path of the file that was being imported when it failed.'
        }
    })"
/>

##### Keyword Results
None.

::: tip The bondy.backup.* topic names don't exist
`bondy.backup.started`, `bondy.backup.finished`, `bondy.backup.failed`, and the corresponding `bondy.backup.restore_*` names are reserved but never published — an import or export triggered through the deprecated `bondy.backup.*` procedures still publishes under the `bondy.export.*` topic names above.
:::

## See also
- [Realm](/router/reference/wamp_api/realm) — recreate realms from configuration before importing their data.
