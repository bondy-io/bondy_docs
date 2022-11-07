Realms are routing and administrative domains that act as namespaces. All resources in Bondy belong to a Realm. Messages are routed separately for each individual realm so sessions attached to a realm won’t see message routed on another realm.

## Description
The realm is a central and fundamental concept in Bondy. It does not only serve as an authentication and authorization domain but also as a message routing domain. Bondy ensures no messages routed in one realm will leak into another realm.

In Bondy a realm is represented by a control plane object.

Realms (and the associated users, credentials, groups, sources and permissions) are persisted to disk and replicated across the cluster by Bondy's control plane data replication procedures.

<ZoomImg src="/assets/realm_diagram.png"/>

As a Bondy administrator you can dynamically create any number of realms using the API described in this page.

A realm is identified by a WAMP URI e.g. `com.mycompany.myrealm`.


## Master Realm
When you start Bondy for the first time it creates and stores the Bondy Master realm a.k.a `com.leapsight.bondy`. This realm is the root realm which allows an admin user to create, list, modify and delete other realms. The realm can be customised either through the `bondy.conf` file or dynamically using this API.

However, the master realm has some limitations:

* It cannot be deleted
* It cannot use [Inheritance](#inheritance)
* It cannot use [Same Sign-on](#same-sign-on)

## Prototype Inheritance
A **Prototype Realm** is a realm that acts as a prototype for the construction of other realms. A prototype realm is a normal realm whose property `is_prototype` has been set to true.

Prototypical inheritance allows us to reuse the properties (including RBAC definitions) from one realm to another through a reference URI configured on the `prototype_uri` property.
Prototypical inheritance is a form of single inheritance as realms are can only be related to a single prototype.
The `prototype_uri` property is defined as an **irreflexive property** i.e. a realm cannot have itself as prototype. In addition **a prototype cannot inherit from another prototype**. This means the inheritance chain is bounded to one level.

The following is the list of properties which a realm inherits from a prototype when those properties have not been assigned a value. Setting a value to these properties is equivalent to overriding the prototype's.

- `security_enabled`
- `allow_connections`
- `sso_realm_uri`
- `authmethods`

In addition **realms inherit Groups, Sources and Grants** from their prototype.

The following are the inheritance rules:

1. Users cannot be defined at the prototype i.e. no user inheritance.
2. A realm has access to all groups defined in the prototype i.e. from a realm perspective the prototype groups operate in the same way as if they have been defined in the realm itself. This enables roles (users and groups) in a realm to be members of groups defined in the prototype.
3. A group defined in a realm overrides any homonym group in the prototype. This works at all levels of the group membership chain.
4. The previous rule does not apply to the special group `all`. Permissions granted to `all` are merged between a realm and its prototype.


## Security

A realm's security may be checked, enabled, or disabled by an administrator through the APIs. This allows an administrator to change security settings of a realm on the whole cluster quickly without needing to change settings on a node-by-node basis.

## Same Sign-on (SSO)
Bondy SSO (Same Sign-on) is a feature that allows users to access multiple realms using just one set of credentials.

To use SSO one needs first create a realm (A) as an SSO realm (by setting its `is_sso_realm` property to `true`).

Subsequently one or more realms can use realm A as their SSO Realm by respectively setting their property `sso_realm_uri` to the URI of realm A.

- It requires the user to authenticate when opening a session in a realm.
- Changing credentials e.g. updating password can be performed while connected to any realm.

To learn more about this topic review the [Single Sign-on page](/concepts/single_sign_on).

## Types

### realm{.datatype}
The representation of the realm returned by the read or write operations e.g. `get`, `list`, `create` or `update`.

<DataTreeView :data="realm" :maxDepth="10" />

### input_data{.datatype}
The object used to create or update a realm. Notice this object contains more information than the actually create realm e.g. users, groups, etc.

The object represents as overview of the all realm properties but the available properties are detailed in each particular operation.

<DataTreeView :data="inputCreateData" :maxDepth="10" />

<!-- ======================================================================= -->
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
        "default": "false"
    },
    "prototype_uri": {
        "type": "uri",
        "required": false,
        "mutable": false,
        "description": "If present, this it the URI of the the realm prototype this realm inherits some of its behaviour and features from."
    },
    "is_sso_realm": {
        "type": "boolean",
        "required": true,
        "mutable": true,
        "description": "If true this realm is an SSO Realm. Once a realm has been designated as an SSO realm it cannot be changed.",
        "default": "false"
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
        "description": "If true this realm is allowing connections from clients. It is normally set to false when the realm is an SSO Realm. Prototype realms never allow connections.",
        "default": "undefined"
    },
    "authmethods": {
        "type": "array",
        "required": true,
        "mutable": true,
        "description": "The list of the authentication methods allowed by this realm. Allowed values: 'anonymous', 'trust', 'password', 'ticket', 'oauth2', 'wampcra', 'cryptosign'",
        "default": [],
        "items" : {
            "type": "string"
        }
    },
    "security_enabled" : {
        "type": "boolean",
        "required": false,
        "mutable": true,
        "description": "Wether security is enabled or not.",
        "default": "undefined"
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
                    "default": {}
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
                    "description": ""
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
                                "description": ""
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