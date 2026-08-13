#!/usr/bin/env node
/**
 * Apply the doc-set split to the files that are not markdown: the sidebar
 * and nav in .vitepress/config.mjs, and the hardcoded link lists in the
 * theme components.
 *
 * It imports mapPath from split-doc-sets.mjs rather than restating the
 * prefixes, so the sidebar cannot drift from where the pages actually went.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { mapPath } from './split-doc-sets.mjs'

const TARGETS = [
  'docs/.vitepress/config.mjs',
  'docs/.vitepress/theme/Layout.vue',
  'docs/.vitepress/theme/DocsHome.vue',
  'docs/.vitepress/theme/Breadcrumb.vue'
]

const LINK = /(?<=['"`])(\/[A-Za-z0-9_\-/.]+)(?=['"`])/g

let total = 0
for (const file of TARGETS) {
  const src = readFileSync(file, 'utf8')
  let hits = 0
  const out = src.replace(LINK, (m) => {
    const target = mapPath(m.replace(/\.(md|html)$/, ''))
    if (!target) return m
    hits++
    return target
  })
  if (hits) writeFileSync(file, out)
  console.log(`${String(hits).padStart(4)}  ${file}`)
  total += hits
}
console.log(`\n${total} paths remapped`)
