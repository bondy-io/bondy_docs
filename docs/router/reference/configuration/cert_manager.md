# Certificate Manager Configuration Reference

Configure the central TLS certificate manager that handles CA trust, server certificates, and mTLS for all Bondy network connections.

## CA Trust Store

@[config](cert_manager.cacertfile,path,N/A,v1.0.0-rc.54)

Path to a PEM file containing additional trusted CA certificates for outbound TLS connections (OIDC providers, HTTP Connector backends, etc.).

These certificates are merged with the [certifi](https://hex.pm/packages/certifi) Mozilla CA bundle and (when available) the OS trust store. The merged, deduplicated set is used by all outbound HTTPS connections that Bondy initiates. If not set, only those two sources are used — a listener's own `listeners.$name.tls.cacertfile` is **not** consulted, because that anchors verification of inbound clients on one socket, not Bondy's own outbound trust.

::: tip
Use this option when Bondy needs to trust certificates signed by an internal CA or a development CA like [mkcert](https://github.com/FiloSottile/mkcert). The configured PEM file is read at startup and can be reloaded at runtime via the `bondy.cert_manager.reload_cacerts` [WAMP procedure](/router/reference/wamp_api/cert_manager#reload-ca-certificates).
:::


## Listener mTLS

Mutual TLS (client certificate verification) is configured **per
listener**, in the listener's own TLS block — see
[TLS material](/router/reference/configuration/listeners#tls-material) in
the Network Listeners reference:

```
listeners.public_wamp_tls.tls.verify               = verify_peer
listeners.public_wamp_tls.tls.cacertfile           = /path/to/cacert.pem
listeners.public_wamp_tls.tls.fail_if_no_peer_cert = on
```

`verify = verify_peer` on its own only *requests* a client certificate — a
client presenting none still connects. Requiring one takes
`fail_if_no_peer_cert = on` as well.

These options can also be updated at runtime via the
`bondy.cert_manager.set_client_auth`
[WAMP procedure](/router/reference/wamp_api/cert_manager#set-client-auth).

@[configDeprecated](api_gateway.https.verify,listeners.$name.tls.verify,v1.0.0)

@[configDeprecated](admin_api.https.verify,listeners.$name.tls.verify,v1.0.0)

@[configDeprecated](wamp.tls.verify,listeners.$name.tls.verify,v1.0.0)

@[configDeprecated](wamp.tls.fail_if_no_peer_cert,listeners.$name.tls.fail_if_no_peer_cert,v1.0.0)

The removed per-scheme spellings (`api_gateway.https.*`,
`admin_api.https.*`, `wamp.tls.*`) are no longer read — see
[Migrating from the pre-1.0 keys](/router/reference/configuration/listeners#migrating-from-the-pre-1-0-keys).
