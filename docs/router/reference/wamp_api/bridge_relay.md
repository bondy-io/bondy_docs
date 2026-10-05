---
outline: [2,3]
related:
    - text: Bondy Edge (Bridge Relay)
      type: Concept
      link: /router/concepts/bridge_relay
      description: What a bridge relay is, why it exists, and what actually happens when one connects.
---
# Bridge Relay (Edge)
The WAMP procedures for managing bridge relays (Bondy Edge connections) at runtime — adding, removing, starting, stopping, and checking the status of a bridge. For what a bridge relay is, why it's distinct from clustering, and what syncs (and doesn't yet sync) when one connects, see [Bondy Edge (Bridge Relay)](/router/concepts/bridge_relay).

## Types
### input_data(){.datatype}
A Bridge Relay object configuration has the following properties:

<DataTreeView :data="inputCreateData" :maxDepth="10" />

## Procedures
The following wamp api is used to configure and manage the proper Edge:

|Name|URI|
|:---|:---|
|[Add a bridge](#add-a-bridge)|`bondy.router.bridge.add`|
|[Remove a bridge](#remove-a-bridge)|`bondy.router.bridge.remove`|
|[Start a bridge](#start-a-bridge)|`bondy.router.bridge.start`|
|[Stop a bridge](#stop-a-bridge)|`bondy.router.bridge.stop`|
|[Retrieve a bridge](#retrieve-a-bridge)|`bondy.router.bridge.get`|
|[List all bridges](#list-all-bridges)|`bondy.router.bridge.list`|
|[Check status of a bridge](#check-status-of-a-bridge)|`bondy.router.bridge.status`|
|[Check spec of a bridge](#check-spec-of-a-bridge)|`bondy.router.bridge.check_spec`|

### Add a bridge
##### bondy.router.bridge.add(input_data()) -> bridge() {.wamp-procedure}
Adds a Bridge Relay specification and optionally starts the bridge.

#### Call

##### Positional Args
<DataTreeView :data="createArgs" :maxDepth="10" />

##### Keyword Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'autostart':{
			'type': 'boolean',
			'required': false,
			'description' : 'If true immediately starts the bridge, otherwise the bridge should be started using bondy.router.bridge.start procedure.'
		}
	})"
/>

#### Result

##### Positional Results
<DataTreeView :data="createResult" :maxDepth="10" />

##### Keyword Results
None.

#### Errors

* [bondy.error.already_exists](/router/reference/wamp_api/errors/already_exists): when the provided bridge name already exists.

#### Example

::: code-group

```bash [Call]
./wick --url ws://localhost:19080/ws \
--realm com.leapsight.bondy \
call bondy.router.bridge.add \
'{
    "name": "edge_test",
    "endpoint": "127.0.0.1:18093",
    "transport": "tls",
    "realms": [
        {
            "uri": "com.leapsight.test",
            "authid": "device1",
            "cryptosign": {
                "pubkey": "1766c9e6ec7d7b354fd7a2e4542753a23cae0b901228305621e5b8713299ccdd",
                "privkey": "4ffddd896a530ce5ee8c86b83b0d31835490a97a9cd718cb2f09c9fd31c4a7d71766c9e6ec7d7b354fd7a2e4542753a23cae0b901228305621e5b8713299ccdd"
            }
        }
    ],
    "reconnect": {"enabled":true},
    "ping": {"enabled":true}
}' --kwarg autostart=true | jq
```
```json [Result]
{
  "connect_timeout": 5000,
  "enabled": false,
  "endpoint": "127.0.0.1:18093",
  "idle_timeout": 86400000,
  "max_frame_size": "infinity",
  "name": "edge_test",
  "parallelism": 1,
  "ping": {
    "enabled": true,
    "idle_timeout": 20000,
    "max_attemps": 2,
    "timeout": 10000
  },
  "realms": [
    {
      "authid": "device1",
      "cryptosign": {
        "privkey": "4ffddd896a530ce5ee8c86b83b0d31835490a97a9cd718cb2f09c9fd31c4a7d71766c9e6ec7d7b354fd7a2e4542753a23cae0b901228305621e5b8713299ccdd",
        "pubkey": "1766c9e6ec7d7b354fd7a2e4542753a23cae0b901228305621e5b8713299ccdd"
      },
      "procedures": [],
      "topics": [],
      "uri": "com.leapsight.test"
    }
  ],
  "reconnect": {
    "backoff_max": 60000,
    "backoff_min": 5000,
    "backoff_type": "jitter",
    "enabled": true,
    "max_retries": 100
  },
  "restart": "transient",
  "socket_opts": {
    "keepalive": true,
    "nodelay": true
  },
  "tls_opts": {
    "verify": "verify_none"
  },
  "transport": "tls",
  "type": "bridge_relay",
  "version": "1.0"
}
```
:::



### Remove a bridge
##### bondy.router.bridge.remove(name) {.wamp-procedure}
Removes the definition of a bridge from the bridge manager.

Returns an error if undefined or if the bridge is running, but no errors if the bridge doesn't exist or it is removed successfully.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The name of the bridge.'
		}
	})"
/>

##### Keyword Args
None.

#### Result

##### Positional Results
None.

##### Keyword Results
None.

#### Errors

* [bondy.error.running](/router/reference/wamp_api/errors/running): when the bridge is running or restarting — stop it first.

#### Example

::: code-group

```bash [Call]
./wick --url ws://localhost:19080/ws \
--realm com.leapsight.bondy \
call bondy.router.bridge.remove "edge_test"
```

```json [Response]
```
:::

### Start a bridge
##### bondy.router.bridge.start(name()) {.wamp-procedure}
Starts a bridge which has already been defined using `bondy.router.bridge.add`.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The name of the bridge.'
		}
	})"
