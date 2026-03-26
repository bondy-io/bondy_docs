# Certificate Manager Configuration Reference

Configure the central TLS certificate manager that handles CA trust, server certificates, and mTLS for all Bondy network connections.

## CA Trust Store

@[config](cert_manager.cacertfile,path,N/A,v1.0.0-rc.54)

Path to a PEM file containing additional trusted CA certificates for outbound TLS connections (OIDC providers, RPC Gateway HTTP backends, etc.).

These certificates are merged with the [certifi](https://hex.pm/packages/certifi) Mozilla CA bundle and (when available) the OS trust store. The merged, deduplicated set is used by all outbound HTTPS connections that Bondy initiates.

If not set, Bondy will try to use the `api_gateway.https.cacertfile` value as a fallback.

::: tip
Use this option when Bondy needs to trust certificates signed by an internal CA or a development CA like [mkcert](https://github.com/FiloSottile/mkcert). The configured PEM file is read at startup and can be reloaded at runtime via the `bondy.cert_manager.reload_cacerts` [WAMP procedure](/reference/wamp_api/cert_manager#reload-ca-certificates).
:::


## Listener mTLS

The following options enable mutual TLS (client certificate verification) on individual listeners. When `verify` is set to `verify_peer`, connecting clients must present a valid certificate signed by a CA in the listener's trust chain.

These options can also be updated at runtime via the `bondy.cert_manager.set_client_auth` [WAMP procedure](/reference/wamp_api/cert_manager#set-client-auth).


### API Gateway HTTPS

@[config](api_gateway.https.verify,verify_peer|verify_none,verify_none,v1.0.0-rc.54)

SSL verification mode for API Gateway HTTPS connections. Set to `verify_peer` to require client certificates (mTLS).

@[config](api_gateway.https.fail_if_no_peer_cert,on|off,off,v1.0.0-rc.54)

Whether to reject connections where the client does not provide a certificate when `verify` is set to `verify_peer`.


### Admin API HTTPS

@[config](admin_api.https.verify,verify_peer|verify_none,verify_none,v1.0.0-rc.54)

SSL verification mode for Admin API HTTPS connections. Set to `verify_peer` to require client certificates (mTLS).

@[config](admin_api.https.fail_if_no_peer_cert,on|off,off,v1.0.0-rc.54)

Whether to reject connections where the client does not provide a certificate when `verify` is set to `verify_peer`.


### WAMP TLS

@[config](wamp.tls.verify,verify_peer|verify_none,verify_none,v0.8.8)

SSL verification mode for WAMP TLS connections. Set to `verify_peer` to require client certificates (mTLS).

@[config](wamp.tls.fail_if_no_peer_cert,on|off,off,v1.0.0-rc.54)

Whether to reject connections where the client does not provide a certificate when `verify` is set to `verify_peer`.
