---
outline: [2,3]
related:
    - text: Mail
      type: Concept
      link: /concepts/mail
      description: Why relays are operator-owned, why sender identity is derived, and what send_async does not promise.
    - text: Configuring Mail Relays
      type: How-to Guide
      link: /guides/administration/configuring_mail_relays
      description: The operator task, end to end — declare a relay, scope it, wire up its credential, verify it.
    - text: Mail WAMP API
      type: API Reference
      link: /reference/wamp_api/mail
      description: The five bondy.mail.* procedures.
    - text: Broker Bridge Configuration Reference
      type: Configuration Reference
      link: /reference/configuration/broker_bridge
      description: Enabling the SMTP bridge and writing its subscription.
---

# Mail Configuration Reference

Outbound email is configured entirely through `bondy.conf`. A **relay** is a
named SMTP endpoint plus the policy governing who may use it and what they may
claim as a sender. See [Mail](/concepts/mail) for why relays live here rather
than in realm state.

**With no `mail.relay.*` key configured the subsystem is dormant**: the node
boots, logs one informational line, and every mail procedure answers
[`bondy.error.mail_not_configured`](/reference/wamp_api/errors/mail_not_configured).

Replace `$name` throughout with your own relay name. It is the name callers use
in a request, and the label that appears in metrics, logs and alarms.

## Endpoint

@[config](mail.relay.$name.host,string,,v1.0.0-rc.60)

The relay's hostname. This is a host, not a domain to resolve: Bondy does not
perform MX lookups, because a relay is somewhere an operator pointed it rather
than a domain whose mail exchangers should be discovered.

@[config](mail.relay.$name.port,integer,587,v1.0.0-rc.60)

@[config](mail.relay.$name.transport,enum,starttls,v1.0.0-rc.60)

One of `plain`, `starttls` or `tls`.

`starttls` **requires** the upgrade: if the relay does not offer `STARTTLS` the
send fails rather than silently continuing in plaintext. Falling back would
make asking for STARTTLS mean nothing.

`tls` is implicit TLS — encrypted from the first byte, conventionally on port
465. `plain` is unencrypted and appropriate for a relay on localhost and
little else.

@[config](mail.relay.$name.timeout,duration,30s,v1.0.0-rc.60)

How long one delivery attempt may take. A caller may request a shorter deadline
in a request; it can never request a longer one.

@[config](mail.relay.$name.max_message_size,bytesize,25MB,v1.0.0-rc.60)

Measured twice. At admission, against the decoded request — subject, both
bodies, headers and attachments together — so an oversized message is refused
before it occupies the queue. And exactly, on the encoded message, before it is
offered to the relay.

Every field counts towards it. The same megabytes are refused whether they
arrive as an attachment or as an HTML body; a limit whose answer depends on
which field you used is not one you can work with.

::: warning The admission check allows for encoding, so it refuses at 70%
A message becomes larger on the wire than it is in a request: base64 costs a
third, and quoted-printable costs more than that on text that is not mostly
ASCII. The admission check therefore refuses anything whose decoded size exceeds
**70% of this limit**, so that a message it lets through will still fit once
encoded.

The margin applies to the whole request, not only to attachments — a 20MB plain
text body against a 25MB relay is refused, and the error names both the size and
the effective limit. Size a relay's `max_message_size` from what the relay
accepts, and expect callers to be held to seven tenths of it.
:::

Exceeding it is a permanent failure and is never retried.

@[config](mail.relay.$name.max_recipients,integer,100,v1.0.0-rc.60)

The most envelope recipients one message may name. `to`, `cc` and `bcc` are
counted together, because they all become `RCPT TO` commands in a single
transaction and their sum is what the relay sees. RFC 5321 obliges a server to
accept 100, which is why that is the default.

## Transport security

@[config](mail.relay.$name.tls.verify,enum,verify_peer,v1.0.0-rc.60)

`verify_peer` or `verify_none`. Certificate verification is **on by default**,
and includes hostname verification — a certificate valid for some other host is
refused.

::: warning
`verify_none` accepts any certificate from anyone. It exists for a relay using
a self-signed certificate on a trusted network; prefer setting
`tls.cacertfile` and keeping verification on.
:::

@[config](mail.relay.$name.tls.cacertfile,path,,v1.0.0-rc.60)

A PEM file of certificate authorities to verify the relay against. Leave it
unset to use the operating system trust store, which is what a public relay is
signed against.

If you are verifying a private relay, this must be the **authority** that
signed its certificate, not the certificate itself: a self-signed leaf is
refused however trusted it is.

## Authentication

