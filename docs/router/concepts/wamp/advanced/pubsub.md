---
draft: false
related:
    - text: Publish/Subscribe
      type: concepts
      link: /router/concepts/wamp/pubsub
      description: Learn the fundamentals of Publish/Subscribe in WAMP.
    - text: Beyond the Basics
      type: concepts
      link: /router/concepts/wamp/beyond_the_basics
      description: Essential advanced features for production systems.
---
# Advanced Publish/Subscribe

This page explains the Publish/Subscribe features Bondy implements beyond plain topic subscription: event retention, pattern-based subscriptions, publisher exclusion and identification, subscriber black- and whitelisting, Payload Passthru Mode and topic reflection. Each feature is controlled by options on `PUBLISH` or `SUBSCRIBE`. For which WAMP features Bondy announces and implements, see [WAMP](/router/reference/protocols/wamp).

## Event Retention

Event retention lets the router keep the most recent event published to a topic and deliver it to a session that subscribes later. A subscriber that joins after the event was published still gets the last known value.

A realm holds at most one retained event per topic. A new retained publication replaces the previous one. Bondy stores the event whether or not the topic has subscribers at the time.

### Retaining an Event

The publisher asks Bondy to retain an event with the `retain` option:

```javascript
wampy.publish('com.myapp.events.important', [eventData], {}, {
    retain: true
});
```

A retained event lives until it is replaced or expires. The publisher sets its lifetime in seconds with the Bondy-specific `_retained_ttl` option. Without it, Bondy applies `wamp.message_retention.default_ttl`; a value of `0` means the event never expires. An event larger than `wamp.message_retention.max_message_size` is delivered to current subscribers but not retained. See [message retention](/router/reference/configuration/wamp) for these settings.

```javascript
wampy.publish('com.myapp.service.status', null, {
    status: 'operational',
    version: '2.1.0'
}, {
    retain: true,
    _retained_ttl: 3600  // Expires after one hour
});
```

### Receiving Retained Events

The subscriber asks for retained events with the `get_retained` option:

```javascript
wampy.subscribe('com.myapp.service.status', {
    onEvent: function(args, kwargs, details) {
        if (details.retained) {
            console.log('Last known status:', kwargs);
        }
        updateDashboard(kwargs);
    },
    get_retained: true
});
```

When the subscription is created, Bondy sends the retained event at once, followed by new events as they are published. A retained event carries `retained: true` in its details, so the subscriber can tell it apart from a live event.

The subscription's matching policy applies to retained events too. A `prefix` or `wildcard` subscription receives the retained event of every matching topic, not just one.

The publisher's delivery constraints travel with the retained event. If the publication excluded a session, or listed eligible sessions, Bondy applies those lists when a later subscriber asks for the retained event. Because `exclude_me` defaults to `true`, a publisher does not receive its own retained event unless it published with `exclude_me: false`.

### Use Cases

- **State synchronization**: new clients get the current state immediately.
- **Last known value**: dashboards display the most recent reading.
- **Configuration updates**: services receive the latest configuration on startup.

## Event History

