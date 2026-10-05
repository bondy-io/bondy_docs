# Admin HTTP API

The Admin HTTP API exposes Bondy's administration procedures over HTTP. Each route calls one procedure of the [WAMP Admin API](/router/reference/wamp_api/index), and that procedure's reference page is the contract for its arguments, results and errors. This page lists the routes and how an HTTP request maps onto the procedure call.

The routes are served by the `admin_api` service. Bondy's default `admin` listener carries it on port `18081`, bound to loopback. See [Network Listeners](/router/reference/configuration/listeners#the-reserved-admin-listener).

::: warning Protect the listener, not the route
The Admin HTTP API declares no authentication scheme. Anyone who can reach a listener carrying the `admin_api` service can administer every realm. Keep that listener on loopback or a private network, and never mount `admin_api` on a listener that serves the public.
:::

## Request and response mapping

Every route follows the same rules:

- **Base path.** Routes are served at the paths below, and also under the prefix `/v1.0`.
- **Positional arguments.** Path parameters become the procedure's positional arguments, in the order they appear in the path. For routes that send a body, the JSON request body is the next positional argument.
- **Result.** A successful call answers with the procedure's first positional result as the JSON response body.
- **Errors.** A failed call answers with the error's keyword arguments as the JSON body, plus `code` set to the error URI. The HTTP status is the error's default status from the [Error Reference](/router/reference/errors), unless the API's own `status_codes` map overrides it; `bondy.error.not_found` maps to `404`, `bondy.error.already_exists` to `400`.

## Routes

### Realms

| Method | Path | WAMP procedure |
|---|---|---|
| `GET` | `/realms` | [`bondy.realm.list`](/router/reference/wamp_api/realm) |
| `POST` | `/realms` | [`bondy.realm.create`](/router/reference/wamp_api/realm) |
| `GET` | `/realms/:realm_uri` | [`bondy.realm.get`](/router/reference/wamp_api/realm) |
| `PUT` | `/realms/:realm_uri` | [`bondy.realm.update`](/router/reference/wamp_api/realm) |
| `DELETE` | `/realms/:realm_uri` | [`bondy.realm.delete`](/router/reference/wamp_api/realm) |
| `GET` | `/realms/:realm_uri/security_enabled` | [`bondy.realm.security.is_enabled`](/router/reference/wamp_api/realm) |
| `PUT` | `/realms/:realm_uri/security_enabled` | [`bondy.realm.security.enable`](/router/reference/wamp_api/realm) |
| `DELETE` | `/realms/:realm_uri/security_enabled` | [`bondy.realm.security.disable`](/router/reference/wamp_api/realm) |

### Users

| Method | Path | WAMP procedure |
|---|---|---|
| `GET` | `/realms/:realm_uri/users` | [`bondy.user.list`](/router/reference/wamp_api/user) |
| `POST` | `/realms/:realm_uri/users` | [`bondy.user.add`](/router/reference/wamp_api/user) |
| `GET` | `/realms/:realm_uri/users/:id` | [`bondy.user.get`](/router/reference/wamp_api/user) |
| `PUT` | `/realms/:realm_uri/users/:id` | [`bondy.user.update`](/router/reference/wamp_api/user) |
| `DELETE` | `/realms/:realm_uri/users/:id` | [`bondy.user.delete`](/router/reference/wamp_api/user) |
| `POST` | `/realms/:realm_uri/users/:id/change_password` | [`bondy.user.change_password`](/router/reference/wamp_api/user) |
| `GET` | `/realms/:realm_uri/users/:id/enabled` | [`bondy.user.is_enabled`](/router/reference/wamp_api/user) |
| `PUT` | `/realms/:realm_uri/users/:id/enabled` | [`bondy.user.enable`](/router/reference/wamp_api/user) |
| `DELETE` | `/realms/:realm_uri/users/:id/enabled` | [`bondy.user.disable`](/router/reference/wamp_api/user) |
| `POST` | `/realms/:realm_uri/users/:id/aliases` | [`bondy.user.add_alias`](/router/reference/wamp_api/user) |
| `PUT` | `/realms/:realm_uri/users/:id/aliases/:alias` | [`bondy.user.add_alias`](/router/reference/wamp_api/user) |
| `DELETE` | `/realms/:realm_uri/users/:id/aliases/:alias` | [`bondy.user.remove_alias`](/router/reference/wamp_api/user) |
| `PUT` | `/realms/:realm_uri/users/:id/groups/:group` | [`bondy.user.add_group`](/router/reference/wamp_api/user) |
| `DELETE` | `/realms/:realm_uri/users/:id/groups/:group` | [`bondy.user.remove_group`](/router/reference/wamp_api/user) |
| `POST` | `/realms/:realm_uri/services/change_password` | [`bondy.user.change_password`](/router/reference/wamp_api/user) |

### Groups

| Method | Path | WAMP procedure |
|---|---|---|
| `GET` | `/realms/:realm_uri/groups` | [`bondy.group.list`](/router/reference/wamp_api/group) |
| `POST` | `/realms/:realm_uri/groups` | [`bondy.group.add`](/router/reference/wamp_api/group) |
| `GET` | `/realms/:realm_uri/groups/:id` | [`bondy.group.get`](/router/reference/wamp_api/group) |
| `PUT` | `/realms/:realm_uri/groups/:id` | [`bondy.group.update`](/router/reference/wamp_api/group) |
| `DELETE` | `/realms/:realm_uri/groups/:id` | [`bondy.group.delete`](/router/reference/wamp_api/group) |