@[config](mail.relay.$name.auth,enum,if_available,v1.0.0-rc.60)

`always`, `if_available` or `never`. `always` fails the send if the relay does
not offer authentication.

@[config](mail.relay.$name.username,string,,v1.0.0-rc.60)

@[config](mail.relay.$name.secret.provider,enum,none,v1.0.0-rc.60)

Where the password comes from: `none` (a literal in this file), `env` (an
environment variable) or `aws_sm` (AWS Secrets Manager). This mirrors
`security.master_key.*` and uses the same resolver.

**A relay whose credential cannot be resolved is dropped**, with an error
logged naming it and the resolver's reason. It does not start unauthenticated,
and it does not appear in `bondy.mail.relay.list` — so a broken credential is
visible rather than silent.

@[config](mail.relay.$name.secret.value,string,,v1.0.0-rc.60)

The literal password, used when `secret.provider = none`. Bondy **warns at
boot naming the relay** when one is set. It is not forbidden, because
forbidding it only relocates the secret to `BONDY_SMTP_PASSWORD=changeme`.

@[config](mail.relay.$name.secret.env.var,string,,v1.0.0-rc.60)

The environment variable to read when `secret.provider = env`.

@[config](mail.relay.$name.secret.aws_sm.secret_id,string,,v1.0.0-rc.60)

The secret id to fetch when `secret.provider = aws_sm`.

@[config](mail.relay.$name.secret.encoding,enum,raw,v1.0.0-rc.60)

`raw` or `base64`, for a stored credential that is base64-encoded.

## Authority

These two keys are the whole access-control story, and both **default to
closed**.

@[config](mail.relay.$name.realms,list,,v1.0.0-rc.60)

Which realms may send through this relay. A comma-separated list of realm URIs,
or `*` for every realm. **Unset means the master realm only.**

A **prototype URI** here admits every realm that inherits from it, so a family
of tenant realms is granted access in one line. See [Simplifying Realm
Management Using
Prototypes](/guides/administration/simplifying_realm_management_using_prototypes).

@[config](mail.relay.$name.from,string,,v1.0.0-rc.60)

The default sender. A request that does not name one gets this — which is why a
caller cannot spoof by default.

May carry a display name, which is where the brand a recipient sees belongs:

```erlang
mail.relay.transactional.from = Acme Ltd <no-reply@example.com>
```

The display name reaches the `From` header only. The envelope always carries
the bare address, because `MAIL FROM` cannot hold anything else. A name may not
contain a control character, a double quote or a backslash.

@[config](mail.relay.$name.allowed_from,list,,v1.0.0-rc.60)

Domains a caller may claim in a request's `from`. A comma-separated list, or
`*` to disable sender restriction for this relay. **Unset means callers cannot
set `from` at all** and always send as `mail.relay.$name.from`.

Matching is against the **address**, never against what the caller supplied. A
request for `Trusted Sender <attacker@evil.example>` is checked on
`evil.example` and refused; a display name buys nothing.

::: warning Sender restriction is a narrowing, not a check
A caller-supplied sender is only ever accepted from within this list. That is
the opposite of validating an asserted sender after the fact, and it is
deliberate: an allow-list you forgot to configure permits nothing, whereas a
validation you forgot to configure permits everything.
:::

## Pooling and backpressure

@[config](mail.relay.$name.pool.size,integer,4,v1.0.0-rc.60)

Workers for this relay, and therefore how many messages it delivers
concurrently. Each worker holds its own messages, and the bounds below are the
relay's — the pool divides them, it does not multiply them.

@[config](mail.relay.$name.queue.max_size,integer,1000,v1.0.0-rc.60)

How many messages may wait for this relay, across its whole pool. **A full
queue refuses immediately** with a transient error rather than blocking the
caller: blocking would move the stall onto whatever asked to send.

@[config](mail.relay.$name.queue.max_bytes,bytesize,64MB,v1.0.0-rc.60)

The same bound in bytes, measured on the decoded request. Whichever of the two
is reached first refuses.

::: tip Why two bounds
A bound in messages says nothing about memory, because a message may be a
hundred bytes or twenty megabytes. This is the one that decides how much a relay
that has stopped answering can occupy, and it is the one to size from the mail
you actually send.
:::

@[config](mail.relay.$name.queue.ttl,duration,5m,v1.0.0-rc.60)

How long a message may sit queued before it is shed unsent. A message nobody is
waiting for any more is not worth a worker.

