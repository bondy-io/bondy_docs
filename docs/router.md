---
layout: page
pageClass: docs-home-page
title: Bondy Router Documentation
description: Develop, deploy and operate distributed applications with Bondy Router — tutorials, how-to guides, reference and concepts.
---

<DocsSet
  eyebrow="Platform"
  title="Bondy Router"
  stand="Everything needed to develop, deploy and operate Bondy Router, organised by what you came here to do."
  :groups="[
    {
      kicker: 'Learning-oriented',
      heading: 'Tutorials',
      href: '/router/tutorials/index',
      blurb: 'Lessons that take you through building something end to end. Start here if you are new to Bondy; each one assumes only what came before it.',
      links: [
        { text: 'Get Bondy', href: '/router/tutorials/getting_started/get_bondy' },
        { text: 'The marketplace demo', href: '/router/tutorials/getting_started/marketplace' },
        { text: 'Bondy Connect for the BEAM', href: '/wamp/tutorials/bondy_connect' },
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
        { text: 'Run a cluster', href: '/router/guides/deployment/running_a_cluster' },
        { text: 'Call and register procedures', href: '/wamp/guides/programming/rpc' },
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
        { text: 'Glossary', href: '/router/reference/glossary' }
      ]
    },
    {
      kicker: 'Understanding-oriented',
      heading: 'Concepts',
      href: '/router/concepts/index',
      blurb: 'What Bondy is, what it does, and why it is built the way it is. Read these when you want the model behind the behaviour rather than an instruction to follow.',
      links: [
        { text: 'What is Bondy?', href: '/router/concepts/what_is_bondy' },
        { text: 'What is WAMP?', href: '/wamp/concepts/what_is_wamp' },
        { text: 'Architecture', href: '/router/concepts/architecture' },
        { text: 'Clustering', href: '/router/concepts/clustering' }
      ]
    }
  ]"
/>
