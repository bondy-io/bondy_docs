<!-- Where the reader is, not where they can go.

     A page like /router/reference/wamp_api/ titles its own H1 "Introduction" and its
     sidebar carries no group header, so without this nothing on screen names
     the API being read.

     Labels come from the names the rest of the site already uses (the nav and
     each set's reference/index.md), with the parent's word factored out where it would
     repeat — "Reference / WAMP API", not "Reference / WAMP API Reference".

     This is docs-specific policy, so it lives here rather than in
     @bondy/site-chrome. It is rendered by PageHead.vue above the page's H1,
     so it lists the ancestors only; the H1 names the page itself. -->
<script setup>
import { computed } from 'vue'
import { withBase, useData, useRoute } from 'vitepress'

const { site } = useData()
const route = useRoute()

// Route path with the deploy base stripped, so matching works the same on
// the current site and on an archived snapshot (base /v<version>/).
const path = computed(() => {
  let p = route.path
  const base = site.value.base
  if (base && base !== '/' && p.startsWith(base)) p = '/' + p.slice(base.length)
  return p.replace(/\.html$/, '')
})

// The first segment is the documentation set. Each has a landing page, and
// naming it is what tells a reader arriving from search which manual they
// are in.
const SETS = {
  router: { text: 'Bondy Connect', link: '/router' },
  about: { text: 'About', link: null }
}

// The second segment is the Diataxis section, within a set. `link` is
// resolved against the set, so the same table serves every set; a section
// with no index.md in that set is plain text rather than a 404.
const SECTIONS = {
  tutorials: { text: 'Tutorials', index: true },
  guides: { text: 'How-to Guides', index: true },
  reference: { text: 'Reference', index: true },
  concepts: { text: 'Concepts', index: true }
}

// `link: true` marks the directories that have an index.md of their own.
// The rest group pages without being pages, so their crumb is plain text —
// linking them would produce a 404.
const SUBSECTIONS = {
  'reference/configuration': { text: 'Configuration', link: true },
  'reference/wamp_api': { text: 'WAMP API', link: true },
  'reference/http_api': { text: 'HTTP API', link: true },
  'reference/api_gateway': { text: 'HTTP API Gateway', link: true },
  'reference/clients': { text: 'Client Libraries', link: true },
  'reference/protocols': { text: 'Protocols' },
  'tutorials/wamp': { text: 'WAMP' },
  'tutorials/edge': { text: 'Edge' },
  'tutorials/getting_started': { text: 'Getting Started' },
  'tutorials/security': { text: 'Security' },
  'guides/install': { text: 'Installation' },
  'guides/configuration': { text: 'Configuration' },
  'guides/security': { text: 'Security' },
  'guides/programming': { text: 'Programming' },
  'guides/programming/wamp': { text: 'WAMP' },
  'guides/deployment': { text: 'Deployment' },
  'guides/administration': { text: 'Administration' },
  'concepts/wamp': { text: 'WAMP', link: true },
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

  // Documentation / <set> / <section> / <subsections…> / <page>
  const set = SETS[segs[0]]
  if (!set) return []

  const out = [{ text: 'Documentation', href: withBase('/') }]
  out.push({ text: set.text, href: set.link ? withBase(set.link) : null })

  // segs[1] is a section only if something follows it. /about/faq is a page
  // directly under its set, and treating `faq` as a section put a spurious
  // crumb in front of the page's own title.
  const hasSection = segs.length > 2 || (isDirIndex && segs.length > 1)
  const section = hasSection ? SECTIONS[segs[1]] : null
  if (section) {
    out.push({
      text: section.text,
      href: section.index ? withBase(`/${segs[0]}/${segs[1]}/index`) : null
    })
  } else if (hasSection && segs[1]) {
    out.push({ text: humanize(segs[1]) })
  }

  // Subsections are keyed within the set, so `reference/http_api` matches
  // whichever set the page is in.
  let acc = segs[1] ?? ''
  for (const seg of isDirIndex ? segs.slice(2) : segs.slice(2, -1)) {
    acc += '/' + seg
    const known = SUBSECTIONS[acc]
    out.push({
      text: known ? known.text : humanize(seg),
      href: known && known.link ? withBase(`/${segs[0]}/${acc}/index`) : null
    })
  }

  // The page itself is not a crumb: the trail sits directly above the
  // page's own H1 (PageHead.vue), which already names it.
  return out
})
</script>

<template>
  <nav class="crumb" aria-label="Breadcrumb">
    <template v-for="(c, i) in crumbs" :key="c.text + i">
      <span v-if="i" class="sep" aria-hidden="true">/</span>
      <a v-if="c.href" :href="c.href">{{ c.text }}</a>
      <span v-else>{{ c.text }}</span>
    </template>
  </nav>
</template>
