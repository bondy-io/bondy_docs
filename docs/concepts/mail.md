---
outline: [2,3]
related:
    - text: Mail Configuration Reference
      type: Configuration Reference
      link: /reference/configuration/mail
      description: Every mail.* key — relays, credentials, TLS, authority, pooling and health.
    - text: Mail WAMP API
      type: API Reference
      link: /reference/wamp_api/mail
      description: The five bondy.mail.* procedures and what each answers.
    - text: Configuring Mail Relays
      type: How-to Guide
      link: /guides/administration/configuring_mail_relays
      description: The operator task — declare a relay, scope it to realms, wire up its credential.
    - text: Sending Email
      type: How-to Guide
      link: /guides/programming/sending_email
      description: The developer task — send from a WAMP client, or on an event.
    - text: Broker Bridge
      type: Concept
      link: /concepts/broker_bridge
      description: The subscription machinery the SMTP bridge plugs into.
---

# Mail

Bondy sends outbound email through **relays** an operator declares in
`bondy.conf`. Two surfaces sit on top of one send path: a [WAMP
API](/reference/wamp_api/mail) a client calls directly, and an [SMTP broker
bridge](/concepts/broker_bridge) that turns a published event into a message.
Both go through the same validation, the same authority checks and the same
worker pool, so neither can do something the other cannot.

## SMTP never runs on the routing path

This is the design's central claim, and the reason for most of what follows.

An SMTP conversation takes hundreds of milliseconds against a healthy relay,
tens of seconds against a sick one, and forever against one that accepts a
connection and then stops answering. So no part of it happens where routing
happens: not in the router's dispatch path, not in a subscriber callback, not
in a bridge callback that blocks event delivery. Every send is handed to a
bounded per-relay worker pool.

**Backpressure is a bound, not a wait.** When a relay's queue is full the send
is refused immediately, with a transient error, rather than blocking the
caller — because a caller that blocks on a stalled relay has moved the stall
rather than absorbed it. In the bridge's case that somewhere else is a
subscriber processing router events.

The queue is bounded twice: by how many messages may wait, and by how much they
may hold. The second bound is the one that matters for the promise above. A
relay that stops answering is *supposed* to fill its queue, so what that queue
costs the rest of the node has to be a number an operator set — not a
consequence of how large the messages happened to be. Each relay's messages wait
in the worker processes that will deliver them, and nowhere else.

The consequence an operator can rely on: a slow or dead relay degrades mail
delivery and nothing else. Publish and subscribe throughput is unaffected
throughout.

## Relays are operator-owned, not realm-owned

A relay is a host, a credential, TLS settings and a sending policy. It is
infrastructure, closer to a network listener than to a subscription — and its
credential is something a realm administrator must never see.

So relays live in `bondy.conf`, and so does the list of realms allowed to use
each one. Putting that binding in replicated realm state would let a realm
administrator grant their own realm access to a relay, which is privilege
escalation across the operator/tenant boundary.

The list is **default-deny**: a relay with no `realms` configured is available
to the master realm only. A prototype URI in that list admits every realm that
inherits from it, so a family of tenant realms can be granted access in one
line — see [Simplifying Realm Management Using
Prototypes](/guides/administration/simplifying_realm_management_using_prototypes).

Credentials never appear in a bridge specification, an RPC argument, a log line
or an error payload. Inside Bondy a credential is held as an opaque term whose
printed form is a function reference, so leaking one takes a deliberate act
rather than an oversight.

## Sender identity is derived, not asserted

A caller does not supply `from` by default. The relay does, through
`mail.relay.$name.from`. If a caller *may* set it, that is because an operator
listed the permitted domains in `mail.relay.$name.allowed_from`, and the
caller's value is checked against that list.

The direction matters more than it looks. Validating an asserted sender after
the fact fails **open** when misconfigured: forget to configure the check and
everything is permitted. Deriving the sender fails **closed**: forget to
configure `allowed_from` and callers cannot set it at all.

You cannot spoof what you cannot set.

A sender may carry a display name — `Acme Ltd <no-reply@acme.com>` — and this
changes nothing about the above. The allow-list is matched against the
**address**, so `Trusted Sender <attacker@evil.example>` is checked on
`evil.example` and refused. The name reaches the `From` header only; the
envelope always carries the bare address.

## The realm is never an argument

Every mail procedure takes the calling realm as its first argument, and Bondy
supplies it from the session when it is absent. Supplying a *different* realm
is refused. The master realm is the single exception — that is how an operator
acts on another realm's behalf — and it comes from the shared administrative
API machinery rather than from anything specific to mail.

So a client cannot send on behalf of another realm, because there is nowhere to
say so.

## Two ways to send, and what each promises

**`bondy.mail.send`** waits until the relay has taken responsibility for the
message, then answers with a receipt. A receipt is not a delivery guarantee: it
means the relay accepted the message, and what happens after that is between
the relay and the recipient. Bondy does not process bounces.

**`bondy.mail.send_async`** returns as soon as the message is queued. It is
worth being precise about what a successful return does **not** mean:

