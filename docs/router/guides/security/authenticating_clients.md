---
outline: [2,3]
related:
    - text: Security
      type: Concept
      link: /router/concepts/wamp/security
      description: How authentication, sources and RBAC fit together on a realm.
    - text: Source
      type: WAMP API Reference
      link: /router/reference/wamp_api/source
      description: The rules that gate which method a user may authenticate with, and from where.
    - text: User
      type: WAMP API Reference
      link: /router/reference/wamp_api/user
      description: Creating users and setting their credentials.
    - text: Ticket
      type: WAMP API Reference
      link: /router/reference/wamp_api/ticket
      description: Issuing and revoking authentication tickets.
---

# Authenticating Clients

Set up a realm so WAMP clients authenticate with an Ed25519 key (`cryptosign`), a password (`wampcra` or `wamp-scram`), or a ticket Bondy issued them earlier (`ticket`).

A client can authenticate with a method only when three things agree: the realm lists the method in its `authmethods`, a [source](/router/concepts/wamp/security#rbac-model) permits that method for the user from the client's address, and the user holds the credential the method needs. The steps below configure each in turn.

## Before you start

You need a session on the master realm (`com.leapsight.bondy`) as a member of `bondy.administrators`. Every call in steps 1 to 5 runs in that session. The examples connect as the `admin` user over the loopback interface with `wampcra`, which the master realm permits by default; substitute your own administrator credentials.

The examples use the realm `com.example.app`, a group `app_clients`, and two users: `alice`, who authenticates with a key, and `bob`, who authenticates with a password.

## 1. Choose the realm's authentication methods

Create the realm with an explicit `authmethods` list:

```bash
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
--authmethod=wampcra --authid="admin" --secret="<admin password>" \
call bondy.realm.create \
'{
    "uri": "com.example.app",
    "description": "Example application realm",
    "authmethods": ["cryptosign", "wampcra", "ticket"]
}' | jq
```

For an existing realm, pass the same `authmethods` to [`bondy.realm.update`](/router/reference/wamp_api/realm#update-a-realm) with the realm URI as the first argument.

Set `authmethods` explicitly. A realm that leaves it unset, and has no prototype, allows `anonymous`, `password`, `oauth2`, `wampcra` and `ticket`. That list does not include `cryptosign` or `wamp-scram`.

Choose one password method:

- **`wampcra`.** List `wampcra`, as above.
- **`wamp-scram`.** List `wamp-scram` in place of `wampcra`.

Bondy hashes a password for one protocol, and each method accepts only its own: `wampcra` needs a CRA password, and `wamp-scram` needs a SCRAM password. The realm picks the protocol for new passwords from its `authmethods`. When the list includes `wamp-scram`, new passwords are hashed for SCRAM. Otherwise Bondy uses the `security.password.protocol` setting, which defaults to `cra`. Passwords set before you change `authmethods` keep their protocol. Set them again with [`bondy.user.update`](/router/reference/wamp_api/user#update-a-user-in-a-realm) to switch them over.

Leave out the other methods unless your clients need them:

- **`password`** sends the password in clear text. Use it only over TLS.
- **`anonymous`** needs no credentials. Even when a realm lists it, Bondy accepts it only from the loopback interface unless you change `security.allow_anonymous_user` (default `local`).
- **`tls`** and **`oidcrp`** are accepted in the list but cannot authenticate a WAMP session.

## 2. Confirm security is enabled

Security is enabled on a new realm. Check it:

```bash
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
--authmethod=wampcra --authid="admin" --secret="<admin password>" \
call bondy.realm.security.status "com.example.app"
```

```json
"enabled"
```

If the result is `"disabled"`, call [`bondy.realm.security.enable`](/router/reference/wamp_api/realm#enable-realm-security) with the realm URI. While security is disabled, Bondy rejects any `HELLO` that carries an `authid`.

## 3. Create a group and grant it permissions

Grant permissions to a group, then make each user a member. A session's `authrole` is the user's group, so a user with no group authenticates with the role `undefined`.

```bash
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
--authmethod=wampcra --authid="admin" --secret="<admin password>" \
call bondy.group.add "com.example.app" '{"name": "app_clients"}' | jq
```

Every call a client makes is checked for `wamp.call` on the procedure URI, including Bondy's own `bondy.` procedures. Grant the group the application's namespace and the two Bondy procedures this guide uses:

```bash
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
--authmethod=wampcra --authid="admin" --secret="<admin password>" \
call bondy.grant.create "com.example.app" \
'{
    "permissions": [
        "wamp.call", "wamp.cancel", "wamp.register", "wamp.unregister",
        "wamp.subscribe", "wamp.unsubscribe", "wamp.publish"
    ],
    "resources": [{"uri": "com.example.app.", "match": "prefix"}],
    "roles": ["app_clients"]
}' | jq
```

```bash
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
--authmethod=wampcra --authid="admin" --secret="<admin password>" \
call bondy.grant.create "com.example.app" \
'{
    "permissions": ["wamp.call"],
    "resources": [
        {"uri": "bondy.session.self", "match": "exact"},
        {"uri": "bondy.ticket.issue", "match": "exact"}
    ],
    "roles": ["app_clients"]
}' | jq
```

Issuing a ticket also needs `bondy.issue` on the ticket scope. A user with no SSO realm gets a ticket scoped to this realm, which is the `bondy.ticket.scope.local` resource:

```bash
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
--authmethod=wampcra --authid="admin" --secret="<admin password>" \
call bondy.grant.create "com.example.app" \
'{
    "permissions": ["bondy.issue"],
    "resources": [{"uri": "bondy.ticket.scope.local", "match": "exact"}],
    "roles": ["app_clients"]
}' | jq
```

Skip this last grant if your clients do not use tickets.

## 4. Create the users

### A key-based user

Generate an Ed25519 key pair and print both halves as hex. The client keeps the private key; Bondy stores only the public key.

```bash
openssl genpkey -algorithm ed25519 -out alice.pem
openssl pkey -in alice.pem -outform DER | tail -c 32 | xxd -p -c 32          # private key
openssl pkey -in alice.pem -pubout -outform DER | tail -c 32 | xxd -p -c 32  # public key
```

Add the user with the public key in `authorized_keys`. The examples use the public key `1766c9e6…ccdd`, whose private key is `4ffddd89…a7d7`; use your own pair.

```bash
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
--authmethod=wampcra --authid="admin" --secret="<admin password>" \
call bondy.user.add "com.example.app" \
'{
    "username": "alice",
    "authorized_keys": ["1766c9e6ec7d7b354fd7a2e4542753a23cae0b901228305621e5b8713299ccdd"],
    "groups": ["app_clients"]
}' | jq
```

The result reports `"has_authorized_keys": true`. A user may hold several keys, one per device.

### A password user

```bash
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
--authmethod=wampcra --authid="admin" --secret="<admin password>" \
call bondy.user.add "com.example.app" \
'{
    "username": "bob",
    "password": "correct-horse-battery",
    "groups": ["app_clients"]
}' | jq
```

The result reports `"has_password": true`. The password is hashed with the realm's protocol from step 1. To choose the protocol for one user, add `"password_opts": {"protocol": "scram"}` (or `"cra"`).

## 5. Add a source for each method

A source permits one authentication method, for some users, from one CIDR range. Without a matching source, a user cannot authenticate at all, whatever credentials it holds. Add one source per method:

```bash
./wick --url ws://localhost:18080/ws --realm com.leapsight.bondy \
--authmethod=wampcra --authid="admin" --secret="<admin password>" \
call bondy.source.add "com.example.app" \
'{"usernames": "all", "authmethod": "cryptosign", "cidr": "127.0.0.0/8"}' | jq
```

Repeat with `"authmethod": "wampcra"` (or `"wamp-scram"`) and `"authmethod": "ticket"`.

Replace `127.0.0.0/8` with the network your clients connect from. To restrict a method to named users, pass a list in `usernames`, for example `["alice"]`. Bondy considers every source whose username and CIDR match the client, so a user may authenticate with any method that one of them permits.

A ticket session needs its own `ticket` source. A source for the method the ticket was issued with does not cover it.

## 6. Connect and verify

### With a key

```bash
./wick --url ws://localhost:18080/ws --realm com.example.app \
--authmethod=cryptosign --authid="alice" \
--private-key="4ffddd896a530ce5ee8c86b83b0d31835490a97a9cd718cb2f09c9fd31c4a7d7" \
call bondy.session.self | jq
```

A client library other than `wick` sends the public key as `authextra.pubkey` in `HELLO`, then signs the challenge from `CHALLENGE` with the private key.

### With a password

```bash
./wick --url ws://localhost:18080/ws --realm com.example.app \
--authmethod=wampcra --authid="bob" --secret="correct-horse-battery" \
call bondy.session.self | jq
```

For `wamp-scram`, use a client library that implements it. The client sends `HELLO` with `authmethods: ["wamp-scram"]` and a base64 client nonce in `authextra.nonce`; Bondy refuses the `HELLO` without the nonce.

### Read the result

[`bondy.session.self`](/router/reference/wamp_api/session#retrieve-the-caller-s-own-session) returns the same identity the router sent in `WELCOME`:

```json
{
  "authid": "alice",
  "authmethod": "cryptosign",
  "authprovider": "com.leapsight.bondy",
  "authrole": "app_clients",
  "x_authroles": ["app_clients"],
  ...
}
```

Check three fields. `authid` is the user. `authmethod` is the method the router chose. `authrole` is the user's group, which carries the grants from step 3.

Offer one method per connection. When a client lists several methods in `HELLO.authmethods` and more than one is available, Bondy picks one of them; it does not follow the client's order.

## 7. Issue a ticket and connect with it

From an authenticated session, call [`bondy.ticket.issue`](/router/reference/wamp_api/ticket). It takes no positional arguments and issues the ticket for the calling session's user, in the session's realm:

```bash
./wick --url ws://localhost:18080/ws --realm com.example.app \
--authmethod=cryptosign --authid="alice" \
--private-key="4ffddd896a530ce5ee8c86b83b0d31835490a97a9cd718cb2f09c9fd31c4a7d7" \
call bondy.ticket.issue | jq
```

The result is a single map:

```json
{
  "ticket": "eyJhbGciOiJFUzI1NiIs...",
  "id": "...",
  "issued_at": 1791158400,
  "expires_at": 1793750400,
  "scope": {...},
  "authroles": [...]
}
```

Keep `ticket`; it is the credential. The ticket expires after `security.ticket.expiry_time` (default 30 days). To shorten it, pass the keyword argument `expiry_time_secs`, for example `{"expiry_time_secs": 3600}`. To limit the ticket to some of the session's roles, pass `authroles`.

To authenticate with the ticket, the client sends `HELLO` with:

```json
{"authmethods": ["ticket"], "authid": "alice"}
```

Bondy replies with `CHALLENGE`, and the client answers with `AUTHENTICATE`, putting the `ticket` string in the signature field. The `authid` must be the user the ticket was issued to. Present tickets only over TLS: anyone who reads one can use it until it expires.

Verify as in step 6. `bondy.session.self` now reports `"authmethod": "ticket"`.

## If authentication fails

The router answers a failed `HELLO` with `ABORT`:

- **`wamp.error.not_auth_method`** — no requested method is available to this user from this address. Check that the realm lists the method (step 1), that a source permits it for the user and the client's address (step 5), and that the user has the credential it needs: `authorized_keys` for `cryptosign`, a password of the matching protocol for `wampcra` or `wamp-scram`.
- **`wamp.error.authentication_failed`** with the message `Authentication failed.` — the method was available but the credential was refused. Bondy returns the same message for an unknown user, a disabled user and a wrong credential, and logs the actual reason on the node.

## See also

- [Security](/router/concepts/wamp/security) — how authentication, sources and authorization fit together.
- [Source](/router/reference/wamp_api/source), [User](/router/reference/wamp_api/user), [Grant](/router/reference/wamp_api/grant) — the procedures used above.
- [Ticket](/router/reference/wamp_api/ticket) — ticket scopes and `bondy.ticket.revoke_all`.
- [Security Configuration Reference](/router/reference/configuration/security) — password, ticket and anonymous settings.
