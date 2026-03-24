---
draft: false
related:
    - text: Realms
      type: concepts
      link: /concepts/realms
      description: Understanding realms and multi-tenancy in Bondy.
    - text: Same Sign-on Tutorial
      type: tutorial
      link: /tutorials/security/same_sign_on
      description: Step-by-step guide to implementing Same Sign-on.
    - text: Security
      type: concepts
      link: /concepts/wamp/security
      description: Authentication and authorization in WAMP.
---
# Single Sign-On

Bondy Single Sign-On (SSO) is a feature that enables users to authenticate once and gain access to multiple realms without re-entering credentials. This reduces authentication friction while maintaining security boundaries between realms.

::: warning Terminology: SSO vs Same Sign-On
Bondy implements **Same Sign-On** (also abbreviated SSO), not traditional Single Sign-On. With Same Sign-On, users still authenticate when opening a session to each realm, but they use the same shared credentials. Traditional Single Sign-On would allow a user to authenticate once and automatically access all connected realms without re-authenticating. Bondy's approach maintains stronger security boundaries while simplifying credential management.
:::

## The Problem: Credential Sprawl

In distributed applications with multiple realms, users typically need separate credentials for each realm:

```
User "Alice" needs:
  - Credentials for realm "com.example.app1"
  - Credentials for realm "com.example.app2"
  - Credentials for realm "com.example.app3"

Result:
  - Multiple passwords to remember
  - Multiple credential updates when changing passwords
  - Administrative overhead managing credentials per realm
```

This becomes unwieldy as the number of realms grows, especially in microservices architectures where services often have their own realms for isolation.

## The Solution: Centralized Credentials

Bondy Same Sign-On addresses this by centralizing credential storage in a dedicated SSO realm:

```
SSO Realm: "com.example.sso"
  └─> Stores credentials for Alice, Bob, Carol

User Realms:
  - "com.example.app1" → Links to SSO realm
  - "com.example.app2" → Links to SSO realm
  - "com.example.app3" → Links to SSO realm

Alice authenticates to any realm using the same credentials
stored in the SSO realm
```

The SSO realm acts as a centralized identity provider, while user realms maintain their own independent authorization rules (what users can do within that realm).

## How It Works

### Architecture

Bondy Same Sign-On involves three components:

1. **SSO Realm** - A special realm that stores user credentials
2. **User Realms** - Regular realms that delegate authentication to the SSO realm
3. **User Records** - Linked user records across realms

When a user authenticates to a user realm that's configured for Same Sign-On:

```
1. Client connects to user realm "com.example.app1"
2. Client provides credentials (username/password)
3. Bondy checks if realm has SSO configured
4. Bondy looks up credentials in linked SSO realm
5. Bondy validates credentials against SSO realm
6. If valid, Bondy creates session in user realm
7. Bondy applies authorization rules from user realm
```

The user realm gets to decide what the user can do (authorization), but the SSO realm determines if they are who they claim to be (authentication).

### SSO Realm Configuration

An SSO realm is created with special properties:

```javascript
wampy.call('bondy.realm.create', [{
    uri: 'com.example.sso',
    is_sso_realm: true,           // Mark as SSO realm
    allow_connections: false,      // No direct connections
    security_enabled: true,
    authmethods: []                // No auth methods needed
}]);
```

Key characteristics:

- **`is_sso_realm: true`** - Designates this realm as an SSO realm
- **`allow_connections: false`** - Users cannot connect directly to this realm
- **No authentication methods** - The SSO realm only stores credentials, it doesn't authenticate sessions

The SSO realm exists solely to store and manage credentials. Users never connect to it directly.

### User Realm Configuration

User realms are configured to delegate authentication:

```javascript
wampy.call('bondy.realm.create', [{
    uri: 'com.example.app1',
    is_sso_realm: false,
    sso_realm_uri: 'com.example.sso',  // Link to SSO realm
    allow_connections: true,
    security_enabled: true,
    authmethods: ['wampcra', 'password'],
    // ... other configuration
}]);
```

The `sso_realm_uri` property links this realm to the SSO realm for credential lookup.

### User Record Creation