- it does not mean the relay accepted the message, or saw it;
- it does not mean the message will be delivered;
- it does not survive a restart. The queue is in memory, so a node that stops
  loses whatever it was holding.

What it does mean is that the message passed validation and authority and was
accepted into a bounded queue on this node. Bondy is not a mail spool, and
building one would put per-message writes into the replicated state plane for
data that is ephemeral by nature.

Every message the broker bridge sends is asynchronous, for the reason in the
first section.

## Idempotency, and why it costs a hop

A request may carry an `id`: a caller's idempotency key. Send the same key
twice and the second call reports what became of the first message instead of
sending another.

The check is **cluster-wide**, not per node. Node-local deduplication would
silently under-deliver the guarantee the field implies, because a client
retrying a timed-out request against a different node would send a second
email — which is exactly the situation an idempotency key exists for.

Bondy locates the check by hashing the key onto a node and routing there, so a
keyed request may make one extra hop inside the cluster. Without a key there is
nothing to deduplicate and no hop to pay.

A key is spent once a relay has been **shown** the message, which is not the
same as the message having been delivered. Retrying a key whose message failed
reports the failure and sends nothing, because Bondy cannot tell a relay that
never saw a message from one that accepted it and then dropped the connection;
a caller who genuinely wants another attempt uses another key. But a message
that no relay ever saw — refused by a full queue, or shed from the queue after
outliving `queue.ttl` — leaves its key available, because refusing to retry
something that was never attempted would suppress an email that was never sent.

One limitation, stated plainly: during a membership change two nodes may
briefly both consider themselves the owner of a key. That window is inherent to
coordination-free ownership; closing it would mean running consensus on the
identity of the owner, which is a much larger dependency than the guarantee is
worth.

## Retries, and what is worth retrying

Failures are classified as **permanent** or **transient** before anything else
happens, and only transient failures are retried.

|Nature|Examples|What it means for you|
|:---|:---|:---|
|**Permanent**|A `5xx` reply, a malformed address, a message over the size limit, a rejected credential, a relay or sender the realm may not use|Offering it again produces the same answer. Something has to change.|
|**Transient**|A `4xx` reply (including greylisting), a connect timeout, a TLS handshake failure, a dropped connection, a full queue, a rate limit|It may well succeed later.|

Retries use a jittered exponential backoff bounded by **both** the relay's
attempt count and the request's own deadline, whichever runs out first.

A failure that runs out of attempts is still reported as transient — the
distinction is about the nature of the failure, not about whether Bondy has
given up on it.

## What a caller is never told

Mail errors are [first-class error
URIs](/reference/wamp_api/errors/) carrying the relay's configured **name** and
nothing else about it. A relay's hostname, its username, its credential and the
text of its SMTP replies stay in the log.

A relay banner is written by someone other than Bondy and may say anything at
all, so only the three-digit reply code survives translation into an error a
caller sees. That code is the part a caller can act on.

## Dormant until configured

With no `mail.relay.*` key configured, the mail subsystem starts, does nothing,
and every procedure answers
[`bondy.error.mail_not_configured`](/reference/wamp_api/errors/mail_not_configured).
Nothing crashes and nothing warns beyond a single informational line at boot.

Configuring email is an operator's choice, and a node that has not made it must
still boot.

## Observability

A `Bondy — Mail` Grafana dashboard ships with the [monitoring
stack](/guides/administration/monitoring). The panel to read first is
**failures by nature**: permanent means someone has to change something,
transient means the relay or the network is the problem.

Two separate latency measurements are worth knowing about, because they fail
differently. **Queue wait** rises when a relay is saturated — the pool is too
small for the load. **Send duration** rises when the relay itself is slow. One
end-to-end number would move for either and distinguish neither.

A relay that fails repeatedly raises a `mail_relay_down` alarm. Only transient
failures count towards it: a rejected recipient says nothing about whether the
relay is reachable, and paging someone about a caller's typo is how alarms stop
being read. See the [Metrics Reference](/reference/metrics#mail).

## Not included

- **Inbound mail.** Bondy is not an MTA.
- **Bounce and complaint processing.**
- **Provider HTTP APIs.** Only SMTP is implemented. The older
  [Mailgun and SendGrid broker bridges](/reference/configuration/broker_bridge)
  call provider APIs, but they predate this subsystem and do not share its
  authority model, pooling or error handling.
- **Durable spooling.** See what `send_async` does not promise, above.
- **Rich template management.** A bridge action is a
  [Mops](/reference/api_gateway/expressions) template; that is the whole
  templating story.

## See also
- [Mail Configuration Reference](/reference/configuration/mail) — every `mail.*` key.
- [Mail WAMP API](/reference/wamp_api/mail) — the five procedures.
- [Configuring Mail Relays](/guides/administration/configuring_mail_relays) — the operator task.
- [Sending Email](/guides/programming/sending_email) — the developer task.
- [Sending Email with the SMTP Bridge](/tutorials/smtp_bridge) — a worked example against a local mail server.
