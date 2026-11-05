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

# What's New in 1.1

This page lists the changes between Bondy Connect 1.0.0 and 1.1. It covers releases 1.0.1, 1.0.2 and 1.1.0. Each section starts with the changes that need action from you.

::: tip Coming from a release candidate?
A deployment that runs a 1.0.0 release candidate has more to change: configuration keys, the WAMP and HTTP APIs, and the realm authentication rules. Follow [Migrating from a Release Candidate](/connect/guides/deployment/migrating_from_a_release_candidate). It includes every change on this page.
:::

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