### OAuth2 clients and resource owners

| Method | Path | WAMP procedure |
|---|---|---|
| `POST` | `/realms/:realm_uri/clients` | [`bondy.oauth2.client.add`](/router/reference/wamp_api/oauth2) |
| `PUT` | `/realms/:realm_uri/clients/:id` | [`bondy.oauth2.client.update`](/router/reference/wamp_api/oauth2) |
| `DELETE` | `/realms/:realm_uri/clients/:id` | [`bondy.oauth2.client.delete`](/router/reference/wamp_api/oauth2) |
| `POST` | `/realms/:realm_uri/resource_owners` | [`bondy.oauth2.resource_owner.add`](/router/reference/wamp_api/oauth2) |
| `PUT` | `/realms/:realm_uri/resource_owners/:id` | [`bondy.oauth2.resource_owner.update`](/router/reference/wamp_api/oauth2) |
| `DELETE` | `/realms/:realm_uri/resource_owners/:id` | [`bondy.oauth2.resource_owner.delete`](/router/reference/wamp_api/oauth2) |

### Grants and sources

| Method | Path | WAMP procedure |
|---|---|---|
| `GET` | `/realms/:realm_uri/grants` | [`bondy.realm.grants`](/router/reference/wamp_api/realm) |
| `POST` | `/realms/:realm_uri/grants` | [`bondy.grant.create`](/router/reference/wamp_api/grant) |
| `PUT` | `/realms/:realm_uri/grants` | [`bondy.grant.revoke`](/router/reference/wamp_api/grant) |
| `GET` | `/realms/:realm_uri/groups/:id/grants` | [`bondy.group.grants`](/router/reference/wamp_api/group) |
| `GET` | `/realms/:realm_uri/users/:id/grants` | [`bondy.user.grants`](/router/reference/wamp_api/user) |
| `GET` | `/realms/:realm_uri/sources` | [`bondy.source.list`](/router/reference/wamp_api/source) |
| `POST` | `/realms/:realm_uri/sources` | [`bondy.source.add`](/router/reference/wamp_api/source) |
| `GET` | `/realms/:realm_uri/users/:id/sources` | [`bondy.source.match`](/router/reference/wamp_api/source) |
| `DELETE` | `/realms/:realm_uri/users/:id/sources` | [`bondy.source.delete`](/router/reference/wamp_api/source) |

### Registrations and subscriptions

| Method | Path | WAMP procedure |
|---|---|---|
| `GET` | `/realms/:realm_uri/callees` | `bondy.wamp.callee.list` — **broken:** no procedure has this name, so the route answers with an error |
| `GET` | `/realms/:realm_uri/callees/:session_id` | `bondy.wamp.callee.get` — **broken:** no procedure has this name, so the route answers with an error |
| `GET` | `/realms/:realm_uri/registrations` | [`bondy.registration.list`](/router/reference/wamp_api/registration) |
| `GET` | `/realms/:realm_uri/registrations_summary` | [`wamp.registration.list`](/router/reference/wamp_api/registration) |
| `GET` | `/realms/:realm_uri/registrations/:id` | [`wamp.registration.get`](/router/reference/wamp_api/registration) |
| `GET` | `/realms/:realm_uri/registrations/:id/callees` | [`wamp.registration.list_callees`](/router/reference/wamp_api/registration) |
| `GET` | `/realms/:realm_uri/subscriptions` | [`bondy.subscription.list`](/router/reference/wamp_api/subscription) |
| `GET` | `/realms/:realm_uri/subscriptions_summary` | [`wamp.subscription.list`](/router/reference/wamp_api/subscription) |

### API Gateway specifications

| Method | Path | WAMP procedure |
|---|---|---|
| `POST` | `/services/load_api_spec` | [`bondy.http_gateway.api.load`](/router/reference/wamp_api/api_gateway) |
| `GET` | `/api_specs` | [`bondy.http_gateway.api.list`](/router/reference/wamp_api/api_gateway) |
| `POST` | `/api_specs` | [`bondy.http_gateway.api.load`](/router/reference/wamp_api/api_gateway) |
| `GET` | `/api_specs/:id` | [`bondy.http_gateway.api.get`](/router/reference/wamp_api/api_gateway) |
| `DELETE` | `/api_specs/:id` | [`bondy.http_gateway.api.delete`](/router/reference/wamp_api/api_gateway) |
| `GET` | `/api_specs/:id/info` | [`bondy.http_gateway.api.get`](/router/reference/wamp_api/api_gateway) |

### Backup and restore

| Method | Path | WAMP procedure |
|---|---|---|
| `POST` | `/services/create_backup` | [`bondy.export.create`](/router/reference/wamp_api/export) |
| `GET` | `/services/backup_status` | [`bondy.export.status`](/router/reference/wamp_api/export) |
| `POST` | `/services/restore_backup` | [`bondy.export.import`](/router/reference/wamp_api/export) |

### Calling any procedure

| Method | Path | WAMP procedure |
|---|---|---|
| `POST` | `/services/call` | The procedure named in the body |


`POST /services/call` takes a body of the form `{"procedure": ..., "args": [...], "kwargs": {...}, "options": {...}}`, calls that procedure, and answers with `{"args": ..., "kwargs": ..., "details": ...}`.
