---
related:
    - text: Advanced Publish/Subscribe
      type: Concept
      link: /wamp/concepts/advanced/pubsub
      description: The protocol-level mechanics behind every feature below.
    - text: Publish/Subscribe
      type: Concept
      link: /wamp/concepts/pubsub
      description: The fundamentals of Publish/Subscribe in WAMP.
---
# Publish and Subscribe

This guide shows the practical, Python side of Pub/Sub programming against Bondy — assuming you already know what a subscription, a publication, and a topic are. For the protocol-level mechanics of each advanced feature, see [Advanced Publish/Subscribe](/wamp/concepts/advanced/pubsub); this guide only shows how to reach for it in code.

## How Subscriptions Work

A subscription binds a topic URI to your session on the router; Bondy delivers any matching publication to it, rather than a publisher addressing subscribers directly — publishers and subscribers never need to know about each other. See [Publish/Subscribe](/wamp/concepts/pubsub) for why WAMP works this way.

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
```
:::

See [Subscriber Black- and White-listing](/wamp/concepts/advanced/pubsub#subscriber-black-and-white-listing) for combining this with excluding the publisher itself.

## Publisher Exclusion

By default a publisher that's also subscribed to its own topic receives its own publication. Opt out with `exclude_me`:

::: code-group
```Python
from autobahn.wamp.types import PublishOptions

await self._session.publish(
    "com.example.chat.message", "Hello!",
    options=PublishOptions(exclude_me=True)
)
```
:::

Useful for chat and collaborative-editing style topics, where a publisher shouldn't see its own message echoed back.

## Publisher Identification

A subscriber that wants to know who published an event requests disclosure with `SubscribeOptions(details_arg=...)`, reading `details.publisher` on delivery; the publisher must separately opt in with `PublishOptions(disclose_me=True)`, or nothing is disclosed:

::: code-group
```Python
from autobahn.wamp.types import SubscribeOptions, PublishOptions

# Subscriber: request publisher disclosure and read it
def on_event(data, details=None):
    print("Published by session:", details.publisher)

await self._session.subscribe(
    on_event, "com.example.events",
    options=SubscribeOptions(details_arg="details")
)

# Publisher: consent to being identified
await self._session.publish(
    "com.example.events", data,
    options=PublishOptions(disclose_me=True)
)
```
:::

Both sides must agree — a subscriber that requests disclosure still sees nothing if the publisher didn't set `disclose_me`.

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

`details.topic` carries the exact topic a publication was sent to, so one subscription can dispatch by suffix. See [Pattern-based Subscriptions](/wamp/concepts/advanced/pubsub#pattern-based-subscriptions) for `prefix` vs. `wildcard` matching.

## Event History

Bondy can retain recent events on a topic and deliver them to a subscriber that wasn't connected when they were published — configured node-wide via [`wamp.message_retention.*`](/router/reference/configuration/wamp#message-retention). A publisher opts a specific event into retention, and a subscriber opts into receiving it on subscribe:

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

This is retention of the *last* event per topic, not a queryable history of many past events — see [Event Retention](/wamp/concepts/advanced/pubsub#event-retention) for the exact semantics, and [Message Retention](/router/reference/configuration/wamp#message-retention) for the storage limits (`max_messages`, `max_memory`, `max_message_size`, `default_ttl`) that bound it.

## Subscription Meta Events and Procedures

Bondy publishes a subscription's lifecycle as WAMP meta-events, and lets a session introspect the registry directly, both under the reserved `wamp.subscription.*` namespace:

::: code-group
```Python
# Watch subscribe/unsubscribe on this realm
await self._session.subscribe(
    on_subscription_created, "wamp.subscription.on_create"
)
await self._session.subscribe(
    on_subscription_gone, "wamp.subscription.on_delete"
)

# Look up who is currently subscribed to a topic
info = await self._session.call("wamp.subscription.match", "com.example.users.created")
```
:::

Use this for operational visibility — knowing when a topic gains or loses subscribers — rather than as part of your application's own event path.

## See also

- [Advanced Publish/Subscribe](/wamp/concepts/advanced/pubsub) — the protocol-level mechanics behind every feature above.
- [Publish/Subscribe](/wamp/concepts/pubsub) — the fundamentals.
- [Message Retention](/router/reference/configuration/wamp#message-retention) — node-wide retention limits.
