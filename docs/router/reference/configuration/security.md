# Security Configuration Reference

## General

@[config](security.allow_anonymous_user,off|local|on,local,v0.8.8)

Controls anonymous authentication, the `anonymous` user and role.

- `off` — anonymous is disabled everywhere.
- `local` — anonymous is allowed only from the loopback interface. Local
  development works out of the box, while exposing anonymous access to the
  network is an explicit opt-in.
- `on` — anonymous is allowed from any network location a realm's own sources
  permit.

The master realm never accepts anonymous connections, whatever this setting is.

::: warning
We strongly recommend disabling anonymous for production use or at least restrict the network locations from which an anonymous connection can be established. See [Source](/router/reference/wamp_api/source) API documentation reference.

Notice that disabling the anonymous disables the `anonymous` authentication method as an option for Authentication and Authorization.
:::

@[config](security.automatically_create_realms,on|off,off,v0.8.8)

Defines whether Bondy creates a new realm when a session wants to attach to a non existing realm.

::: warning
We strongly recommend to disable this option and only enable it for development or testing purposes.
:::

@[config](security.admin_user.password,string,none,v1.0.0)

The initial password of the `admin` user in the master realm (`com.leapsight.bondy`). Bondy ships no default credential for this user.

Bondy reads this key only when it creates the master realm, which happens when the node does not find the realm in its store — on the first boot of a fresh install. After that the stored password is the one that counts: changing this key has no effect. Change the password through the user API instead.

If the key is unset (or empty), Bondy generates a random password and logs it once, at `notice` level, as `generated_password`. Record it from the log when it appears; Bondy does not show it again.

::: warning Clusters
Each node that creates the master realm resolves the password on its own, and a generated password differs from node to node. In a multi-node cluster, set the same value on every node so that the replicated `admin` user converges to one password.
:::


## Password options

Options used by those authentication methods based on password.

@[config](security.password.protocol,cra|scram,cra,v0.9.0)

Defines the default password protocol to be used for new user password
creation. Notice the user API allows a caller to define the protocol to be
used. This default is used when the caller does not specify a protocol.



@[config](security.password.protocol.upgrade.enabled,on|off,off,v0.9.0)

Controls whether a password protocol upgrade is performed during
password migrations. A password migration occurs when Bondy changes the
internal representation of the password object to accommodate new protocols,
features or bug fixes. Normally some of this changes can be done without
user input, but when these changes include a re-calculation of the salted
hash they can only happened during authentication or when the user changes
the password.

If this option is set to `on`, then Bondy will try to upgrade the password
protocol of an existing password to the protocol defined by the
`security.password.protocol` option using the default parameters defined in
the `security.password.{SelectedProtocol}.{Option}` options.


@[config](security.password.min_length,3..256,6,v0.9.0)

Defines the minimum length for newly created passwords. The value must be an
integer in the range 3..256.


@[config](security.password.max_length,min_length..256,254,v0.9.0)

Defines the maximum length for newly created passwords. The value must be an
integer no smaller than `security.password.min_length` and no larger than 256.


@[config](security.password.scram.kdf,pbkdf2,pbkdf2,v0.9.0)

Defines the default key derivation function (KDF) to be used with SCRAM. The
only option is `pbkdf2`.


@[config](security.password.cra.kdf,pbkdf2,pbkdf2,v0.9.0)

Defines the default key derivation function (KDF) to be used with CRA. The only option is pbkdf2.


@[config](security.password.pbkdf2.iterations,4096..10000000,600000,v0.9.0)

Defines the default number of iterations to be used with the pbkdf2 key
derivation function. The value must be an integer in the range 4096..10000000.
The default follows OWASP guidance for PBKDF2-HMAC-SHA256. Higher values raise
the CPU cost of every password login.

## Authentication: OAuth2

@[config](oauth2.config_file,path,'{{platform_etc_dir}}/oauth2_config.json',v0.9.0)

Path to the OAuth2 client configuration file (registered clients, scopes, and related settings).

@[config](oauth2.password_grant.duration,duration_time_units,15m,v0.9.0)

Lifetime of an access token issued via the Resource Owner Password Credentials grant.

@[config](oauth2.client_credentials_grant.duration,duration_time_units,15m,v0.9.0)

Lifetime of an access token issued via the Client Credentials grant.

@[config](oauth2.code_grant.duration,duration_time_units,10m,v0.9.0)

