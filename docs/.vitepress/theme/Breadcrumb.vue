<!-- Where the reader is, not where they can go.

     A page like /reference/wamp_api/ titles its own H1 "Introduction" and its
     sidebar carries no group header, so without this nothing on screen names
     the API being read.

     Labels come from the names the rest of the site already uses (the nav and
     reference/index.md), with the parent's word factored out where it would
     repeat — "Reference / WAMP API", not "Reference / WAMP API Reference".

     This is docs-specific policy, so it lives here rather than in
     @bondy/site-chrome, and is passed into SiteNav's `subbar` slot. -->
<script setup>
import { computed } from 'vue'
import { withBase, useData, useRoute } from 'vitepress'

const { site, page } = useData()
const route = useRoute()

// Route path with the deploy base stripped, so matching works the same on
// the current site and on an archived snapshot (base /v<version>/).
const path = computed(() => {
  let p = route.path
  const base = site.value.base
  if (base && base !== '/' && p.startsWith(base)) p = '/' + p.slice(base.length)
  return p.replace(/\.html$/, '')
})

const SECTIONS = {
  tutorials: { text: 'Tutorials', link: '/tutorials/index' },
  guides: { text: 'How-to Guides', link: '/guides/index' },
  reference: { text: 'Reference', link: '/reference/index' },
  concepts: { text: 'Concepts', link: '/concepts/index' }
}

// `link: true` marks the directories that have an index.md of their own.
// The rest group pages without being pages, so their crumb is plain text —
// linking them would produce a 404.
const SUBSECTIONS = {
  'reference/configuration': { text: 'Configuration', link: true },
  'reference/wamp_api': { text: 'WAMP API', link: true },
  'reference/http_api': { text: 'HTTP API', link: true },
  'reference/api_gateway': { text: 'HTTP API Gateway', link: true },
  'reference/wamp_clients': { text: 'WAMP Client Libraries', link: true },
  'tutorials/getting_started': { text: 'Getting Started' },
  'tutorials/security': { text: 'Security' },
  'guides/install': { text: 'Installation' },
  'guides/configuration': { text: 'Configuration' },
  'guides/security': { text: 'Security' },
  'guides/programming': { text: 'Programming' },
  'guides/deployment': { text: 'Deployment' },
  'guides/administration': { text: 'Administration' },
  'concepts/wamp': { text: 'WAMP' },
  'concepts/wamp/advanced': { text: 'Advanced' }
}

const humanize = (seg) =>
  seg.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

const crumbs = computed(() => {
  const raw = path.value
  let segs = raw.replace(/^\/|\/$/g, '').split('/').filter(Boolean)

  // An index page addresses its directory: /reference/wamp_api/ and
  // /reference/wamp_api/index both mean "every segment is a directory".
  const wasIndex = segs[segs.length - 1] === 'index'
  if (wasIndex) segs = segs.slice(0, -1)
  const isDirIndex = wasIndex || raw.endsWith('/')

  const section = SECTIONS[segs[0]]
  if (!section) return [{ text: 'Documentation', here: true }]

  const out = [{ text: section.text, href: withBase(section.link) }]

  let acc = segs[0]
  for (const seg of isDirIndex ? segs.slice(1) : segs.slice(1, -1)) {
    acc += '/' + seg
    const known = SUBSECTIONS[acc]
    out.push({
      text: known ? known.text : humanize(seg),
      href: known && known.link ? withBase('/' + acc + '/index') : null
    })
  }

  // The page itself, unless its title just repeats the crumb above it (a
  // section index such as /tutorials/index, titled "Tutorials").
  const title = page.value.title
  if (title && title !== out[out.length - 1].text) out.push({ text: title, here: true })

  return out
})
</script>

<template>
  <nav class="crumb" aria-label="Breadcrumb">
    <template v-for="(c, i) in crumbs" :key="c.text + i">
      <span v-if="i" class="sep" aria-hidden="true">/</span>
      <a v-if="c.href" :href="c.href">{{ c.text }}</a>
      <span
        v-else
        :class="{ here: c.here }"
        :aria-current="c.here ? 'page' : undefined"
      >{{ c.text }}</span>
    </template>
  </nav>
</template>
