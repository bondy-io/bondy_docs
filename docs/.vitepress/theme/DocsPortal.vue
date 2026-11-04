<!-- The documentation portal: developer.bondy.io's index.

     One card per product. Each card links to that product's documentation
     set, whose own landing page (a DocsSet, e.g. /connect) organises it by
     Diataxis mode.

     The list comes from DOC_SETS in @bondy/site-chrome, so adding a product
     is a change in one file shared by every property rather than here.
     resolveDocSets('docs') keeps this host's own sets relative and sends the
     rest to their origin.

     A set marked `released: false` still gets a card, but not a link:
     resolveDocSets drops it so that no site links to a host that does not
     answer yet, and this page shows it as coming soon instead.

     Own-host hrefs go through withBase. An archived version is built with
     base /v<version>/, so its card must open that version's set, not the
     current one at the site root. withBase leaves the other hosts' absolute
     URLs unchanged (vitepress 1.6.4, client/app/utils.js). -->
<script setup>
import { withBase } from 'vitepress'
import { DOC_SETS, DOC_GROUPS, resolveDocSets } from '@bondy/site-chrome'

const lineOf = (set) => DOC_GROUPS.find((g) => g.id === set.group)?.text

const released = resolveDocSets('docs').map((s) => ({ ...s, href: withBase(s.href) }))
const upcoming = DOC_SETS.filter((s) => s.released === false)

// Released products first, then the ones still to come; each in DOC_SETS order.
const products = [
  ...released.map((s) => ({ ...s, line: lineOf(s) })),
  ...upcoming.map((s) => ({ ...s, line: lineOf(s), href: null }))
]
</script>

<template>
  <div class="bondy-chrome docs-home docs-portal">
    <div class="wrap">
      <header class="dh-head">
        <h1>Documentation</h1>
        <p class="stand">
          Tutorials, guides, concepts and reference for every product. Pick the
          one you are working with.
        </p>
      </header>

      <div class="dp-gallery">
        <component
          :is="p.href ? 'a' : 'div'"
          v-for="p in products"
          :key="p.id"
          class="dp-card"
          :class="{ 'is-upcoming': !p.href }"
          :href="p.href || undefined"
        >
          <p v-if="p.line" class="dp-line">{{ p.line }}</p>
          <h2>{{ p.text }}</h2>
          <p class="dp-blurb">{{ p.blurb }}</p>
          <span v-if="p.href" class="dp-go">Read the docs →</span>
          <span v-else class="dp-soon">Coming soon</span>
        </component>
      </div>
    </div>
  </div>
</template>
