---
outline: [2,3]
related:
    - text: Mail
      type: Concept
      link: /concepts/mail
      description: Why relays are operator-owned, why sender identity is derived, and what send_async does not promise.
    - text: Mail Configuration Reference
      type: Configuration Reference
      link: /reference/configuration/mail
      description: Every mail.* key — relays, credentials, TLS, authority, pooling and health.
    - text: Sending Email
      type: How-to Guide
      link: /guides/programming/sending_email
      description: Sending from a WAMP client, and sending on an event.
---

# Mail

Send email from a WAMP session. See [Mail](/concepts/mail) for the model behind
these procedures; this page is the call shapes.

## Description

Every procedure takes the **realm as argument 0**. Bondy supplies it from the
session when it is absent, and refuses a caller who supplies a realm that is
not the session's own. The master realm is the single exception, which is how
an operator acts on another realm's behalf.

So the two shapes below are equivalent for an ordinary session, and the second
is what you write:

```erlang
bondy.mail.send("com.acme.app", Request)   % explicit; must match the session
bondy.mail.send(Request)                   % realm taken from the session
```

::: warning Authorization
`bondy.mail.*` is gated by the standard `wamp.call` permission on the procedure
URI, so it is grantable per realm and per group, with prototype inheritance,
using [`bondy.grant`](/reference/wamp_api/grant). No mail-specific permission
exists.

Two further checks happen inside Bondy and are **not** grantable through the
API, because they belong to the operator rather than to the realm: whether the
realm may use the named relay
([`mail.relay.$name.realms`](/reference/configuration/mail#mail.relay.$name.realms)),
and whether it may claim the sender it asked for
([`mail.relay.$name.allowed_from`](/reference/configuration/mail#mail.relay.$name.allowed_from)).
:::

### The request object

<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        'id': {
            'type': 'string',
            'required': false,
            'description': 'Idempotency key. Sending the same key twice reports the first message instead of sending another. The check is cluster-wide, and the window is mail.status.ttl.'
        },
        'relay': {
            'type': 'string',
            'required': false,
            'description': 'Relay name. Defaults to mail.default_relay. Must be a relay the calling realm is permitted to use.'
        },
        'from': {
            'type': 'string',
            'required': false,
            'description': 'Sender address. Defaults to the configured sender of the relay. If supplied, its domain must appear in the allowed_from list of the relay, or the request is refused.'
        },
        'to': {
            'type': 'list',
            'required': true,
            'description': 'Recipient addresses. Syntax-validated before the request is queued.'
        },
        'cc': {
            'type': 'list',
            'required': false,
            'description': 'Carbon-copy addresses.'
        },
        'bcc': {
            'type': 'list',
            'required': false,
            'description': 'Blind carbon-copy addresses. Delivered to via the envelope and absent from every header.'
        },
        'reply_to': {
            'type': 'string',
            'required': false,
            'description': 'Reply-To address.'
        },
        'subject': {
            'type': 'string',
            'required': true,
            'description': 'Subject line. Non-ASCII is encoded and decoded transparently.'
        },
        'text': {
            'type': 'string',
            'required': false,
            'description': 'Plain-text body. At least one of text or html is required.'
        },
        'html': {
            'type': 'string',
            'required': false,
            'description': 'HTML body. Supplying both produces a multipart/alternative message.'
        },
        'headers': {
            'type': 'map',
            'required': false,
            'description': 'Additional headers. A name or value containing CR, LF or NUL is REJECTED, not sanitised. Envelope and security headers (Bcc, Return-Path, Received, DKIM-Signature, Authentication-Results and similar) are refused.'
        },
        'attachments': {
            'type': 'list',
            'required': false,
            'description': 'A list of objects with filename, content_type and data. data is base64 on the wire and is decoded before the size limit is applied.'
        },
        'priority': {
            'type': 'string',
            'required': false,
            'description': 'normal (default) or low.'
        },
        'timeout': {
            'type': 'integer',
            'required': false,
            'description': 'Deadline in milliseconds. Bounded by the timeout of the relay: a caller may ask for less, never more.'
        }
    })"
/>

**Unknown keys are rejected, not ignored.** A misspelled `subjcet` produces
[`bondy.error.invalid_data`](/reference/wamp_api/errors/invalid_data) rather
than an email with no subject.

## Procedures

#### bondy.mail.send(realm_uri, request) -> [result] {.wamp-procedure}

Send a message and wait until the relay has taken responsibility for it.

#### Call

##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        0: {
            'type': 'string',
            'required': false,
            'description': 'The realm uri. Supplied from the session when absent; must equal the session realm when present.'
        },
        1: {
            'type': 'map',
            'required': true,
            'description': 'The request object, described above.'
        }
    })"
/>

##### Keyword Args
None. The request is positional: the realm occupies argument 0, so a shape
admitting both would make the first positional argument mean two different
things.

#### Result

##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        0: {
            'type': 'map',
            'required': true,
            'description': 'An object with id (the message id), status (sent), receipt (the acknowledgement from the relay) and attempts (how many tries it took). A request whose idempotency key was already used answers with duplicate: true and reports the first message instead.'
        }
    })"
/>

::: info A receipt is not a delivery guarantee
It means the relay accepted the message. What happens after that is between the
relay and the recipient; Bondy does not process bounces.
:::

##### Keyword Args
None.

