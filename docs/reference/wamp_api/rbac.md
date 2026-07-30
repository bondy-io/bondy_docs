---
outline: [2,3]
related:
    - text: Grant
      type: WAMP API Reference
      link: /reference/wamp_api/grant
      description: Create, revoke, and list the grants an authorization check evaluates against.
---

# RBAC
Bondy's access control (who may register, call, subscribe, or publish to what) is enforced continuously as part of routing every WAMP request — a `CALL` you're not authorized to make never reaches its procedure. `bondy.rbac.authorize` lets a session ask that same question directly, ahead of time, without attempting the action itself.

## Procedures

|Name|URI|
|:---|:---|
|[Check an authorization](#check-an-authorization)|`bondy.rbac.authorize`|

### Check an authorization
##### bondy.rbac.authorize(authid, permission, resource) -> boolean {.wamp-procedure}
Evaluates whether `authid` currently holds `permission` on `resource` on the caller's realm, using exactly the same grant-matching rules (exact match, then pattern match, with `any`-resource grants always merged in) that routing itself uses.

::: tip Not restricted to the caller's own identity
`authid` can be any user on the realm, not only the caller — checking someone else's authorization requires no special permission beyond `wamp.call` on this procedure itself. A nonexistent `authid` is not an error: it behaves as an identity holding no grants, so the check returns `false`.
:::

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'string',
            'description' : 'The authid (username) to check. Need not be the caller\'s own.'
        },
        '1':{
            'type': 'string',
            'description' : 'The WAMP permission to check: one of `wamp.register`, `wamp.unregister`, `wamp.call`, `wamp.cancel`, `wamp.subscribe`, `wamp.unsubscribe`, `wamp.publish`, `wamp.disclose_caller`, `wamp.disclose_publisher`. See [Grant](/reference/wamp_api/grant#actions) for what each authorizes.'
        },
        '2':{
            'type': 'uri',
            'description' : 'The concrete procedure or topic URI to check the permission against. There is no way to pass the `any` resource wildcard over this procedure — a grant made on `any` is still automatically included in the check regardless of which concrete URI you pass here.'
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
            'type': 'boolean',
            'description' : '`true` if authid holds permission on resource; `false` otherwise.'
        }
    })"
/>

##### Keyword Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        'message':{
            'type': 'string',
            'description' : 'Present only when the result is `false` — a human-readable explanation of why the check failed.'
        }
    })"
/>

#### Errors
None — denial is reported as a `false` result (with an explanatory `message`), never a WAMP error. This lets a caller distinguish "not authorized" from every other failure mode without a try/catch around a real attempt at the action.

## See also
- [Grant](/reference/wamp_api/grant) — create, revoke, and list the grants this check evaluates.
- [Group](/reference/wamp_api/group) — grants can target a group as well as a user; a user's effective permissions include every group they belong to.
- [Security](/concepts/wamp/security) — the realm/authentication/authorization model this check is part of.
