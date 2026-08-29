## Types

### realm{.datatype}
The representation of the realm returned by the read or write operations e.g. `get`, `list`, `create` or `update`.

<DataTreeView :data="realm" :maxDepth="10" />

### input_data{.datatype}
The object used to create or update a realm. Notice this object contains more information than the actually created realm e.g. users, groups, etc.


<DataTreeView :data="inputCreateData" :maxDepth="10" />

<script>
const realmUri = {
    "uri": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "The realm identifier"
    }
};
const realmPrivate = {
    "private_keys" :  {
        "type": "array",
        "required": false,
        "mutable": true,
        "description": "A list of private keys used for signing.",
        "items": {
            "type": "private_key"
        }
    },
    "encryption_keys" :  {
        "type": "array",
        "required": false,
        "mutable": true,
        "description": "A list of private keys used for encryption.",
        "items": {
            "type": "private_key"
        }
    }
};

const rateLimitBudget = {
    "type": "object",
    "required": false,
    "mutable": true,
    "properties": {
        "rate": {
            "type": "integer",
            "required": true,
            "mutable": true,
            "description": "Tokens per second — the sustained allowance. Must be a positive integer."
        },
        "capacity": {
            "type": "integer",
            "required": true,
            "mutable": true,
            "description": "The burst size — tokens a caller may spend at once before being held to the rate. Must be a positive integer."
        }
    }
};

const rateLimitClass = {
    "type": "object",
    "required": false,
    "mutable": true,
    "properties": {
        "enabled": {
            "type": "boolean",
            "required": false,
            "mutable": true,
            "description": "Set to `false` to park this class's budgets without deleting the numbers. The block's presence enables it.",
            "default": "`true`"
        },
        "per_caller": {...rateLimitBudget,
            "description": "A budget per caller — per source IP, or per session for the message class."
        },
        "total": {...rateLimitBudget,
            "description": "One budget shared by ALL of the realm's callers — the tenant quota. Enforced per node."
        }
    }
};

