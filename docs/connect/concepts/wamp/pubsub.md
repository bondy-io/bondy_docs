---
related:
    - text: Communication Patterns
      type: concepts
      link: /connect/concepts/wamp/communication_patterns
      description: Understanding RPC and PubSub patterns in WAMP.
    - text: Advanced Publish/Subscribe
      type: concepts
      link: /connect/concepts/wamp/advanced/pubsub
      description: Advanced PubSub features like event retention, subscriber lists and publisher exclusion.
    - text: Introduction to WAMP
      type: concepts
      link: /connect/concepts/wamp/introduction
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

<PubSubBasicFlowDiagram />

### WAMP Messages

**Subscribe**

::: code-group sdk

```javascript [JavaScript]
wampy.subscribe('com.myapp.sensor.temperature', function(args, kwargs, details) {
    console.log('Temperature:', args[0]);
});
```

```erlang [Erlang]
OnTemperature = fun([Temperature], _KWArgs, _Details) ->
    io:format("Temperature: ~p~n", [Temperature])
end,

{ok, _SubscriptionId} = bondy_connect_client:subscribe(
    Conn, <<"com.myapp.sensor.temperature">>, OnTemperature
).
```

:::

**Publish**

::: code-group sdk

```javascript [JavaScript]
wampy.publish('com.myapp.sensor.temperature', [25.5], {
    unit: 'celsius',
    sensor_id: 'temp_01'
});
```

```erlang [Erlang]
ok = bondy_connect_client:publish(
    Conn, <<"com.myapp.sensor.temperature">>, [25.5], #{
        <<"unit">> => <<"celsius">>,
        <<"sensor_id">> => <<"temp_01">>
    }
).
```

:::

## Topics

Topics are identified by URIs using dot-notation:
- `com.myapp.events.user.login`
- `com.myapp.sensors.temperature`
- `com.myapp.notifications.email.sent`

### Topic Matching

WAMP supports three matching policies:

**Exact Match** (default)

::: code-group sdk

```javascript [JavaScript]
// Subscribe
wampy.subscribe('com.myapp.user.created', handler);

// Receives only exact matches
// com.myapp.user.created ✓
// com.myapp.user.updated ✗
```

```erlang [Erlang]
%% Subscribe
{ok, _} = bondy_connect_client:subscribe(
    Conn, <<"com.myapp.user.created">>, Handler
).

%% Receives only exact matches
%% com.myapp.user.created ✓
%% com.myapp.user.updated ✗
```

:::

**Prefix Match**

::: code-group sdk

```javascript [JavaScript]
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

```erlang [Erlang]
%% Subscribe with prefix
{ok, _} = bondy_connect_client:subscribe(
    Conn, <<"com.myapp.user.">>, Handler, #{match => <<"prefix">>}
).

%% Receives all matching prefix
%% com.myapp.user.created ✓
%% com.myapp.user.updated ✓
%% com.myapp.user.deleted ✓
```

:::

**Wildcard Match**

::: code-group sdk

```javascript [JavaScript]
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

```erlang [Erlang]
%% Subscribe with wildcard
{ok, _} = bondy_connect_client:subscribe(
    Conn, <<"com.myapp..created">>, Handler, #{match => <<"wildcard">>}
).

%% Receives wildcard matches
%% com.myapp.user.created ✓
%% com.myapp.order.created ✓
%% com.myapp.product.created ✓
```

:::

## Publishing

### Simple Publish

::: code-group sdk

```javascript [JavaScript]
wampy.publish('com.myapp.notification', ['Hello World']);
```

```erlang [Erlang]
ok = bondy_connect_client:publish(
    Conn, <<"com.myapp.notification">>, [<<"Hello World">>]
).
```

:::

### Publish with Keyword Arguments

::: code-group sdk

```javascript [JavaScript]
wampy.publish('com.myapp.user.created', null, {
    user_id: 123,
    username: 'alice',
    email: 'alice@example.com'
});
```

```erlang [Erlang]
ok = bondy_connect_client:publish(
    Conn, <<"com.myapp.user.created">>, [], #{
        <<"user_id">> => 123,
        <<"username">> => <<"alice">>,
        <<"email">> => <<"alice@example.com">>
    }
).
```

