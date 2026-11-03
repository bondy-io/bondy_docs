# Admin HTTP API

The Admin HTTP API exposes Bondy's administration procedures over HTTP. Each route calls one procedure of the [WAMP Admin API](/connect/reference/wamp_api/index), and that procedure's reference page is the contract for its arguments, results and errors. This page lists the routes and how an HTTP request maps onto the procedure call.

The routes are served by the `admin_api` service. Bondy's default `admin` listener carries it on port `18081`, bound to loopback. See [Network Listeners](/connect/reference/configuration/listeners#the-reserved-admin-listener).

::: warning Protect the listener, not the route
The Admin HTTP API declares no authentication scheme. Anyone who can reach a listener carrying the `admin_api` service can administer every realm. Keep that listener on loopback or a private network, and never mount `admin_api` on a listener that serves the public.
:::

## Request and response mapping

Every route follows the same rules:

- **Base path.** Routes are served at the paths below, and also under the prefix `/v1.0`.
- **Positional arguments.** Path parameters become the procedure's positional arguments, in the order they appear in the path. For routes that send a body, the JSON request body is the next positional argument.
- **Result.** A successful call answers with the procedure's first positional result as the JSON response body.
- **Errors.** A failed call answers with the error's keyword arguments as the JSON body, with `code` replaced by the error URI. The HTTP status is the error's status from the [Error Reference](/connect/reference/errors). For example, `bondy.error.not_found` maps to `404` and `bondy.error.already_exists` to `400`. An error URI that the catalogue does not hold answers `500`.
- **`OPTIONS`.** Every path also answers `OPTIONS`, with an empty body.

## Routes

### Realms

| Method | Path | WAMP procedure |
|---|---|---|
| `GET` | `/realms` | [`bondy.realm.list`](/connect/reference/wamp_api/realm) |
| `POST` | `/realms` | [`bondy.realm.create`](/connect/reference/wamp_api/realm) |
| `GET` | `/realms/:realm_uri` | [`bondy.realm.get`](/connect/reference/wamp_api/realm) |
| `PUT` | `/realms/:realm_uri` | [`bondy.realm.update`](/connect/reference/wamp_api/realm) |
| `DELETE` | `/realms/:realm_uri` | [`bondy.realm.delete`](/connect/reference/wamp_api/realm) |
| `GET` | `/realms/:realm_uri/security_enabled` | [`bondy.realm.security.is_enabled`](/connect/reference/wamp_api/realm) |
| `PUT` | `/realms/:realm_uri/security_enabled` | [`bondy.realm.security.enable`](/connect/reference/wamp_api/realm) |
| `DELETE` | `/realms/:realm_uri/security_enabled` | [`bondy.realm.security.disable`](/connect/reference/wamp_api/realm) |

### Users

| Method | Path | WAMP procedure |
|---|---|---|
| `GET` | `/realms/:realm_uri/users` | [`bondy.user.list`](/connect/reference/wamp_api/user) |
| `POST` | `/realms/:realm_uri/users` | [`bondy.user.add`](/connect/reference/wamp_api/user) |
| `GET` | `/realms/:realm_uri/users/:id` | [`bondy.user.get`](/connect/reference/wamp_api/user) |
| `PUT` | `/realms/:realm_uri/users/:id` | [`bondy.user.update`](/connect/reference/wamp_api/user) |
| `DELETE` | `/realms/:realm_uri/users/:id` | [`bondy.user.delete`](/connect/reference/wamp_api/user) |
| `POST` | `/realms/:realm_uri/users/:id/change_password` | [`bondy.user.change_password`](/connect/reference/wamp_api/user) |
| `GET` | `/realms/:realm_uri/users/:id/enabled` | [`bondy.user.is_enabled`](/connect/reference/wamp_api/user) |
| `PUT` | `/realms/:realm_uri/users/:id/enabled` | [`bondy.user.enable`](/connect/reference/wamp_api/user) |
| `DELETE` | `/realms/:realm_uri/users/:id/enabled` | [`bondy.user.disable`](/connect/reference/wamp_api/user) |
| `POST` | `/realms/:realm_uri/users/:id/aliases` | [`bondy.user.add_alias`](/connect/reference/wamp_api/user) |
| `PUT` | `/realms/:realm_uri/users/:id/aliases/:alias` | [`bondy.user.add_alias`](/connect/reference/wamp_api/user) |
| `DELETE` | `/realms/:realm_uri/users/:id/aliases/:alias` | [`bondy.user.remove_alias`](/connect/reference/wamp_api/user) |
| `PUT` | `/realms/:realm_uri/users/:id/groups/:group` | [`bondy.user.add_group`](/connect/reference/wamp_api/user) |
| `DELETE` | `/realms/:realm_uri/users/:id/groups/:group` | [`bondy.user.remove_group`](/connect/reference/wamp_api/user) |
| `POST` | `/realms/:realm_uri/services/change_password` | [`bondy.user.change_password`](/connect/reference/wamp_api/user) |

### Groups

| Method | Path | WAMP procedure |
|---|---|---|
| `GET` | `/realms/:realm_uri/groups` | [`bondy.group.list`](/connect/reference/wamp_api/group) |
| `POST` | `/realms/:realm_uri/groups` | [`bondy.group.add`](/connect/reference/wamp_api/group) |
| `GET` | `/realms/:realm_uri/groups/:id` | [`bondy.group.get`](/connect/reference/wamp_api/group) |
| `PUT` | `/realms/:realm_uri/groups/:id` | [`bondy.group.update`](/connect/reference/wamp_api/group) |
| `DELETE` | `/realms/:realm_uri/groups/:id` | [`bondy.group.delete`](/connect/reference/wamp_api/group) |

