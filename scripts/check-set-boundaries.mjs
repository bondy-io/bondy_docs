#!/usr/bin/env node
/**
 * Assert that structural navigation never leaves its documentation set.
 *
 * A reader clicking the sidebar in the Fabric docs must stay in the Fabric
 * docs. Cross-set pointers are legitimate, but they belong in a page's
 * `related:` frontmatter — an aside the reader chooses — not in the tree
 * that tells them where they are.
 *
 * Run after touching sidebars:  node scripts/check-set-boundaries.mjs
 * Exits non-zero on any crossing, so it can gate a build.
 */
import { readFileSync } from 'node:fs'

const CONFIG = 'docs/.vitepress/config.mjs'

// Sidebar keys are path prefixes; the set is the first segment of the key.
const setOf = (path) => (path.match(/^\/([a-z0-9_-]+)/) || [])[1]

const src = readFileSync(CONFIG, 'utf8')

// The sidebars() map: '<key>': <builder>()
const mapBody = src.match(/function sidebars\(\)\s*\{\s*return\s*\{([\s\S]*?)\n\s*\}\s*\n\}/)
if (!mapBody) {
  console.error('could not find sidebars() in ' + CONFIG)
  process.exit(2)
}
const entries = [...mapBody[1].matchAll(/'([^']+)':\s*(\w+)\(\)/g)].map((m) => ({
  key: m[1],
  builder: m[2],
  set: setOf(m[1])
}))

// Each builder's source, so its links can be read without evaluating it.
function bodyOf(name) {
  const i = src.indexOf(`function ${name}(`)
  if (i < 0) return ''
  let depth = 0, start = src.indexOf('{', i)
  for (let j = start; j < src.length; j++) {
    if (src[j] === '{') depth++
    else if (src[j] === '}' && --depth === 0) return src.slice(start, j + 1)
  }
  return ''
}

let bad = 0
const seen = new Map()
for (const { key, builder, set } of entries) {
  const links = [...bodyOf(builder).matchAll(/link:\s*'(\/[^']+)'/g)].map((m) => m[1])
  const crossing = links.filter((l) => setOf(l) && setOf(l) !== set)
  // A builder reused under two keys is reported once per key it violates.
  if (crossing.length) {
    console.log(`\n${key}  (${builder})  →  ${crossing.length} link(s) leave the "${set}" set:`)
    for (const l of crossing) console.log(`    ${l}`)
    bad += crossing.length
  }
  seen.set(builder, links.length)
}

if (bad) {
  console.log(`\n${bad} crossing(s). Move them to the page's \`related:\` frontmatter.`)
  process.exit(1)
}
console.log(`no crossings — ${entries.length} sidebars, ${[...seen.values()].reduce((a, b) => a + b, 0)} links, each inside its own set`)