:::

### Publish Options

::: code-group sdk

```javascript [JavaScript]
wampy.publish('com.myapp.event', ['data'], {}, {
    acknowledge: true,  // Get confirmation of publish
    exclude_me: false,  // Receive own publications
    exclude: [session_id],  // Exclude specific sessions
    eligible: [session_id]  // Only send to specific sessions
});
```

```erlang [Erlang]
%% publish_ack/5 waits for the router's confirmation of the publish
{ok, _PublicationId} = bondy_connect_client:publish_ack(
    Conn, <<"com.myapp.event">>, [<<"data">>], #{}, #{
        exclude_me => false,     %% Receive own publications
        exclude => [SessionId],  %% Exclude specific sessions
        eligible => [SessionId]  %% Only send to specific sessions
    }
).
```

:::

## Subscribing

### Basic Subscription

::: code-group sdk

```javascript [JavaScript]
function onEvent(args, kwargs, details) {
    console.log('Event received:', args, kwargs);
    console.log('Publisher:', details.publisher);
}

wampy.subscribe('com.myapp.events', onEvent);
```

```erlang [Erlang]
OnEvent = fun(Args, KWArgs, Details) ->
    io:format("Event received: ~p ~p~n", [Args, KWArgs]),
    io:format("Publisher: ~p~n", [maps:get(publisher, Details)])
end,

{ok, _} = bondy_connect_client:subscribe(
    Conn, <<"com.myapp.events">>, OnEvent
).
```

:::

### Subscription Options

::: code-group sdk

```javascript [JavaScript]
wampy.subscribe('com.myapp.events', {
    onEvent: onEvent,
    match: 'exact',  // exact | prefix | wildcard
    get_retained: true  // Retrieve retained events
});
```

```erlang [Erlang]
{ok, _} = bondy_connect_client:subscribe(
    Conn, <<"com.myapp.events">>, OnEvent, #{
        match => <<"exact">>,  %% exact | prefix | wildcard
        get_retained => true   %% Retrieve retained events
    }
).
```

:::

### Unsubscribing

::: code-group sdk

```javascript [JavaScript]
// Subscribe and store reference
wampy.subscribe('com.myapp.events', onEvent);

// Later, unsubscribe by topic
wampy.unsubscribe('com.myapp.events');

// Or unsubscribe with callback
wampy.unsubscribe('com.myapp.events', onEvent);
```

```erlang [Erlang]
%% Subscribe and keep the subscription id
{ok, SubscriptionId} = bondy_connect_client:subscribe(
    Conn, <<"com.myapp.events">>, OnEvent
),

%% Later, unsubscribe by topic
ok = bondy_connect_client:unsubscribe(Conn, <<"com.myapp.events">>).

%% Or unsubscribe by subscription id:
%% ok = bondy_connect_client:unsubscribe(Conn, SubscriptionId).
```

:::

## Use Cases

### Real-Time Updates

Broadcasting state changes to all connected clients:

::: code-group sdk

```javascript [JavaScript]
// Backend publishes order status
wampy.publish('com.shop.order.status_changed', null, {
    order_id: 12345,
    status: 'shipped',
    tracking_number: 'ABC123'
});

// All interested clients receive update
```

```erlang [Erlang]
%% Backend publishes order status
ok = bondy_connect_client:publish(
    Conn, <<"com.shop.order.status_changed">>, [], #{
        <<"order_id">> => 12345,
        <<"status">> => <<"shipped">>,
        <<"tracking_number">> => <<"ABC123">>
    }
).

%% All interested clients receive update
```

:::

### Event Notifications

Notifying systems of important events:

::: code-group sdk

```javascript [JavaScript]
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

```erlang [Erlang]
%% User service publishes
ok = bondy_connect_client:publish(
    Conn, <<"com.myapp.user.registered">>, [], #{
        <<"user_id">> => 789,
        <<"timestamp">> => erlang:system_time(millisecond)
    }
).

