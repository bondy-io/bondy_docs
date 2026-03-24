---
draft: false
related:
    - text: Publish/Subscribe
      type: concepts
      link: /concepts/wamp/pubsub
      description: Learn the fundamentals of Publish/Subscribe in WAMP.
    - text: Beyond the Basics
      type: concepts
      link: /concepts/wamp/beyond_the_basics
      description: Essential advanced features for production systems.
---
# Advanced Publish/Subscribe

This reference covers advanced PubSub features for building sophisticated event-driven systems. These capabilities go beyond basic pub/sub to provide fine-grained control, scalability, and reliability.

## Event Retention

Event retention allows the router to store recent events and deliver them to subscribers upon request. This is useful when subscribers need to catch up on events they missed while offline.

### Configuration

Enable event retention at the topic level:

```javascript
// Publisher can request event retention
wampy.publish('com.myapp.events.important', [eventData], {}, {
    retain: true  // Request this event be retained
});
```

### Retrieving Retained Events

Subscribers can request retained events when subscribing:

```javascript
wampy.subscribe('com.myapp.events.important', {
    onEvent: function(args, kwargs, details) {
        console.log('Event:', args);
        console.log('Was retained:', details.retained);
    },
    get_retained: true  // Retrieve retained events
});
```

When `get_retained: true`, the subscriber immediately receives the most recent retained event for that topic, followed by new events as they arrive.

### Use Cases

- **State synchronization** - New clients get current state immediately
- **Last known value** - Dashboards display most recent data
- **Configuration updates** - Services receive latest config on startup

**Example:**
```javascript
// Service publishes current status with retention
wampy.publish('com.myapp.service.status', null, {
    status: 'operational',
    version: '2.1.0',
    uptime: 86400
}, {
    retain: true
});

// New monitoring client subscribes
// Immediately receives last published status
wampy.subscribe('com.myapp.service.status', {
    onEvent: function(args, kwargs) {
        updateDashboard(kwargs);
    },
    get_retained: true
});
```

## Event History<Badge text="Roadmap"/>

Event history extends retention by storing multiple past events, allowing subscribers to retrieve event sequences rather than just the latest event.

### Planned Capabilities

- **Time-based queries** - Get events from last N minutes
- **Sequence-based queries** - Get last N events
- **Replay from point** - Resume from specific event ID
- **Persistent storage** - Events survive router restarts

### Anticipated Use Cases

- **Event sourcing** - Reconstruct entity state from events
- **Audit trails** - Review historical changes
- **Offline sync** - Mobile apps catch up after reconnecting
- **Debug and replay** - Reproduce issues from event streams

**Conceptual API:**
```javascript
wampy.subscribe('com.myapp.orders.', {
    onEvent: handleOrderEvent,
    history: {
        since: Date.now() - 3600000,  // Last hour
        limit: 100  // Max 100 events
    }
});
```

## Pattern-based Subscriptions

Subscribe to multiple topics using URI patterns instead of exact topic URIs.

### Prefix Matching

Receive events from all topics with a given prefix:

```javascript
// Subscribe to all user events
wampy.subscribe('com.myapp.users.', {
    onEvent: function(args, kwargs, details) {
        console.log('User event on topic:', details.topic);
        console.log('Event data:', args, kwargs);
    },
    match: 'prefix'
});

// Receives events from:
// com.myapp.users.created
// com.myapp.users.updated
// com.myapp.users.deleted
// com.myapp.users.login
// etc.
```

### Wildcard Matching

Use wildcards for flexible pattern matching:

```javascript
// Subscribe to all "created" events across resources
wampy.subscribe('com.myapp..created', {
    onEvent: function(args, kwargs, details) {
        const parts = details.topic.split('.');
        const resource = parts[2];  // users, orders, products, etc.
        console.log(`${resource} created:`, kwargs);
    },
    match: 'wildcard'
});

// Receives events from:
// com.myapp.users.created
// com.myapp.orders.created
// com.myapp.products.created
```

### Multiple Pattern Subscriptions

Combine patterns for complex event routing:

