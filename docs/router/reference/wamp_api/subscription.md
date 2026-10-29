---
outline: [2,3]
related:
    - text: Registry Routing (RIB)
      type: Concept
      link: /router/concepts/registry_routing
      description: How Bondy routes events across a cluster without replicating every subscription to every node.
    - text: Registration
      type: WAMP API Reference
      link: /router/reference/wamp_api/registration
      description: The registration-side introspection procedures — the same two families, the same shapes.
    - text: Pub/Sub Programming Guide
      type: Guide
      link: /router/guides/programming/wamp/pub_sub
      description: Subscribing to topics and pattern-based subscriptions from a client's perspective.
---

# Subscription
A subscription is a subscriber's interest in a topic URI. Bondy creates one when a client sends a WAMP `SUBSCRIBE`, and removes it on `UNSUBSCRIBE` or when the owning session closes. The procedures mirror those of [Registration](/router/reference/wamp_api/registration).

Bondy exposes subscription introspection as two procedure families. Both read the same underlying data.

- **`bondy.subscription.*`** takes the realm URI as its first positional argument. A session in the master realm (`com.leapsight.bondy`) uses this family to read another realm. The enumerations are cluster-wide and keyset-**paginated**.
- **`wamp.subscription.*`** is the WAMP Meta API. Each procedure takes exactly the arguments the WAMP specification gives and acts on the caller's realm. Results take the shapes the WAMP specification gives. No procedure in this family takes a realm argument: a call with extra positional arguments fails with `wamp.error.invalid_argument` ("Invalid number of positional arguments."). The cluster-wide set of subscriptions has no fixed bound, so each `wamp.subscription.*` enumeration is capped. Past the ceiling it raises `bondy.error.too_many_results` and points the caller to the paginated family. Bondy does not truncate the result.

Only the node that owns a subscription holds its full record. Other nodes know it only through the RIB's compact summary (see [Registry Routing (RIB)](/router/concepts/registry_routing)). Both families run a cluster-wide query to answer a call.

## Types

### subscription{.datatype}

The external form of a subscription entry, common to every procedure below.

<DataTreeView :data="subscription" :maxDepth="10" />

### page(subscription){.datatype}

The result shape of every paginated `bondy.subscription.*` procedure.

<DataTreeView :data="page" :maxDepth="10" />

## Procedures

