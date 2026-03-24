---
related:
    - text: Introduction to WAMP
      type: concepts
      link: /concepts/wamp/introduction
      description: Core WAMP concepts and architecture.
    - text: Routed RPC
      type: concepts
      link: /concepts/wamp/rpc
      description: Learn about Remote Procedure Call pattern in WAMP.
    - text: Publish/Subscribe
      type: concepts
      link: /concepts/wamp/pubsub
      description: Learn about Publish/Subscribe pattern in WAMP.
---
# Naming Best Practices

In WAMP, both RPC procedures and PubSub topics are identified by URIs. Choosing good URI naming conventions is crucial for building maintainable, scalable distributed applications. This guide provides best practices for naming your WAMP resources.

## URI Structure

WAMP URIs use a hierarchical, dot-separated structure similar to reverse domain names:

```
com.company.application.service.resource.action
```

### Components

A well-structured URI typically includes:

1. **Namespace** - Organization or domain identifier (e.g., `com.mycompany`)
2. **Application** - Application or product name (e.g., `marketplace`)
3. **Service** - Logical service or component (e.g., `orders`, `users`)
4. **Resource** - Specific resource type (e.g., `order`, `user`)
5. **Action/Event** - Operation or event type (e.g., `create`, `created`, `update`)

## RPC Procedure Naming

### General Conventions

**Use verb-noun structure for actions:**
```
com.myapp.orders.order.create
com.myapp.orders.order.update
com.myapp.orders.order.delete
com.myapp.orders.order.get
com.myapp.orders.order.list
```

**Group related procedures:**
```
com.myapp.auth.login
com.myapp.auth.logout
com.myapp.auth.refresh_token
com.myapp.auth.validate_token
```

**Use descriptive action verbs:**
- `create` - Create new resource
- `get` - Retrieve single resource
- `list` - Retrieve multiple resources
- `update` - Update existing resource
- `delete` - Remove resource
- `search` - Query resources
- `validate` - Validate data
- `calculate` - Perform calculation
- `process` - Execute processing

### CRUD Operations

For standard CRUD operations, use consistent verb patterns:

```
# Create
com.myapp.users.user.create

# Read (single)
com.myapp.users.user.get

# Read (multiple)
com.myapp.users.user.list

# Update
com.myapp.users.user.update

# Delete
com.myapp.users.user.delete
```

### Query Operations

For search and filter operations:

```
com.myapp.products.product.search
com.myapp.products.product.find_by_category
com.myapp.orders.order.list_by_user
com.myapp.analytics.report.generate
```

### Admin/Management Procedures

Distinguish administrative procedures:

```
com.myapp.admin.users.user.suspend
com.myapp.admin.users.user.activate
com.myapp.admin.system.cache.clear
com.myapp.admin.system.config.reload
```

## PubSub Topic Naming

### Event Naming Conventions

**Use past-tense verbs for events** (something happened):

```
com.myapp.orders.order.created
com.myapp.orders.order.updated
com.myapp.orders.order.deleted
com.myapp.orders.order.shipped
com.myapp.orders.order.cancelled
```

**Lifecycle events:**
```
com.myapp.users.user.registered
com.myapp.users.user.activated
com.myapp.users.user.deactivated
com.myapp.users.user.deleted
```

**State change events:**
```
com.myapp.devices.device.online
com.myapp.devices.device.offline
com.myapp.services.api.available
com.myapp.services.api.degraded
```

### Hierarchy for Filtering

Design topics to allow flexible subscription patterns:

```
# Subscribe to all order events
com.myapp.orders.order.*

# Subscribe to specific order events
com.myapp.orders.order.created
com.myapp.orders.order.updated

# Subscribe to all events for a service
com.myapp.orders.*

# Subscribe to everything for an application
com.myapp.*
```

### Data vs. Notification Topics

Distinguish between data streams and notifications:

```
# High-frequency data streams
com.myapp.telemetry.sensor.temperature.data
com.myapp.telemetry.sensor.pressure.data

# Low-frequency notifications
com.myapp.alerts.sensor.threshold_exceeded
com.myapp.alerts.system.high_load
```

### User/Session-Specific Topics

For user-specific events, include user context:

```
com.myapp.users.{userid}.notification
com.myapp.users.{userid}.message.received
com.myapp.sessions.{sessionid}.expired
```

## Pattern Matching

WAMP supports three matching policies for both procedures and topics:

### Exact Match (default)

```
# Registration/Subscription
com.myapp.users.user.get

# Matches only
com.myapp.users.user.get
```

### Prefix Match

```
# Registration/Subscription with prefix
com.myapp.users.

# Matches
com.myapp.users.user.get
com.myapp.users.user.list
com.myapp.users.group.get
```

### Wildcard Match

```
# Registration/Subscription with wildcard
com.myapp..created

# Matches
com.myapp.users.user.created
com.myapp.orders.order.created
com.myapp.products.product.created
```

