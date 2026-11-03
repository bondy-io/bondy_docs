---
outline: [2,3]
related:
    - text: OAuth2 Token
      type: WAMP API Reference
      link: /connect/reference/wamp_api/oauth2_token
      description: The HTTP-side token and revoke endpoints these identities authenticate against.
    - text: User
      type: WAMP API Reference
      link: /connect/reference/wamp_api/user
      description: The underlying entity — an API client or resource owner is an RBAC user in a reserved group.
---

# OAuth2 Administration
An OAuth2 **API client** and a **resource owner** are both, underneath, an ordinary [RBAC user](/connect/reference/wamp_api/user) — Bondy just forces membership in a reserved group when creating one: `api_clients` for a client, `resource_owners` for a resource owner. There is no separate storage or entity type; `bondy.oauth2.client.add`, for instance, is `bondy.user.add` with the `api_clients` group appended to whatever groups you passed. The result, and the `username`/`groups`/`meta` fields you can set on it, are exactly the [user](/connect/reference/wamp_api/user#types) type.

This page covers the `bondy.oauth2.*` procedures that manage these identities and their refresh tokens administratively. The client-facing token issuance and revocation flow — the `/oauth/token` and `/oauth/revoke` HTTP endpoints a resource owner's application actually calls — is covered in [OAuth2 Token](/connect/reference/wamp_api/oauth2_token).

## Procedures

|Name|URI|
|:---|:---|
|[Add an API client](#add-an-api-client)|`bondy.oauth2.client.add`|
|[Update an API client](#update-an-api-client)|`bondy.oauth2.client.update`|
|[Delete an API client](#delete-an-api-client)|`bondy.oauth2.client.delete`|
|[Add a resource owner](#add-a-resource-owner)|`bondy.oauth2.resource_owner.add`|
|[Update a resource owner](#update-a-resource-owner)|`bondy.oauth2.resource_owner.update`|
|[Delete a resource owner](#delete-a-resource-owner)|`bondy.oauth2.resource_owner.delete`|
|[Revoke a refresh token](#revoke-a-refresh-token)|`bondy.oauth2.token.revoke`|
|[Revoke every refresh token for a resource owner](#revoke-every-refresh-token-for-a-resource-owner)|`bondy.oauth2.token.revoke_all`|

### Add an API client
##### bondy.oauth2.client.add(realm_uri, data) -> user {.wamp-procedure}
Creates an API client: an RBAC user in the `api_clients` group, authenticated with a `client_id`/`client_secret` pair instead of a human password.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'The URI of the realm to add the client to.'
        },
        '1':{
            'type': 'dict',
            'description' : 'The client data — see below.'
        }
    })"
/>

`data`:
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        'client_id':{
            'type': 'string',
            'description' : 'The client identifier. Becomes the underlying user\'s `username`.'
        },
        'client_secret':{
            'type': 'string',
            'description' : 'Required. Becomes the underlying user\'s password.'
        },
        'groups':{
            'type': 'array',
            'description' : 'Additional group names to also add the user to. `api_clients` is always added regardless of what is passed here; defaults to `[]`.'
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
            'type': 'user',
            'description' : 'The new client, as a [user](/connect/reference/wamp_api/user#types) object.'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
* [bondy.error.already_exists](/connect/reference/wamp_api/errors/already_exists): when `client_id` is already in use.
* [bondy.error.missing_required_value](/connect/reference/wamp_api/errors/missing_required_value): when `client_secret` is not provided.

### Update an API client
##### bondy.oauth2.client.update(realm_uri, client_id, info) -> user {.wamp-procedure}
Updates an existing API client.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'The URI of the realm the client belongs to.'
        },
        '1':{
            'type': 'string',
            'description' : 'The client\'s `client_id` (its username).'
        },
        '2':{
            'type': 'dict',
            'description' : 'The fields to update. `client_secret` is refused: the call fails with `wamp.error.invalid_argument` and changes nothing. Set it with [`bondy.user.change_password`](/connect/reference/wamp_api/user#change-the-user-password). `groups` is optional; when it is given, `api_clients` is re-added to it regardless of what is passed, the same as on creation. Omitting `groups` entirely leaves the client\'s current groups untouched.'
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
            'type': 'user',
            'description' : 'The updated client, as a [user](/connect/reference/wamp_api/user#types) object.'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
* [wamp.error.no_such_principal](/connect/reference/wamp_api/errors/wamp_no_such_principal): when `client_id` does not exist.
* [wamp.error.invalid_argument](/connect/reference/wamp_api/errors/wamp_invalid_argument): when the data carries `client_secret`.
* [bondy.error.invalid_value](/connect/reference/wamp_api/errors/invalid_value): when `client_id` is a reserved name.

### Delete an API client
##### bondy.oauth2.client.delete(realm_uri, client_id) -> ok {.wamp-procedure}
Deletes an API client.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'The URI of the realm the client belongs to.'
        },
        '1':{
            'type': 'string',
            'description' : 'The client\'s `client_id` (its username).'
        }
    })"
/>

##### Keyword Args
None.

#### Result
##### Positional Results
None.

##### Keyword Results
None.

#### Errors
* [wamp.error.no_such_principal](/connect/reference/wamp_api/errors/wamp_no_such_principal): when no user with the given name exists in the realm.
* [bondy.error.invalid_value](/connect/reference/wamp_api/errors/invalid_value): when the name is a reserved name.

### Add a resource owner
##### bondy.oauth2.resource_owner.add(realm_uri, data) -> user {.wamp-procedure}
Creates a resource owner: an RBAC user in the `resource_owners` group, representing the end-user (or system account) an OAuth2 token is issued on behalf of.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'The URI of the realm to add the resource owner to.'
        },
        '1':{
            'type': 'dict',
            'description' : 'The resource owner data. Beyond `groups` (optional, defaults to `[]` — `resource_owners` is always added regardless of what is passed), this accepts the same fields as [`bondy.user.add`](/connect/reference/wamp_api/user#add-a-user-to-a-realm), e.g. `username` and `password`.'
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
            'type': 'user',
            'description' : 'The new resource owner, as a [user](/connect/reference/wamp_api/user#types) object.'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
* [bondy.error.already_exists](/connect/reference/wamp_api/errors/already_exists): when the username is already in use.
* [bondy.error.missing_required_value](/connect/reference/wamp_api/errors/missing_required_value): when a required value is not provided.

### Update a resource owner
##### bondy.oauth2.resource_owner.update(realm_uri, username, info) -> user {.wamp-procedure}
Updates an existing resource owner.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'The URI of the realm the resource owner belongs to.'
        },
        '1':{
            'type': 'string',
            'description' : 'The resource owner\'s username.'
        },
        '2':{
            'type': 'dict',
            'description' : 'The fields to update. `password` is refused: the call fails with `wamp.error.invalid_argument` and changes nothing. Set it with [`bondy.user.change_password`](/connect/reference/wamp_api/user#change-the-user-password). `groups` is optional; when given, `resource_owners` is re-added to it regardless of what is passed. Omitting `groups` entirely leaves the current groups untouched.'
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
            'type': 'user',
            'description' : 'The updated resource owner, as a [user](/connect/reference/wamp_api/user#types) object.'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
* [wamp.error.no_such_principal](/connect/reference/wamp_api/errors/wamp_no_such_principal): when `username` does not exist.
* [wamp.error.invalid_argument](/connect/reference/wamp_api/errors/wamp_invalid_argument): when the data carries `password`.
* [bondy.error.invalid_value](/connect/reference/wamp_api/errors/invalid_value): when `username` is a reserved name.

### Delete a resource owner
##### bondy.oauth2.resource_owner.delete(realm_uri, username) -> ok {.wamp-procedure}
Deletes a resource owner.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'The URI of the realm the resource owner belongs to.'
        },
        '1':{
            'type': 'string',
            'description' : 'The resource owner\'s username.'
        }
    })"
/>

##### Keyword Args
None.

#### Result
##### Positional Results
None.

##### Keyword Results
None.

#### Errors
* [wamp.error.no_such_principal](/connect/reference/wamp_api/errors/wamp_no_such_principal): when no user with the given name exists in the realm.
* [bondy.error.invalid_value](/connect/reference/wamp_api/errors/invalid_value): when the name is a reserved name.

### Revoke a refresh token
##### bondy.oauth2.token.revoke(realm_uri, client_id, refresh_token) -> ok {.wamp-procedure}
Revokes one refresh token by its value.

::: tip client_id is accepted but not used
The `client_id` argument is validated for presence (spec-shape compatibility) but does not scope the revocation — only `refresh_token` identifies which token is revoked.
:::

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'The URI of the realm the token belongs to.'
        },
        '1':{
            'type': 'string',
            'description' : 'Accepted but not used — see the tip above.'
        },
        '2':{
            'type': 'string',
            'description' : 'The refresh token to revoke.'
        }
    })"
