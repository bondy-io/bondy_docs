---
outline: [2,3]
---
# Certificate Manager

The Certificate Manager provides WAMP procedures for managing TLS certificates at runtime without restarting Bondy.

## Description

Bondy's certificate manager (`bondy_cert_manager`) centralises all TLS certificate operations:

- **CA trust store** -- merges CA certificates from the `certifi` Mozilla bundle, a user-configured PEM file (`cert_manager.cacertfile`), and the OS trust store. Used for all outbound TLS connections (OIDC providers, RPC Gateway HTTP backends, etc.).
- **Server certificates** -- manages per-listener TLS certificates (cert + key). Enables live certificate rotation via an `sni_fun` callback so new connections use updated certificates without listener restarts.
- **mTLS** -- per-listener client CA pools, `verify` mode, and `fail_if_no_peer_cert` settings for mutual TLS authentication.

### Live Certificate Rotation

When you rotate a server certificate, the change takes effect immediately for **new** TLS connections. Existing connections continue using the certificate that was active when the handshake occurred. This allows graceful rotation -- new connections get the new certificate, old connections finish naturally.

The typical workflow for certificate renewal:

1. An external process (certbot, internal CA, cron job) writes new certificate files to disk.
2. Call `bondy.cert_manager.rotate_listener` or `bondy.cert_manager.rotate_all` to reload them.
3. New connections immediately use the updated certificates.


## Procedures

