---
related:
    - text: Session
      type: WAMP API Reference
      link: /reference/wamp_api/session
      description: Retrieve information about active sessions and subscribe to session lifecycle events.
    - text: Realm
      type: concepts
      link: /concepts/realms
      description: Learn about realms, the routing and administrative domains in Bondy.
---
# Connections and Sessions

A WAMP session is an authenticated, stateful, two-way communication channel between a client and a WAMP Router, enabling real-time, interactive communication over a specific Realm.

## Overview

WAMP is a session-oriented protocol. Before a client can use WAMP's RPC and Pub/Sub features, it must establish a session with the Router by connecting to a transport and authenticating to a specific Realm.

::: definition Session
A session is a transient, authenticated channel that exists from the moment a client successfully establishes a connection and authenticates to a Realm until the connection is terminated or the session is explicitly closed.
:::

## Session Lifecycle

### 1. Connection

The client initiates a connection to the WAMP Router using one of the supported transports:
- **WebSocket** - For browser and mobile apps
- **Raw TCP Socket** - For backend services and native applications
- **Unix Domain Socket** - For local inter-process communication

The client and Router negotiate the transport-level connection parameters, including message serialization format (JSON, MessagePack, CBOR, etc.).

### 2. Authentication

Once connected, the client attempts to join a Realm by sending a `HELLO` message containing:
- **Realm URI** - The target realm to join (e.g., `com.example.realm1`)
- **Roles** - The roles the client wants to play (Caller, Callee, Publisher, Subscriber)
- **Authentication details** - Credentials or auth

 method information

The Router responds with either:
- **WELCOME** - Session established successfully, includes session ID and Router capabilities
- **CHALLENGE** - Authentication challenge (for challenge-response auth methods like WAMP-CRA)
- **ABORT** - Authentication failed or realm not found

Supported authentication methods in Bondy include:
- `anonymous` - No authentication required
- `ticket` - Pre-issued authentication tickets
- `wampcra` - Challenge-Response Authentication
- `cryptosign` - Cryptographic signature-based authentication
- `oauth2` - OAuth2 tokens (via HTTP API Gateway)
- `trust` - IP-based trust (typically for localhost)

### 3. Active Session

Once authenticated, the session is active and the client can:
- **Register** procedures to be called remotely (Callee role)
- **Call** remote procedures (Caller role)
- **Subscribe** to topics (Subscriber role)
- **Publish** events to topics (Publisher role)

All messages during an active session are:
- **Authenticated** - Associated with the session's identity
- **Authorized** - Checked against the Realm's access control rules
- **Routed** - Within the session's Realm only (no cross-realm routing)

### 4. Session Termination

A session can end in several ways:
- **Client-initiated** - Client sends `GOODBYE` message
- **Router-initiated** - Router sends `GOODBYE` (e.g., realm shutdown, policy violation)
- **Connection loss** - Network failure or transport-level disconnect
- **Timeout** - Inactivity timeout or keep-alive failure

## Session Characteristics

### Stateful

Sessions maintain state on both the client and Router sides:
- **Client state**: Open subscriptions, registered procedures, pending calls
- **Router state**: Session identity, permissions, active registrations/subscriptions

This statefulness enables efficient message routing without re-authentication for each message.

### Realm-Scoped

A session is always attached to exactly one Realm. The Realm:
- Defines the namespace for procedures and topics
- Enforces authentication and authorization policies
- Isolates routing from other Realms
- Cannot be changed without establishing a new session

To interact with multiple Realms, a client must establish separate sessions for each.

### Identified

Each session has a unique session ID assigned by the Router. This ID:
- Remains constant for the session's lifetime
- Is used for session management and monitoring
- Appears in Router logs and admin APIs
- Can be used to forcibly close sessions

## Session Roles

WAMP defines four client roles that determine what a client can do within a session:

| Role | Description | Actions |
|------|-------------|---------|
| **Caller** | Invokes remote procedures | Call procedures registered by Callees |
| **Callee** | Implements remote procedures | Register procedures, handle invocations |
| **Subscriber** | Receives events | Subscribe to topics, receive publications |
| **Publisher** | Sends events | Publish events to topics |

::: tip Peer-to-Peer Model
A client can play multiple roles simultaneously within the same session. For example, a web application can be both a Caller (invoking backend procedures) and a Publisher (sending user events), while also being a Subscriber (receiving real-time updates).
:::

## Session Security

### Authentication

Authentication happens during session establishment and determines:
- **Identity** - Who is establishing the session
- **Method** - How identity is verified
- **Source** - Where the connection originates (IP/CIDR-based policies)

### Authorization

Once authenticated, every WAMP action is authorized against the Realm's access control rules:
- **RPC calls** - Can this session call this procedure?
- **RPC registrations** - Can this session register this procedure?
- **Pub/Sub subscriptions** - Can this session subscribe to this topic?
- **Pub/Sub publications** - Can this session publish to this topic?

Authorization is evaluated for each action, allowing fine-grained control based on:
- User identity
- Group membership
- URI patterns (exact, prefix, wildcard matching)
- Custom permission rules

### Session Monitoring

Administrators can monitor active sessions through Bondy's WAMP and HTTP APIs:
- List all sessions in a Realm
- Retrieve session details (identity, roles, connection info)
- Subscribe to session lifecycle events (`bondy.session.on_join`, `bondy.session.on_leave`)
- Forcibly terminate sessions

## Best Practices

### Connection Management

1. **Implement reconnection logic** - Handle network failures gracefully with exponential backoff
2. **Use heartbeats** - Enable transport-level keep-alive to detect dead connections
3. **Clean session termination** - Always send `GOODBYE` before disconnecting
4. **Handle GOODBYE from Router** - Respect Router-initiated session closure

### Security

1. **Use TLS/SSL** - Encrypt transport layer in production (wss://, TLS socket)
2. **Minimize session duration** - Re-authenticate periodically for sensitive operations
3. **Validate permissions** - Don't assume actions will succeed; handle authorization errors
4. **Secure credentials** - Never log or expose authentication secrets

### Performance

1. **Reuse sessions** - Establish long-lived sessions rather than frequent reconnection
2. **Batch operations** - Where possible, combine multiple operations
3. **Monitor session count** - Track concurrent sessions for capacity planning
4. **Use appropriate serialization** - JSON for debugging, MessagePack for production

## See Also

- [Introduction to WAMP](/concepts/wamp/introduction) - Core WAMP concepts
- [Realms](/concepts/realms) - Understanding Bondy's routing and administrative domains
- [Security](/concepts/wamp/security) - WAMP authentication and authorization in depth
- [Session API Reference](/reference/wamp_api/session) - Programmatic session management
