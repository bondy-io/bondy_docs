---
outline: [2,3]
related:
    - text: Mail WAMP API
      type: API Reference
      link: /reference/wamp_api/mail
      description: The five bondy.mail.* procedures and their exact call shapes.
    - text: Mail
      type: Concept
      link: /concepts/mail
      description: What send_async promises, how idempotency works, and what a caller is never told.
    - text: Configuring Mail Relays
      type: How-to Guide
      link: /guides/administration/configuring_mail_relays
      description: The operator task this guide assumes is already done.
    - text: Sending Email with the SMTP Bridge
      type: Tutorial
      link: /tutorials/smtp_bridge
      description: A worked example, end to end, against a local mail server.
---

# Sending Email

There are two ways to send email from Bondy, and they share one send path:

- **Call a procedure.** A client that knows it wants to send an email calls
  [`bondy.mail.send`](/reference/wamp_api/mail).
- **Subscribe to a topic.** An operator declares a bridge subscription, and
  publishing an event sends the email. The publisher does not know email is
  involved.

This guide assumes a relay is already configured — see [Configuring Mail
Relays](/guides/administration/configuring_mail_relays).

## Which relays can I use?

```javascript
const relays = await session.call("bondy.mail.relay.list");
// [{ name: "transactional", transport: "starttls",
//    status: "up", from: "no-reply@example.com" }]
```

The list is filtered to what your realm may actually use, and carries no
hostname, username or credential.

## Send and wait

```javascript
const [result] = await session.call("bondy.mail.send", [{
    to: ["user@example.com"],
    subject: "Welcome",
    text: "Your account is ready.",
    html: "<h1>Welcome</h1><p>Your account is ready.</p>"
}]);
// { id: "bondy@10.0.0.1/9f2c…", status: "sent",
//   receipt: "2.0.0 Ok: queued", attempts: 1 }
```

You did not name a realm: Bondy takes it from your session, and naming a
different one is refused. You did not name a sender either, so the message goes
out as the relay's configured `from` — which is why a caller cannot spoof by
default.

::: info A receipt is not a delivery guarantee
It means the relay accepted the message. What happens after that is between the
relay and the recipient; Bondy does not process bounces.
:::

## Send without waiting

```javascript
const [result] = await session.call("bondy.mail.send_async", [{
    to: ["user@example.com"],
    subject: "Welcome",
    text: "Your account is ready."
}]);
// { id: "bondy@10.0.0.1/9f2c…", status: "queued" }
```

Use this when the caller should not wait on an SMTP conversation — which is
most of the time.

::: warning `queued` is a weaker promise than it looks
It does not mean the relay accepted the message, or saw it. It does not mean
the message will be delivered. And it does not survive a restart: the queue is
in memory.

If you need to know what happened, keep the `id` and ask.
:::

```javascript
const [status] = await session.call("bondy.mail.status.get", [result.id]);
// { status: "sent",   relay: "transactional", attempts: 1 }
// { status: "failed", nature: "permanent", error_class: "rejected" }
// { status: "shed",   nature: "transient",  error_class: "expired" }
```

| `status` | Meaning |
| --- | --- |
| `queued` | Accepted into a relay's queue. |
| `sent` | A relay took responsibility for it. |
| `failed` | A relay was shown the message and it will not be delivered. |
| `shed` | Dropped from the queue before any relay saw it — it outlived `queue.ttl`, or the worker holding it stopped. |
| `unknown` | Bondy cannot say. |

`unknown` means the id never existed, the record has aged out of
`mail.status.ttl`, it belongs to another realm, or its owning node is
unreachable. All four answer the same way on purpose.

## Not sending twice

Supply an `id` — your own idempotency key — and a repeat reports the first
message instead of sending another:

```javascript
await session.call("bondy.mail.send", [{
    id: `welcome:${userId}`,
    to: [email],
    subject: "Welcome",
    text: "Your account is ready."
}]);
```

The check is cluster-wide, so a retry that lands on a different node still
sends one email. Three things to know:

- **The window is `mail.status.ttl`** (one hour by default). A retry policy
  that outlasts it will send twice.
