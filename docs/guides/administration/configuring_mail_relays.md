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
      description: Every mail.* key, with defaults.
    - text: Simplifying Realm Management Using Prototypes
      type: How-to Guide
      link: /guides/administration/simplifying_realm_management_using_prototypes
      description: The inheritance a relay's realms list reuses.
    - text: Sending Email
      type: How-to Guide
      link: /guides/programming/sending_email
      description: What a developer does once you have finished here.
---

# Configuring Mail Relays

A **relay** is an SMTP endpoint plus the policy governing who may use it and
what they may claim as a sender. Declaring one is an operator task: relays live
in `bondy.conf`, not in realm state, because a realm administrator must never
be able to grant their own realm access to a relay or read its credential.

This guide takes one from nothing to verified.

## 1. Declare the endpoint

```erlang
mail.relay.transactional.host = smtp.example.com
mail.relay.transactional.port = 587
mail.relay.transactional.transport = starttls
```

`starttls` is the default and **requires** the upgrade: if the relay will not
offer `STARTTLS` the send fails rather than continuing in plaintext. Use `tls`
for implicit TLS (usually port 465), and `plain` only for a relay on localhost.

Certificate verification is on by default and includes the hostname, so there
is nothing to switch on. If the relay uses a private certificate authority,
point at it:

```erlang
mail.relay.transactional.tls.cacertfile = /etc/bondy/relay-ca.pem
```

That must be the **authority** that signed the relay's certificate, not the
certificate itself — a self-signed leaf is refused however trusted it is.

## 2. Wire up the credential

Keep the password out of the configuration file. The `env` provider reads it
from the environment:

```erlang
mail.relay.transactional.auth = always
mail.relay.transactional.username = apikey
mail.relay.transactional.secret.provider = env
mail.relay.transactional.secret.env.var = BONDY_SMTP_PASSWORD
```

`aws_sm` fetches it from AWS Secrets Manager instead, using
`secret.aws_sm.secret_id`. A literal in `bondy.conf` (`secret.provider = none`
with `secret.value`) works and is not forbidden — forbidding it only relocates
the secret to `BONDY_SMTP_PASSWORD=changeme` — but Bondy will **warn at boot
naming the relay** every time it starts.

::: info A relay whose credential will not resolve is dropped
It does not start unauthenticated. An error is logged naming the relay and the
resolver's reason, and the relay is absent from `bondy.mail.relay.list` — so a
broken credential is visible rather than silent.
:::

## 3. Decide who may send, and as whom

These two keys are the whole access-control story, and both default to closed.

```erlang
mail.relay.transactional.from = no-reply@example.com
mail.relay.transactional.allowed_from = example.com
mail.relay.transactional.realms = com.acme.app, com.acme.admin
```

**`realms`** lists the realms permitted to use this relay. Leave it out and
only the master realm can. `*` opens it to every realm.

**`from`** is the sender a caller gets when they do not ask for one, which is
why a caller cannot spoof by default. **`allowed_from`** lists the domains a
caller *may* ask for. Leave it out and callers cannot set the sender at all.

### One line for a family of realms

If your tenant realms inherit from a prototype, name the **prototype** and
every realm that inherits from it is admitted:

```erlang
mail.relay.transactional.realms = com.acme.tenant_prototype
```

Adding a tenant realm then needs no change here. See [Simplifying Realm
Management Using
Prototypes](/guides/administration/simplifying_realm_management_using_prototypes).

## 4. Size the pool and the queue

```erlang
mail.relay.transactional.pool.size = 4
mail.relay.transactional.queue.max_size = 1000
mail.relay.transactional.rate_limit.rate = 20
mail.relay.transactional.rate_limit.burst = 50
```

`pool.size` is how many messages this relay delivers concurrently.
`queue.max_size` is the bound in front of it — when it is full, sends are
refused immediately with
[`bondy.error.mail_queue_full`](/reference/wamp_api/errors/mail_queue_full)
rather than blocking the caller.

