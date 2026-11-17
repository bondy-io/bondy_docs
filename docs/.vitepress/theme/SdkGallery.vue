<!-- The Bondy Connect SDK gallery on the SDK home page: one card per
     language, from theme/sdks.js.

     Each card is the site's own <Feature> card, the one every section index
     uses, so the gallery looks like the rest of the site. A published SDK's
     card links to that SDK's page. An SDK that is not published yet is the
     same card with no link, dimmed and marked "Coming soon".

     <Feature> runs its link through the VitePress base, so an archived
     snapshot served at /v<version>/ resolves it against its own base. -->
<script setup>
import { Feature } from '@leapsight/vitepress-template/theme'
import { sdks } from './sdks'
</script>

<template>
  <ul class="sdk-gallery">
    <li v-for="sdk in sdks" :key="sdk.id" :class="{ 'is-soon': !sdk.available }">
      <Feature
        v-if="sdk.available"
        :type="sdk.languages"
        :text="sdk.name"
        :description="sdk.description"
        :link="`/connect/sdk/${sdk.id}/index`"
      />
      <!-- No link: <Feature> then renders an anchor without an href, which
           is not a link and takes no focus. -->
      <Feature
        v-else
        type="Coming soon"
        :text="sdk.name"
        :description="`The Bondy Connect SDK for ${sdk.name} is not published yet.`"
      />
    </li>
  </ul>
</template>

<style scoped>
.sdk-gallery {
  list-style: none !important;
  padding: 0 !important;
  margin: 1.25rem 0 2rem !important;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}
.sdk-gallery li {
  margin: 0 !important;
  padding: 0;
}
/* Not published: the card recedes and does not react to the pointer. */
.sdk-gallery li.is-soon {
  opacity: 0.5;
  pointer-events: none;
}
</style>
