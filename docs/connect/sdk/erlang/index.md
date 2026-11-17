---
features:
    - text: Tutorial
      type: Learn
      link: /connect/sdk/erlang/tutorial
      description: Connect to a router, register and call a procedure, then publish and subscribe.
    - text: Reference
      type: Look up
      link: /connect/sdk/erlang/reference
      description: Every function, option and error shape, grouped by task.
    - text: Design
      type: Understand
      link: /connect/sdk/erlang/design
      description: Why a connection is a supervised process, and what follows from that.
related:
    - text: Remote Procedure Calls
      type: How-to Guide
      link: /connect/guides/programming/wamp/rpc
      description: Register and call procedures, with Erlang examples.
    - text: Publish and Subscribe
      type: How-to Guide
      link: /connect/guides/programming/wamp/pub_sub
      description: Publish events and subscribe to topics, with Erlang examples.
    - text: Bondy Connect SDKs
      type: SDKs
      link: /connect/sdk/index
      description: The SDKs for the other languages.
---

# Bondy Connect SDK for Erlang

The Bondy Connect SDK for Erlang is Bondy's own WAMP client for the BEAM. Use it from Erlang or Elixir. It is the OTP application `bondy_connect_sdk`, and it does not depend on the Bondy router, so it embeds in any BEAM service.

<Features class="VPHomeFeatures" :features="$frontmatter.features"/>

## What it supports

- **Roles.** Caller, callee, publisher and subscriber, with progressive calls and progressive call results.
- **Transports.** WebSocket, RawSocket over TCP, TLS and Unix domain sockets, HTTP long-poll and Server-Sent Events.
- **Authentication.** `anonymous`, `ticket`, `wampcra` and `cryptosign`.

## Requirements

- Erlang/OTP 29 or later.
- rebar3.

The [tutorial](/connect/sdk/erlang/tutorial) shows how to add the dependency and start the application.
