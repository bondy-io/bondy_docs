---
layout: page
pageClass: docs-home-page
title: Bondy Connect Documentation
description: Build on, deploy and operate Bondy Connect, whichever protocol your components speak — tutorials, how-to guides, reference and concepts.
---

<DocsSet
  eyebrow="Platform"
  title="Bondy Connect"
  stand="Everything needed to build on, deploy and operate Bondy Connect, organised by what you came here to do. Components reach it over WAMP, HTTP/REST or MCP; each is covered in every section below."
  :highlight="{
    kicker: 'This version',
    heading: 'What’s New in 1.1',
    href: '/connect/whats_new',
    blurb: 'Configuration keys grouped by component, a node that refuses unknown keys, a bearer token on the Admin API, and stricter OIDC and cookie authentication. Read this before you upgrade from 1.0.',
    links: [
      { text: 'What’s New in 1.1', href: '/connect/whats_new' },
      { text: 'Migrating from a release candidate', href: '/connect/guides/deployment/migrating_from_a_release_candidate' },
      { text: 'Upgrading to 1.0.0', href: '/connect/guides/deployment/upgrading_to_1_0_0' }
    ]
  }"
  :groups="[
    {
      kicker: 'Learning-oriented',
      heading: 'Tutorials',
      href: '/connect/tutorials/index',
      blurb: 'Lessons that take you through building something end to end. Start here if you are new to Bondy; each one assumes only what came before it.',
      links: [
        { text: 'Get Bondy', href: '/connect/tutorials/getting_started/get_bondy' },
        { text: 'The marketplace demo', href: '/connect/tutorials/getting_started/marketplace' },
        { text: 'Your first WAMP component (Python)', href: '/connect/tutorials/wamp/wampy' },
        { text: 'The marketplace API gateway', href: '/connect/tutorials/getting_started/marketplace_api_gateway' },
        { text: 'Same Sign-On', href: '/connect/tutorials/security/same_sign_on' }
      ]
    },
    {
      kicker: 'Task-oriented',
      heading: 'How-to Guides',
      href: '/connect/guides/index',
      blurb: 'Directions for getting a specific job done. They assume you know what you are trying to achieve and want the steps, not the theory.',
      links: [
        { text: 'Install using Docker', href: '/connect/guides/install/docker' },
        { text: 'Call and register procedures', href: '/connect/guides/programming/wamp/rpc' },
        { text: 'Run a cluster', href: '/connect/guides/deployment/running_a_cluster' },
        { text: 'Load an API specification', href: '/connect/guides/programming/loading_api_spec' },
        { text: 'Monitor a cluster', href: '/connect/guides/administration/monitoring' }
      ]
    },
    {
      kicker: 'Information-oriented',
      heading: 'Reference',
      href: '/connect/reference/index',
      blurb: 'Material to consult while working, not to read start to end. Every configuration key, API procedure, metric and error, described once and precisely.',
      links: [
        { text: 'Configuration Reference', href: '/connect/reference/configuration/index' },
        { text: 'HTTP API Reference', href: '/connect/reference/http_api/index' },
        { text: 'WAMP Administration API', href: '/connect/reference/wamp_api/index' },
        { text: 'Bondy Connect SDK', href: '/connect/reference/clients/bondy_connect_sdk' },
        { text: 'Glossary', href: '/connect/reference/glossary' }
      ]
    },
    {
      kicker: 'Understanding-oriented',
      heading: 'Concepts',
      href: '/connect/concepts/index',
      blurb: 'What Bondy is, what it does, and why it is built the way it is. Read these when you want the model behind the behaviour rather than an instruction to follow.',
      links: [
        { text: 'What is WAMP?', href: '/connect/concepts/wamp/what_is_wamp' },
        { text: 'What is Bondy?', href: '/connect/concepts/what_is_bondy' },
        { text: 'Application networks', href: '/connect/concepts/application_networks' },
        { text: 'Architecture', href: '/connect/concepts/architecture' },
        { text: 'Clustering', href: '/connect/concepts/clustering' }
      ]
    }
  ]"
/>
