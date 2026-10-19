<!-- Docs layout: the shared template Layout (draft watermark, related grid,
     back-to-top) wearing the shared Bondy chrome.

     SiteNav goes in `layout-top` — VitePress renders that slot above
     everything else, which is where a fixed header belongs. The footer is a
     sibling of the Layout rather than a slot, because the template already
     claims `layout-bottom` for BackToTop and VitePress's own VPFooter is
     suppressed on any page that has a sidebar (i.e. nearly every page here).

     Everything generic — the bar, the burger, the night toggle, the footer
     grid, the palette — comes from @bondy/site-chrome. What stays here is
     only what is specific to this site: the context row in the bar's
     #context slot (DocsContext.vue: the set, its sections and the version)
     and the footer's Diataxis column set. Search comes from the chrome too —
     it spans all three deploys, so it cannot belong to any one of them. -->
<script setup>
import Theme from '@leapsight/vitepress-template/theme'
import { SiteNav, SiteFooter, SiteSearch, GITHUB_ROUTER, ORIGINS } from '@bondy/site-chrome'
import { computed } from 'vue'
import { withBase, useData, useRoute } from 'vitepress'
import DocsContext from './DocsContext.vue'
import { docsContext } from './docsContext.js'

const { Layout } = Theme

const { site } = useData()
const route = useRoute()

// The route with the deploy base stripped, so an archived snapshot (base
// /v<version>/) resolves the same context as the current site.
const ctx = computed(() => {
  let p = route.path
  const base = site.value.base
  if (base && base !== '/' && p.startsWith(base)) p = '/' + p.slice(base.length)
  return docsContext(p)
})

const footerColumns = [
  {
    title: 'Learn',
    links: [
      { text: 'Tutorials', href: withBase('/router/tutorials/index') },
      { text: 'How-to Guides', href: withBase('/router/guides/index') },
      { text: 'Concepts', href: withBase('/router/concepts/index') },
      { text: 'Glossary', href: withBase('/router/reference/glossary') }
    ]
  },
  {
    title: 'Reference',
    links: [
      { text: 'Configuration', href: withBase('/router/reference/configuration/index') },
      { text: 'HTTP API', href: withBase('/router/reference/http_api/index') },
      { text: 'WAMP API', href: withBase('/router/reference/wamp_api/index') },
      { text: 'API Gateway', href: withBase('/router/reference/api_gateway/index') }
    ]
  },
  {
    title: 'Project',
    links: [
      { text: 'bondy.io', href: ORIGINS.website },
      { text: 'GitHub', href: GITHUB_ROUTER },
      { text: 'Community', href: `${ORIGINS.website}/community/` },
      { text: 'Support', href: `${ORIGINS.website}/support` },
      { text: 'Code of Conduct', href: `${ORIGINS.website}/code-of-conduct` }
    ]
  }
]

const BLURB =
  'Documentation for Bondy Connect — the always-on, distributed application ' +
  'networking platform. Open source under Apache-2.0, by Leapsight.'
</script>

<template>
  <Layout>
    <template #layout-top>
      <SiteNav active="docs" self="docs" layout="docs" :github="GITHUB_ROUTER">
        <template #search><SiteSearch self="docs" /></template>
        <template v-if="ctx" #context><DocsContext :ctx="ctx" /></template>
      </SiteNav>
    </template>
  </Layout>
  <SiteFooter
    layout="docs"
    :columns="footerColumns"
    :blurb="BLURB"
    note="Content CC-BY-SA-4.0 · Bondy Connect Apache-2.0"
  />
</template>