|Name|URI|
|:---|:---|
|[List subscriptions (paginated)](#list-subscriptions-paginated)|`bondy.subscription.list`|
|[Match a topic URI (paginated)](#match-a-topic-uri-paginated)|`bondy.subscription.match`|
|[Get a subscription in a realm](#get-a-subscription-in-a-realm)|`bondy.subscription.get`|
|[List a subscription's subscribers in a realm](#list-a-subscription-s-subscribers-in-a-realm)|`bondy.subscription.list_subscribers`|
|[Count a subscription's subscribers in a realm](#count-a-subscription-s-subscribers-in-a-realm)|`bondy.subscription.count_subscribers`|
|[List subscriptions](#list-subscriptions)|`wamp.subscription.list`|
|[Look up a subscription](#look-up-a-subscription)|`wamp.subscription.lookup`|
|[Match a topic URI](#match-a-topic-uri)|`wamp.subscription.match`|
|[Get a subscription](#get-a-subscription)|`wamp.subscription.get`|
|[List a subscription's subscribers](#list-a-subscription-s-subscribers)|`wamp.subscription.list_subscribers`|
|[Count a subscription's subscribers](#count-a-subscription-s-subscribers)|`wamp.subscription.count_subscribers`|

### List subscriptions (paginated)
##### bondy.subscription.list(realm_uri) -> page(subscription) {.wamp-procedure}
Returns a cluster-wide page of every subscription in the realm, in node-then-entry order.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'The URI of the realm to list.'
        }
    })"
/>

##### Keyword Args
The two keyword arguments below drive pagination.

<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        'limit':{
            'type': 'integer',
            'description' : 'Maximum number of entries to return. A non-integer or out-of-range value is silently replaced with the default rather than raising an error: a page size has a sane default, so bounding the call is a better answer than refusing it. Defaults to 100; the ceiling is 1000.'
        },
        'cursor':{
            'type': 'string',
            'description' : 'The opaque `cursor` from a previous page\'s result, to resume from. Omit for the first page.'
        }
    })"
/>

#### Result
##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'page(subscription)',
            'description' : 'The requested page (see the `page(subscription)` type above).'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
Raises `bondy.error.stale` if `cursor` was minted by an incompatible cursor schema or node-walk shape (the caller should restart from the first page), or `bondy.error.malformed` if `cursor` isn't a decodable cursor at all. Unlike `limit`, a cursor has no tolerant fallback: a resume position cannot be guessed.

### Match a topic URI (paginated)
##### bondy.subscription.match(realm_uri, uri) -> page(subscription) {.wamp-procedure}
As [`bondy.subscription.list`](#list-subscriptions-paginated), restricted to the subscriptions whose topic URI matches `uri` under that subscription's own match policy (`exact`, `prefix`, or `wildcard`).

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'The URI of the realm to search.'
        },
        '1':{
            'type': 'uri',
            'description' : 'The topic URI to match against every subscription\'s match policy.'
        }
    })"
/>

##### Keyword Args
Same `limit` / `cursor` keyword arguments as [`bondy.subscription.list`](#list-subscriptions-paginated).

#### Result
##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'page(subscription)',
            'description' : 'The requested page (see the `page(subscription)` type above).'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
Same as [`bondy.subscription.list`](#list-subscriptions-paginated).

### Get a subscription in a realm
##### bondy.subscription.get([realm_uri, ]subscription_id) -> subscription {.wamp-procedure}
As [`wamp.subscription.get`](#get-a-subscription), for the named realm. The realm URI may be omitted, because the procedure takes no optional argument; Bondy then uses the caller's realm.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'Optional. The URI of the realm the subscription belongs to. When the call carries one positional argument, that argument is the subscription id and Bondy uses the caller\'s realm.'
        },
        '1':{
            'type': 'id',
            'description' : 'The subscription id.'
        }
    })"
/>

##### Keyword Args
None.

#### Result
##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'subscription',
            'description' : 'The requested subscription (see the `subscription` type above).'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
Same as [`wamp.subscription.get`](#get-a-subscription). Naming a realm other than the caller's requires a session in the master realm (`com.leapsight.bondy`). Any other session receives `wamp.error.not_authorized`.

### List a subscription's subscribers in a realm
##### bondy.subscription.list_subscribers([realm_uri, ]subscription_id) -> id[] {.wamp-procedure}
As [`wamp.subscription.list_subscribers`](#list-a-subscription-s-subscribers), for the named realm. The realm URI may be omitted; Bondy then uses the caller's realm.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'Optional. The URI of the realm the subscription belongs to. When the call carries one positional argument, that argument is the subscription id and Bondy uses the caller\'s realm.'
        },
        '1':{
            'type': 'id',
            'description' : 'The subscription id.'
        }
    })"
/>

##### Keyword Args
None.

#### Result
##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'array',
            'description' : 'The session ids of the subscription\'s current subscribers.'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
Same as [`wamp.subscription.list_subscribers`](#list-a-subscription-s-subscribers). Naming a realm other than the caller's requires a session in the master realm (`com.leapsight.bondy`). Any other session receives `wamp.error.not_authorized`.

### Count a subscription's subscribers in a realm
##### bondy.subscription.count_subscribers([realm_uri, ]subscription_id) -> integer {.wamp-procedure}
As [`wamp.subscription.count_subscribers`](#count-a-subscription-s-subscribers), for the named realm. The realm URI may be omitted; Bondy then uses the caller's realm.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'Optional. The URI of the realm the subscription belongs to. When the call carries one positional argument, that argument is the subscription id and Bondy uses the caller\'s realm.'
        },
        '1':{
            'type': 'id',
            'description' : 'The subscription id.'
        }
    })"
/>

##### Keyword Args
None.

#### Result
##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'integer',
            'description' : 'The number of current subscribers.'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
Same as [`wamp.subscription.count_subscribers`](#count-a-subscription-s-subscribers). Naming a realm other than the caller's requires a session in the master realm (`com.leapsight.bondy`). Any other session receives `wamp.error.not_authorized`.

### List subscriptions
##### wamp.subscription.list() -> dict {.wamp-procedure}
Returns every subscription id in the caller's realm, grouped by match policy. Bounded: raises `bondy.error.too_many_results` if the realm has more subscriptions than the configured ceiling (1000 by default). Use [`bondy.subscription.list`](#list-subscriptions-paginated) instead when that happens.

#### Call
##### Positional Args
None.

##### Keyword Args
None.

#### Result
##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'dict',
            'description' : 'A `{exact, prefix, wildcard}` object, each key holding the list of subscription ids using that match policy.'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
Raises `bondy.error.too_many_results` past the enumeration ceiling.

### Look up a subscription
##### wamp.subscription.lookup(topic_uri[, options]) -> id | null {.wamp-procedure}
Returns the subscription stored under exactly `(topic_uri, options.match)` in the caller's realm. Every subscriber holds its own subscription in Bondy, so when several subscribers share that key, the result is the oldest subscription under it.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'The topic URI to look up.'
        },
        '1':{
            'type': 'dict',
            'description' : 'Optional. Its `match` key selects the match policy: `exact` (the default), `prefix`, or `wildcard`.'
        }
    })"
