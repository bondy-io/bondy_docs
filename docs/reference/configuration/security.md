# Security Configuration Reference

## General

@[config](security.allow_anonymous_user,on|off,on,v0.8.8)

Defines whether Bondy allows the `anonymous` user.

::: warning
We strongly recommend disabling anonymous for production use or at least restrict the network locations from which an anonymous connection can be established. See [Source](/reference/wamp_api/source) API documentation reference.

Notice that disabling the anonymous disables the `anonymous` authentication method as an option for Authentication and Authorization.
:::

@[config](security.automatically_create_realms,on|off,off,v0.8.8)

Defines whether Bondy creates a new realm when a session wants to attach to a non existing realm.

::: warning
We strongly recommend to disable this option and only enable it for development or testing purposes.
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


@[config](security.password.min_length,6..254,6,v0.9.0)

Defines the minimum length for newly created passwords. The value
should be at least 6 and at most 254.


@[config](security.password.max_length,6..254,6,v0.9.0)

Defines the maximum length for newly created passwords. The value should be at least 6 and at most 254.


@[config](security.password.scram.kdf,pbkdf2|argon2id13,pbkdf2,v0.9.0)

Defines the default key derivation function (KDF) to be used with SCRAM.


@[config](security.password.cra.kdf,pbkdf2,pbkdf2,v0.9.0)

Defines the default key derivation function (KDF) to be used with CRA. The only option is pbkdf2.


@[config](security.password.pbkdf2.iterations,4096..65536,1000,v0.9.0)

Defines the default number of iterations to be used with the pbkdf2 key
derivation function. It should be an integer in the range 4096..65536.

@[config](security.password.argon2id13.iterations,alias|4096..4294967295,moderate,v0.9.0)

Defines the default iterations to be used with the argon2id13 key
derivation function. It should be an integer in the range 4096..4294967295
or one of the following named alias configuration:
- `interactive` (2)
- `moderate` (3)
- `sensitive` (4)


@[config](security.password.argon2id13.memory,alias|8192..1073741824,interactive,v0.9.0)

Defines the default memory to be used with the argon2id13 key
derivation function. It should be an integer in the range 8192..1073741824
or a named alias configuration:
- `interactive` (64MB)
- `moderate` (256MB)
- `sensitive` (1GB)

::: info Notice
The underlying library allows up to 4398046510080 (3.9 TB), but Bondy
restricts this value so that a configuration error cannot itself become a
DoS vector.
:::


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

Inbound rate limiting applies token-bucket limits on connection establishment, handshakes, and authentication attempts, keyed by source IP. It is **off by default** and **fails open**: if the rate limiter process is not up, requests proceed unthrottled rather than being rejected. Each `rate` is tokens per second (steady-state); `capacity` is the burst size.

@[config](security.rate_limit.enabled,on|off,off,v1.0.0)

Master switch for inbound rate limiting.

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

@[config](security.rate_limit.message.enabled,on|off,off,v1.0.0)

Separately opt-in from the other limits above, because it sits on the message hot path: when enabled, the per-session bucket is read once at session open and consumed with a single field read plus an atomics operation per message, so there is no configuration lookup per message.

@[config](security.rate_limit.message.rate,integer,1000,v1.0.0)

Token-bucket refill rate, in tokens per second, for `CALL`/`PUBLISH`/`SUBSCRIBE`/`REGISTER` messages per session.

@[config](security.rate_limit.message.capacity,integer,2000,v1.0.0)

Burst size (bucket capacity) for the same per-session message limit.

::: warning Topology-aware tuning
A source IP behind a shared NAT or reverse proxy is throttled collectively with every other client behind it. Keep limits generous unless you can confirm clients present distinct source IPs to Bondy — see [Trusted Proxies](/reference/configuration/listeners#trusted-proxies-x-forwarded-for) for how the source IP itself is determined behind a proxy.
:::

## Realm Signing Keys

Realm private keys can be encrypted at rest (AES-256-GCM) using a master key resolved at boot. The keyring **fails closed**: if the master key is unavailable at boot, encrypted keys are not served.

@[config](security.master_key.provider,none&#124;env&#124;aws_sm,none,v1.0.0)

Enables encryption at rest and selects where the master key material comes from. `none` disables the feature (the default, matching pre-1.0.0 behaviour). `env` reads it from an environment variable; `aws_sm` reads it from AWS Secrets Manager.

@[config](security.master_key.env.var,string,BONDY_SECRET_KEY,v1.0.0)

Name of the environment variable holding the master key, when `provider = env`. A base64-encoded 32-byte key can be generated with `openssl rand -base64 32`.

@[config](security.master_key.aws_sm.secret_id,string,bondy/master_key,v1.0.0)

Secret identifier used to fetch the master key from AWS Secrets Manager, when `provider = aws_sm`.

@[config](security.master_key.aws_sm.region,string,us-east-1,v1.0.0)

AWS region of that secret.

@[config](security.master_key.aws_sm.field,string,master_key,v1.0.0)

Field name within the secret holding the key material.

@[config](security.master_key.encoding,raw&#124;base64,base64,v1.0.0)

How the resolved master key material is encoded. `base64` decodes it to raw bytes (expected 32); `raw` uses the bytes verbatim.

@[config](security.master_key.id,integer,1,v1.0.0)

The key id baked into new encryption envelopes. Bump this on rotation.

::: warning Cluster-wide requirement
In a cluster, every node must resolve the **same** master key, or replicated realm keys will not decrypt on peers. Back the master key up out of band — losing it makes all encrypted realm keys permanently unrecoverable.
:::







