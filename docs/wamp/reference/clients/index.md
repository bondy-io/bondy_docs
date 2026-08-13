---
draft: true
outline: [2,3]
---
# WAMP Client Libraries
To write distributed application components in your favorite language, you will need a WAMP client library so that your component can connect to Bondy.

::: tip Bondy clients
[Bondy Connect](/wamp/reference/clients/bondy_connect) is Bondy's own production client for the BEAM (Erlang/Elixir) — see below. Android and iOS clients are still in development; they'll be linked here once ready.
:::

There are community-maintained client libraries implementations for most popular programming languages. The WAMP Specification website has an [up-to-date list](https://wamp-proto.org/implementations.html#libraries) of community-supported client libraries.


## Client Libraries
The following is a pre-selection of libraries we have been using and/or we know people are using with Bondy.

### Dart / Flutter
* [Connectanum](https://pub.dev/packages/connectanum)

### Erlang/Elixir (BEAM)

* [Bondy Connect](/wamp/reference/clients/bondy_connect) — Bondy's own production client for the BEAM, supporting all transports and authentication methods, callee/caller/publisher/subscriber roles, and Progressive Calls/Call Results. See the [tutorial](/wamp/tutorials/bondy_connect) to get started.
* [wamp_client](https://github.com/leapsight/wamp_client) (legacy — superseded by Bondy Connect)

### Go
* [Nexus](https://github.com/gammazero/nexus)

### Java
* [Autobahn Java](https://github.com/crossbario/autobahn-java) - WebSocket & WAMP in Java for Android and Java 8.
* Jawampa

### JavaScript

* [AutobahnJS](https://github.com/crossbario/autobahn-js) (Browser and NodeJS)
* [Wampy](https://github.com/KSDaemon/wampy.js) (Browser and NodeJS)

### Python

* [AutobahnPython](https://github.com/crossbario/autobahn-python) (Python 2 and 3, on Twisted and Asyncio)

### Ruby
* [ruby_wamp_client](https://github.com/ericchapman/ruby_wamp_client)

## CLI clients

* [Wick](https://github.com/asimfarooq5/wamp-cli)