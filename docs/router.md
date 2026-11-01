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
  :groups="[
    {
      kicker: 'Learning-oriented',
      heading: 'Tutorials',
      href: '/router/tutorials/index',
      blurb: 'Lessons that take you through building something end to end. Start here if you are new to Bondy; each one assumes only what came before it.',
      links: [
        { text: 'Get Bondy', href: '/router/tutorials/getting_started/get_bondy' },
        { text: 'The marketplace demo', href: '/router/tutorials/getting_started/marketplace' },
        { text: 'Your first WAMP component (Python)', href: '/router/tutorials/wamp/wampy' },
        { text: 'The marketplace API gateway', href: '/router/tutorials/getting_started/marketplace_api_gateway' },
        { text: 'Same Sign-On', href: '/router/tutorials/security/same_sign_on' }
      ]
    },
    {
      kicker: 'Task-oriented',
      heading: 'How-to Guides',
      href: '/router/guides/index',
      blurb: 'Directions for getting a specific job done. They assume you know what you are trying to achieve and want the steps, not the theory.',
      links: [
        { text: 'Install using Docker', href: '/router/guides/install/docker' },
        { text: 'Call and register procedures', href: '/router/guides/programming/wamp/rpc' },
        { text: 'Run a cluster', href: '/router/guides/deployment/running_a_cluster' },
        { text: 'Load an API specification', href: '/router/guides/programming/loading_api_spec' },
        { text: 'Monitor a cluster', href: '/router/guides/administration/monitoring' }
      ]
    },
    {
      kicker: 'Information-oriented',
      heading: 'Reference',
      href: '/router/reference/index',
      blurb: 'Material to consult while working, not to read start to end. Every configuration key, API procedure, metric and error, described once and precisely.',
      links: [
        { text: 'Configuration Reference', href: '/router/reference/configuration/index' },
        { text: 'HTTP API Reference', href: '/router/reference/http_api/index' },
        { text: 'WAMP Administration API', href: '/router/reference/wamp_api/index' },
        { text: 'Bondy Connect SDK', href: '/router/reference/clients/bondy_connect_sdk' },
        { text: 'Glossary', href: '/router/reference/glossary' }
      ]
    },
    {
      kicker: 'Understanding-oriented',
      heading: 'Concepts',
      href: '/router/concepts/index',
      blurb: 'What Bondy is, what it does, and why it is built the way it is. Read these when you want the model behind the behaviour rather than an instruction to follow.',
      links: [
        { text: 'What is WAMP?', href: '/router/concepts/wamp/what_is_wamp' },
        { text: 'What is Bondy?', href: '/router/concepts/what_is_bondy' },
        { text: 'Application networks', href: '/router/concepts/application_networks' },
        { text: 'Architecture', href: '/router/concepts/architecture' },
        { text: 'Clustering', href: '/router/concepts/clustering' }
      ]
    }
  ]"
/>