Lifetime of an access token issued via the Authorization Code grant.

@[config](oauth2.refresh_token.duration,duration_time_units,30d,v0.9.0)

Lifetime of a refresh token. A client uses a still-valid refresh token to obtain a new access token without the resource owner re-authenticating.

@[config](oauth2.refresh_token.limit,integer,25,v0.9.0)

Maximum number of refresh tokens held concurrently per user. Issuing beyond this limit retires the oldest outstanding token for that user.

@[config](oauth2.refresh_token.length,bytesize,40,v0.9.0)

::: warning Deprecated
This key has no effect in current releases and is kept only for backward compatibility with existing `bondy.conf` files — setting it neither errors nor changes refresh token behaviour.
:::

## Authentication: Ticket

@[config](security.ticket.authmethods,enum,all,v0.9.0)

Defines the a comma separated list of authentication methods that a
user can use to establish a session that is allowed to issue tickets to be
used with 'ticket' authentication.

The possible values are the names of the authentication methods:
- "cryptosign"
- "password"
- "ticket"
- "tls"
- "trust"
- "wamp-scram"
- "wampcra"

The option also allows a single value "all" in which case all the methods
above will be allowed.

::: info Notice
"anonymous" and "oauth2" methods are NOT allowed in this list as
they are incompatible with the idea of tickets.
:::

@[config](security.ticket.allow_not_found,on|off,on,v0.9.0)

Defines whether Bondy will allow a valid ticket to be used for
authentication when a local copy of the ticket has not been found in
storage. This might happen if the ticket data has not yet been synchronised
to the node handling the authentication request.


@[config](security.ticket.expiry_time,time_duration_units,30d,v0.9.0)

The default expiration time on or after which authentication ticket
MUST NOT be accepted for processing.


@[config](security.ticket.max_expiry_time,time_duration_units,30d,v0.9.0)

The maximum expiration time on or after which authentication ticket
MUST NOT be accepted for processing.

@[config](security.ticket.scope.local.persistence,on|off,on,v0.9.0)

Controls whether local scope tickets are persistent. If enabled the
ticket will be stored in Bondy's database. Otherwise the ticket is not
stored.

@[config](security.ticket.scope.sso.persistence,on|off,on,v0.9.0)

Controls whether SSO scope tickets are persistent. If enabled the
ticket will be stored in Bondy's database. Otherwise the ticket is not
stored.

@[config](security.ticket.scope.client_local.persistence,on|off,on,v0.9.0)

Controls whether client-local scope tickets are persistent. If enabled
the ticket will be stored in Bondy's database. Otherwise the ticket is not
stored.

@[config](security.ticket.scope.client_sso.persistence,on|off,on,v0.9.0)

Controls whether client-SSO scope tickets are persistent. If enabled the
ticket will be stored in Bondy's database. Otherwise the ticket is not
stored.

## Authentication: OIDC

OIDC providers are configured per realm, in the realm's `oidc_providers` property, and the login, callback and logout routes come from an `oidc` security scheme in an API Gateway specification. Those routes are served by every listener that exposes the `api_gateway` service. See [OIDC Authentication](/router/concepts/oidc_authentication) for both.

The `security.oidc.providers.*` keys below are accepted by the configuration schema, but this release does not read them. Setting them registers no provider and mounts no route.

@[config](security.oidc.providers.enabled,on|off,off,v1.0.0)

Accepted and stored in the node configuration. Nothing reads it.

@[config](security.oidc.providers.$provider_id.issuer,string,none,v1.0.0)

The provider's issuer URL. Do not set this key: the schema translation for `security.oidc.providers` has no case for `issuer`, so setting it makes configuration generation fail. The realm-level `issuer` property is the one that works.

@[config](security.oidc.providers.$provider_id.client_id,string,none,v1.0.0)

The OAuth2 client ID registered with the provider. Accepted and stored, not read.

@[config](security.oidc.providers.$provider_id.client_secret,string,none,v1.0.0)

The OAuth2 client secret. Accepted and stored, not read.

@[config](security.oidc.providers.$provider_id.login_path,string,none,v1.0.0)

A login path for the provider, for example `/oidc/aws_cognito/login`. Accepted and stored, not read. The login route that works is `<base_path>/oidc/login`, built from the API Gateway specification.

@[config](security.oidc.providers.$provider_id.redirect_path,string,none,v1.0.0)

