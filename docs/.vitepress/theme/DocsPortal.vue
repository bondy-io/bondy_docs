<!-- The documentation portal: developer.bondy.io's index.

     This host is the home for every Bondy documentation set except the
     language reference, which is generated from Bondy source and deploys
     separately to lang.bondy.io. The portal is the one page that names them
     all; each set's own landing page lives behind it (/router, /wamp), and
     those are DocsSet with different props.

     The list comes from DOC_SETS in @bondy/site-chrome, so adding a system
     is a change in one file shared by every property rather than here.
     resolveDocSets('docs') keeps this host's own sets relative and sends the
     rest to their origin. -->
<script setup>
import { resolveDocSets } from '@bondy/site-chrome'

const sets = resolveDocSets('docs')
</script>

<template>
  <div class="bondy-chrome docs-home docs-portal">
    <div class="wrap">
      <header class="dh-head">
        <p class="eyebrow">Documentation</p>
        <h1>Bondy</h1>
        <p class="stand">
          A language and a platform for distributed, multi-agent systems.
          Pick the manual you need.
        </p>
      </header>

      <div class="dp-grid">
        <a v-for="(s, i) in sets" :key="s.id" class="dp-set" :href="s.href">
          <span class="dp-num">{{ String(i + 1).padStart(2, '0') }}</span>
          <h2>{{ s.text }}</h2>
          <p>{{ s.blurb }}</p>
          <span class="dp-go">Read the docs →</span>
        </a>
      </div>
    </div>
  </div>
</template>
