---
outline: [2,3]
---
# WAMP Client Libraries
A component reaches Bondy through a WAMP client library. This page lists the libraries known to work with Bondy, by language.

Any library that implements the WAMP specification can connect to Bondy, as long as it supports a transport, a serializer and an authentication method that Bondy offers. [WAMP Compliance](/router/reference/protocols/wamp) lists those. The WAMP project keeps a [list of implementations](https://wamp-proto.org/implementations.html#libraries) for languages not listed here.

## Bondy Connect SDK

The [Bondy Connect SDK](/router/reference/clients/bondy_connect_sdk) is Bondy's own client, for Erlang and Elixir.

- **Transports.** WebSocket, RawSocket over TCP, TLS and Unix domain sockets, HTTP long-poll and Server-Sent Events.
- **Authentication.** `anonymous`, `ticket`, `wampcra` and `cryptosign`.
- **Roles.** Caller, callee, publisher and subscriber, with progressive calls and progressive call results.

To start, follow the [Bondy Connect SDK tutorial](/router/tutorials/wamp/bondy_connect_sdk).

## Community libraries

Other projects maintain these libraries. Check each one against the features your component needs.

|Language|Library|Notes|
|:---|:---|:---|
|Dart and Flutter|[Connectanum](https://pub.dev/packages/connectanum)||
|Erlang|[wamp_client](https://github.com/leapsight/wamp_client)|Superseded by the Bondy Connect SDK.|
|Go|[Nexus](https://github.com/gammazero/nexus)||
|Java|[Autobahn\|Java](https://github.com/crossbario/autobahn-java)|For Android and Java 8 or later.|
|JavaScript|[Autobahn\|JS](https://github.com/crossbario/autobahn-js)|Browser and Node.js.|
|JavaScript|[Wampy.js](https://github.com/KSDaemon/wampy.js)|Browser and Node.js. See the [Wampy tutorial](/router/tutorials/wamp/wampy).|
|Python|[Autobahn\|Python](https://github.com/crossbario/autobahn-python)|Requires Python 3.11 or later.|
|Ruby|[ruby_wamp_client](https://github.com/ericchapman/ruby_wamp_client)||

## Command-line client

[Wick](https://github.com/asimfarooq5/wamp-cli) calls procedures, publishes events and subscribes to topics from a shell. The examples in the WAMP API reference use it.