```javascript
// Monitor all critical system events
wampy.subscribe('com.myapp..error', {
    onEvent: handleError,
    match: 'wildcard'
});

wampy.subscribe('com.myapp..alert', {
    onEvent: handleAlert,
    match: 'wildcard'
});

// Aggregate metrics from all services
wampy.subscribe('com.myapp.services.', {
    onEvent: aggregateMetrics,
    match: 'prefix'
});
```

## Publication Trust Levels<Badge text="Roadmap"/>

Trust levels will allow publishers and subscribers to indicate the criticality and reliability requirements of events.

### Planned Levels

- **Best effort** - Fire and forget, no guarantees
- **Acknowledged** - Publisher receives confirmation of delivery
- **Persistent** - Event stored until delivered to all subscribers
- **Transactional** - Atomic delivery to subscriber groups

### Anticipated Use Cases

- **Critical alerts** - Ensure delivery to all monitoring systems
- **Financial transactions** - Atomic event processing
- **Audit events** - Guaranteed persistence
- **Telemetry** - Best effort for high-volume data

## Publisher Exclusion

Control whether publishers receive their own published events.

### Exclude Self

Don't receive your own publications:

```javascript
wampy.publish('com.myapp.chat.message', ['Hello!'], {}, {
    exclude_me: true
});

// This session's own subscription won't receive the event
wampy.subscribe('com.myapp.chat.message', {
    onEvent: function(args) {
        // Only receives messages from other sessions
        console.log('Message from others:', args[0]);
    }
});
```

### Include Self

Receive your own publications (default behavior):

```javascript
wampy.publish('com.myapp.updates', [data], {}, {
    exclude_me: false  // Default, can omit
});
```

### Use Cases

- **Chat applications** - Don't echo your own messages
- **Collaborative editing** - Don't trigger on own changes
- **State synchronization** - Include all clients equally

## Publisher Identification

Subscribers can request to know who published each event.

### Requesting Publisher Info

```javascript
wampy.subscribe('com.myapp.events', {
    onEvent: function(args, kwargs, details) {
        if (details.publisher) {
            console.log('Published by session:', details.publisher);
        }
        console.log('Event data:', args, kwargs);
    },
    get_publisher: true  // Request publisher disclosure
});
```

### Publisher Must Consent

Publishers must allow disclosure:

```javascript
wampy.publish('com.myapp.events', [data], {}, {
    disclose_me: true  // Allow identity disclosure
});
```

Only when both subscriber requests (`get_publisher: true`) and publisher allows (`disclose_me: true`) is the publisher's session ID disclosed.

### Use Cases

- **Audit logging** - Track who triggered events
- **Access control** - Filter events by publisher
- **Attribution** - Show who made changes
- **Debugging** - Trace event sources

## Subscriber Black- and White-listing

Control which specific sessions receive events.

### Eligible List (Whitelist)

Send events only to specific subscribers:

```javascript
wampy.publish('com.myapp.admin.command', [command], {}, {
    eligible: [session_id_1, session_id_2]  // Only these sessions
});
```

All other subscribers to `com.myapp.admin.command` will not receive this event.

### Exclude List (Blacklist)

Send events to all subscribers except specific ones:

```javascript
wampy.publish('com.myapp.broadcast', [announcement], {}, {
    exclude: [session_id_3, session_id_4]  // Everyone except these
});
```

### Combining with Publisher Exclusion

Can combine with `exclude_me`:

```javascript
wampy.publish('com.myapp.updates', [data], {}, {
    exclude_me: true,
    exclude: [session_id_5]  // Exclude self and session_id_5
});
```

### Use Cases

- **Targeted notifications** - Send alerts to specific users
- **Permission-based events** - Respect additional authorization
- **Rate limiting** - Skip overloaded subscribers
- **Testing** - Exclude canary subscribers

## Subscription Revocation<Badge text="WIP"/>

The ability to forcibly revoke subscriptions from the router side.

### Planned Capabilities

Router administrators will be able to:
- Revoke specific subscriptions by subscription ID
- Revoke all subscriptions for a session
- Revoke all subscriptions to a topic
- Provide reason codes for revocation

### Anticipated Use Cases

- **Security** - Remove compromised session subscriptions
- **Resource management** - Enforce subscription quotas
- **Administrative** - Clean up abandoned subscriptions
- **Dynamic authorization** - Revoke when permissions change

