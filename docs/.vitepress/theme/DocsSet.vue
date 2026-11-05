<!-- The landing page of one documentation set.
     developer.bondy.io hosts several — the router today, WAMP alongside it,
     BAMP after that — and every one of them wants the same thing: a Diataxis
     directory naming what a reader can want, with the most-travelled page in
     each group so someone who already knows lands in one click.

     That directory used to be hardcoded in DocsHome.vue with the router's
     content baked in. It is a component with props now, so a second set is
     a markdown file rather than a second copy of the component, and the
     content lives where an author can edit it.

     Links go through withBase so an archived snapshot served at /v<version>/
     resolves them against its own base. -->
<script setup>
import { withBase } from 'vitepress'

defineProps({
  /** Small mono line above the title. */
  eyebrow: { type: String, default: 'Documentation' },
  title: { type: String, required: true },
  /** The standfirst under the title. */
  stand: { type: String, default: '' },
  /**
   * The Diataxis groups: { kicker, heading, href, blurb, links: [{text, href}] }.
   * `kicker` names the reader's orientation — that is what teaches an
   * arriving reader which quadrant they are in.
   */
  groups: { type: Array, default: () => [] },
  /**
   * An optional notice above the groups: { kicker, heading, href, blurb,
   * links: [{text, href}] }. A version's landing page uses it for "What's
   * New". Each version is built from its own tag, so a highlight set here
   * appears in this version only, never in an archived one.
   */
  highlight: { type: Object, default: null }
})
</script>

<template>
  <div class="bondy-chrome docs-home">
    <div class="wrap">
      <header class="dh-head">
        <p class="eyebrow">{{ eyebrow }}</p>
        <h1>{{ title }}</h1>
        <p v-if="stand" class="stand">{{ stand }}</p>
      </header>

      <aside v-if="highlight" class="dh-highlight">
        <p v-if="highlight.kicker" class="kicker">{{ highlight.kicker }}</p>
        <h2><a :href="withBase(highlight.href)">{{ highlight.heading }}</a></h2>
        <p v-if="highlight.blurb" class="dh-blurb">{{ highlight.blurb }}</p>
        <ul v-if="highlight.links && highlight.links.length">
          <li v-for="l in highlight.links" :key="l.text">
            <a :href="withBase(l.href)">{{ l.text }}</a>
          </li>
        </ul>
      </aside>

      <div class="dh-grid">
        <section v-for="g in groups" :key="g.heading">
          <p class="kicker">{{ g.kicker }}</p>
          <h2><a :href="withBase(g.href)">{{ g.heading }}</a></h2>
          <p class="dh-blurb">{{ g.blurb }}</p>
          <ul>
            <li v-for="l in g.links" :key="l.text">
              <a :href="withBase(l.href)">{{ l.text }}</a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>