When adding a user to a realm configured with Same Sign-On:

**Option 1: Create in SSO realm first**

```javascript
// 1. Create user in SSO realm (with credentials)
wampy.call('bondy.user.add', ['com.example.sso', {
    username: 'alice@example.com',
    password: 'secure_password',
    groups: []
}]);

// 2. Create user in user realm (without credentials)
wampy.call('bondy.user.add', ['com.example.app1', {
    username: 'alice@example.com',
    sso_realm_uri: 'com.example.sso',
    groups: ['app1_user']
}]);
```

**Option 2: Create in user realm (automatic SSO creation)**

```javascript
// Create user in user realm with credentials
// Bondy automatically creates user in SSO realm
wampy.call('bondy.user.add', ['com.example.app1', {
    username: 'alice@example.com',
    password: 'secure_password',
    sso_realm_uri: 'com.example.sso',
    groups: ['app1_user']
}]);
```

If the user doesn't exist in the SSO realm, Bondy creates them there automatically. If they already exist, the credentials in the SSO realm are used.

### Result: Linked Users

After setup, you have linked user records:

**In SSO Realm (`com.example.sso`):**
```json
{
  "username": "alice@example.com",
  "password": "<hashed>",
  "authorized_keys": [...],
  "groups": []
}
```

**In User Realm (`com.example.app1`):**
```json
{
  "username": "alice@example.com",
  "sso_realm_uri": "com.example.sso",
  "groups": ["app1_user"]
}
```

Notice the user realm record doesn't contain credentials—only a link to the SSO realm.

## Authentication Flow

When Alice connects to `com.example.app1`:

```
1. Alice → Bondy: HELLO to "com.example.app1"
   └─> Includes username "alice@example.com"

2. Bondy checks realm configuration
   └─> Sees sso_realm_uri = "com.example.sso"

3. Bondy looks up Alice in "com.example.app1"
   └─> Finds user record with SSO link

4. Bondy looks up Alice in "com.example.sso"
   └─> Retrieves credentials

5. Bondy → Alice: CHALLENGE
   └─> Using credentials from SSO realm

6. Alice → Bondy: AUTHENTICATE
   └─> Provides password or signature

7. Bondy validates credentials
   └─> Against credentials in SSO realm

8. If valid, Bondy → Alice: WELCOME
   └─> Session created in "com.example.app1"
   └─> Authorization from "com.example.app1" applied
```

The same credentials work for `com.example.app2`, `com.example.app3`, or any other realm linked to the same SSO realm.

## Authorization Remains Independent

While authentication is centralized, authorization remains realm-specific:

```
Alice in com.example.app1:
  - Groups: ["app1_user"]
  - Permissions: Can call app1.* procedures

Alice in com.example.app2:
  - Groups: ["app2_admin"]
  - Permissions: Can call app2.* and manage app2 users

Same credentials, different permissions
```

This separation allows:
- Centralized identity management
- Decentralized access control
- Realm-specific security policies
- Independent realm administration

## Credential Management

### Password Changes

Changing a password affects all linked realms:

```javascript
// Can update from any linked realm
wampy.call('bondy.user.update', ['com.example.app1', 'alice@example.com', {
    password: 'new_secure_password'
}]);

// Bondy updates password in SSO realm
// New password immediately works for all linked realms
```

Password changes are automatically propagated to the SSO realm, affecting authentication across all linked user realms.

### Adding Users to Additional Realms

To give Alice access to another realm:

```javascript
wampy.call('bondy.user.add', ['com.example.app3', {
    username: 'alice@example.com',
    sso_realm_uri: 'com.example.sso',  // Same SSO realm
    groups: ['app3_guest']
}]);
```

No password needed—Alice's existing credentials from the SSO realm will work.

### Local (Non-SSO) Users

Realms can have both SSO users and local users:

```javascript
// Local user (credentials stored in realm)
wampy.call('bondy.user.add', ['com.example.app1', {
    username: 'local_user@example.com',
    password: 'local_password',
    sso_realm_uri: null,  // No SSO link
    groups: ['app1_user']
}]);
```

Local users authenticate directly against the user realm without SSO involvement.

## Use Cases