- **Scope the key to something specific.** `order-42` is not an imaginative
  key; Bondy already scopes it to your realm, but two features in the same
  realm can still collide.
- **A key is spent once a relay has been shown the message**, whatever the
  relay then did with it. Reusing a key whose message `failed` reports the
  failure and sends nothing, because Bondy cannot tell a relay that never saw
  a message from one that accepted it and dropped the connection. A key whose
  message was never offered to a relay — refused by a full queue, or `shed` —
  is free, and reusing it sends.

::: tip Ask, do not infer
Whether a key is still usable is not something the error tells you: a transient
error may or may not have reached a relay. `bondy.mail.status.get` does tell
you. `failed` means spent; `shed` and `unknown` mean free.
:::

## Attachments, and a custom sender

```javascript
await session.call("bondy.mail.send", [{
    from: "billing@example.com",
    to: ["user@example.com"],
    bcc: ["archive@example.com"],
    subject: "Your invoice",
    text: "Invoice attached.",
    headers: { "X-Invoice-Id": "INV-1024" },
    attachments: [{
        filename: "invoice.pdf",
        content_type: "application/pdf",
        data: base64Pdf
    }]
}]);
```

`from` is only accepted if its domain is in the relay's `allowed_from` list;
otherwise you get
[`sender_not_permitted`](/reference/wamp_api/errors/sender_not_permitted).
Blind recipients are delivered to and appear in no header.

Attachment `data` is base64 on the wire and is decoded before the size limit
applies, so the limit is on the real message.

::: warning Headers are rejected, not sanitised
A header name or value containing CR or LF is refused outright rather than
stripped, because a silent truncation changes what a message means without
saying so. Envelope and security headers (`Bcc`, `Return-Path`,
`DKIM-Signature` and similar) are refused too — a caller-supplied `Bcc` header
would publish exactly what the field exists to hide.
:::

## Sending on an event instead

To send email when something is published — a user registers, an order ships —
an operator declares a bridge subscription and the publisher stays unaware:

```json
{
    "bridge": "bondy_smtp_bridge",
    "match": {
        "realm": "com.acme.app",
        "topic": "com.acme.user.registered",
        "options": {"match": "exact"}
    },
    "action": {
        "realm": "{{event.realm}}",
        "relay": "transactional",
        "to": "{{event.kwargs.email}}",
        "subject": "\"Welcome, {{event.kwargs.name}}\"",
        "text": "\"Your account is ready.\""
    }
}
```

Publishing then sends the email:

```javascript
session.publish("com.acme.user.registered", [],
                { email: "user@example.com", name: "Ada" });
```

Bridge sends are always asynchronous, so a stalled relay cannot slow event
delivery. A missing template variable — an event published without `email` —
fails the action and sends nothing rather than sending a half-rendered message.

See [Sending Email with the SMTP Bridge](/tutorials/smtp_bridge) for the whole
thing running against a local mail server.

## Handling failure

The one distinction worth branching on is **nature**:

```javascript
try {
    await session.call("bondy.mail.send", [request]);
} catch (e) {
    switch (e.error) {
        case "bondy.error.mail_queue_full":
            // Transient, and nothing was offered to a relay. Retry with the
            // SAME idempotency key: it is still free.
            break;
        case "bondy.error.relay_unavailable":
        case "bondy.error.mail_delivery_failed":
        case "bondy.error.request_timeout":
            // Transient, but a relay may already have been shown the message,
            // so the key may be spent. Retry with a NEW key, or ask
            // bondy.mail.status.get about the old one first.
            break;
        case "bondy.error.invalid_recipient":
        case "bondy.error.mail_rejected":
        case "bondy.error.sender_not_permitted":
            // Permanent. Sending it again produces the same answer.
            break;
    }
}
```

Errors carry the relay's **name** and, for a rejection, the three-digit reply
code. They never carry the relay's hostname, its credentials, or the text of
its reply — a relay banner is written by someone other than Bondy and may say
anything at all.

## See also
- [Mail WAMP API](/reference/wamp_api/mail) — every argument and result.
- [Mail](/concepts/mail) — the model, including what `send_async` does not promise.
- [Configuring Mail Relays](/guides/administration/configuring_mail_relays) — the operator side.
