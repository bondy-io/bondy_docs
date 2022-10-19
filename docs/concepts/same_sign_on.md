# Same Sign-on
>Bondy SSO (Same Sign-on) is a feature that allows users to authenticate into multiple realms using just one set of credentials.{.definition}

## Background
A realm can be seen as a self-contained Identity Provider and Authorization Service: all users, groups and permissions for a realm are managed by the realm itself in a (virtual) private database.

In addition, a realm defines which authentication methods are available and allows to restrict the available methods to a user or group of users based on the connection’s source IP address (CIDR).

When your distributed system design requires users to belong to multiple realms this creates the problem of each user having multiple credentials (one per realm) e.g. passwords and/or public keys, which are not synchronised amongst them.

Same Sign-on (SSO) is a solution to that problem.

> With SSO one or more realms can delegate the credentials management and the authentication process to a common (shared) ***SSO Realm***. That is, the SSO Realm becomes the Identity Provider for the other realms.

Enabling this new feature doesn't affect the capability to have users managed "locally" by each realm, caters for the need to have multiple SSO realms in the system and the need for each realm being able to delegate authentication to one or more SSO realms.

::: info Notice
At the moment the realm object only allows a single SSO realm to be associated with it, but the rest of the logic in the platform already caters for multiple SSO realms per realm, so we will be enabling this in the future.
:::

To use SSO one needs first create a realm (A) as an SSO realm (by setting its `is_sso_realm` property to `true`).

Subsequently one or more realms can use realm A as their SSO Realm by respectively setting their property `sso_realm_uri` to the URI of realm A.

- It requires the user to authenticate when opening a session in a realm.
- Changing credentials e.g. updating password can be performed while connected to any realm.

To learn more about this topic review the [Single Sign-on page](/concepts/single_sign_on).

## How does it work?

SSO works by having realms **share a common realm** in which they delegate the user identification and authentication.

Let’s see how it works with an example. We will first create two organisation realms. The following is the definition of the SSO realm called `com.example.sso`.

```jsx
CALL("bondy.realm.create", [{
   "uri": "com.example.sso",
   "is_sso_realm": true,
   "allow_connections": false,
   "security_enabled": true,
   "authmethods": []
}])
```

Here we asume we will manage this realm by opening a WAMP session on Bondy’s master admin realm a.k.a `com.leapsight.bondy`, thus, we do not need anybody to open WAMP sessions on `com.example.sso` so we disabled connections by using a new option introduced in this release: `allow_connections :: boolean()` .

Now that we have the SSO realm we can put it to work. First we redefine the System realm to use SSO. To do that we just need to add the following declaration to the system realm definition: `"sso_realm_uri": "com.example.sso"` .

```jsx
{
   "uri": "com.example.realm.1",
   "is_sso_realm": false,
   "sso_realm_uri": "com.example.sso",
   "allow_connections": true,
   "security_enabled": true,
   "authmethods": [
       "wampcra",
       "cryptosign"
   ],
   "sources": [
      ...
   ],
   "groups": [
      ...
   ],
   "grants": [
      ...
   ]
}
```

This tells the `com.example.realm.1` realm to delegate the authentication of some users to the `com.example.sso` realm.

Now we create a user organisation realm, that will also use the same SSO realm.

```jsx
{
   "uri": "com.thing.organization.1972",
   "is_sso_realm": false,
   "sso_realm_uri": "com.example.sso",
   "allow_connections": true,
   "security_enabled": true,
   "authmethods": [
            "wampcra",
      "cryptosign"
   ],
   "sources": [
      ...
   ],
   "groups": [
      ...
   ],
   "grants": [
      ...
   ]
}
```

