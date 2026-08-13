<!-- The Bondy Router documentation home (/router): a Diataxis directory,
     and nothing else. The portal index that lists this set alongside the
     language docs is DocsPortal, at /.

     The four quadrants are the four things a reader can want, and naming
     the orientation of each ("learning", "task", "information",
     "understanding") is what teaches an arriving reader which one they are
     in. Entry links are the most-travelled page in each section, so a
     reader who already knows what they want lands in one click.

     Links go through withBase so an archived snapshot served at
     /v<version>/ resolves them against its own base. -->
<script setup>
import { withBase } from 'vitepress'

const quadrants = [
  {
    kicker: 'Tutorials',
    href: '/tutorials/index',
    orientation: 'Learning-oriented',
    blurb:
      'Lessons that take you through building something end to end. Start here if you are new to Bondy; each one assumes only what came before it.',
    links: [
      { text: 'Get Bondy', href: '/tutorials/getting_started/get_bondy' },
      { text: 'The marketplace demo', href: '/tutorials/getting_started/marketplace' },
      { text: 'Bondy Connect for the BEAM', href: '/tutorials/getting_started/bondy_connect' },
      { text: 'Same Sign-On', href: '/tutorials/security/same_sign_on' }
    ]
  },
  {
    kicker: 'How-to Guides',
    href: '/guides/index',
    orientation: 'Task-oriented',
    blurb:
      'Directions for getting a specific job done. They assume you know what you are trying to achieve and want the steps, not the theory.',
    links: [
      { text: 'Install using Docker', href: '/guides/install/docker' },
      { text: 'Run a cluster', href: '/guides/deployment/running_a_cluster' },
      { text: 'Call and register procedures', href: '/guides/programming/rpc' },
      { text: 'Monitor a cluster', href: '/guides/administration/monitoring' }
    ]
  },
  {
    kicker: 'Reference',
    href: '/reference/index',
    orientation: 'Information-oriented',
    blurb:
      'Material to consult while working, not to read start to end. Every configuration key, API procedure, metric and error, described once and precisely.',
    links: [
      { text: 'Configuration Reference', href: '/reference/configuration/index' },
      { text: 'HTTP API Reference', href: '/reference/http_api/index' },
      { text: 'WAMP API Reference', href: '/reference/wamp_api/index' },
      { text: 'Glossary', href: '/reference/glossary' }
    ]
  },
  {
    kicker: 'Concepts',
    href: '/concepts/index',
    orientation: 'Understanding-oriented',
    blurb:
      'What Bondy is, what it does, and why it is built the way it is. Read these when you want the model behind the behaviour rather than an instruction to follow.',
    links: [
      { text: 'What is Bondy?', href: '/concepts/what_is_bondy' },
      { text: 'What is WAMP?', href: '/concepts/what_is_wamp' },
      { text: 'Architecture', href: '/concepts/architecture' },
      { text: 'Clustering', href: '/concepts/clustering' }
    ]
  }
]
</script>

<template>
  <div class="bondy-chrome docs-home">
    <div class="wrap">
      <header class="dh-head">
        <p class="eyebrow">Documentation</p>
        <h1>Bondy Router</h1>
        <p class="stand">
          Everything needed to develop, deploy and operate Bondy Router,
          organised by what you came here to do.
        </p>
      </header>

      <div class="dh-grid">
        <section v-for="q in quadrants" :key="q.kicker">
          <p class="kicker">{{ q.orientation }}</p>
          <h2><a :href="withBase(q.href)">{{ q.kicker }}</a></h2>
          <p class="dh-blurb">{{ q.blurb }}</p>
          <ul>
            <li v-for="l in q.links" :key="l.text">
              <a :href="withBase(l.href)">{{ l.text }}</a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>
