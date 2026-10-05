---
outline: [2,3]
related:
    - text: Grant
      type: WAMP API Reference
      link: /router/reference/wamp_api/grant
      description: Create, revoke, and list the grants an authorization check evaluates against.
---

# RBAC
Bondy's access control (who may register, call, subscribe, or publish to what) is enforced continuously as part of routing every WAMP request — a `CALL` you're not authorized to make never reaches its procedure. `bondy.rbac.authorize` lets a session ask that same question directly, ahead of time, without attempting the action itself.

## Procedures

|Name|URI|
|:---|:---|
|[Check an authorization](#check-an-authorization)|`bondy.rbac.authorize`|

### Check an authorization
##### bondy.rbac.authorize([realm_uri, ]authid, permission, resource) -> boolean {.wamp-procedure}
Evaluates whether `authid` currently holds `permission` on `resource` in a realm, using exactly the same grant-matching rules (exact match, then pattern match, with `any`-resource grants always merged in) that routing itself uses.

`realm_uri` is optional and defaults to the caller's own realm, so the three-argument call asks about the realm you are in.

::: tip Not restricted to the caller's own identity
`authid` can be any user on the realm, not only the caller — checking someone else's authorization requires no special permission beyond `wamp.call` on this procedure itself. A nonexistent `authid` is not an error: it behaves as an identity holding no grants, so the check returns `false`.
:::

::: warning Which realm you may ask about
A session in an ordinary realm may only ask about **its own** realm. Naming any other is refused with `wamp.error.not_authorized` — refused, not answered `false`, because a `false` would itself disclose that the other realm holds no such grant.

A session in the **master realm** (`com.leapsight.bondy`) may name any realm. This is the only way to check a tenant's authorizations, since the default is always the caller's own realm.

Either way the caller still needs `wamp.call` on this procedure.
:::

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'OPTIONAL. The realm to evaluate the check in. Defaults to the caller\'s own realm. A session outside the master realm may only name its own realm; a master-realm session may name any.'
        },
        '1':{
            'type': 'string',
            'description' : 'The authid (username) to check. Need not be the caller\'s own.'
        },
        '2':{
            'type': 'string',
            'description' : 'The WAMP permission to check: one of `wamp.register`, `wamp.unregister`, `wamp.call`, `wamp.cancel`, `wamp.subscribe`, `wamp.unsubscribe`, `wamp.publish`, `wamp.disclose_caller`, `wamp.disclose_publisher`. See [Grant](/router/reference/wamp_api/grant#actions) for what each authorizes.'
        },
        '3':{
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
- [Grant](/router/reference/wamp_api/grant) — create, revoke, and list the grants this check evaluates.
- [Group](/router/reference/wamp_api/group) — grants can target a group as well as a user; a user's effective permissions include every group they belong to.
- [Security](/router/concepts/wamp/security) — the realm/authentication/authorization model this check is part of.
