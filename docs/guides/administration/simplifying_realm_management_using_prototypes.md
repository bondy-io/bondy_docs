---
related:
    - text: Realms
      type: Concept
      link: /concepts/realms
      description: Realms are routing and administrative domains that act as namespaces.
    - text: Realm
      type: WAMP API Reference
      link: /reference/wamp_api/realm
      description: Creating, retrieving, updating, and deleting realms.
    - text: Group
      type: WAMP API Reference
      link: /reference/wamp_api/group
      description: Groups defined on a prototype are usable from every realm that inherits from it.
---
# How to Simplify Realm Management Using Prototypes

A **prototype realm** is a normal realm, with `is_prototype` set to `true`, that other realms inherit shared configuration and RBAC definitions from via a `prototype_uri` reference. This lets a fleet of similar realms — one per customer or per environment, for example — share a common baseline instead of having every group, source, and grant duplicated into each one individually.

**Prerequisites:** a WAMP session on the **Master Realm** with `wamp.call` permission — every call below uses the [Realm](/reference/wamp_api/realm) and [Group](/reference/wamp_api/group) WAMP APIs, both Master-Realm-only.

## Steps

### 1. Create the prototype realm

```bash
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
call bondy.realm.create \
'{
    "uri": "com.example.prototype",
    "description": "Shared baseline for customer realms",
    "is_prototype": true,
    "authmethods": ["cryptosign", "wampcra"]
}' | jq
```

Define whatever should be common to every realm that will inherit from it here: groups, sources, and grants, plus any of `authmethods`, `allow_connections`, or `sso_realm_uri` you want as the shared default (see [what's inherited](#what-gets-inherited) below).

::: warning A prototype cannot have users or connections
`is_prototype: true` forces `allow_connections` to `false` — a prototype realm can never be connected to directly, only inherited from. Define groups, sources, and grants on it; don't attempt to add users.
:::

### 2. Create realms that inherit from it

```bash
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
call bondy.realm.create \
'{
    "uri": "com.example.customer1",
    "description": "Customer 1",
    "prototype_uri": "com.example.prototype"
}' | jq
```

Every realm created this way immediately has access to every group defined on `com.example.prototype`, as if those groups were defined locally — a user added to `com.example.customer1` can be made a member of a prototype-defined group directly.

### 3. Override only what needs to differ

Set a property explicitly on a specific realm to override the prototype's value for that realm only — nothing else changes:

```bash
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
call bondy.realm.update \
"com.example.customer1" \
'{"authmethods": ["cryptosign", "wampcra", "ticket"]}' | jq
```

The same override rule applies to a **group**: defining a group in `com.example.customer1` with the same name as one on the prototype shadows the prototype's version for that realm, at every level of the membership chain — the one exception is the special `all` group, whose permissions are *merged* between a realm and its prototype rather than one shadowing the other.

## What gets inherited

When left unset on the inheriting realm, these properties fall back to the prototype's value; setting one explicitly overrides it for that realm only:

- `allow_connections`
- `authmethods`
- `sso_realm_uri`
- `security_enabled`

Groups, sources, and grants inherit too, following the rules in step 3 above: a realm sees every prototype group as if it were its own, a same-named realm-level group overrides the prototype's, and `all`'s grants merge rather than override. Users are never inherited — a prototype cannot have any, so there is nothing to inherit.

## Limits

- **Single inheritance only.** A realm's `prototype_uri` points to one prototype, and a prototype cannot itself have a `prototype_uri` — the chain is bounded to one level, not arbitrarily deep.
- **`prototype_uri` is immutable.** Once a realm is created with (or later given) a prototype, it cannot be pointed at a different one or un-set.
- **`is_prototype` is immutable.** A realm designated a prototype cannot be un-designated later; decide this at creation.

## Result

Every realm inheriting from the prototype shares its baseline groups, sources, and grants and its default settings, with only the properties you explicitly set on an individual realm diverging from that baseline — so a fleet of many similar realms is configured and audited in one place instead of once per realm.

## See also

- [Realms](/concepts/realms) — the realm concept these prototypes extend.
- [Realm WAMP API Reference](/reference/wamp_api/realm) — `is_prototype`, `prototype_uri`, and every other realm property.
- [Group](/reference/wamp_api/group), [Source](/reference/wamp_api/source), [Grant](/reference/wamp_api/grant) — the RBAC entities a prototype shares with the realms that inherit from it.