A callback path for the provider, for example `/oidc/aws_cognito/callback`. Accepted and stored, not read. The callback route that works is `<base_path>/oidc/<provider>/callback`, built from the API Gateway specification.

## Token and Ticket Reclamation

Each node periodically deletes security state that can no longer be used: expired OAuth2 tokens and tickets, tokens and tickets of users that were deleted or disabled, and a user's OAuth2 tokens beyond [`oauth2.refresh_token.limit`](#oauth2.refresh_token.limit). Nothing else removes this state. It is bounded per user but never shrinks, so a user who never returns leaves it behind for good.

Each node sweeps only the realms it owns under Rendezvous hashing. The work spreads across the cluster with no coordination, and each realm has exactly one node deleting from it. The sweeps run as jobs on the [job manager](/router/reference/configuration/overload_protection#load_regulation.job_manager.pool.size), off the request path. If the job queue is full, the round is logged as a warning and retried after about five minutes, or after `security.reclamation.interval` if that is shorter.

This is not the same as [`db.reclaim`](/router/reference/configuration/reclamation). This sweep decides which tokens and tickets are dead and deletes them. `db.reclaim` later frees the storage the deleted entries occupy, once every node has seen the deletion.

@[config](security.reclamation.enabled,on|off,on,v1.0.0)

Whether the node runs the sweeps. Turn it off only if you would rather keep dead tokens and tickets than spend the periodic scan.

@[config](security.reclamation.interval,duration_time_units,6h,v1.0.0)

How often each node sweeps the realms it owns. Nothing waits on a sweep, so the value can be generous; the cost of a sweep grows with the number of tokens and tickets in the owned realms.

Each delay is brought forward by a random amount of up to 25% of this value. Every node schedules from the same value, and without that jitter a cluster restarted together would sweep in lockstep.

## Realm Static Configuration

@[config](security.config_file,path,'&#123;&#123;platform_etc_dir&#125;&#125;/security_config.json',v0.8.8)

The filename of a security JSON configuration file, which allows you to statically configure realms and its users, groups, sources and permissions.

Bondy Security can be completely configured dynamically via API, read more about this in the Security section.

This options is for those cases when you want to ensure a given configuration is applied every time Bondy restarts.

:::warning
Every node applies the security configuration on startup, persisting it to the embedded replica of the database. Eventually, when it joins a cluster, this will trigger an active anti-entropy exchange, synchronising the data with peer nodes.

Boot-time configuration application is declarative and idempotent: re-applying the same configuration on every boot no longer generates spurious replicated writes, and realm signing keys no longer regenerate on each boot (they live in their own union-merged structure, independent of the realm's identity hash).
:::

## Rate Limiting

Inbound rate limiting applies token-bucket limits on connection establishment, handshakes, authentication attempts, HTTP requests and WAMP messages, keyed by source IP (or by session, for messages). It is **off by default** and **fails open**: if the rate limiter process is not up, requests proceed unthrottled rather than being rejected. Each `rate` is tokens per second (steady-state); `capacity` is the burst size.

The keys on this page configure the **node** scope — budgets shared by every listener and realm on the node. Budgets also exist at two narrower scopes: per listener ([`listeners.$name.rate_limit.*`](/router/reference/configuration/listeners#rate-limiting)) and per realm (the realm's own `rate_limit` property, managed through the [realm admin APIs](/router/reference/wamp_api/realm) and the security configuration file — not through `bondy.conf`). A request is admitted only when **every** configured scope admits it, so narrower scopes can only tighten what the node allows. The model is described in [Understanding Load Regulation and Rate Limiting](/router/guides/administration/load_regulation_and_rate_limiting#rate-limiting-inbound-traffic).

::: tip Checking is cheap — refusing is not
The checks themselves are no reason to hold back: a budget that is never exceeded costs one lock-free atomic operation per configured scope per message — a single field read when nothing is configured — with no measurable effect on throughput or latency. The expensive outcome of rate limiting is a budget sized too tight for legitimate traffic. Size budgets for abuse, leave them enabled, and watch `bondy_rate_limited_total`; the [guide's scopes section](/router/guides/administration/load_regulation_and_rate_limiting#scopes-node-listener-realm) carries the full guidance.
:::

@[config](security.rate_limit.enabled,on|off,off,v1.0.0)

Master switch for **node-scope** inbound rate limiting. Listener and realm budgets are independent of it: each is enabled by its own configuration being present.

@[config](security.rate_limit.handshake.rate,integer,10,v1.0.0)

Token-bucket refill rate, in tokens per second, for `HELLO` (pre-authentication handshake) attempts per source IP.

@[config](security.rate_limit.handshake.capacity,integer,50,v1.0.0)

Burst size (bucket capacity) for the same `HELLO` limit.

@[config](security.rate_limit.auth.rate,integer,5,v1.0.0)

Token-bucket refill rate, in tokens per second, for `AUTHENTICATE` (credential verification) attempts per source IP.

@[config](security.rate_limit.auth.capacity,integer,20,v1.0.0)

Burst size (bucket capacity) for the same `AUTHENTICATE` limit.

@[config](security.rate_limit.connection.rate,integer,20,v1.0.0)

Token-bucket refill rate, in tokens per second, for new connections per source IP, applied at the transport handler before authentication.

@[config](security.rate_limit.connection.capacity,integer,100,v1.0.0)

Burst size (bucket capacity) for the same connection limit.

@[config](security.rate_limit.http.rate,integer,100,v1.0.0)

Token-bucket refill rate, in tokens per second, for HTTP requests per source IP — the API Gateway, Admin API and MCP endpoints. Requests, not connections, so it is a separate class from `connection`. Throttled requests answer `429` with a `retry-after` header.

@[config](security.rate_limit.http.capacity,integer,500,v1.0.0)

Burst size (bucket capacity) for the same HTTP request limit.

@[config](security.rate_limit.message.enabled,on|off,off,v1.0.0)

Separately opt-in from the other limits above, because it sits on the message hot path: when enabled, the per-session bucket is read once at session open and consumed with a single field read plus an atomics operation per message, so there is no configuration lookup per message.

@[config](security.rate_limit.message.rate,integer,1000,v1.0.0)

Token-bucket refill rate, in tokens per second, for `CALL`/`PUBLISH`/`SUBSCRIBE`/`REGISTER` messages per session.

@[config](security.rate_limit.message.capacity,integer,2000,v1.0.0)

Burst size (bucket capacity) for the same per-session message limit.

::: warning Topology-aware tuning
A source IP behind a shared NAT or reverse proxy is throttled collectively with every other client behind it. Keep limits generous unless you can confirm clients present distinct source IPs to Bondy — see [Trusted Proxies](/router/reference/configuration/listeners#trusted-proxies) for how the source IP itself is determined behind a proxy.
:::

## Realm Signing Keys

Realm private keys can be encrypted at rest (AES-256-GCM) using a master key resolved at boot. The keyring **fails closed**: if the master key is unavailable at boot, encrypted keys are not served.

@[config](security.master_key.provider,none&#124;env&#124;aws_sm,none,v1.0.0)

Enables encryption at rest and selects where the master key material comes from. `none` disables the feature (the default, matching pre-1.0.0 behaviour). `env` reads it from an environment variable; `aws_sm` reads it from AWS Secrets Manager.

@[config](security.master_key.env.var,string,none,v1.0.0)

Name of the environment variable holding the master key. Required when `provider = env`: there is no default, and an unset name leaves the key unresolvable, so Bondy refuses to encrypt or decrypt rather than fall back to plaintext. A base64-encoded 32-byte key can be generated with `openssl rand -base64 32`, for example into `BONDY_SECRET_KEY`.

@[config](security.master_key.aws_sm.secret_id,string,none,v1.0.0)

Secret identifier used to fetch the master key from AWS Secrets Manager, when `provider = aws_sm`.

@[config](security.master_key.aws_sm.region,string,none,v1.0.0)

AWS region of that secret.

@[config](security.master_key.aws_sm.field,string,none,v1.0.0)

Field name within the secret holding the key material.

@[config](security.master_key.encoding,raw&#124;base64,base64,v1.0.0)

How the resolved master key material is encoded. `base64` decodes it to raw bytes (expected 32); `raw` uses the bytes verbatim.

@[config](security.master_key.id,integer,1,v1.0.0)

The key id written into every new encryption envelope.

::: danger Do not change this on a node with encrypted data
Bondy resolves only the current key id. Envelopes written under any other id cannot be decrypted, so changing this value makes every realm key encrypted before the change unreadable. Master key rotation is not supported yet.
:::

::: warning Cluster-wide requirement
In a cluster, every node must resolve the **same** master key, or replicated realm keys will not decrypt on peers. Back the master key up out of band — losing it makes all encrypted realm keys permanently unrecoverable.
:::







