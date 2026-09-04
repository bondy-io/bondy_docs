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
      link: /wamp/guides/programming/pub_sub
      description: Subscribing to topics and pattern-based subscriptions from a client's perspective.
---

# Subscription
A subscription is a subscriber's interest in a topic URI. Bondy creates one when a client sends a WAMP `SUBSCRIBE`, and removes it on `UNSUBSCRIBE` or when the owning session closes.

Bondy exposes subscription introspection as two independent procedure families, both reading the same underlying data — the subscription-side mirror of [Registration](/router/reference/wamp_api/registration):

- **`bondy.subscription.*`** — cluster-wide, keyset-**paginated**, unbounded.
- **`wamp.subscription.*`** — the WAMP Meta API, kept in the shape a single-node router historically returned. Each enumeration is capped; past the ceiling it raises `bondy.error.too_many_results` and steers the caller to the paginated family.

Only the node that owns a subscription holds its full record; other nodes know it only through the RIB's compact summary (see [Registry Routing (RIB)](/router/concepts/registry_routing)).

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
Pagination is driven by the two keyword arguments below. They were
`CALL.Options` extension keys (`_limit` / `_cursor`) until 2026-09-01; the
option form is no longer read.

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

### List subscriptions
##### wamp.subscription.list(realm_uri) -> dict {.wamp-procedure}
Returns every subscription id in the realm, grouped by match policy. Bounded: raises `bondy.error.too_many_results` if the realm has more subscriptions than the configured ceiling (1000 by default) — use [`bondy.subscription.list`](#list-subscriptions-paginated) instead when that happens.

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
##### wamp.subscription.lookup(realm_uri, topic_uri[, options]) -> id {.wamp-procedure}
Returns the single subscription id that owns `topic_uri` under an exact match, if one exists.

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
            'description' : 'The topic URI to look up.'
        },
        '2':{
            'type': 'dict',
            'description' : 'Optional. Accepted for spec compatibility; Bondy does not currently interpret any keys in it.'
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
            'description' : 'The subscription id, present only when a match was found. When there is no match, the result carries no positional arguments at all rather than a null or zero value.'
        }
    })"
/>

##### Keyword Results
None.

### Match a topic URI
##### wamp.subscription.match(realm_uri, topic_uri[, options]) -> id[] {.wamp-procedure}
Returns every subscription id whose topic URI matches `topic_uri` under that subscription's own match policy. Bounded like [`wamp.subscription.list`](#list-subscriptions) — raises `bondy.error.too_many_results` past the ceiling.

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
            'description' : 'The topic URI to match.'
        },
        '2':{
            'type': 'dict',
            'description' : 'Optional. Accepted for spec compatibility; Bondy does not currently interpret any keys in it.'
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
            'description' : 'The matching subscription ids. Empty when there are none.'
        }
    })"
/>

##### Keyword Results
None.

#### Errors
Raises `bondy.error.too_many_results` past the enumeration ceiling.

### Get a subscription
##### wamp.subscription.get(realm_uri, subscription_id[, details]) -> subscription {.wamp-procedure}
Returns the full external form of one subscription, resolved cluster-wide — the id doesn't have to belong to a subscription owned by the node handling the call.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'The URI of the realm the subscription belongs to.'
        },
        '1':{
            'type': 'id',
            'description' : 'The subscription id.'
        },
        '2':{
            'type': 'dict',
            'description' : 'Optional. Accepted for spec compatibility; Bondy does not currently interpret any keys in it.'
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
Raises `wamp.error.no_such_subscription` when no node holds a subscription with this id. Raises `bondy.error.unavailable`, rather than a false "no such subscription", when a node that might hold it could not be reached in time to confirm its absence.

### List a subscription's subscribers
##### wamp.subscription.list_subscribers(realm_uri, subscription_id) -> id[] {.wamp-procedure}
Returns the WAMP session ids of the subscribers currently matching `subscription_id`, gathered cluster-wide.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'The URI of the realm the subscription belongs to.'
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
Raises `wamp.error.no_such_subscription` or `bondy.error.unavailable` — same distinction as [`wamp.subscription.get`](#get-a-subscription), since resolving the id to its topic URI is itself a cluster-wide lookup.

### Count a subscription's subscribers
##### wamp.subscription.count_subscribers(realm_uri, subscription_id) -> integer {.wamp-procedure}
Returns the number of subscribers currently matching `subscription_id`, cluster-wide.

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'The URI of the realm the subscription belongs to.'
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
Raises `wamp.error.no_such_subscription` or `bondy.error.unavailable` — same distinction as [`wamp.subscription.get`](#get-a-subscription).

## Topics
Bondy publishes these meta events on a subscription's lifecycle, subject to the `wamp.meta_events` setting (`demand` by default: an event is only produced when a matching subscriber exists). Because delivery isn't guaranteed, a consumer should snapshot current state via [`wamp.subscription.list`](#list-subscriptions) (or the paginated family) after subscribing, which also covers the gap between subscribing and the next emitted event.

##### wamp.subscription.on_create{.wamp-topic}
Published when a topic URI receives its first subscription.

##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'id',
            'description' : 'The session id of the subscribing client.'
        },
        '1':{
            'type': 'subscription',
            'description' : 'The new subscription (see the `subscription` type above).'
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

### wamp.subscription.on_subscribe{.wamp-topic}
Published when a client subscribes to a topic URI that already has at least one subscriber.

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
Published when a client unsubscribes from a topic URI that still has other subscribers remaining.

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

### wamp.subscription.on_delete{.wamp-topic}
Published when a topic URI's last subscription is removed.

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
            'description' : 'The topic URI whose last subscription was just removed.'
        }
    })"
/>

## See also
- [Registration](/router/reference/wamp_api/registration) — the same two families of introspection, for registrations instead of subscriptions.
- [Registry Routing (RIB)](/router/concepts/registry_routing) — why subscription introspection is a cluster-wide query rather than a local one.
- [Pub/Sub Programming Guide](/wamp/guides/programming/pub_sub) — subscribing to topics and pattern-based subscriptions.

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
                    "description": "The date and time the subscription was created.",
                    "type": "datetime",
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
                    "description": "The page's entries — \`subscription\` objects for this family.",
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
