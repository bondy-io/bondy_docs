---
outline: [2,3]
related:
    - text: Mail
      type: Concept
      link: /concepts/mail
      description: Why relays are operator-owned, and what send_async does not promise.
    - text: Mail Configuration Reference
      type: Configuration Reference
      link: /reference/configuration/mail
      description: Every mail.* key, with defaults.
    - text: Configuring Mail Relays
      type: How-to Guide
      link: /guides/administration/configuring_mail_relays
      description: The same relay setup against a real provider.
    - text: Broker Bridge
      type: Concept
      link: /concepts/broker_bridge
      description: The subscription machinery this tutorial uses.
---

# Sending Email with the SMTP Bridge

By the end of this tutorial you will publish a WAMP event and read the email it
produced, in a browser, on your own machine. Nothing is sent to the internet.

You need Docker and a Bondy node you can restart.

## 1. Start a mail server

Bondy's repository ships a [Mailpit](https://mailpit.axllent.org/) stack for
exactly this. Mailpit speaks SMTP, keeps every message instead of delivering
it, and shows them in a web UI.

```bash
cd examples/mailpit
docker compose up -d
```

Open `http://localhost:8025`. An empty mailbox, waiting.

The stack listens for plain SMTP and STARTTLS on port `1025`, and it generated
a certificate authority into `examples/mailpit/certs/` that you can verify
against later.

## 2. Declare a relay

Add this to your `bondy.conf`:

```erlang
mail.relay.local.host = localhost
mail.relay.local.port = 1025
mail.relay.local.transport = plain
mail.relay.local.auth = never
mail.relay.local.from = no-reply@bondy.test
mail.relay.local.realms = *

mail.default_relay = local
```

`realms = *` opens this relay to every realm. That is right for a local mail
catcher and wrong for anything else — a real relay names the realms allowed to
use it, and defaults to admitting none.

Restart Bondy.

## 3. Send one message by hand

Before involving the bridge, prove the relay works. From a master-realm
session:

```erlang
bondy.mail.test("you@example.com")
```

Refresh `http://localhost:8025`. The message is there.

If it is not, the error names the layer that refused it — see the table in
[Configuring Mail Relays](/guides/administration/configuring_mail_relays#_6-verify-it).

## 4. Send from a client

`bondy.mail.test` is an operator's check. This is what an application does:

```javascript
const [result] = await session.call("bondy.mail.send", [{
    to: ["user@example.com"],
    subject: "Hello from Bondy",
    text: "Sent through the local relay.",
    html: "<h1>Hello</h1><p>Sent through the local relay.</p>"
}]);
// { id: "bondy@127.0.0.1/3f9a…", status: "sent", ... }
```

Mailpit shows one message with both a plain-text and an HTML part — Bondy built
a `multipart/alternative` because you supplied both bodies.

Note what you did **not** write: a realm (taken from your session), a sender
(supplied by the relay), or a relay name (`mail.default_relay`).

## 5. Send it on an event instead

Now the interesting part. Instead of a client calling a mail procedure, an
event triggers the email and the publisher knows nothing about it.

Enable the bridge in `bondy.conf` and point it at a specification file:

```erlang
broker_bridge.smtp.enabled = on
broker_bridge.config_file = ./etc/broker_bridge_config.json
```

Create `etc/broker_bridge_config.json`:

```json
{
    "id": "smtp_example",
    "meta": {},
    "subscriptions": [
        {
            "bridge": "bondy_smtp_bridge",
            "match": {
                "realm": "com.example.realm",
                "topic": "com.example.user.registered",
                "options": {"match": "exact"}
            },
            "action": {
                "realm": "{{event.realm}}",
                "relay": "local",
                "to": "{{event.kwargs.email}}",
                "subject": "\"Welcome, {{event.kwargs.name}}\"",
                "text": "\"Your account is ready.\"",
                "html": "\"<h1>Welcome, {{event.kwargs.name}}</h1><p>Your account is ready.</p>\""
            }
        }
    ]
}
```

::: warning Enable the bridge on every node
A subscriber handles only **locally-published** events. On a cluster, a node
where `broker_bridge.smtp.enabled` is off silently drops the events published
to it — so whether an email is sent would depend on which node the publisher
happened to connect to.
:::

Restart Bondy, then publish:

```javascript
session.publish("com.example.user.registered", [], {
    email: "ada@example.com",
    name: "Ada"
});
```

Refresh Mailpit. *Welcome, Ada*, addressed to `ada@example.com`.

The publisher sent an event. It did not know an email existed, which is the
point: adding, changing or removing the email is an operator's edit to one JSON
file.

## 6. Watch it fail safely

Publish the same topic without an `email`:

```javascript
session.publish("com.example.user.registered", [], { name: "Ada" });
```

No new message appears in Mailpit, and the log records a failed action.
`{{event.kwargs.email}}` against an event that has no such key is a hard error,
not an empty string — the action fails and sends nothing, because a
half-rendered email is worse than none.

## 7. Watch a stalled relay not stall the router

This is the claim the design exists to make, and you can check it.

Stop Mailpit while leaving Bondy running:

```bash
docker compose stop mailpit
```

Publish to the bridged topic a few times. Nothing is delivered — and publishing
is exactly as fast as it was. Your subscribers keep receiving events, your RPC
calls keep returning. The relay's queue fills, sends start being refused with
[`bondy.error.mail_queue_full`](/reference/wamp_api/errors/mail_queue_full),
and after a few consecutive failures the relay is marked down and raises the
`mail_relay_down` alarm.

Mail degraded. Routing did not.

Start Mailpit again and the relay recovers on its first success.

## 8. Turn on TLS

The compose stack's certificate authority is at
`examples/mailpit/certs/ca.pem`. Point a relay at it to exercise real
certificate verification:

```erlang
mail.relay.local_tls.host = localhost
mail.relay.local_tls.port = 1025
mail.relay.local_tls.transport = starttls
mail.relay.local_tls.tls.verify = verify_peer
mail.relay.local_tls.tls.cacertfile = ./examples/mailpit/certs/ca.pem
mail.relay.local_tls.auth = never
mail.relay.local_tls.from = no-reply@bondy.test
mail.relay.local_tls.realms = *
```

```erlang
bondy.mail.test("you@example.com", relay := "local_tls")
```

Remove the `cacertfile` line and try again: the send fails with
[`relay_unavailable`](/reference/wamp_api/errors/relay_unavailable), because
verification against the operating-system trust store cannot vouch for a
certificate the compose stack generated five minutes ago. That failure is
verification working.

## Clean up

```bash
cd examples/mailpit && docker compose down -v
```

## Where to go next

- [Configuring Mail Relays](/guides/administration/configuring_mail_relays) —
  the same setup against a real provider: credentials from the environment,
  realms scoped instead of `*`, and a sender policy.
- [Sending Email](/guides/programming/sending_email) — attachments, custom
  senders, idempotency keys and error handling.
- [Mail](/concepts/mail) — why the model is shaped this way.
