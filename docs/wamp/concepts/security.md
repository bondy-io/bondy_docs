---
related:
    - text: Realms
      type: Concept
      link: /router/concepts/realms
      description: The administrative and routing domain every session attaches to.
    - text: Security Configuration Reference
      type: Reference
      link: /router/reference/configuration/security
      description: Configure authentication methods, rate limiting, and realm signing keys.
    - text: User, Group, Source, Grant
      type: WAMP API Reference
      link: /router/reference/wamp_api/user
      description: Create and manage the RBAC entities described here.
---
# Security

Bondy enforces security at the router, before a message ever reaches a procedure or a subscriber — not as something each application has to implement itself. Two independent questions get answered on every session and every call: who is this (authentication), and is this identity allowed to do what it's asking (authorization), scoped to the realm the session is attached to.

## Multi-tenancy

### Realms

A [realm](/router/concepts/realms) is the boundary both questions are asked within: authentication credentials, RBAC rules, and message routing are all scoped to one realm, and nothing routed in one realm leaks into another. A user, group, or grant defined in one realm doesn't exist in a different one — the same username can mean two different identities with two different permission sets in two different realms, and Bondy never conflates them.

This is what makes a single Bondy cluster able to serve multiple, mutually isolated tenants: each realm is a self-contained security domain, and creating one costs nothing beyond the control-plane record itself — see [Realms](/router/concepts/realms) for the full model, including the Master Realm that administers every other realm, and [Same Sign-On](/router/concepts/same_sign_on) / [Single Sign-On](/router/concepts/single_sign_on) for the two ways Bondy lets one identity span several realms without duplicating credentials in each.

## Authentication

Authentication establishes who a session belongs to. A realm doesn't pick one method — it allows a set of them, and a connecting client chooses which one to use, so a browser session using `cryptosign` and a service session using `wampcra` can coexist on the same realm.

### Using `anonymous`
No credentials at all; the session is assigned to the `anonymous` group. Useful for public, unauthenticated access, but the resulting session still goes through authorization — the `anonymous` group's permissions are ordinary RBAC grants, not a bypass.

### Using `cryptosign`
Public-key challenge-response: the client signs a server-issued challenge with an Ed25519 private key, and Bondy verifies it against the user's registered public key. No secret crosses the wire in either direction.

### Using `wampcra`
Shared-secret challenge-response: Bondy issues a challenge, the client returns an HMAC of it keyed by a secret derived from the user's password. The password itself never crosses the wire, but (unlike `cryptosign`) both sides must hold the same shared secret.

### Using `wamp-scram`
An adaptation of SCRAM (RFC 5802) to WAMP. Like `wampcra`, the password never crosses the wire; SCRAM additionally adds mutual authentication and per-session salting and iteration counts, resisting precomputed-hash attacks that a static HMAC challenge doesn't.

### Using `ticket`
A previously issued ticket, presented alongside a username, in place of a password or key. Tickets are how a session that already authenticated once (via one of the methods above) can reauthenticate cheaply — see the [Ticket WAMP API Reference](/router/reference/wamp_api/ticket) for issuing and using them.

Bondy also supports `password` (clear-text, TLS-dependent), `trust` (accepts an existing username with no credential check, meant to be paired with a network-restricted [source](#sources)), and `oauth2` (token-based, via the HTTP Gateway). See the glossary's [Authentication Method](/router/reference/glossary#authentication-method-authmethod) entry for the full list in one place, and [Security Configuration Reference](/router/reference/configuration/security) for configuring which methods a realm allows.

## Authorization

Authentication answers who; authorization answers what they can do. Bondy's authorization model is Role-Based Access Control (RBAC): permissions are granted to a role — a user or a group — not to a session directly, and a session inherits whatever its authenticated user (and that user's groups, transitively) has been granted.

### RBAC model
A permission check asks one question: does this session's role hold the requested action on the requested resource? Concretely:

- **Users** are the identities that authenticate. See the [User WAMP API Reference](/router/reference/wamp_api/user).
- **Groups** are named collections of users (and other groups). Granting a permission to a group grants it to every member, transitively — the mechanism [Simplifying Realm Management with Prototypes](/router/guides/administration/simplifying_realm_management_using_prototypes) builds on to keep large realms manageable. See the [Group WAMP API Reference](/router/reference/wamp_api/group).
- **Grants** bind a set of actions (`wamp.call`, `wamp.register`, `wamp.publish`, and the other WAMP permission actions) to a resource — a procedure or topic URI, matched `exact`, `prefix`, or `wildcard` — for a role. A grant on `*` applies regardless of the resource requested. See the [Grant WAMP API Reference](/router/reference/wamp_api/grant).
- **Sources** restrict *how* a user may authenticate at all, independent of what they're authorized to do once they have: a source binds a username (or `all`) to an allowed authentication method and a CIDR range, so a credential that's valid in principle still can't be used to open a session from a network it isn't trusted on. See the [Source WAMP API Reference](/router/reference/wamp_api/source).

A session's `authrole` — the single active role a permission check is evaluated against — is derived from its authenticated user's group memberships at session-establishment time, not re-derived per call; changing a user's groups takes effect on their next session, not their current one.

::: tip Security can be turned off per realm
A realm's RBAC checks can be disabled entirely (`bondy.realm.security.disable` — see the [Realm WAMP API Reference](/router/reference/wamp_api/realm#disable-realm-security)), which makes every authorization check pass unconditionally. This is meant for development, not production: users, groups, and grants stay fully configurable while security is disabled, and take effect again the moment it's re-enabled.
:::

## See also

- [Realms](/router/concepts/realms) — the administrative and routing domain security is scoped to.
- [Security Configuration Reference](/router/reference/configuration/security) — configuring authmethods, rate limiting, and realm signing keys.
- [Same Sign-On](/router/concepts/same_sign_on) and [Single Sign-On](/router/concepts/single_sign_on) — sharing one identity across realms.