**Design URIs to leverage patterns:**
```
# Good - allows pattern matching
com.myapp.orders.order.created
com.myapp.orders.invoice.created

# Subscribe to all "created" events
com.myapp..created
```

## Anti-Patterns

### Don't Use Query Parameters

```
# Bad
com.myapp.users.user.get?id=123

# Good
com.myapp.users.user.get
# Pass ID as call argument
```

### Don't Encode Data in URIs

```
# Bad
com.myapp.orders.order.user123.created

# Good
com.myapp.orders.order.created
# Include user_id in event payload
```

### Don't Mix Conventions

```
# Bad - inconsistent verbs
com.myapp.users.createUser
com.myapp.users.get_user
com.myapp.users.UserDelete

# Good - consistent structure
com.myapp.users.user.create
com.myapp.users.user.get
com.myapp.users.user.delete
```

### Don't Use Ambiguous Names

```
# Bad - unclear meaning
com.myapp.process
com.myapp.handle
com.myapp.do_thing

# Good - specific and clear
com.myapp.orders.order.process_payment
com.myapp.events.notification.handle_delivery
com.myapp.tasks.job.execute
```

## Versioning

### URI-Based Versioning

Include version in URI for breaking changes:

```
# Version 1
com.myapp.v1.users.user.create

# Version 2 (breaking changes)
com.myapp.v2.users.user.create

# Both can coexist during migration
```

### When to Version

Version when:
- Changing procedure signature (arguments, return type)
- Changing event payload structure
- Changing semantics of an operation
- Removing features

Don't version for:
- Adding optional parameters
- Adding fields to responses (if clients ignore unknown fields)
- Bug fixes that don't affect contract

## Multi-Tenant Applications

### Tenant Isolation

Include tenant identifier in URI:

```
com.myapp.{tenant}.orders.order.create
com.myapp.{tenant}.users.user.list
```

Or use realms for tenant isolation (recommended):
```
# Each tenant in separate realm
Tenant A realm: com.myapp.tenanta
Tenant B realm: com.myapp.tenantb

# Same URIs in each realm
com.myapp.orders.order.create
```

## Security Considerations

### Sensitive Operations

Clearly identify privileged operations:

```
com.myapp.admin.users.user.delete
com.myapp.system.database.backup
com.myapp.internal.debug.enable
```

This makes it easier to:
- Apply appropriate authorization rules
- Audit access patterns
- Identify security-sensitive operations

### Public vs. Private APIs

Distinguish public and internal APIs:

```
# Public API
com.myapp.public.products.product.list

# Internal API
com.myapp.internal.cache.invalidate
```

## Documentation

### Self-Documenting Names

Good names reduce need for documentation:

```
# Self-explanatory
com.myapp.billing.invoice.generate_pdf
com.myapp.notifications.email.send_verification

# Requires explanation
com.myapp.billing.proc1
com.myapp.notifications.do_thing
```

### Consistency Aids Discovery

Consistent naming allows developers to guess URIs:

```
# If you know
com.myapp.users.user.create

# You can guess
com.myapp.orders.order.create
com.myapp.products.product.create
```

## Examples by Domain

### E-Commerce

```
# Procedures
com.shop.products.product.get
com.shop.cart.item.add
com.shop.checkout.payment.process
com.shop.orders.order.track

# Topics
com.shop.orders.order.placed
com.shop.inventory.item.low_stock
com.shop.shipping.package.shipped
```

### IoT/Telemetry

```
# Procedures
com.iot.devices.device.configure
com.iot.devices.device.reboot
com.iot.sensors.calibration.run

# Topics
com.iot.sensors.temperature.reading
com.iot.devices.connection.status_changed
com.iot.alerts.sensor.offline
```

### Collaboration/Chat

```
# Procedures
com.chat.messages.message.send
com.chat.rooms.room.create
com.chat.users.presence.update

# Topics
com.chat.messages.message.received
com.chat.rooms.user.joined
com.chat.rooms.user.typing
```

## Summary Checklist

When naming WAMP URIs:

- ✅ Use reverse domain notation
- ✅ Use consistent, hierarchical structure
- ✅ Use verbs for RPC procedures (present tense)
- ✅ Use past-tense verbs for events
- ✅ Group related resources logically
- ✅ Design for pattern matching when useful
- ✅ Keep names concise but descriptive
- ✅ Be consistent across your application
- ✅ Document URI conventions for your team
- ✅ Version URIs for breaking changes

## See Also

- [Introduction to WAMP](/concepts/wamp/introduction) - WAMP fundamentals
- [Routed RPC](/concepts/wamp/rpc) - RPC pattern details
- [Publish/Subscribe](/concepts/wamp/pubsub) - PubSub pattern details
- [Security](/concepts/wamp/security) - Authorization based on URI patterns
