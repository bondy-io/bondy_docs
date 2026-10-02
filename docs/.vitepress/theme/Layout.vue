<!-- Docs layout: the shared template Layout (draft watermark, related grid,
     back-to-top) wearing the shared Bondy chrome.

     SiteNav goes in `layout-top` — VitePress renders that slot above
     everything else, which is where a fixed header belongs. The footer is a
     sibling of the Layout rather than a slot, because the template already
     claims `layout-bottom` for BackToTop and VitePress's own VPFooter is
     suppressed on any page that has a sidebar (i.e. nearly every page here).

     Everything generic — the bar, the burger, the night toggle, the footer
     grid, the palette — comes from @bondy/site-chrome. What stays here is
     only what is specific to this site: the page head (breadcrumb and
     version picker, PageHead.vue, which sits with the page rather than in
     the bar) and the footer's Diataxis column set. Search comes from the chrome too —
     it spans all three deploys, so it cannot belong to any one of them. -->
<script setup>
import Theme from '@leapsight/vitepress-template/theme'
import { SiteNav, SiteFooter, SiteSearch, GITHUB_ROUTER, ORIGINS } from '@bondy/site-chrome'
import { withBase } from 'vitepress'
import PageHead from './PageHead.vue'

const { Layout } = Theme

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
      </SiteNav>
    </template>
    <template #doc-before><PageHead /></template>
    <template #page-top>
      <div class="bondy-chrome page-head-band"><div class="wrap"><PageHead /></div></div>
    </template>
  </Layout>
  <SiteFooter
    layout="docs"
    :columns="footerColumns"
    :blurb="BLURB"
    note="Content CC-BY-SA-4.0 · Bondy Apache-2.0"
  />
</template>
