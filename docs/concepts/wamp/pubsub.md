---
related:
    - text: Communication Patterns
      type: concepts
      link: /concepts/wamp/communication_patterns
      description: Understanding RPC and PubSub patterns in WAMP.
    - text: Advanced Publish/Subscribe
      type: concepts
      link: /concepts/wamp/advanced/pubsub
      description: Advanced PubSub features like subscriber lists, publisher exclusion, and event history.
    - text: Introduction to WAMP
      type: concepts
      link: /concepts/wamp/introduction
      description: Core WAMP concepts and architecture.
---
# Publish/Subscribe

Publish/Subscribe (PubSub) is a message-oriented communication pattern in WAMP where Publishers send events to topics, and Subscribers receive those events without direct knowledge of each other.

## Overview

In traditional point-to-point communication, senders must know the identity and location of receivers. PubSub decouples senders (Publishers) from receivers (Subscribers) by introducing an intermediary (the Router's Broker role) that manages topic subscriptions and event routing.

This decoupling provides several benefits:
- Publishers don't need to know who (if anyone) is listening
- Subscribers don't need to know who is publishing
- New subscribers can be added without changing publishers
- Multiple subscribers can independently consume the same events

## How It Works

### Basic Flow

```
1. Subscriber subscribes to topic "com.myapp.events.user.login"
   → Router tracks subscription

2. Publisher publishes event to "com.myapp.events.user.login"
   → Router receives event

3. Router delivers event to all subscribers
   → Each subscriber receives event independently
```

### WAMP Messages

**Subscribe**
```javascript
wampy.subscribe('com.myapp.sensor.temperature', function(args, kwargs, details) {
    console.log('Temperature:', args[0]);
});
```

**Publish**
```javascript
wampy.publish('com.myapp.sensor.temperature', [25.5], {
    unit: 'celsius',
    sensor_id: 'temp_01'
});
```

## Topics

Topics are identified by URIs using dot-notation:
- `com.myapp.events.user.login`
- `com.myapp.sensors.temperature`
- `com.myapp.notifications.email.sent`

### Topic Matching

WAMP supports three matching policies:

**Exact Match** (default)
```javascript
// Subscribe
wampy.subscribe('com.myapp.user.created', handler);

// Receives only exact matches
// com.myapp.user.created ✓
// com.myapp.user.updated ✗
```

**Prefix Match**
```javascript
// Subscribe with prefix
wampy.subscribe('com.myapp.user.', {
    onEvent: handler,
    match: 'prefix'
});

// Receives all matching prefix
// com.myapp.user.created ✓
// com.myapp.user.updated ✓
// com.myapp.user.deleted ✓
```

**Wildcard Match**
```javascript
// Subscribe with wildcard
wampy.subscribe('com.myapp..created', {
    onEvent: handler,
    match: 'wildcard'
});

// Receives wildcard matches
// com.myapp.user.created ✓
// com.myapp.order.created ✓
// com.myapp.product.created ✓
```

## Publishing

### Simple Publish

```javascript
wampy.publish('com.myapp.notification', ['Hello World']);
```

### Publish with Keyword Arguments

```javascript
wampy.publish('com.myapp.user.created', null, {
    user_id: 123,
    username: 'alice',
    email: 'alice@example.com'
});
```

### Publish Options

```javascript
wampy.publish('com.myapp.event', ['data'], {}, {
    acknowledge: true,  // Get confirmation of publish
    exclude_me: false,  // Receive own publications
    exclude: [session_id],  // Exclude specific sessions
    eligible: [session_id]  // Only send to specific sessions
});
```

## Subscribing

### Basic Subscription

```javascript
function onEvent(args, kwargs, details) {
    console.log('Event received:', args, kwargs);
    console.log('Publisher:', details.publisher);
}

wampy.subscribe('com.myapp.events', onEvent);
```

### Subscription Options

```javascript
wampy.subscribe('com.myapp.events', {
    onEvent: onEvent,
    match: 'exact',  // exact | prefix | wildcard
    get_retained: true  // Retrieve retained events
});
```

### Unsubscribing

```javascript
// Subscribe and store reference
wampy.subscribe('com.myapp.events', onEvent);

// Later, unsubscribe by topic
wampy.unsubscribe('com.myapp.events');

// Or unsubscribe with callback
wampy.unsubscribe('com.myapp.events', onEvent);
```

## Use Cases

### Real-Time Updates

Broadcasting state changes to all connected clients:

```javascript
// Backend publishes order status
wampy.publish('com.shop.order.status_changed', null, {
    order_id: 12345,
    status: 'shipped',
    tracking_number: 'ABC123'
});

// All interested clients receive update
```

### Event Notifications

Notifying systems of important events:

```javascript
// User service publishes
wampy.publish('com.myapp.user.registered', null, {
    user_id: 789,
    timestamp: Date.now()
});

// Multiple services subscribe:
// - Email service sends welcome email
// - Analytics service tracks signup
// - CRM system creates record
```

### Live Data Feeds

Streaming sensor data or market data:

```javascript
// IoT device publishes readings
setInterval(() => {
    wampy.publish('com.iot.sensor.temperature', [getCurrentTemp()]);
}, 1000);

// Dashboard subscribes and displays
wampy.subscribe('com.iot.sensor.temperature', updateChart);
```

### Activity Streams

Broadcasting user activities:

```javascript
// Publish user action
wampy.publish('com.app.activity.user_logged_in', null, {
    user: 'alice',
    ip: '192.168.1.10'
});

// Admin dashboard subscribes to monitor activity
```

## Delivery Guarantees

WAMP PubSub provides **at-most-once delivery**:
- Events are delivered to connected subscribers
- No persistence or queuing by default
- If subscriber is disconnected, events are not delivered
- No acknowledgment from subscribers to publisher

This "fire-and-forget" model is appropriate for:
- Real-time updates where latest value matters most
- High-frequency data streams
- Notifications where occasional loss is acceptable

For stronger guarantees, see [Advanced PubSub](/concepts/wamp/advanced/pubsub) for event history and retention features.

## Best Practices

### Topic Design

**Use hierarchical naming:**
```
com.myapp.service.resource.event
```

**Group related topics:**
```
com.myapp.users.user.created
com.myapp.users.user.updated
com.myapp.users.user.deleted
```

### Publishing

**Keep events small:**
- Include IDs, not full objects
- Subscribers can fetch details if needed

**Use past-tense event names:**
```
user.created  (not user.create)
order.shipped (not order.ship)
```

**Include relevant context:**
```javascript
wampy.publish('com.myapp.order.created', null, {
    order_id: 123,
    user_id: 456,
    timestamp: Date.now()
});
```

### Subscribing

**Be specific when possible:**
```
// Prefer exact topics
com.myapp.order.created

// Over broad prefixes
com.myapp.
```

**Handle subscription errors:**
```javascript
wampy.subscribe('com.myapp.events', {
    onEvent: handler,
    onSuccess: function() { console.log('Subscribed'); },
    onError: function(err) { console.error('Subscription failed:', err); }
});
```

**Clean up subscriptions:**
```javascript
// Unsubscribe when no longer needed
wampy.unsubscribe('com.myapp.events', handler);
```

## Comparison with Message Queues

| Feature | WAMP PubSub | Message Queues (RabbitMQ, Kafka) |
|---------|-------------|-----------------------------------|
| **Delivery** | Push to connected clients | Pull or push |
| **Persistence** | None (by default) | Persistent |
| **Ordering** | Not guaranteed across topics | Can be guaranteed |
| **Backpressure** | Managed by transport | Explicit |
| **Use Case** | Real-time notifications | Reliable async processing |

WAMP PubSub excels at **real-time event distribution** to connected clients. For durable messaging and work queues, consider integrating with dedicated message brokers.

## Security

### Authorization

PubSub operations are authorized per topic URI:

- **Subscribe permission** - Who can subscribe to topics
- **Publish permission** - Who can publish to topics

Permissions can use URI patterns:
```
# Allow subscribe to all user events
com.myapp.users.user.*

# Allow publish only to specific topics
com.myapp.admin.system.alert
```

### Topic Isolation

Within a Realm, topics can be protected:
- Public topics - Anyone can subscribe/publish
- Protected topics - Restricted by permissions
- Private topics - Single user/group only

## See Also

- [Advanced Publish/Subscribe](/concepts/wamp/advanced/pubsub) - Event history, subscriber lists, and more
- [Communication Patterns](/concepts/wamp/communication_patterns) - RPC vs PubSub
- [Routed RPC](/concepts/wamp/rpc) - Request-response pattern
- [Security](/concepts/wamp/security) - Authentication and authorization
