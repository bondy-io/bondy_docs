---
related:
    - type: concepts
      text: Realms
      link: /concepts/realms
      description: Realms are routing and administrative domains that act as namespaces. All resources in Bondy belong to a Realm.
    - text: Realm
      type: WAMP API Reference
      link: /reference/wamp_api/realm
      description: Creating, retrieving and managing realms and also enabling, disabling and checking per realm security status.
    - text: Realm
      type: HTTP API Reference
      link: /reference/http_api/realm
      description: Creating, retrieving and managing realms and also enabling, disabling and checking per realm security status.
---
# Using Same Sign-on
Learn how to use create and use a Same Sign-on Realm.

## Introduction

We are going to use an example to demonstrate how easy it is to create an SSO Realm and use it with two other realms to allow Same Sign-on.

In this example we will have a user called `Linda` and three realms `com.example.realm.1`, `com.example.realm.2` and `com.example.realm.3`.

`Linda` needs to have access to all realms.Without SSO Realms `Linda` will have separate credentials per realm.

So the goal of this tutorial is to teach you how to use SSO Realms to allow these users to be able to authenticate in all three realms usign a single set of credentials.


## 1. Creating the SSO realm
The first thing we need to do is create the SSO Realm. Let's call it `com.example.sso`.

The following shows how to create it using the [Realm WAMP API](/reference/wamp_api/realm) to do it.

:::::: tabs code
::: tab Javascript
```javascript 6-7
// Session is attached to Master Realm
// and user has been granted permission
// to call the procedure
session.call("bondy.realm.create", [{
   "uri": "com.example.sso",
   "is_sso_realm": true,
   "allow_connections": false,
   "security_enabled": true,
   "authmethods": []
}])
```
:::
::::::

Notice that in line 3 we set property `is_sso_realm` to true.

Congratulations, that's all we need to define this realm as an SSO realm!

Also notice that on line 4 we disallow connections. This means no user can open a session attached to this realm (which is the recommended option) as the role of this realm is just to become a shared Identity Provider for other realms.

::: info Note
Notice that disallowing connections doesn't affect our abiilty to manage the realm, because to do it we need to open as session attached to the [Master Realm](/concepts/realms#master-realm) anyway.
:::

## 2. Creating the user realms
Now that we have the SSO realm we can put it to work. We now need to create the three realms.

To do that we just need to use the following declaration, replacing the value for `uri` property with the respective ones defined in the previous section.

:::::: tabs code
::: tab Javascript
```javascript 6-7
// Session is attached to Master Realm
// and user has been granted permission
// to call the procedure
session.call("bondy.realm.create", {
   "uri": "com.example.realm.1", // change for realms 2 and 3
   "is_sso_realm": false,
   "sso_realm_uri": "com.example.sso",
   "allow_connections": true,
   "security_enabled": true,
   "authmethods": ["wampcra", "cryptosign"],
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
:::
::::::

Line 7 tells the `com.example.realm.1` realm to delegate the management of credentials and authentication to the `com.example.sso` realm.

Notice that this does not prevent you from having local users (with local credentials) in those realms. By default adding a realm will NOT use the SSO Realm. We need to tell Bondy we want that when creating the users. We will do this in the next step.

## 3. Adding the user
Now that all realms have been created we will add `Linda` as an "SSO user".

We have two options:
* **Direct option**: Add the user in the SSO realm first, and then in the other 3 realms.
    1. Create the user in the SSO realm using the `bondy.user.add` procedure **while logged in on the Bondy Admin realm.** The call requires passing 2 arguments: the SSO realm URI and a User Data object which should include the user credentials.
    2. Then call `bondy.user.add` for the `com.example.realm.1` realm (without including the credentials).
* **Indirect option** : Add the user to each realm (only available If the user does not yet exist in the SSO realm):
    1. Create the user in the `com.example.realm.1` realm, passing the parameter `sso_realm_uri` with the URI of the SSO realm supported by the realm , as it will be demonstrated below. Bondy will automatically create the user in the SSO realm.

In the following example we will use **Indirect Option** to create the user `Linda` in the three realms realm **which will result in the user being also created in the SSO realm** and linked to it.

:::::: tabs code
::: tab Javascript
```javascript 11
// Session is attached to Master Realm
// and user has been granted permission
// to call the procedure
session.call("bondy.user.add", [
   "com.example.realm.1",
   {
      "username": "linda@gmail.com",
      "password": "123456",
      "groups": ["admin"],
      "meta" : {"country": "us"},
      "sso_realm_uri": "com.example.sso"
   }
])
```
:::
::::::

::: warning
If the user already existed in the SSO realm we would get and `already_exists`error.
:::

::: info Note
Notice that the user data object includes the property `sso_realm_uri` set to the SSO Realm Uri. This currently has to match the realm's property of the same name but in the near future we will allow a realm to have multiple SSO realm URIs, so this property will need to have one of those URIs.
:::

The above call creates two linked records.

The first record is **created in the SSO realm** and looks like this:

```json
{
  "username": "linda@gmail.com",
  "password": "123456",
  "groups": ["admin", "owner"],
  "meta" : {"plan": "family +5"}
}
```

The second record is created **in the `com.example.realm.1` realm** and looks like this:

```json
{
  "username": "linda@gmail.com",
  "sso_realm_uri": "com.example.sso",
  "groups": ["admin"],
  "meta" : {"country": "us"}
}
```

Notice that the credentials (password in this case) are not in the second record and instead we have a link to the SSO realm which contains the credentials (see the `sso_realm_uri` property).

We need to repeat the step again to add `Linda` to realms 2 and 3. Notice that we could remove the `password` property now as it will be ignored since `Linda` already exists in the SSO Realm.

The following diagram shows the end result:

<ZoomImg src="/assets/sso_example.png"/>

Now `Linda` can authenticate to all three realms using a single set of credentuals. Moreover, performing a password change on any of the thre realms will actually change it in the SSO realm, having immediate effect across all associated realms.



