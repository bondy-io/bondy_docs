# Ticket
> An authentication ticket is a signed (and possibly encrypted) assertion
> of a user's identity, that a client can use to authenticate the user without
> the need to ask it to re-enter its credentials. {.definition}

## Overview
Tickets MUST be issued by a session that was opened using an authentication
method that is neither `ticket` nor `anonymous` authentication.


### Claims

<DataTreeView :maxDepth="10" :data="claims"/>


### Ticket Scopes
A ticket can be issued using different scopes. The scope is determined based
on the options used to issue the ticket.

### Local scope
> The ticket can be used to authenticate on the ***session's realm only.***

The ticket was issued with `allow_sso` option set to `false` or when set to
`true` the user did not have SSO credentials, and the option `client_ticket`
was not provided.

::: warning Authorization
To be able to issue this ticket, the session must have been granted the
permission `bondy.issue` on the `bondy.ticket.scope.local`
resource.
:::

### SSO Scope
> The ticket can be used to authenticate on ***any realm*** the user has access > to through SSO.

The ticket was issued with `allow_sso` option set to `true` and the user has
SSO credentials, and the option `client_ticket` was not provided.


::: warning Authorization
To be able to issue this ticket, the session must have been granted the
permission `bondy.issue` on the `bondy.ticket.scope.sso`
resource.
:::

### Client-Local scope
> The ticket can be used to authenticate on the ***session's realm only.***

The ticket was issued with `allow_sso` option set to `false` or when set to
`true` the user did not have SSO credentials, and the option `client_ticket`
was provided having a valid ticket issued by a client
(a local or sso ticket).

::: warning Authorization
To be able to issue this ticket, the session must have been granted the
permission `bondy.issue` on the `bondy.ticket.scope.client_local`
resource.
:::


### Client-SSO scope
> The ticket can be used to authenticate on ***any realm*** the user has access
> to through SSO.

The ticket was issued with `allow_sso` option set to `true` and the user has
SSO credentials, and the option `client_ticket` was provided having a valid
ticket issued by a client ( a local or sso ticket).



::: warning Authorization
To be able to issue this ticket, the session must have been granted the
permission `bondy.issue` on the `bondy.ticket.scope.client_local`
resource.
:::


### Scope Summary

* `uri()` in the following table refers to the scope realm (not the
Authentication realm which is used in the prefix)



### Permissions Summary
Issuing tickets requires the user to be granted certain permissions beyond
the WAMP permission required to call the procedures.


|Scope|Permission|Resource|
|---|---|---|
|Local|`bondy.issue`|`bondy.ticket.scope.local`|
|SSO|`bondy.issue`|`bondy.ticket.scope.sso`|
|Client-Local|`bondy.issue`|`bondy.ticket.scope.client_local`|
|Client-SSO|`bondy.issue`|`bondy.ticket.scope.client_sso`|


## Procedures


### bondy.ticket.issue(uri;expiry_time_secs=,...) -> [] {.wamp-procedure}
#### Call

##### Positional Args

<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
		0:{
			'type': 'string',
			'required': true,
			'description' : 'The uri we want to issue the ticket for.'
		}
	})"
/>


##### Keyword Args

<DataTreeView :maxDepth="10" :data="data"/>

#### Result

##### Positional Args
The call result is a single positional argument containing  a realm:

##### Keyword Args
None.


<script>
const data = {
    expiry_time_secs : {
        type: "integer",
        description: "",
        mutable: true,
        required: false
    },
    allow_sso : {
        type: "boolean",
        description: "",
        mutable: true,
        required: false,
        default: true
    },
    client_ticket : {
        type: "string",
        description: "",
        mutable: true,
        required: false
    },
    client_id : {
        type: "string",
        description: "",
        mutable: true,
        required: false
    },
    client_instance_id : {
        type: "string",
        description: "",
        mutable: true,
        required: false
    }
};

const claims = {
    id : {
        type: "string",
        description: "The unique identifier for the ticket",
        mutable: false,
        required: false
    },
    issued_by: {
        type: "string",
        description: "Identifies the principal that issued the ticket. Most of the time this is an application identifier (a.k.a username or client_id) but sometimes it can be the WAMP session's username (a.k.a `authid`).",
        mutable: false,
        required: false
    },
    authid: {
        type: "string",
        description: "identifies the principal that is the subject of the ticket. This is the WAMP session's username (a.k.a `authid').",
        mutable: false,
        required: false
    },
    authrealm: {
        type: "string",
        description: "Identifies the recipients that the ticket is intended for. The value is a realm URI.",
        mutable: false,
        required: false
    },
    expires_at: {
        type: "string",
        description: "Identifies the expiration time (a timestamp in seconds) on or after which the ticket MUST NOT be accepted for processing.  The processing of this attribute requires that the current date/time MUST be before the value assigned to this attribute. Bondy considers a small leeway of 2 mins by default",
        mutable: false,
        required: false
    },
    issued_at: {
        type: "string",
        description: "Identifies the time at which the ticket was issued. This claim can be used to determine the age of the ticket. Its value is a timestamp in seconds.",
        mutable: false,
        required: false
    },
    issued_on: {
        type: "string",
        description: "The Bondy nodename in which the ticket was issued.",
        mutable: false,
        required: false
    },
    scope: {
        type: "object",
        description: "The scope of the ticket.",
        computed: true,
        required: false,
        properties: {
            realm : {required: false, type: "uri", mutable: false},
            client_id: {required: false, type: "string", mutable: false},
            client_instance_id: {required: false, type: "string", mutable: false}
        }
    },
    realm: {
        type: "string",
        description: "If undefined the ticket grants access to all realms the user has access to by the authrealm (an SSO realm). Otherwise, the value is the realm this ticket is valid on.",
        mutable: false,
        required: false
    }
};

export default {
    data() {
        return {
            data: JSON.stringify(data),
            claims: JSON.stringify(claims),
        }
    }
};
</script>