Set `rate_limit.rate` to whatever your provider's quota allows. It protects the
*relay*, so refusal happens on Bondy's side of the queue rather than as a `4xx`
from the provider.

## 5. Name a default

```erlang
mail.default_relay = transactional
```

With exactly one relay configured this is unnecessary. With several and no
default, a caller must name one — Bondy does not guess, because guessing is how
mail goes out through the wrong relay.

## 6. Verify it

Restart the node and check the relay came up:

```bash
bondy attach
```

From a master-realm session, list the relays and send yourself a test message:

```erlang
bondy.mail.relay.list()
bondy.mail.test("you@example.com")
```

`bondy.mail.test` is master-realm only and sends a fixed message, so nothing
about its content can be the reason it fails. Pass `relay` as a keyword
argument to test a specific one.

If it does not arrive, the error tells you which layer refused it:

|Error|What to change|
|:---|:---|
|[`mail_not_configured`](/reference/wamp_api/errors/mail_not_configured)|No relay is configured, or this one's credential would not resolve. Check the boot log.|
|[`no_such_relay`](/reference/wamp_api/errors/no_such_relay)|The name is wrong, or several relays exist and `mail.default_relay` is unset.|
|[`relay_not_permitted`](/reference/wamp_api/errors/relay_not_permitted)|`mail.relay.$name.realms` does not include the calling realm.|
|[`sender_not_permitted`](/reference/wamp_api/errors/sender_not_permitted)|`allowed_from` does not include the domain that was asked for.|
|[`relay_unavailable`](/reference/wamp_api/errors/relay_unavailable)|Host, port, TLS or the certificate chain. Check `tls.cacertfile`.|
|[`mail_rejected`](/reference/wamp_api/errors/mail_rejected)|The relay refused it. The `code` in the error is its reply code; the full text is in the log.|

## 7. Let a realm use it

Membership of `mail.relay.$name.realms` says the realm *may* use the relay. A
session still needs the ordinary `wamp.call` permission on the procedure, which
is granted like any other:

```erlang
bondy.grant("com.acme.app", {
    "permissions": ["wamp.call"],
    "uri": "bondy.mail.",
    "match": "prefix",
    "roles": ["api_clients"]
})
```

## If you are using the broker bridge

Sending email on a published event needs one more key, and it belongs in this
guide rather than the developer's because getting it wrong is an operational
failure rather than a coding one:

```erlang
broker_bridge.smtp.enabled = on
broker_bridge.config_file = ./etc/broker_bridge_config.json
```

::: warning Enable it on every node
A broker bridge subscriber handles only **locally-published** events. A node
where this is off silently drops the events published to it, so whether an
email is sent depends on which node the publisher happened to connect to
&mdash; which is the kind of fault that looks like an intermittent bug in the
application for weeks.
:::

The relay's `realms` list still applies: the subscription names a realm, and
that realm must be permitted to use the relay it names. See the [Broker Bridge
Configuration Reference](/reference/configuration/broker_bridge#smtp).

## Watching it in production

The [`Bondy — Mail` dashboard](/guides/administration/monitoring) is the
per-relay view. Two things to know when reading it:

- **Failures split by nature.** `permanent` means somebody has to change
  something; `transient` means the relay or the network is the problem. That
  split is the number that decides whether to page anyone.
- **A relay that fails repeatedly raises a `mail_relay_down` alarm.** Only
  transient failures count towards it, so a caller sending to a bad address
  cannot raise it. Delivery recovers on the first success; the alarm clears
  after `health.success_threshold` successes, so a flapping relay does not
  flap the page.

## See also
- [Mail](/concepts/mail) — the reasoning behind the model.
- [Mail Configuration Reference](/reference/configuration/mail) — every key and its default.
- [Sending Email](/guides/programming/sending_email) — the developer's side.
- [Sending Email with the SMTP Bridge](/tutorials/smtp_bridge) — a worked example against a local mail server.