|Name|URI|
|:---|:---|
|[Reload CA certificates](#reload-ca-certificates)|`bondy.cert_manager.reload_cacerts`|
|[Rotate listener certificate](#rotate-listener-certificate)|`bondy.cert_manager.rotate_listener`|
|[Rotate all certificates](#rotate-all-certificates)|`bondy.cert_manager.rotate_all`|
|[Get server certificate info](#get-server-certificate-info)|`bondy.cert_manager.get_server_cert_info`|
|[Set client auth](#set-client-auth)|`bondy.cert_manager.set_client_auth`|
|[Get client auth](#get-client-auth)|`bondy.cert_manager.get_client_auth`|


### Reload CA certificates

#### bondy.cert_manager.reload_cacerts() -> result() {.wamp-procedure}

Re-reads CA certificates from all configured sources (certifi bundle, user PEM file, OS trust store), deduplicates them, and updates the in-memory trust store. New outbound TLS connections will use the updated CA certificates.

#### Call

##### Positional Args
None.

##### Keyword Args
None.

#### Result

##### Positional Results
None.

##### Keyword Results
None.


---


### Rotate listener certificate

#### bondy.cert_manager.rotate_listener(listener) -> result() {.wamp-procedure}

Re-reads the certificate and key files from disk for the specified listener and updates the in-memory certificate store. New TLS handshakes on that listener will use the updated certificate.

Also calls `ranch:set_transport_options/2` to update the static certificate for clients that do not send SNI (Server Name Indication).

#### Call

##### Positional Args

<DataTreeView :maxDepth="10" :data="listener_arg"/>

##### Keyword Args
None.

#### Result

##### Positional Results
None.

##### Keyword Results
None.

#### Errors
- `wamp.error.invalid_argument` -- the listener reference is not a known TLS listener.


---


### Rotate all certificates

#### bondy.cert_manager.rotate_all() -> result() {.wamp-procedure}

Re-reads certificate files from disk for all known TLS listeners (`api_gateway_https`, `admin_api_https`, `wamp_tls`, `bridge_relay_tls`) and updates the in-memory certificate store.

Listeners that do not have certificates configured are silently skipped.

#### Call

##### Positional Args
None.

##### Keyword Args
None.

#### Result

##### Positional Results
None.

##### Keyword Results
None.


---


### Get server certificate info

#### bondy.cert_manager.get_server_cert_info(listener) -> result(cert_info) {.wamp-procedure}

Returns metadata about the currently loaded server certificate for a listener. The private key is never exposed.

#### Call

##### Positional Args

<DataTreeView :maxDepth="10" :data="listener_arg"/>

##### Keyword Args
None.

#### Result

##### Positional Results

<DataTreeView :maxDepth="10" :data="cert_info"/>

##### Keyword Results
None.

#### Errors
- `wamp.error.no_such_resource` -- no certificate is loaded for the given listener.


---


### Set client auth

#### bondy.cert_manager.set_client_auth(listener, options) -> result() {.wamp-procedure}

Sets the client certificate verification configuration for a listener. This enables or disables mutual TLS (mTLS) at runtime.

Updates take effect for new connections. Existing connections are not affected.

#### Call

##### Positional Args

<DataTreeView :maxDepth="10" :data="set_client_auth_args"/>

##### Keyword Args
None.

#### Result

##### Positional Results
None.

##### Keyword Results
None.


---


### Get client auth

#### bondy.cert_manager.get_client_auth(listener) -> result(mtls_config) {.wamp-procedure}

Returns the current mTLS configuration for a listener.

#### Call

##### Positional Args

<DataTreeView :maxDepth="10" :data="listener_arg"/>

##### Keyword Args
None.

#### Result

##### Positional Results

<DataTreeView :maxDepth="10" :data="mtls_config"/>

##### Keyword Results
None.

#### Errors
- `wamp.error.no_such_resource` -- no mTLS configuration exists for the given listener.


<script>
const listener_arg = {
    0: {
        type: "string",
        required: true,
        description: "The listener reference. One of: api_gateway_https, admin_api_https, wamp_tls, bridge_relay_tls."
    }
};

const cert_info_data = {
    0: {
        type: "object",
        required: true,
        description: "Certificate metadata.",
        properties: {
            subject: {
                type: "string",
                required: true,
                description: "The Common Name (CN) of the certificate subject."
            },
            issuer: {
                type: "string",
                required: true,
                description: "The Common Name (CN) of the certificate issuer."
            },
            not_before: {
                type: "string",
                required: true,
                description: "The certificate validity start time (ASN.1 time format)."
            },
            not_after: {
                type: "string",
                required: true,
                description: "The certificate validity end time (ASN.1 time format)."
            },
            serial: {
                type: "string",
                required: true,
                description: "The certificate serial number."
            }
        }
    }
};

const set_client_auth_args_data = {
    0: {
        type: "string",
        required: true,
        description: "The listener reference. One of: api_gateway_https, admin_api_https, wamp_tls, bridge_relay_tls."
    },
    1: {
        type: "object",
        required: true,
        description: "The mTLS configuration options.",
        properties: {
            verify: {
                type: "string",
                required: false,
                description: "The verification mode. Either verify_peer (require client certificate) or verify_none (no client certificate required)."
            },
            fail_if_no_peer_cert: {
                type: "boolean",
                required: false,
                description: "When verify is verify_peer, whether to reject connections where the client does not provide a certificate. Defaults to false."
            },
            cacertfile: {
                type: "string",
                required: false,
                description: "Path to a PEM file containing trusted CA certificates for verifying client certificates."
            }
        }
    }
};

const mtls_config_data = {
    0: {
        type: "object",
        required: true,
        description: "The current mTLS configuration for the listener.",
        properties: {
            verify: {
                type: "string",
                required: true,
                description: "The verification mode: verify_peer or verify_none."
            },
            fail_if_no_peer_cert: {
                type: "boolean",
                required: true,
                description: "Whether connections without a client certificate are rejected."
            },
            cacerts: {
                type: "array",
                required: false,
                description: "The list of trusted client CA certificates (DER-encoded). Present only when a client CA pool has been configured.",
                items: {
                    type: "string"
                }
            }
        }
    }
};

export default {
    data() {
        return {
            listener_arg: JSON.stringify(listener_arg),
            cert_info: JSON.stringify(cert_info_data),
            set_client_auth_args: JSON.stringify(set_client_auth_args_data),
            mtls_config: JSON.stringify(mtls_config_data),
        }
    }
};
</script>