Now that the system and organization realm are created we will add the organisation’s owner in both realms but making use of SSO, that is, we will create a "SSO user". For that we need to **add the user in the SSO realm first** and then in the system and organisation realms respectively using a new User attribute `sso_realm_uri` (this currently has to match the realm's property of the same name but in the near future we will allow a realm to have multiple SSO realm URIs, so this property will need to have one of those URIs).

We can do the above using two options offered by Bondy:

1. **Direct** option:
    1. Create the user in the SSO realm using the `bondy.user.add` procedure **while logged in on the Bondy Admin realm.** The call requires passing the SSO realm URI and a User Data object which should include the user credentials.
    2. Then call `bondy.user.add` for the system realm and the user organization realm respectively (without including the credentials).
2. **Indirect** option (only available If the user does not yet exist in the SSO realm):
    1. Create the user in either the system realm or user organization realm, passing the setting the `sso_realm_uri` with the URI of the SSO realm supported by the realm , as it will be demonstrated below. Bondy will automatically create the user in the SSO realm as well as in the chosen realm (atomically).

In the following example we will use indirect option (2) to create the user `linda@gmail.com` in the `com.example.realm.1` realm **which will result in the user being also created in the SSO realm** and linked to it.

```jsx
CALL("bondy.user.add", [<<"com.example.realm.1">>, {
    "username": "linda@gmail.com",
    "password": "123456",
    "groups": ["organization_admin"],
    "meta" : {"country": "us"},
    "sso_realm_uri": "com.example.sso"
}])
```

The above call creates two records. The first record is **created in the SSO realm** and looks like this:

```jsx
{
  "username": "linda@gmail.com",
  "password": "123456",
  "groups": [
     "organization_admin",
     "organization_owner"
  ],
  "meta" : {"plan": "family +5"}
}
```

The second record is created **in the `com.example.realm.1` realm** and looks like this:

```jsx
{
  "username": "linda@gmail.com",
  "sso_realm_uri": "com.example.sso",
  "groups": [
     "organization_admin"
   ],
  "meta" : {"country": "us"}
}
```

Notice that the credentials (password) are not in the system realm record and instead we have a link to the SSO realm which contains the credentials (see the `sso_realm_uri` property).

<ZoomImg src="/assets/sso.png"/>

::: warning
If the user already existed in the SSO realm we would get and `already_exists`error.
:::

We now need to add Linda to her organisation realm. We simply do:

```jsx
CALL("bondy.user.add", [<<"com.thing.organization.1972">>, {
    "sso_realm_uri": "com.example.sso",
    "username": "linda@gmail.com",
    "groups": ["organization_admin"]
}])
```

Bondy will first validate Linda exists in the SSO realm and then create the “linked” record in the organisation’s realm which will look like this:

```jsx
{
  "username": "linda@gmail.com",
  "sso_realm_uri": "com.example.sso",
  "groups": [
     "organization_admin"
   ],
  "meta" : {}
}
```

# Logging-in

There is no need to change the client code to use Same Sign-on. The user can login using her credentials to any of the realms she belongs to (system realm and organization realms).

# Changing credentials

Changing credentials (`password` or `authorized_keys`) can be done by calling the Bondy APIs while logged-in on any of the realms the user is associated with, Bondy will forward the operation to the linked SSO realm.

# Creating local users

Users can still be created just on the realm (aka a "Local" user). This is required for example when provisioning an app into a user’s Hub/Organization realm, as we do not want that app to be linked to other users’ realms via SSO!

To do this we just create the user without specifying a value for the property `sso_realm_uri`  or setting it to `null`.

# Configuring via a file

The security file format is just the same payload used by the WAMP APIs explained above.

Every time Bondy boots it loads the provided security configuration file and makes a call to `bondy.realm.add`. This however uses a **special mode of operation** of the API. While use interactively (and as mentioned above) the API will **return an error when trying to create and already existing object** but when applying the configuration from file it will override the data.

That is, when using a configuration file Bondy treats it as a declarative configuration statement.

<aside>
<img src="https://img.icons8.com/ios/250/000000/attach.png" alt="https://img.icons8.com/ios/250/000000/attach.png" width="40px" /> You can find a complete working example of (Bondy Same Sign-on and Single Sign-on) at  `st-platform-docs/docs/developer/tools/docker_compose` . The example uses 3 organisation realms and the system realm using a common SSO realm called `com.example.sso`.

</aside>

# FAQs

## Is this the same as Single Sign-on?

No. Same Sign-on still requires the user to authenticate again when opening a session on a realm. See [Bondy Single Sign-on](https://www.notion.so/Bondy-Single-Sign-on-c6330866a7bf47f78f8b196560680894).

## Where does the authorization happen?

Authorization is still performed by the realm the user is connecting to. That means

the permissions will be those granted by the local RBAC configuration for the realm. Bondy SSO only handles authentication.