/>

##### Keyword Args
None.

#### Result

##### Positional Results
None.

##### Keyword Results
None.

#### Errors

* [bondy.error.not_found](/router/reference/wamp_api/errors/not_found): when the provided bridge name is not found.
* [wamp.error.invalid_argument](/router/reference/wamp_api/errors/wamp_invalid_argument): when there are an invalid number of positional arguments.
* [bondy.error.unknown_error](/router/reference/wamp_api/errors/unknown_error): when the bridge fails to start for a reason that doesn't map to a more specific error.

#### Examples

::: details Success Call
- Request
```bash
./wick --url ws://localhost:19080/ws \
--realm com.leapsight.bondy \
call bondy.router.bridge.start "edge_test"
```
:::

### Stop a bridge
##### bondy.router.bridge.stop(name()) {.wamp-procedure}
Stops an existing running bridge.

Returns an error if the bridge is not running or undefined.

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The name of the bridge.'
		}
	})"
/>

##### Keyword Args
None.

#### Result

##### Positional Results
None.

##### Keyword Results
None.

#### Errors

* [bondy.error.not_found](/router/reference/wamp_api/errors/not_found): when the provided bridge name is not found or not running.
* [wamp.error.invalid_argument](/router/reference/wamp_api/errors/wamp_invalid_argument): when there are an invalid number of positional arguments.

#### Examples

::: details Success Call
- Request
```bash
./wick --url ws://localhost:19080/ws \
--realm com.leapsight.bondy \
call bondy.router.bridge.stop "edge_test"
```
:::

### Retrieve a bridge
##### bondy.router.bridge.get(name()) -> bridge() {.wamp-procedure}
Retrieves a Bridge Object specification by name

#### Call

##### Positional Args
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		'0':{
			'type': 'string',
			'required': true,
			'description' : 'The name of the bridge.'
		}
	})"
/>

##### Keyword Args
None.

#### Result

##### Positional Results
<DataTreeView :data="createResult" :maxDepth="10" />

##### Keyword Results
None.

#### Errors

* [bondy.error.not_found](/router/reference/wamp_api/errors/not_found): when the provided bridge name is not found.
* [wamp.error.invalid_argument](/router/reference/wamp_api/errors/wamp_invalid_argument): when there are an invalid number of positional arguments.

#### Examples