Bondy does not implement event history; it retains only the most recent event per topic (see [Event Retention](#event-retention) and [WAMP](/router/reference/protocols/wamp)).

## Pattern-based Subscriptions

A subscription can match many topics by giving a URI pattern and a matching policy in the `match` option. Bondy supports the three WAMP policies: `exact` (the default), `prefix` and `wildcard`. Because one subscription can then receive events from several topics, Bondy always includes the concrete `topic` in the event details.

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

An empty URI component in the pattern matches any single component:

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

One session can hold several pattern subscriptions:

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

## Publication Trust Levels

Bondy does not implement publication trust levels. See [WAMP](/router/reference/protocols/wamp).

## Publisher Exclusion

By default a publisher does not receive its own event, even when it is subscribed to the topic it publishes to. The `exclude_me` option controls this and defaults to `true`.

### Excluding the Publisher

Omit `exclude_me`, or set it to `true`:

```javascript
wampy.publish('com.myapp.chat.message', ['Hello!']);

// This session's own subscription does not receive the event
wampy.subscribe('com.myapp.chat.message', {
    onEvent: function(args) {
        // Only receives messages from other sessions
        console.log('Message from others:', args[0]);
    }
});
```

### Including the Publisher

Set `exclude_me` to `false` to receive your own publication:

```javascript
wampy.publish('com.myapp.updates', [data], {}, {
    exclude_me: false
});
```

### Use Cases

- **Chat applications**: do not echo your own messages back.
- **Collaborative editing**: do not react to your own changes.
- **State synchronization**: set `exclude_me: false` so every client, the publisher included, applies the same update path.

## Publisher Identification

An event can tell the subscriber who published it. The publisher controls disclosure with the `disclose_me` option, which defaults to `true`. Unless the publisher sets `disclose_me: false`, Bondy adds these attributes to the event details:

- `publisher`: the publisher's session ID.
- `publisher_authid`: the publisher's authentication ID.
- `publisher_authrole`: the publisher's authentication role.

The subscriber does not need to ask for this information.

```javascript
wampy.subscribe('com.myapp.events', {
    onEvent: function(args, kwargs, details) {
        if (details.publisher) {
            console.log('Published by session:', details.publisher);
            console.log('authid:', details.publisher_authid);
        }
    }
});
```

A publisher that wants to stay anonymous opts out:

```javascript
wampy.publish('com.myapp.events', [data], {}, {
    disclose_me: false
});
```

### Use Cases

- **Audit logging**: record who triggered an event.
- **Attribution**: show who made a change.
- **Debugging**: trace an event to its source session.

## Subscriber Black- and Whitelisting

A publisher can restrict which subscribers receive an event by listing session IDs. Bondy honours two options:

- `eligible`: only the listed sessions receive the event.
- `exclude`: the listed sessions do not receive the event.

WAMP also defines `eligible_authid`, `exclude_authid`, `eligible_authrole` and `exclude_authrole`. Bondy accepts these options and ignores them: filtering by authentication ID or role has no effect.

### Eligible List (Whitelist)

```javascript
wampy.publish('com.myapp.admin.command', [command], {}, {
    eligible: [session_id_1, session_id_2]  // Only these sessions
});
```

Other subscribers to `com.myapp.admin.command` do not receive this event.

### Exclude List (Blacklist)

```javascript
wampy.publish('com.myapp.broadcast', [announcement], {}, {
    exclude: [session_id_3, session_id_4]  // Everyone except these
});
```

### Combining with Publisher Exclusion

When `exclude_me` is `true`, which is the default, Bondy adds the publisher's own session to the exclude list. A session that appears in both `eligible` and the exclude list does not receive the event.

```javascript
wampy.publish('com.myapp.updates', [data], {}, {
    exclude: [session_id_5]  // Excludes session_id_5 and, by default, the publisher
});
```

### Use Cases

- **Targeted notifications**: send an event to specific sessions.
- **Testing**: keep canary subscribers out of a publication.

## Subscription Revocation

Bondy does not implement subscription revocation. See [WAMP](/router/reference/protocols/wamp).

## Payload Passthru Mode

In Payload Passthru Mode the publisher sends a payload Bondy does not read. The payload is often encrypted end to end, or encoded in a format only the publisher and subscribers understand. Bondy routes it without decoding it.

A publisher turns on Payload Passthru Mode by setting `ppt_scheme` in the `PUBLISH` options. The payload must then be a single binary value in the arguments list, with no keyword arguments; Bondy rejects any other payload shape. These options describe the payload:

- `ppt_scheme` (required): identifies the key management scheme, for example the name of a key provider known to the subscribers.
- `ppt_serializer`: the serializer used to encode the payload, such as `json`, `msgpack` or `cbor`, or a tunnelled protocol such as `mqtt`.
- `ppt_cipher`: the encryption algorithm, required when the payload is encrypted.
- `ppt_keyid`: the identifier of the key used to encrypt the payload.

Bondy copies the `ppt_*` options into the details of each `EVENT`, so the subscriber learns how to decode the payload.

```javascript
wampy.publish('com.myapp.sensor.frame', [encryptedFrame], {}, {
    ppt_scheme: 'x_myapp_keys',
    ppt_serializer: 'cbor',
    ppt_cipher: 'xsalsa20poly1305',
    ppt_keyid: 'key-2026-10'
});
```

### Tradeoffs

The router cannot inspect, validate or transform a passthru payload. Bondy's own procedures need to read their arguments, so they refuse a `CALL` that uses Payload Passthru Mode (see [Serialization](/router/reference/serialization#payload-passthru-mode)). Decoding and decryption are the subscriber's job.

### Use Cases

- **End-to-end encryption**: the router never sees the plaintext.
- **Pre-serialized payloads**: the application owns the serialization.
- **Tunnelling**: carry MQTT or other protocol payloads through WAMP.

## Sharded Subscriptions

Bondy does not implement sharded subscriptions. See [WAMP](/router/reference/protocols/wamp).

## Topic Reflection

Bondy implements the WAMP topic reflection procedures `wamp.reflection.topic.list` and `wamp.reflection.topic.describe`. They return the topics a realm has described and the metadata recorded for each one. See [Interface](/router/reference/wamp_api/interface).

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
wampy.subscribe('com.myapp.', {..., match: 'prefix'});

// Better - specific domain
wampy.subscribe('com.myapp.orders.', {..., match: 'prefix'});

// Best - exact when possible
wampy.subscribe('com.myapp.orders.completed', {...});
```

### Retention Guidelines

**Use retention for:**
- State that changes infrequently
- Last known values
- Configuration updates

**Do not use retention for:**
- High-frequency streams. Bondy's retention store is not built for high publication rates.
- Large payloads. Events above `wamp.message_retention.max_message_size` are not retained.

### Publisher Identification

Disclosure is on by default. Set `disclose_me: false` when subscribers have no reason to know the publisher's identity, or when that identity must stay private.

## Summary

- **Event retention**: the last event on a topic is delivered to late subscribers.
- **Pattern-based subscriptions**: `exact`, `prefix` and `wildcard` topic matching.
- **Publisher exclusion**: `exclude_me`, on by default.
- **Publisher identification**: `disclose_me`, on by default.
- **Subscriber black- and whitelisting**: `eligible` and `exclude` by session ID.
- **Payload Passthru Mode**: opaque payloads described by `ppt_*` options.
- **Topic reflection**: `wamp.reflection.topic.*`.

Bondy does not implement event history, publication trust levels, subscription revocation or sharded subscriptions.

For fundamental concepts, see [Publish/Subscribe](/router/concepts/wamp/pubsub). For practical patterns, see [Beyond the Basics](/router/concepts/wamp/beyond_the_basics).