/>

##### Keyword Args
None.

#### Result
##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'id',
            'description' : 'The subscription id. When no subscription is stored under the key, the result is null: the RESULT carries no positional arguments.'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
Raises `wamp.error.invalid_argument` when `options.match` is not `exact`, `prefix`, or `wildcard`.

### Match a topic URI
##### wamp.subscription.match(topic_uri) -> id[] | null {.wamp-procedure}
Returns every subscription in the caller's realm that an event published to `topic_uri` would reach. Bounded like [`wamp.subscription.list`](#list-subscriptions).

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'The topic URI to match.'
        }
    })"
/>

##### Keyword Args
None.

#### Result
##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'array',
            'description' : 'The matching subscription ids. When no subscription matches, the result is null: the RESULT carries no positional arguments.'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
Raises `bondy.error.too_many_results` past the enumeration ceiling.

### Get a subscription
##### wamp.subscription.get(subscription_id) -> subscription {.wamp-procedure}
Returns the full external form of one subscription in the caller's realm, resolved cluster-wide. The id does not have to belong to a subscription owned by the node handling the call.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'id',
            'description' : 'The subscription id.'
        }
    })"
/>

##### Keyword Args
None.

#### Result
##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'subscription',
            'description' : 'The requested subscription (see the `subscription` type above).'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
Raises `wamp.error.no_such_subscription` when no node holds a subscription with this id. Raises `bondy.error.unavailable`, rather than a false "no such subscription", when a node that may hold it could not be reached to confirm its absence.

### List a subscription's subscribers
##### wamp.subscription.list_subscribers(subscription_id) -> id[] {.wamp-procedure}
Returns the WAMP session ids of the subscribers of the subscription stored under the same `(uri, match)` key as `subscription_id`, gathered cluster-wide.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'id',
            'description' : 'The subscription id.'
        }
    })"
/>

##### Keyword Args
None.

#### Result
##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'array',
            'description' : 'The session ids of the subscription\'s current subscribers.'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
Raises `wamp.error.no_such_subscription` or `bondy.error.unavailable`, with the same distinction as [`wamp.subscription.get`](#get-a-subscription).

### Count a subscription's subscribers
##### wamp.subscription.count_subscribers(subscription_id) -> integer {.wamp-procedure}
Returns the number of subscribers of the subscription stored under the same `(uri, match)` key as `subscription_id`, counted cluster-wide.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'id',
            'description' : 'The subscription id.'
        }
    })"
