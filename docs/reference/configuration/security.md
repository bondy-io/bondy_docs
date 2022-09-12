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


@[config](security.password.max_length,6..254, 6, v0.9.0)

Defines the maximum length for newly created passwords. The value should be at least 6 and at most 254.

## Authentication: OAuth2

@[config](oauth2.client_credentials_grant.duration)

@[config](oauth2.code_grant.duration)

@[config](oauth2.config_file)

@[config](oauth2.password_grant.duration)

@[config](oauth2.refresh_token.duration)

@[config](oauth2.refresh_token.length)



## Authentication: Ticket