### Multi-Application SaaS

Provide multiple applications under one account:

```
SSO Realm: com.saascompany.sso
User Realms:
  - com.saascompany.crm      (CRM application)
  - com.saascompany.helpdesk (Support application)
  - com.saascompany.billing  (Billing portal)

Customer authenticates once, accesses all applications
with the same credentials
```

### Microservices Per Customer

Each customer gets isolated microservices:

```
SSO Realm: com.platform.tenant123.sso
User Realms:
  - com.platform.tenant123.api
  - com.platform.tenant123.analytics
  - com.platform.tenant123.reporting

All services share credentials, maintain separate permissions
```

### Development Environments

Share credentials across environment realms:

```
SSO Realm: com.example.dev.sso
User Realms:
  - com.example.dev.app
  - com.example.staging.app
  - com.example.demo.app

Developers use same credentials across environments
```

## Security Considerations

### SSO Realm Protection

The SSO realm is critical infrastructure:

- **No direct connections** - Users cannot connect to SSO realm directly
- **Admin-only management** - Only administrators should create/modify SSO realms
- **Audit logging** - Track all credential changes
- **Backup strategy** - Losing SSO realm affects all linked realms

### Credential Scope

Same Sign-On shares credentials, not sessions:

- Each realm connection requires separate authentication
- Sessions are realm-specific
- One realm compromise doesn't compromise others
- Realm permissions remain isolated

### Password Policy

Since passwords are centralized, apply strong policies:

- Minimum length requirements
- Complexity rules
- Rotation policies
- Lockout after failed attempts

Configure these at the SSO realm level to enforce consistently across all linked realms.

## Comparison: Same Sign-On vs Single Sign-On

| Aspect | Bondy Same Sign-On | Traditional Single Sign-On |
|--------|-------------------|---------------------------|
| **Credentials** | Shared across realms | Centralized identity provider |
| **Authentication** | Per-realm session | Once, then propagated |
| **Sessions** | Independent per realm | Shared or federated |
| **Authorization** | Realm-specific | Often centralized |
| **Security Boundary** | Each realm isolated | Relies on token/session propagation |
| **Use Case** | Multi-tenant platforms | Enterprise SSO (SAML, OAuth) |

Bondy's approach prioritizes security isolation while reducing credential management overhead.

## Best Practices

### SSO Realm Design

1. **One SSO realm per tenant** - In multi-tenant systems, give each tenant their own SSO realm
2. **Descriptive naming** - Use clear URI patterns like `com.company.tenant123.sso`
3. **Minimal groups** - Keep SSO realm groups empty, manage groups per user realm
4. **No application logic** - SSO realm is for credentials only, no business procedures

### User Management

1. **Consistent usernames** - Use email addresses as usernames for clarity
2. **Document SSO links** - Track which realms share which SSO realm
3. **Test credential updates** - Verify password changes propagate correctly
4. **Handle user deletion** - Understand that deleting from SSO realm affects all linked realms

### Operations

1. **Monitor SSO realm** - Alert on failed authentication attempts
2. **Backup SSO realm** - Critical data that affects multiple realms
3. **Control SSO realm access** - Limit who can manage SSO realm users
4. **Audit credentials** - Log all password changes and user modifications

## Getting Started

To implement Same Sign-On in your application:

1. **Create SSO realm** - Set `is_sso_realm: true` and `allow_connections: false`
2. **Configure user realms** - Set `sso_realm_uri` to your SSO realm
3. **Add users** - Create users with `sso_realm_uri` in their user data
4. **Test authentication** - Verify users can authenticate to multiple realms with same credentials
5. **Manage passwords** - Update passwords through any linked realm

For detailed implementation steps, see the [Same Sign-On Tutorial](/tutorials/security/same_sign_on).

## Summary

Bondy Same Sign-On simplifies credential management in multi-realm architectures:

- **Centralized credentials** in dedicated SSO realm
- **Decentralized authorization** in each user realm
- **Reduced friction** for users accessing multiple realms
- **Maintained security** through realm isolation

It's an elegant solution to the credential sprawl problem in distributed applications, maintaining strong security boundaries while improving user experience.