::: details Success Call
- Request
```bash
./wick --url ws://localhost:19080/ws \
--realm com.leapsight.bondy \
call bondy.router.bridge.get "edge_test" | jq
```
- Response:
```json
{
  "connect_timeout": 5000,
  "enabled": false,
  "endpoint": "127.0.0.1:18093",
  "hibernate": "idle",
  "idle_timeout": 86400000,
  "max_frame_size": "infinity",
  "name": "edge_test",
  "network_timeout": 30000,
  "parallelism": 1,
  "ping": {
    "enabled": true,
    "idle_timeout": 20000,
    "max_attempts": 2,
    "timeout": 10000
  },
  "realms": [
    {
      "authid": "device1",
      "cryptosign": {
        "privkey": "4ffddd896a530ce5ee8c86b83b0d31835490a97a9cd718cb2f09c9fd31c4a7d71766c9e6ec7d7b354fd7a2e4542753a23cae0b901228305621e5b8713299ccdd",
        "pubkey": "1766c9e6ec7d7b354fd7a2e4542753a23cae0b901228305621e5b8713299ccdd"
      },
      "procedures": [],
      "topics": [],
      "uri": "com.leapsight.test"
    }
  ],
  "reconnect": {
    "backoff_max": 60000,
    "backoff_min": 5000,
    "backoff_type": "jitter",
    "enabled": true,
    "max_retries": 100
  },
  "restart": "transient",
  "socket_opts": {
    "keepalive": true,
    "nodelay": true
  },
  "tls_opts": {
    "verify": "verify_none"
  },
  "transport": "tls",
  "type": "bridge_relay",
  "version": "1.0"
}
```
:::

### List all bridges
##### bondy.router.bridge.list() -> [bridge()] {.wamp-procedure}
Returns a list of all installed bridges in the system.

#### Call

##### Positional Args
None.

##### Keyword Args
None.

#### Result

##### Positional Results
<DataTreeView :data="listResult" :maxDepth="10" />

##### Keyword Results
None.

#### Errors

#### Examples

::: details Success Call
- Request
```bash
./wick --url ws://localhost:19080/ws \
--realm com.leapsight.bondy \
call bondy.router.bridge.list | jq
```
- Response:
```json
[
    {
        "connect_timeout": 5000,
        "enabled": false,
        "endpoint": "127.0.0.1:18093",
        "hibernate": "idle",
        "idle_timeout": 86400000,
        "max_frame_size": "infinity",
        "name": "edge_test",
        "network_timeout": 30000,
        "parallelism": 1,
        "ping": {
            "enabled": true,
            "idle_timeout": 20000,
            "max_attempts": 2,
            "timeout": 10000
        },
        "realms": [
            {
                "authid": "device1",
                "cryptosign": {
                    "privkey": "4ffddd896a530ce5ee8c86b83b0d31835490a97a9cd718cb2f09c9fd31c4a7d71766c9e6ec7d7b354fd7a2e4542753a23cae0b901228305621e5b8713299ccdd",
                    "pubkey": "1766c9e6ec7d7b354fd7a2e4542753a23cae0b901228305621e5b8713299ccdd"
                },
                "procedures": [],
                "topics": [],
                "uri": "com.leapsight.test"
            }
        ],
        "reconnect": {
            "backoff_max": 60000,
            "backoff_min": 5000,
            "backoff_type": "jitter",
            "enabled": true,
            "max_retries": 100
        },
        "restart": "transient",
        "socket_opts": {
            "keepalive": true,
            "nodelay": true
        },
        "tls_opts": {
            "verify": "verify_none"
        },
        "transport": "tls",
        "type": "bridge_relay",
        "version": "1.0"
    }
]
```
:::

### Check status of a bridge
##### bondy.router.bridge.status() -> bridgeStatus() {.wamp-procedure}
Returns an object where the key is an installed bridge name and the value is the bridge status object.

The status object has the following properties:

- **status** — The status of the bridge it can be:
    - `not_started`: The bridge was added but never started since the Bondy node started
    - `stopped`: The bridge was stopped
    - `restarting`: The bridge crashes and the supervisor is restarting it
    - `running`: The bridge is running

#### Call

##### Positional Args
None.

##### Keyword Args
None.

#### Result

##### Positional Results
<DataTreeView :data="bridgeStatus" :maxDepth="10" />

##### Keyword Results
None.

#### Errors

#### Examples

::: details Success Call
- Request
```bash
./wick --url ws://localhost:19080/ws \
--realm com.leapsight.bondy \
call bondy.router.bridge.status | jq
```
- Response:
```json
{
    "edge_test": {
        "status": "not_started"
    }
}
```
:::

### Check spec of a bridge
##### bondy.router.bridge.check_spec(input()) -> bridge() {.wamp-procedure}
Checks the validity of a Bridge Relay Object.