A shed message is reported, not dropped: a synchronous caller receives a
transient error rather than waiting out its own timeout, the message's status
becomes `shed` with an `error_class` of `expired`, and
`bondy_mail_rejected_total` counts it with the same reason. It does **not**
count against the relay's health — a queue backing up says nothing about whether
the relay is answering — and it does **not** consume the caller's idempotency
key, because no relay was ever shown the message. Sending the same key again
sends.

@[config](mail.relay.$name.rate_limit.rate,number,0,v1.0.0-rc.60)

Messages per second, refilled continuously. `0` disables the limit. Fractional
rates are accepted: a relay permitting thirty messages a minute is `0.5`.

This protects the relay's own quota, so refusal happens on the caller's side of
the queue — before the message occupies it. A refused message answers
[`bondy.error.rate_limit_exceeded`](/reference/errors), which is transient.

The limit is keyed per relay, not per realm, because the quota it protects
belongs to the relay.

@[config](mail.relay.$name.rate_limit.burst,integer,1,v1.0.0-rc.60)

Token-bucket capacity: how many messages may be sent back to back before the
rate above starts to bite. The default of `1` allows no burst at all, so a
relay configured with a rate wants a burst chosen alongside it.

## Retries

Only **transient** failures are retried. A `5xx` reply, a malformed address or
an oversized message is permanent and is offered once.

@[config](mail.relay.$name.retry.max_attempts,integer,3,v1.0.0-rc.60)

Retries after the first attempt. The request's own deadline also bounds this,
and whichever runs out first wins.

@[config](mail.relay.$name.retry.backoff.min,duration,1s,v1.0.0-rc.60)

@[config](mail.relay.$name.retry.backoff.max,duration,1m,v1.0.0-rc.60)

Exponential with jitter between these bounds.

## Health and alarms

@[config](mail.relay.$name.health.failure_threshold,integer,3,v1.0.0-rc.60)

Consecutive **transient** failures that mark the relay down, raising the
`mail_relay_down` alarm and setting `bondy_mail_relay_up` to `0`.

Permanent failures do not count. A rejected recipient or an oversized message
is the relay working correctly, and marking it down for one would page someone
about a caller's mistake.

@[config](mail.relay.$name.health.success_threshold,integer,1,v1.0.0-rc.60)

Consecutive successes that clear the alarm again.

Delivery itself recovers on the **first** success regardless of this setting —
a relay that is merely flaky should not be treated as down a moment longer than
it is. Only the alarm waits, so that a relay alternating between working and
failing does not alternate the page.

## Cross-cutting

@[config](mail.default_relay,string,,v1.0.0-rc.60)

The relay used when a request does not name one. With exactly one relay
configured that relay is the default automatically. With several and no default
set, a caller must name one: guessing on their behalf is how mail goes out
through the wrong relay.

@[config](mail.status.ttl,duration,1h,v1.0.0-rc.60)

How long `bondy.mail.status.get` remembers a message. This is **also** the
window in which an idempotency key deduplicates, so a client whose retry policy
outlasts it will send twice.

@[config](mail.status.max_size,integer,50000,v1.0.0-rc.60)

A backstop on the number of remembered messages, not an operating point: the
table is bounded by arrival rate times TTL, and this only decides what happens
if that product is larger than expected.

## A worked example

```erlang
# A development relay pointing at a local mail catcher.
mail.relay.local.host = localhost
mail.relay.local.port = 1025
mail.relay.local.transport = plain
mail.relay.local.auth = never
mail.relay.local.from = no-reply@bondy.test
mail.relay.local.realms = *

# A production relay, scoped to two realms, with its credential in the
# environment.
mail.relay.transactional.host = smtp.example.com
mail.relay.transactional.port = 587
mail.relay.transactional.transport = starttls
mail.relay.transactional.tls.verify = verify_peer
mail.relay.transactional.auth = always
mail.relay.transactional.username = apikey
mail.relay.transactional.secret.provider = env
mail.relay.transactional.secret.env.var = BONDY_SMTP_PASSWORD
mail.relay.transactional.from = no-reply@example.com
mail.relay.transactional.allowed_from = example.com
mail.relay.transactional.realms = com.acme.app, com.acme.admin
mail.relay.transactional.pool.size = 4
mail.relay.transactional.rate_limit.rate = 20
mail.relay.transactional.rate_limit.burst = 50

mail.default_relay = transactional
```

## See also
- [Mail](/concepts/mail) — the reasoning behind these keys.
- [Configuring Mail Relays](/guides/administration/configuring_mail_relays) — the same task, step by step.
- [Mail WAMP API](/reference/wamp_api/mail) — what a caller can then do.
- [Prometheus Metrics Reference](/reference/metrics#mail) — the `bondy_mail_*` families.
