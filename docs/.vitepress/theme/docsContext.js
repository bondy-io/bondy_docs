/**
 * Which documentation set, and which of its sections, a route belongs to.
 *
 * The first path segment names the set; the second names the Diataxis
 * section. Returns null for a page outside every set (the portal), which is
 * how Layout.vue knows to render no context row at all.
 *
 * Section names are controlled vocabulary: they are the words the sidebar
 * groups (config.mjs), the set landing page (docs/router.md) and the footer
 * use for the same thing. Change one, change all.
 */
const SECTIONS = [
  { id: 'tutorials', text: 'Tutorials' },
  { id: 'guides', text: 'How-to Guides' },
  { id: 'reference', text: 'Reference' },
  { id: 'concepts', text: 'Concepts' }
]

const SETS = {
  router: { text: 'Bondy Connect', link: '/router', sections: SECTIONS },
  about: { text: 'About', link: null, sections: [] }
}

/**
 * @param {string} path  route path with the deploy base already stripped
 */
export function docsContext(path) {
  const segs = path.replace(/\.html$/, '').split('/').filter(Boolean)
  const set = SETS[segs[0]]
  if (!set) return null
  const sections = set.sections.map((s) => ({
    ...s,
    link: `/${segs[0]}/${s.id}/index`
  }))
  const section = sections.some((s) => s.id === segs[1]) ? segs[1] : null
  return { id: segs[0], text: set.text, link: set.link, sections, section }
}