#### Call

##### Positional Args
<DataTreeView :data="createArgs" :maxDepth="10" />

##### Keyword Args
None.

#### Result

##### Positional Results
<DataTreeView :data="createResult" :maxDepth="10" />

##### Keyword Results
None.

#### Errors

* [bondy.error.missing_required_value](/router/reference/wamp_api/errors/missing_required_value): when a required value is not provided.
* [bondy.error.invalid_datatype](/router/reference/wamp_api/errors/invalid_datatype): when the data type is invalid.
* [bondy.error.invalid_value](/router/reference/wamp_api/errors/invalid_value): when the data value is invalid.
* [bondy.error.invalid_data](/router/reference/wamp_api/errors/invalid_data): when the data values are invalid.

#### Examples

::: details Success Call
- Request
```bash
./wick --url ws://localhost:19080/ws \
--realm com.leapsight.bondy \
call bondy.router.bridge.check_spec \
'{
    "name": "edge_test",
    "endpoint": "127.0.0.1:18093",
    "realms": [
        {
            "uri": "com.leapsight.test",
            "authid": "device1",
            "cryptosign": {
                "pubkey": "1766c9e6ec7d7b354fd7a2e4542753a23cae0b901228305621e5b8713299ccdd",
                "privkey": "4ffddd896a530ce5ee8c86b83b0d31835490a97a9cd718cb2f09c9fd31c4a7d71766c9e6ec7d7b354fd7a2e4542753a23cae0b901228305621e5b8713299ccdd"
            }
        }
    ]
}' | jq
```
- Response:
```json
{
  "connect_timeout": 5000,
  "enabled": false,
  "endpoint": "127.0.0.1:18093",
  "idle_timeout": 86400000,
  "max_frame_size": "infinity",
  "name": "edge_test",
  "parallelism": 1,
  "ping": {},
  "realms": [
    {
      "authid": "device1",
      "cryptosign": {
        "privkey": "4ffddd896a530ce5ee8c86b83b0d31835490a97a9cd718cb2f09c9fd31c4a7d71766c9e6ec7d7b354fd7a2e4542753a23cae0b901228305621e5b8713299ccdd",
        "pubkey": "1766c9e6ec7d7b354fd7a2e4542753a23cae0b901228305621e5b8713299ccdd"
      },
      "procedures": [],
      "topics": [],
      "uri": "com.leapsight.test"
    }
  ],
  "reconnect": {},
  "restart": "transient",
  "socket_opts": {
    "keepalive": true,
    "nodelay": true
  },
  "tls_opts": {
    "verify": "verify_none"
  },
  "transport": "tcp",
  "type": "bridge_relay",
  "version": "1.0"
}
```
:::

<script>
const bridgeStatus = {
    "status": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "The status of the bridge."
    }
};

const actionSpec = {
    "uri": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "The procedure uri."
    },
    "match": {
        "type": "string",
        "required": false,
        "mutable": false,
        "description": "Allowed values: exact, prefix and wildcard.",
        "default": "exact"
    },
    "direction": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "Allowed values: out, in and both.",
        "default": '"out"'
    }
};

const topicActionSpec = {...actionSpec};
const procedureActionSpec = {...actionSpec,
    "registration": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "Allowed values: static, dynamic."
    }};

