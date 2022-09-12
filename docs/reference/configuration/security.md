# Security Configuration Reference

## General

@[config](security.allow_anonymous_user, on | off, on, v0.8.8)

Defines whether Bondy allows the `anonymous` user.

::: warning
We strongly recommend disabling anonymous for production use or at least restrict the network locations from which an anonymous connection can be established. See [Source](/reference/wamp_api/source) API documentation reference.
:::

@[config](security.automatically_create_realms,on | off, off, v0.8.8)

Defines whether Bondy creates a new realm when a session wants to attach to a non existing realm.

## Static Configuration

@[config](security.config_file, path, '&#123;&#123;platform_etc_dir&#125;&#125;/security_config.json', v0.8.8)

The filename of a security JSON configuration file, which allows you to statically configure realms and its users, groups, sources and permissions. Bondy Security can be completely configured dynamically via API, read more about this in the Security section. This file is for those cases when you want to ensure a given configuration is applied every time Bondy restarts.

## Password options


@[config](security.password.protocol, cra | scram, cra, v0.9.0)

Defines the default password protocol to be used for new user password
creation. Notice the user API allows a caller to define the protocol to be
used. This default is used when the caller does not specify a protocol.



@[config](security.password.protocol.upgrade.enabled, on | off, off, v0.9.0)

Controls whether a password protocol upgrade is performed during
password migrations. A password migration occurs when Bondy changes the
internal representation of the password object to accommodate new protocols,
features or bug fixes. Normally some of this changes can be done without
user input, but when these changes include a re-calculation of the salted
hash they can only happend during authentication or when the user changes
the password.

If this option is set to `on`, then Bondy will try to upgrade the password
protocol of an existing password to the protocol defined by the
`security.password.protocol` option using the defaul parameters defined in
the `security.password.{SelectedProtocol}.{Option}` options.


@[config](security.password.min_length,6..254, 6, v0.9.0)

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

@[config](security.password.argon2id13.iterations, alias|4096..4294967295,moderate,v0.9.0)

Defines the default iterations to be used with the argon2id13 key
derivation function. It should be an integer in the range 4096..4294967295
or one of the following named alias configuration:
- `interactive` (2)
- `moderate` (3)
- `sensitive` (4)


@[config](security.password.argon2id13.memory, alias|8192..1073741824,interactive,v0.9.0)

Defines the default memory to be used with the argon2id13 key
derivation function. It should be an integer in the range 8192..1073741824
or a named alias configuration:
- `interactive` (64MB)
- `moderate` (256MB)
- `sensitive` (1GB)

::: info Notice
The underlying library allows up to 4398046510080 (3.9 TB)
but we have restricted this value to avoid a configuration error to enable a
DoS attack.
:::


## Authentication: OAuth2

@[config](oauth2.client_credentials_grant.duration)

@[config](oauth2.code_grant.duration)

@[config](oauth2.config_file)

@[config](oauth2.password_grant.duration)

@[config](oauth2.refresh_token.duration)

@[config](oauth2.refresh_token.length)



## Authentication: Ticket

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

@[config](security.ticket.allow_not_found,on|off,on,v0.9.0)

Defines whether Bondy will allow a valid ticket to be used for
authentication when a local copy of the ticket has not been found in
storage. This might happen if the ticket data has not yet been syncrhonised
to the node handling the authentication request.

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








