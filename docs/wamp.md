---
layout: page
pageClass: docs-home-page
title: WAMP Documentation
description: The Web Application Messaging Protocol — routed RPC and publish/subscribe over a single connection, for developers writing WAMP components.
---

<DocsSet
  eyebrow="Protocol"
  title="WAMP"
  stand="The Web Application Messaging Protocol: routed remote procedure calls and publish/subscribe over one connection. This set is for developers writing WAMP components — what you need to know is the protocol, not how the router is operated."
  :groups="[
    {
      kicker: 'Understanding-oriented',
      heading: 'Concepts',
      href: '/wamp/concepts/what_is_wamp',
      blurb: 'What WAMP is, the two patterns it provides, and the mechanics underneath them. Read these for the model behind the behaviour.',
      links: [
        { text: 'What is WAMP?', href: '/wamp/concepts/what_is_wamp' },
        { text: 'Communication patterns', href: '/wamp/concepts/communication_patterns' },
        { text: 'Connections and sessions', href: '/wamp/concepts/sessions' },
        { text: 'Security', href: '/wamp/concepts/security' }
      ]
    },
    {
      kicker: 'Task-oriented',
      heading: 'Programming Guides',
      href: '/wamp/guides/programming/general',
      blurb: 'Directions for getting a specific job done from a component: register a procedure, call one, publish an event, subscribe to a topic.',
      links: [
        { text: 'General conventions', href: '/wamp/guides/programming/general' },
        { text: 'Calling and registering procedures', href: '/wamp/guides/programming/rpc' },
        { text: 'Publishing and subscribing', href: '/wamp/guides/programming/pub_sub' },
        { text: 'Naming procedures and topics', href: '/wamp/concepts/naming' }
      ]
    },
    {
      kicker: 'Learning-oriented',
      heading: 'Tutorials',
      href: '/wamp/tutorials/wampy',
      blurb: 'End-to-end walkthroughs. They run against Bondy, because that is the router we ship — what you are learning is the protocol.',
      links: [
        { text: 'Wampy (Python)', href: '/wamp/tutorials/wampy' },
        { text: 'Bondy Connect SDK (Erlang/Elixir)', href: '/wamp/tutorials/bondy_connect_sdk' }
      ]
    },
    {
      kicker: 'Information-oriented',
      heading: 'Client Libraries',
      href: '/wamp/reference/clients/index',
      blurb: 'What to use to speak WAMP from your language, and the full API reference for the client Bondy ships itself.',
      links: [
        { text: 'WAMP client libraries', href: '/wamp/reference/clients/index' },
        { text: 'Bondy Connect SDK', href: '/wamp/reference/clients/bondy_connect_sdk' },
        { text: 'Advanced RPC', href: '/wamp/concepts/advanced/rpc' },
        { text: 'Advanced Pub/Sub', href: '/wamp/concepts/advanced/pubsub' }
      ]
    }
  ]"
/>
