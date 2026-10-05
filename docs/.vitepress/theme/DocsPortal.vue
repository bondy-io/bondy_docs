<!-- The documentation portal: developer.bondy.io's index.

     This host is the home for every Bondy documentation set except the
     language reference, which is generated from Bondy source and deploys
     separately to lang.bondy.io. The portal is the one page that names them
     all; each set's own landing page lives behind it (/router), and is a
     DocsSet.

     The list comes from DOC_SETS in @bondy/site-chrome, so adding a system
     is a change in one file shared by every property rather than here.
     resolveDocSets('docs') keeps this host's own sets relative and sends the
     rest to their origin. -->
<script setup>
import { resolveDocGroups } from '@bondy/site-chrome'

// Bucketed by product line. A group with nothing in it drops out, so this
// reads as a flat list until a second set joins a line — which is what keeps
// the page honest while Platform has only Fabric in it.
const groups = resolveDocGroups('docs')
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

      <div v-for="g in groups" :key="g.id" class="dp-group">
        <p class="dp-line">{{ g.text }}</p>
        <div class="dp-grid">
          <a v-for="s in g.sets" :key="s.id" class="dp-set" :href="s.href">
                        <h2>{{ s.text }}</h2>
            <p>{{ s.blurb }}</p>
            <span class="dp-go">Read the docs →</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