#### bondy.mail.send_async(realm_uri, request) -> [result] {.wamp-procedure}

Queue a message and return without waiting.

#### Call

##### Positional Args
Identical to `bondy.mail.send`.

##### Keyword Args
None.

#### Result

##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        0: {
            'type': 'map',
            'required': true,
            'description': 'An object with id (the message id, which bondy.mail.status.get takes) and status (queued).'
        }
    })"
/>

::: warning What a successful return does not mean
It does not mean the relay accepted the message, or saw it. It does not mean
the message will be delivered. And it does not survive a restart: the queue is
in memory, so a node that stops loses whatever it was holding.

What it does mean is that the message passed validation and authority and was
accepted into a bounded queue on this node.
:::

##### Keyword Args
None.

#### bondy.mail.status.get(realm_uri, id) -> [result] {.wamp-procedure}

Report what is known about a message.

#### Call

##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        0: {
            'type': 'string',
            'required': false,
            'description': 'The realm uri. Supplied from the session when absent.'
        },
        1: {
            'type': 'string',
            'required': true,
            'description': 'The message id returned by send or send_async.'
        }
    })"
/>

##### Keyword Args
None.

#### Result

##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        0: {
            'type': 'map',
            'required': true,
            'description': 'An object with status (queued, sent, failed or unknown), and where known: relay, attempts, nature (permanent or transient) and error_class.'
        }
    })"
/>

::: info unknown means four different things, on purpose
An id that never existed, a record that has aged out of `mail.status.ttl`, a
message belonging to another realm, and a message whose owning node is
unreachable all answer `unknown`.

Answering the same way for all four is deliberate: a caller cannot use this to
discover whether another realm's message exists, and an unreachable node
genuinely has an unknown answer because its queue was in memory.
:::

##### Keyword Args
None.

#### bondy.mail.relay.list(realm_uri) -> [result] {.wamp-procedure}

List the relays the calling realm may use.

#### Call

##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        0: {
            'type': 'string',
            'required': false,
            'description': 'The realm uri. Supplied from the session when absent.'
        }
    })"
/>

##### Keyword Args
None.

#### Result

##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        0: {
            'type': 'list',
            'required': true,
            'description': 'One object per relay, each with name, transport, status (up or down) and from. Never the host, the username or the credential.'
        }
    })"
/>

The list is **filtered, not annotated**: a realm is not shown a relay it would
be refused. A list of things you cannot have is an invitation to try them.

##### Keyword Args
None.

#### bondy.mail.test(realm_uri, address) -> [result] {.wamp-procedure}

Send a fixed test message, to prove a relay works.

::: warning Master realm only
This is an operator's check. It names a recipient directly and is refused for
any other realm.
:::

#### Call

##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        0: {
            'type': 'string',
            'required': false,
            'description': 'The realm uri to send as. Supplied from the session when absent.'
        },
        1: {
            'type': 'string',
            'required': true,
            'description': 'The address to send the test message to.'
        }
    })"
/>

##### Keyword Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        'relay': {
            'type': 'string',
            'required': false,
            'description': 'Which relay to test. Defaults to mail.default_relay.'
        }
    })"
/>

#### Result

##### Positional Args
As `bondy.mail.send`.

##### Keyword Args
None.

## Errors

|URI|Nature|Raised when|
|:---|:---|:---|
|[`bondy.error.mail_not_configured`](/reference/wamp_api/errors/mail_not_configured)|Permanent|No relay is configured, or the named one cannot be used as configured.|
|[`bondy.error.no_such_relay`](/reference/wamp_api/errors/no_such_relay)|Permanent|The named relay does not exist.|
|[`bondy.error.relay_not_permitted`](/reference/wamp_api/errors/relay_not_permitted)|Permanent|The relay exists, but this realm may not use it.|
|[`bondy.error.sender_not_permitted`](/reference/wamp_api/errors/sender_not_permitted)|Permanent|The requested `from` is outside the relay's `allowed_from`.|
|[`bondy.error.invalid_recipient`](/reference/wamp_api/errors/invalid_recipient)|Permanent|An address is not a valid address.|
|[`bondy.error.mail_rejected`](/reference/wamp_api/errors/mail_rejected)|Permanent|The relay refused the message with a `5xx`.|
|[`bondy.error.mail_delivery_failed`](/reference/wamp_api/errors/mail_delivery_failed)|Transient|Delivery failed after exhausting its retries or its deadline.|
|[`bondy.error.relay_unavailable`](/reference/wamp_api/errors/relay_unavailable)|Transient|The relay could not be reached.|
|[`bondy.error.mail_queue_full`](/reference/wamp_api/errors/mail_queue_full)|Transient|The relay's queue is at its bound.|

Other errors a mail call can raise:
[`bondy.error.invalid_data`](/reference/wamp_api/errors/invalid_data) for a
malformed request or an unknown key,
[`bondy.error.too_large_payload`](/reference/errors) for an oversized message,
and `bondy.error.rate_limit_exceeded` when the relay's rate limit refuses.

**No relay hostname, credential or SMTP banner ever appears in an error.** A
relay's rejection text is written by someone other than Bondy, so only the
three-digit reply code survives — that is the part a caller can act on.

## See also
- [Mail](/concepts/mail) — the model behind these procedures.
- [Sending Email](/guides/programming/sending_email) — worked client examples.
- [Mail Configuration Reference](/reference/configuration/mail) — the relays these calls name.