**Conceptual API:**
```javascript
// Admin revokes subscription
wampy.call('bondy.subscription.revoke', [subscription_id], {
    reason: 'permissions_changed'
});
```

## Payload Passthru Mode<Badge text="WIP"/>

Bypass router payload processing for performance-critical scenarios.

### Planned Behavior

In passthru mode:
- Router doesn't deserialize event payload
- Router doesn't validate payload structure
- Router forwards raw bytes directly to subscribers
- Significant performance improvement for large payloads

### Tradeoffs

**Benefits:**
- Lower latency for large events
- Reduced router CPU usage
- Higher throughput

**Limitations:**
- No payload validation
- No transformation or filtering on payload
- All subscribers must use same serialization

### Anticipated Use Cases

- **Video streaming** - Large binary frames
- **File transfer** - Raw file chunks
- **High-frequency data** - Sensor streams, market data
- **Pre-serialized payloads** - Application handles serialization

## Sharded Subscriptions<Badge text="Roadmap"/>

Distribute events across subscriber groups for parallel processing.

### Planned Capabilities

Instead of all subscribers receiving each event, sharding will distribute events across subscribers:

```javascript
// Subscribers join a shard group
wampy.subscribe('com.myapp.work_queue', {
    onEvent: processWork,
    shard: 'worker_group',  // Shard group name
    shard_strategy: 'roundrobin'  // Distribution strategy
});
```

Events published to `com.myapp.work_queue` will be distributed across all subscribers in the `worker_group` shard using the specified strategy.

### Anticipated Strategies

- **Round robin** - Even distribution
- **Random** - Statistical distribution
- **Hash-based** - Consistent routing by key
- **Load-aware** - Route to least-busy subscriber

### Use Cases

- **Work queues** - Distribute tasks across workers
- **Load balancing** - Parallel event processing
- **Stream partitioning** - Shard by key for ordering guarantees
- **Fan-out workers** - Scale event consumers horizontally

## Best Practices

### Event Design

**Keep events focused:**
```javascript
// Good - specific, focused event
wampy.publish('com.myapp.order.payment_received', null, {
    order_id: '123',
    amount: 99.99,
    timestamp: Date.now()
});

// Avoid - generic event requiring conditionals
wampy.publish('com.myapp.order.updated', null, {
    order_id: '123',
    update_type: 'payment_received',  // Subscribers must check type
    data: {...}
});
```

### Pattern Subscription Strategy

Use the most specific pattern possible:

```javascript
// Too broad - receives everything
wampy.subscribe('com.myapp.', {...}, 'prefix');

// Better - specific domain
wampy.subscribe('com.myapp.orders.', {...}, 'prefix');

// Best - exact when possible
wampy.subscribe('com.myapp.orders.completed', {...});
```

### Retention Guidelines

**Use retention for:**
- State that changes infrequently
- Last known values
- Configuration updates

**Don't use retention for:**
- High-frequency streams
- Events with strict ordering requirements
- Large payloads

### Publisher Identification

**Enable disclosure when:**
- Audit requirements demand it
- Authorization depends on publisher
- Debugging event sources

**Disable disclosure when:**
- Privacy is required
- Publisher identity is irrelevant
- Performance is critical

## Summary

Advanced PubSub features provide fine-grained control over event distribution:

- **Event retention** - Last value delivery for late subscribers
- **Event history** (roadmap) - Historical event replay
- **Pattern subscriptions** - Flexible topic matching
- **Publication trust levels** (roadmap) - Reliability guarantees
- **Publisher exclusion** - Control self-reception
- **Publisher identification** - Track event sources
- **Subscriber filtering** - Whitelist/blacklist delivery
- **Subscription revocation** (WIP) - Administrative control
- **Payload passthru** (WIP) - Performance optimization
- **Sharded subscriptions** (roadmap) - Parallel processing

These capabilities make WAMP PubSub suitable for production systems requiring sophisticated event-driven architectures.

For fundamental concepts, see [Publish/Subscribe](/concepts/wamp/pubsub). For practical patterns, see [Beyond the Basics](/concepts/wamp/beyond_the_basics).