%% Multiple services subscribe:
%% - Email service sends welcome email
%% - Analytics service tracks signup
%% - CRM system creates record
```

:::

### Live Data Feeds

Streaming sensor data or market data:

::: code-group sdk

```javascript [JavaScript]
// IoT device publishes readings
setInterval(() => {
    wampy.publish('com.iot.sensor.temperature', [getCurrentTemp()]);
}, 1000);

// Dashboard subscribes and displays
wampy.subscribe('com.iot.sensor.temperature', updateChart);
```

```erlang [Erlang]
%% IoT device publishes readings
{ok, _Timer} = timer:apply_interval(1000, fun() ->
    bondy_connect_client:publish(
        Conn, <<"com.iot.sensor.temperature">>, [get_current_temp()]
    )
end),

%% Dashboard subscribes and displays
{ok, _} = bondy_connect_client:subscribe(
    Conn, <<"com.iot.sensor.temperature">>, UpdateChart
).
```

:::

### Activity Streams

Broadcasting user activities:

::: code-group sdk

```javascript [JavaScript]
// Publish user action
wampy.publish('com.app.activity.user_logged_in', null, {
    user: 'alice',
    ip: '192.168.1.10'
});

// Admin dashboard subscribes to monitor activity
```

```erlang [Erlang]
%% Publish user action
ok = bondy_connect_client:publish(
    Conn, <<"com.app.activity.user_logged_in">>, [], #{
        <<"user">> => <<"alice">>,
        <<"ip">> => <<"192.168.1.10">>
    }
).

%% Admin dashboard subscribes to monitor activity
```

:::

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

To give a late subscriber the last event of a topic, see [event retention](/connect/concepts/wamp/advanced/pubsub#event-retention). Bondy does not implement event history.

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

::: code-group sdk

```javascript [JavaScript]
wampy.publish('com.myapp.order.created', null, {
    order_id: 123,
    user_id: 456,
    timestamp: Date.now()
});
```

```erlang [Erlang]
ok = bondy_connect_client:publish(
    Conn, <<"com.myapp.order.created">>, [], #{
        <<"order_id">> => 123,
        <<"user_id">> => 456,
        <<"timestamp">> => erlang:system_time(millisecond)
    }
).
```

:::

### Subscribing

**Be specific when possible:**
```
// Prefer exact topics
com.myapp.order.created

// Over broad prefixes
com.myapp.
```

**Handle subscription errors:**

::: code-group sdk

```javascript [JavaScript]
wampy.subscribe('com.myapp.events', {
    onEvent: handler,
    onSuccess: function() { console.log('Subscribed'); },
    onError: function(err) { console.error('Subscription failed:', err); }
});
```

```erlang [Erlang]
case bondy_connect_client:subscribe(Conn, <<"com.myapp.events">>, Handler) of
    {ok, _SubscriptionId} ->
        io:format("Subscribed~n");
    {error, Error} ->
        io:format("Subscription failed: ~p~n", [Error])
end.
```

:::

**Clean up subscriptions:**

::: code-group sdk

```javascript [JavaScript]
// Unsubscribe when no longer needed
wampy.unsubscribe('com.myapp.events', handler);
```

```erlang [Erlang]
%% Unsubscribe when no longer needed
ok = bondy_connect_client:unsubscribe(Conn, <<"com.myapp.events">>).
```

:::

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

A grant names a URI and a match policy (`exact`, `prefix` or `wildcard`):
```
# Allow subscribe to all user events (match: prefix)
com.myapp.users.user.

# Allow publish only to specific topics (match: exact)
com.myapp.admin.system.alert
```

### Topic Isolation

Within a Realm, topics can be protected:
- Public topics - Anyone can subscribe/publish
- Protected topics - Restricted by permissions
- Private topics - Single user/group only

## See Also

- [Advanced Publish/Subscribe](/connect/concepts/wamp/advanced/pubsub) - Event retention, subscriber lists, and more
- [Communication Patterns](/connect/concepts/wamp/communication_patterns) - RPC vs PubSub
- [Routed RPC](/connect/concepts/wamp/rpc) - Request-response pattern
- [Security](/connect/concepts/wamp/security) - Authentication and authorization