### OAuth2 clients and resource owners

| Method | Path | WAMP procedure |
|---|---|---|
| `POST` | `/realms/:realm_uri/clients` | [`bondy.oauth2.client.add`](/connect/reference/wamp_api/oauth2) |
| `PUT` | `/realms/:realm_uri/clients/:id` | [`bondy.oauth2.client.update`](/connect/reference/wamp_api/oauth2) |
| `DELETE` | `/realms/:realm_uri/clients/:id` | [`bondy.oauth2.client.delete`](/connect/reference/wamp_api/oauth2) |
| `POST` | `/realms/:realm_uri/resource_owners` | [`bondy.oauth2.resource_owner.add`](/connect/reference/wamp_api/oauth2) |
| `PUT` | `/realms/:realm_uri/resource_owners/:id` | [`bondy.oauth2.resource_owner.update`](/connect/reference/wamp_api/oauth2) |
| `DELETE` | `/realms/:realm_uri/resource_owners/:id` | [`bondy.oauth2.resource_owner.delete`](/connect/reference/wamp_api/oauth2) |

### Grants and sources

| Method | Path | WAMP procedure |
|---|---|---|
| `GET` | `/realms/:realm_uri/grants` | [`bondy.realm.grants`](/connect/reference/wamp_api/realm) |
| `POST` | `/realms/:realm_uri/grants` | [`bondy.grant.create`](/connect/reference/wamp_api/grant) |
| `PUT` | `/realms/:realm_uri/grants` | [`bondy.grant.revoke`](/connect/reference/wamp_api/grant) |
| `GET` | `/realms/:realm_uri/groups/:id/grants` | [`bondy.group.grants`](/connect/reference/wamp_api/group) |
| `GET` | `/realms/:realm_uri/users/:id/grants` | [`bondy.user.grants`](/connect/reference/wamp_api/user) |
| `GET` | `/realms/:realm_uri/sources` | [`bondy.source.list`](/connect/reference/wamp_api/source) |
| `POST` | `/realms/:realm_uri/sources` | [`bondy.source.add`](/connect/reference/wamp_api/source) |
| `GET` | `/realms/:realm_uri/users/:id/sources` | [`bondy.source.match`](/connect/reference/wamp_api/source) |
| `DELETE` | `/realms/:realm_uri/users/:id/sources` | [`bondy.source.delete`](/connect/reference/wamp_api/source) |

### Registrations and subscriptions

| Method | Path | WAMP procedure |
|---|---|---|
| `GET` | `/realms/:realm_uri/callees` | `bondy.wamp.callee.list` — **broken:** no procedure has this name, so the route answers with an error |
| `GET` | `/realms/:realm_uri/callees/:session_id` | `bondy.wamp.callee.get` — **broken:** no procedure has this name, so the route answers with an error |
| `GET` | `/realms/:realm_uri/registrations` | [`bondy.registration.list`](/connect/reference/wamp_api/registration) |
| `GET` | `/realms/:realm_uri/registrations/:id` | [`bondy.registration.get`](/connect/reference/wamp_api/registration#get-a-registration-in-a-realm) |
| `GET` | `/realms/:realm_uri/registrations/:id/callees` | [`bondy.registration.list_callees`](/connect/reference/wamp_api/registration#list-a-registration-s-callees-in-a-realm) |
| `GET` | `/realms/:realm_uri/subscriptions` | [`bondy.subscription.list`](/connect/reference/wamp_api/subscription) |

The `/registrations` and `/subscriptions` routes answer with the first page of the paginated procedure. The body holds `values`, `has_more` and, when more entries remain, `cursor`. Each entry carries its id and its match policy. These routes pass no `limit` or `cursor` to the procedure, so the page has the default size and no route reads the next page. Use [`POST /services/call`](#calling-any-procedure) to call the procedure with `limit` and `cursor`.

### API Gateway specifications

| Method | Path | WAMP procedure |
|---|---|---|
| `POST` | `/services/load_api_spec` | [`bondy.http_gateway.api.load`](/connect/reference/wamp_api/api_gateway) |
| `GET` | `/api_specs` | [`bondy.http_gateway.api.list`](/connect/reference/wamp_api/api_gateway) |
| `POST` | `/api_specs` | [`bondy.http_gateway.api.load`](/connect/reference/wamp_api/api_gateway) |
| `GET` | `/api_specs/:id` | [`bondy.http_gateway.api.get`](/connect/reference/wamp_api/api_gateway) |
| `DELETE` | `/api_specs/:id` | [`bondy.http_gateway.api.delete`](/connect/reference/wamp_api/api_gateway) |
| `GET` | `/api_specs/:id/info` | [`bondy.http_gateway.api.get`](/connect/reference/wamp_api/api_gateway) |

### Backup and restore

| Method | Path | WAMP procedure |
|---|---|---|
| `POST` | `/services/create_backup` | [`bondy.export.create`](/connect/reference/wamp_api/export) |
| `GET` | `/services/backup_status` | [`bondy.export.status`](/connect/reference/wamp_api/export) |
| `POST` | `/services/restore_backup` | [`bondy.export.import`](/connect/reference/wamp_api/export) |

### Calling any procedure

| Method | Path | WAMP procedure |
|---|---|---|
| `POST` | `/services/call` | The procedure named in the body |


`POST /services/call` takes a body of the form `{"procedure": ..., "args": [...], "kwargs": {...}, "options": {...}}`, calls that procedure, and answers with `{"args": ..., "kwargs": ..., "details": ...}`.