/>

##### Keyword Args
None.

#### Result
##### Positional Results
None.

##### Keyword Results
None.

#### Errors
None documented. The call succeeds even when `refresh_token` does not exist — there is nothing to revoke, which is treated the same as having revoked it.

### Revoke every refresh token for a resource owner
##### bondy.oauth2.token.revoke_all(realm_uri, client_id, authid) -> ok {.wamp-procedure}
Revokes every refresh token issued to `authid` on the realm.

::: tip client_id is accepted but not used
As with [`bondy.oauth2.token.revoke`](#revoke-a-refresh-token), `client_id` doesn't scope the revocation to tokens issued to that particular client — every token belonging to `authid`, issued through any client, is revoked.
:::

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'The URI of the realm the tokens belong to.'
        },
        '1':{
            'type': 'string',
            'description' : 'Accepted but not used — see the tip above.'
        },
        '2':{
            'type': 'string',
            'description' : 'The resource owner\'s username (authid) whose tokens are revoked.'
        }
    })"
/>

##### Keyword Args
None.

#### Result
##### Positional Results
None.

##### Keyword Results
None.

#### Errors
None documented. The call succeeds even when `authid` has no outstanding tokens.

## Not implemented
These reserved `bondy.oauth2.*` URIs do not perform an operation:

- `bondy.oauth2.client.get`, `bondy.oauth2.client.list` — deprecated; they raise `bondy.error.deprecated_procedure`. List API clients as users in the `api_clients` group instead.
- `bondy.oauth2.resource_owner.get`, `bondy.oauth2.resource_owners.list` — deprecated in the same way, for resource owners (note the plural `owners` in the list URI).
- `bondy.oauth2.token.lookup` — deprecated; raises `bondy.error.deprecated_procedure`.

::: tip Client/resource owner lifecycle topics are reserved, not published
`bondy.oauth2.client.added`/`.deleted`/`.updated` and `bondy.oauth2.resource_owner.added`/`.deleted`/`.updated` are reserved URIs that Bondy never actually publishes to. Since a client or resource owner is an RBAC user, subscribe to [`bondy.user.added`/`.updated`/`.deleted`](/connect/reference/wamp_api/user#topics) instead if you need to observe these changes.
:::

## See also
- [OAuth2 Token](/connect/reference/wamp_api/oauth2_token) — the HTTP-side token issuance and revocation flow these identities authenticate against.
- [User](/connect/reference/wamp_api/user) — the underlying entity, and the full external `user` shape.
- [Group](/connect/reference/wamp_api/group) — the `api_clients` and `resource_owners` groups these identities are forced into.