const realmPublic = {
    "description": {
        "type": "string",
        "required": true,
        "mutable": true,
        "description": "A textual description of the realm.",
        "default": ""
    },
    "is_prototype": {
        "type": "boolean",
        "required": true,
        "mutable": true,
        "description": "If true this realm is a realm used as a prototype. Prototype realms cannot be used by themselves. Once a realm has been designated as a prototype it cannot be changed.",
        "default": "`false`"
    },
    "prototype_uri": {
        "type": "uri",
        "required": false,
        "mutable": false,
        "description": "If present, this it the URI of the the realm prototype this realm inherits some of its behaviour and features from. This is an **irreflexive** property i.e. a realm cannot have itself as prototype."
    },
    "is_sso_realm": {
        "type": "boolean",
        "required": true,
        "mutable": true,
        "description": "If true this realm is an SSO Realm. Once a realm has been designated as an SSO realm it cannot be changed.",
        "default": "`false`"
    },
    "sso_realm_uri": {
        "type": "uri",
        "required": false,
        "mutable": false,
        "description": "If present, this it the URI of the SSO Realm this realm is connected to. Once a realm has been associated with an SSO realm it cannot be changed.",
        "default": "The realm's prototype value if the realm inherits from a prototype (see prototype_uri), otherwise undefined."
    },
    "allow_connections": {
        "type": "boolean",
        "required": true,
        "mutable": true,
        "description": "If `true` this realm will allow connections from clients. It is normally set to `false` when the realm is an SSO Realm.  \n:::info\nPrototype realms never allow connections, so if you set `is_prototype` to `true` this property will be assumed to be `false`.\n:::",
        "default": "undefined"
    },
    "authmethods": {
        "type": "array",
        "required": true,
        "mutable": true,
        "description": "The list of the authentication methods allowed by this realm. Allowed values: 'anonymous', 'trust', 'password', 'ticket', 'oauth2', 'wampcra', 'cryptosign'",
        "default": "`[]`",
        "items" : {
            "type": "string"
        }
    },
    "security_enabled" : {
        "type": "boolean",
        "required": false,
        "mutable": true,
        "description": "Whether security is enabled or not.",
        "default": "undefined"
    },
    "rate_limit" : {
        "type": "object",
        "required": false,
        "mutable": true,
        "description": "The realm's own rate-limit budgets — the realm scope of the rate-limiting chain (see the [rate limiting guide](/router/guides/administration/load_regulation_and_rate_limiting#rate-limiting-inbound-traffic)). A request is admitted only when the node, listener AND realm budgets all admit it, so these can only narrow what the node allows. Covers the classes a realm-addressed request reaches: `auth`, `http` and `message`. Setting the property to `null` on update clears it. \n:::warning\nBudgets are enforced per node: a `total` of N tokens per second bounds each cluster node separately.\n:::",
        "properties": {
            "auth": {...rateLimitClass,
                "description": "Budgets for authentication attempts on this realm."
            },
            "http": {...rateLimitClass,
                "description": "Budgets for HTTP requests addressing this realm (API Gateway, MCP)."
            },
            "message": {...rateLimitClass,
                "description": "Budgets for WAMP CALL/PUBLISH/SUBSCRIBE/REGISTER messages on this realm's sessions."
            }
        }
    },
    "users" :  {
        "type": "array",
        "required": false,
        "mutable": true,
        "description": "A list of user objects.",
        "items": {
            "type": "User"
        }
    },
    "groups" :  {
        "type": "array",
        "required": false,
        "mutable": true,
        "description": "A list of group objects.",
        "items": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "required": true,
                    "mutable": false,
                    "description": "The group identifier."
                },
                "groups" :  {
                    "type": "array",
                    "required": false,
                    "mutable": true,
                    "description": "A list of group names.",
                    "items": {
                        "type": "string"
                    }
                },
                "meta": {
                    "type": "map",
                    "required": true,
                    "mutable": true,
                    "description": "Group metadata.",
                    "default": "`{}`"
                }
            }
        }
    },
    "sources" :  {
        "type": "array",
        "required": false,
        "mutable": true,
        "description": "A list of source objects.",
        "items": {
            "type": "source"
        }
    },
    "grants" :  {
        "type": "array",
        "required": false,
        "mutable": true,
        "description": "A list of grant objects.",
        "items": {
            "type": "object",
            "properties": {
                "permissions": {
                    "type": "array",
                    "required": true,
                    "mutable": true,
                    "description": "A list of permissions. Allowed values: 'wamp.register','wamp.unregister','wamp.subscribe','wamp.unsubscribe','wamp.call','wamp.cancel','wamp.publish'",
                    "items": {
                        "type": "string"
                    }
                },
                "roles": {
                    "type": "array",
                    "required": true,
                    "mutable": true,
                    "description": "A list of group names.",
                    "items": {
                        "type": "string"
                    }
                },
                "uri": {
                    "type": "string",
                    "required": true,
                    "mutable": true,
                    "description": "The URI or URI pattern the permissions apply to, matched according to `match`."
                },
                "match": {
                    "type": "string",
                    "required": true,
                    "mutable": true,
                    "description": "Allowed values: 'exact', 'prefix', 'wildcard'"
                },
                "resources": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "uri": {
                                "type": "string",
                                "required": true,
                                "mutable": true,
                                "description": "The URI or URI pattern this resource entry covers, matched according to its own `match`."
                            },
                            "match": {
                                "type": "string",
                                "required": true,
                                "mutable": true,
                                "description": "Allowed values: 'exact', 'prefix', 'wildcard'"
                            }
                        }
                    }
                },
                "meta": {
                    "type": "map",
                    "required": false,
                    "mutable": true,
                    "description": "Grant metadata."
                }
            }
        }
    }
};

const inputCreateData = {...realmUri, ...realmPublic, ...realmPrivate};
const inputUpdateData = {...realmPublic, ...realmPrivate};

const realm = {...realmUri, ...realmPublic,
    "security_status" :  {
        "type": "string",
        "required": false,
        "mutable": true,
        "description": "The string 'enabled' if enabled is true. Otherwise the string is 'disabled'."
    }
};

export default {
    data() {
        return {
            inputCreateData: JSON.stringify(inputCreateData),
            realm: JSON.stringify(realm),
            createArgs: JSON.stringify({
                0: {
                    "type": "object",
                    "description": "The realm configuration data",
                    "mutable": true,
                    "properties" : inputCreateData
                }
            }),
            createResult: JSON.stringify({
                0: {
                    "type": "object",
                    "description": "The created realm.",
                    "mutable": true,
                    "properties" : realm
                }
            }),
            inputUpdateData: JSON.stringify(inputUpdateData),
            updateArgs: JSON.stringify({
                0: {
                    "type": "uri",
                    "required": true,
                    "description" : "The URI of the realm you want to update."
                },
                1: {
                    "type": "object",
                    "description": "The realm configuration data",
                    "mutable": true,
                    "properties" : inputUpdateData
                }
            }),
            updateResult: JSON.stringify({
                0: {
                    "type": "object",
                    "description": "The updated realm.",
                    "mutable": true,
                    "properties" : realm
                }
            }),
            listResult: JSON.stringify({
                0: {
                    "type": "array",
                    "description": "The realms you want to retrieve.",
                    "items" : {
                        "type": "object",
                        "description": "The realm.",
                        "properties": realm
                    }
                }
            })
        }
    }
};
</script>