/>

##### Keyword Args
None.

#### Result
##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'integer',
            'description' : 'The number of current subscribers.'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
Raises `wamp.error.no_such_subscription` or `bondy.error.unavailable`, with the same distinction as [`wamp.subscription.get`](#get-a-subscription).

## Topics
Bondy publishes these meta events on a subscription's lifecycle, subject to the `wamp.meta_events` setting (`demand` by default: an event is only produced when a matching subscriber exists). Because delivery isn't guaranteed, a consumer should snapshot current state via [`wamp.subscription.list`](#list-subscriptions) (or the paginated family) after subscribing, which also covers the gap between subscribing and the next emitted event.

Bondy does not publish `wamp.subscription.on_create` or `wamp.subscription.on_delete`. The WAMP specification has the router publish them when a topic URI gains its first subscription and loses its last. A cluster cannot decide which subscription is the first or the last without coordinating its nodes. Each node would announce its own, and a subscriber would see a URI deleted while other nodes still serve it. To learn whether a topic URI has subscriptions, call [`wamp.subscription.lookup`](#look-up-a-subscription) or [`wamp.subscription.list`](#list-subscriptions).

### wamp.subscription.on_subscribe{.wamp-topic}
Published for every new subscription, whether or not the topic URI already has other subscriptions.

##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'id',
            'description' : 'The session id of the subscribing client.'
        },
        '1':{
            'type': 'id',
            'description' : 'The new subscription\'s id.'
        }
    })"
/>

##### Keyword Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        'topic':{
            'type': 'uri',
            'description' : 'The subscribed topic URI.'
        }
    })"
/>

### wamp.subscription.on_unsubscribe{.wamp-topic}
Published for every removed subscription: the client unsubscribes, or its session ends. Bondy publishes it whether or not other subscriptions of the topic URI remain.

##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'id',
            'description' : 'The session id of the unsubscribing client.'
        },
        '1':{
            'type': 'id',
            'description' : 'The removed subscription\'s id.'
        }
    })"
/>

##### Keyword Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        'topic':{
            'type': 'uri',
            'description' : 'The topic URI that was unsubscribed from.'
        }
    })"
/>

## See also
- [Registration](/router/reference/wamp_api/registration) — the same two families of introspection, for registrations instead of subscriptions.
- [Registry Routing (RIB)](/router/concepts/registry_routing) — why subscription introspection is a cluster-wide query rather than a local one.
- [Pub/Sub Programming Guide](/router/guides/programming/wamp/pub_sub) — subscribing to topics and pattern-based subscriptions.

<script>
export default {
    data() {
        return {
            subscription: `{
                "id" : {
                    "description": "The subscription's identifier.",
                    "type": "id",
                    "required": true,
                    "mutable": false
                },
                "created" : {
                    "description": "The date and time the subscription was created, as an ISO 8601 string.",
                    "type": "string",
                    "required": true,
                    "mutable": false
                },
                "uri" : {
                    "description": "The subscribed topic URI.",
                    "type": "uri",
                    "required": true,
                    "mutable": false
                },
                "match" : {
                    "description": "The match policy: \`exact\`, \`prefix\`, or \`wildcard\`.",
                    "type": "string",
                    "required": true,
                    "mutable": false
                }
            }`,
            page: `{
                "values" : {
                    "description": "The page's entries: \`subscription\` objects.",
                    "type": "array",
                    "required": true,
                    "mutable": false
                },
                "has_more" : {
                    "description": "Whether further pages remain.",
                    "type": "boolean",
                    "required": true,
                    "mutable": false
                },
                "cursor" : {
                    "description": "An opaque token to pass as \`cursor\` for the next page. Present only when \`has_more\` is \`true\`.",
                    "type": "string",
                    "required": false,
                    "mutable": false
                }
            }`
        }
    }
}
</script>
