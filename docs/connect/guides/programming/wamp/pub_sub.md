---
related:
    - text: Advanced Publish/Subscribe
      type: Concept
      link: /connect/concepts/wamp/advanced/pubsub
      description: The protocol-level mechanics behind every feature below.
    - text: Publish/Subscribe
      type: Concept
      link: /connect/concepts/wamp/pubsub
      description: The fundamentals of Publish/Subscribe in WAMP.
---
# Publish and Subscribe

This guide shows the practical, Python side of Pub/Sub programming against Bondy — assuming you already know what a subscription, a publication, and a topic are. For the protocol-level mechanics of each advanced feature, see [Advanced Publish/Subscribe](/connect/concepts/wamp/advanced/pubsub); this guide only shows how to reach for it in code.

## How Subscriptions Work

A subscription binds a topic URI to your session on the router; Bondy delivers any matching publication to it, rather than a publisher addressing subscribers directly — publishers and subscribers never need to know about each other. See [Publish/Subscribe](/connect/concepts/wamp/pubsub) for why WAMP works this way.

## Basic Subscription

Typically you subscribe on the session's `on_join` callback, the same way you'd register a procedure:

::: code-group
```Python
async def _on_join(self, session, details):
    self._session = session
    await self._session.subscribe(self.on_order_created, "com.example.order.created")

def on_order_created(order_id, **kwargs):
    print(f"Order created: {order_id}")
```
:::

And publishing:

::: code-group
```Python
await self._session.publish("com.example.order.created", order_id)
```
:::

By default a publication doesn't wait for acknowledgement — pass `options=PublishOptions(acknowledge=True)` if you need to confirm the router accepted it.

## Subscriber Black- and Whitelisting

Restrict which sessions receive a specific publication, regardless of who else is subscribed:

::: code-group
```Python
from autobahn.wamp.types import PublishOptions

# Only these sessions receive it
await self._session.publish(
    "com.example.admin.command", command,
    options=PublishOptions(eligible=[session_id_1, session_id_2])
)

# Everyone except these sessions receives it
await self._session.publish(
    "com.example.broadcast", announcement,
    options=PublishOptions(exclude=[session_id_3])
)

# Only sessions holding the operator role receive it
await self._session.publish(
    "com.example.ops.alert", alert,
    options=PublishOptions(eligible_authrole=["operator"])
)
```
:::

An empty `eligible` list delivers the event to no subscriber.

See [Subscriber Black- and White-listing](/connect/concepts/wamp/advanced/pubsub#subscriber-black-and-whitelisting) for combining this with excluding the publisher itself.

## Publisher Exclusion

By default Bondy does not deliver a publication to its own publisher, even when the publisher is subscribed to the topic. `exclude_me` defaults to `true`. To receive your own publication, set `exclude_me` to `False`:

::: code-group
```Python
from autobahn.wamp.types import PublishOptions

await self._session.publish(
    "com.example.state.updated", state,
    options=PublishOptions(exclude_me=False)
)
```
:::

Keep the default for chat and collaborative-editing topics, where a publisher does not need its own message echoed back.

## Publisher Identification

Bondy discloses the publisher to subscribers by default. To read the publisher's identity, subscribe with `SubscribeOptions(details_arg=...)` and read `details.publisher`, `details.publisher_authid` and `details.publisher_authrole`:

::: code-group
```Python
from autobahn.wamp.types import SubscribeOptions

# Subscriber: read the publisher's identity
def on_event(data, details=None):
    print("Published by session:", details.publisher)
    print("Authenticated as:", details.publisher_authid)

await self._session.subscribe(
    on_event, "com.example.events",
    options=SubscribeOptions(details_arg="details")
)

# Publisher: no option is needed
await self._session.publish("com.example.events", data)
```
:::

Bondy omits the publisher only when the `PUBLISH` sets `disclose_me` to `false`. See [Publisher Identification](/connect/concepts/wamp/advanced/pubsub#publisher-identification).

## Pattern-Based Subscriptions

Subscribe to a URI prefix or wildcard instead of an exact topic to receive events from a whole family of topics on one subscription:

::: code-group
```Python
from autobahn.wamp.types import SubscribeOptions

def on_user_event(*args, details=None, **kwargs):
    print("Event on topic:", details.topic)

await self._session.subscribe(
    on_user_event, "com.example.users.",
    options=SubscribeOptions(match="prefix", details_arg="details")
)

# Receives com.example.users.created, com.example.users.updated, etc.
```
:::

`details.topic` carries the exact topic a publication was sent to, so one subscription can dispatch by suffix. See [Pattern-based Subscriptions](/connect/concepts/wamp/advanced/pubsub#pattern-based-subscriptions) for `prefix` vs. `wildcard` matching.

## Event Retention

Bondy can retain the last event on a topic and deliver it to a subscriber that was not connected when it was published — configured node-wide via [`wamp.message_retention.*`](/connect/reference/configuration/wamp#message-retention). A publisher opts a specific event into retention, and a subscriber opts into receiving it on subscribe:

::: code-group
```Python
from autobahn.wamp.types import PublishOptions, SubscribeOptions

# Publisher retains this event
await self._session.publish(
    "com.example.service.status", None,
    status="operational",
    options=PublishOptions(retain=True)
)

# A subscriber joining later still gets the last retained event immediately
await self._session.subscribe(
    on_status, "com.example.service.status",
    options=SubscribeOptions(get_retained=True)
)
```
:::

This is retention of the *last* event per topic, not a queryable history of many past events — see [Event Retention](/connect/concepts/wamp/advanced/pubsub#event-retention) for the exact semantics, and [Message Retention](/connect/reference/configuration/wamp#message-retention) for the storage limits (`max_messages`, `max_memory`, `max_message_size`, `default_ttl`) that bound it.

## Subscription Meta Events and Procedures

Bondy publishes a subscription's lifecycle as WAMP meta-events, and lets a session introspect the registry directly, both under the reserved `wamp.subscription.*` namespace:

::: code-group
```Python
# Watch subscribe/unsubscribe on this realm
await self._session.subscribe(
    on_subscribed, "wamp.subscription.on_subscribe"
)
await self._session.subscribe(
    on_unsubscribed, "wamp.subscription.on_unsubscribe"
)

# List the subscriptions an event on a topic would reach
sub_ids = await self._session.call("wamp.subscription.match", "com.example.users.created")
```
:::

Use this for operational visibility — knowing when a topic gains or loses subscribers — rather than as part of your application's own event path. Bondy does not publish [`wamp.subscription.on_create` or `wamp.subscription.on_delete`](/connect/reference/wamp_api/subscription#topics). To learn whether a topic still has subscribers, call `wamp.subscription.lookup` or `wamp.subscription.match`.

## See also

- [Advanced Publish/Subscribe](/connect/concepts/wamp/advanced/pubsub) — the protocol-level mechanics behind every feature above.
- [Publish/Subscribe](/connect/concepts/wamp/pubsub) — the fundamentals.
- [Message Retention](/connect/reference/configuration/wamp#message-retention) — node-wide retention limits.