const bridgeData = {
    "name": {
		"type": "string",
		"required": true,
		"mutable": false,
		"description": "The name to be use as unique identifier for the bridge."
	},
    "enabled": {
        "type": "boolean",
        "required": true,
		"mutable": true,
		"description": "Whether the bridge is enabled.",
        "default": "`false`"
    },
    "endpoint": {
        "type": "required",
        "required": true,
		"mutable": true,
		"description": "The IP Address or Hostname and port e.g `myhost:9075`"
    },
    "transport": {
        "type": "string",
        "required": true,
		"mutable": false,
		"description": "The connection transport. The allowed values are: `tls` and `tcp`.",
        "default": '"tcp"'
    },
    "tls_opts": {
        "type": "object",
        "required": true,
		"mutable": false,
		"description": "Client certificate.",
        "properties": {
            "versions": {
                "type": "array",
                "required": true,
                "mutable": false,
                "description": "Containing the TLS versions supported. The versions are: 1.2 or 1.3.",
                "items": {
                    "type": "string"
                },
                "default": '["tlsv1.3"]'
            },
            "verify": {
                "type": "string",
                "required": true,
                "mutable": false,
                "description": "The allowed values are: verify_peer and verify_none.",
                "default": '"verify_none"'
            },
            "certfile": {
                "type": "string",
                "required": false,
                "mutable": false,
                "description": "The path to the cert file."
            },
            "keyfile": {
                "type": "string",
                "required": false,
                "mutable": false,
                "description": "The path to the key file."
            },
            "cacertfile": {
                "type": "string",
                "required": false,
                "mutable": false,
                "description": "The path to the cacertfile file."
            }
        },
        "default": {
            "verify": "verify_none"
        }
    },
    "socket_opts": {
        "type": "object",
        "required": true,
		"mutable": false,
		"description": "Socket options.",
        "properties": {
            "keepalive": {
                "type": "boolean",
                "required": true,
                "default": "`true`"
            },
            "nodelay": {
                "type": "boolean",
                "required": true,
                "mutable": true
            },
            "sndbuf": {
                "type": "integer",
                "required": false
            },
            "recbuf": {
                "type": "integer",
                "required": false
            },
            "buffer": {
                "type": "integer",
                "required": false
            }
        },
        "default": '{"keepalive": true, "nodelay": true}'
    },
    "parallelism": {
        "type": "integer",
        "required": true,
		"mutable": false,
		"description": "Parallelism.",
        "default": "`1`"
    },
    "restart": {
        "type": "string",
        "required": true,
		"mutable": false,
		"description": "Defines when a terminated bridge must be restarted. The allowed values are: `permanent` and `transient`. \n* A `permanent` bridge is always restarted, even after recovering from a Bondy node crash or when the node is manually stopped and re-started. Bondy persists the configuration of permanent bridges in the database and reads them during startup.\n* A `transient` bridge is restarted only if it terminated abnormally. In case of a node crash or manually stopped and re-started they will not be restarted.",
        "default": "transient"
    },
    "idle_timeout": {
        "type": "integer | infinity",
        "required": true,
		"mutable": false,
		"description": "Time in milliseconds that Bondy will allow for a connection with no activity to be kept alive. Bondy will close the connection after this time.",
        "default": "86400000 (24 hs)"
    },
    "hibernate": {
        "type": "string",
        "required": true,
		"mutable": false,
		"description": "Allowed values: never, idle and always.",
        "default": "idle"
    },
    "connect_timeout": {
        "type": "integer | infinity",
        "required": true,
		"mutable": false,
		"description": "TCP connection timeout in milliseconds.",
        "default": "5000"
    },
    "network_timeout": {
        "type": "integer | infinity",
        "required": true,
		"mutable": false,
		"description": "Time in milliseconds that Bondy will wait for a network connected event. When a connection is dropped, Bondy Bridge Relay connection will wait for the host to have at least one non-loopback network interface address to be available before starting a connection retry. \n\nThis is mainly to avoid logging failed connection attempts when Bondy knows there is no network interface address available.",
        "default": "30000"
    },
    "max_frame_size": {
        "type": "integer | infinity",
        "required": true,
		"mutable": false,
		"description": "The maximum frame size in bytes. ",
        "default": "infinity"
    },
    "reconnect": {
        "type": "object",
        "required": true,
		"mutable": false,
		"description": "Enables or disables the reconnect feature. Once a connection is established but fails due to an unknown error or by the connecting being aborted by the remote with an error that is recoverable, we might want to ask Bondy to retry the connection e.g. when connecting with realm A the remote aborts the connection with reason `no_such_realm`, in this case maybe the realm has not yet been provisioned, so we want the connection to retry indefinitely.",
        "properties": {
            "enabled": {
                "type": "boolean",
                "required": true,
                "mutable": false,
                "description": "Set to the `true` to enable the reconnect feature, `false` to disabled it.",
                "default": "`true`"
            },
            "backoff_max": {
                "type": "integer",
                "required": true,
                "mutable": false,
                "description": "The maximum backoff time in milliseconds.",
                "default": "60000"
            },
            "backoff_min": {
                "type": "integer",
                "required": true,
                "mutable": false,
                "description": "The minimum backoff time in milliseconds.",
                "default": "5000"
            },
            "backoff_type": {
                "type": "string",
                "required": true,
                "mutable": false,
                "description": "Allowed values: `normal` and `jitter`. The backoff strategy to be used, `jitter` implements an exponential backoff and is the recommended option.",
                "default": "jitter"
            },
            "max_retries": {
                "type": "integer",
                "required": true,
                "mutable": false,
                "description": "The max number of retries.",
                "default": "100"
            }
        },
        "default": "`{}`"
    },
    "ping": {
        "type": "object",
        "required": true,
        "mutable": false,
        "properties": {
            "enabled": {
                "type": "boolean",
                "required": true,
                "mutable": false,
                "description": "Set to the `true` to enable the ping feature, `false` to disabled it.",
                "default": "`true`"
            },
            "idle_timeout": {
                "type": "integer | infinity",
                "required": true,
                "mutable": false,
                "description": "Time in milliseconds that Bondy will allow for a connection with no activity to be kept alive.",
                "default": "20000"
            },
            "timeout": {
                "type": "integer",
                "required": true,
                "mutable": false,
                "description": "Timeout in milliseconds.",
                "default": "10000"
            },
            "max_attempts": {
                "type": "integer",
                "required": true,
                "mutable": false,
                "description": "The max retries after which Bondy deems the connection dead and closes the socket.",
                "default": "2"
            }
        },
        "default": "`{}`"
    },
    "realms": {
        "type": "array",
        "required": true,
        "mutable": false,
        "description": "The list of realm bridging configuration",
        "items": {
            "type": "object",
            "properties": {
                "uri": {
                    "type": "string",
                    "required": true,
                    "mutable": false,
                    "description": "The realm uri to sync with bondy router"
                },
                "authid": {
                    "type": "string",
                    "required": true,
                    "mutable": false,
                    "description": ""
                },
                "cryptosign": {
                    "type": "object",
                    "required": true,
                    "mutable": false,
                    "properties": {
                        "pubkey": {
                            "type": "string",
                            "required": true,
                            "mutable": false,
                            "description": "The user public key in hexstring format."
                        },
                        "privkey": {
                            "type": "string",
                            "required": false,
                            "mutable": false,
                            "description": "The private key in hexstring format. This is an alternative to privkey_env_var."
                        },
                        "privkey_env_var": {
                            "type": "string",
                            "required": false,
                            "mutable": false,
                            "description": "The name of the environment variable Bondy will use to get the value of the private key."
                        },
                        "procedure": {
                            "type": "string",
                            "required": false,
                            "mutable": false,
                            "description": ""
                        },
                        "exec": {
                            "type": "string",
                            "required": false,
                            "mutable": false,
                            "description": "The name of the shell executable that will compute the signature e.g. to interact with a Secure Element. The executable should accept at least two arguments (`pubkey` and `challenge` both as byte array of hexstrings)."
                        }
                    }
                },
                "procedures": {
                    "type": "array",
                    "required": true,
                    "items": {
                        "type": "object",
                        "properties": procedureActionSpec
                    },
                    "description": "Accepted and validated, but not yet enforced by the running bridge — see Bondy Edge.",
                    "default": "[]"
                },
                "topics": {
                    "type": "array",
                    "required": true,
                    "items": {
                        "type": "object",
                        "properties": topicActionSpec
                    },
                    "description": "Only direction \"out\" currently has an effect — see Bondy Edge.",
                    "default": "[]"
                }
            }
        }
    }
};

const inputCreateData = {...bridgeData};

const bridge = {...bridgeData};

export default {
	data() {
        return {
			inputCreateData: JSON.stringify(inputCreateData),
            bridge: JSON.stringify(bridge),
            bridgeStatus: JSON.stringify(bridgeStatus),
			createArgs: JSON.stringify({
				0: {
					"type": "object",
					"description": "The bridge relay configuration data",
					"mutable": true,
					"properties": inputCreateData
				}
			}),
			createResult: JSON.stringify({
				0: {
					"type": "object",
					"description": "The bridge relay object.",
					"mutable": true,
					"properties": bridge
				}
			}),
            listResult: JSON.stringify({
				0: {
					"type": "array",
					"description": "The all bridges you want to retrieve.",
					"items" : {
						"type": "object",
						"description": "The bridge relay object.",
						"properties": bridge
					}
				}
			})
        }
    }
};
</script>