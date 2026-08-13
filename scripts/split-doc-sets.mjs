#!/usr/bin/env node
/**
 * Split the documentation into per-product sets.
 *
 * developer.bondy.io hosts several documentation sets. Until now there was
 * one — the router's — sitting at the root, so adding WAMP (and BAMP after
 * it) would have interleaved protocol material with "how to operate Bondy"
 * in the same tree. This moves each set under its own prefix:
 *
 *     /router/…   operating and configuring Bondy Router
 *     /wamp/…     the WAMP protocol, for developers writing WAMP components
 *     /about/…    portal-level, shared by every set
 *
 * The boundary is "what is the reader learning" — NOT "what do the examples
 * run against", which is always Bondy. reference/wamp_api therefore stays
 * with the router: it is Bondy's administration API, which merely happens to
 * be exposed over WAMP, and its reader is an operator.
 *
 * Everything is driven by MOVES below. To correct a boundary call, edit one
 * line and re-run against a clean tree — this is deliberately not a pile of
 * one-off edits.
 *
 *   node scripts/split-doc-sets.mjs --dry-run    report, change nothing
 *   node scripts/split-doc-sets.mjs              move files and rewrite links
 */

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

const DOCS = 'docs'
const DRY = process.argv.includes('--dry-run')

/**
 * Path prefixes, longest-match-first. `from` and `to` are URL paths without
 * the .md extension; the same table drives the file moves, the link rewrite
 * and the redirect list, so the three can never disagree.
 */
const MOVES = [
  // ── WAMP: the protocol ────────────────────────────────────────────────
  // The redundant segment is flattened: concepts/wamp/rpc -> wamp/concepts/rpc.
  ['/concepts/wamp', '/wamp/concepts'],
  ['/concepts/what_is_wamp', '/wamp/concepts/what_is_wamp'],
  ['/guides/programming/general', '/wamp/guides/programming/general'],
  ['/guides/programming/rpc', '/wamp/guides/programming/rpc'],
  ['/guides/programming/pub_sub', '/wamp/guides/programming/pub_sub'],
  ['/reference/wamp_clients', '/wamp/reference/clients'],
  ['/tutorials/getting_started/wampy', '/wamp/tutorials/wampy'],
  ['/tutorials/getting_started/bondy_connect', '/wamp/tutorials/bondy_connect'],

  // ── Router: everything else that is not portal-level ──────────────────
  // Order matters only against the WAMP rules above, which are longer and
  // therefore matched first.
  ['/concepts', '/router/concepts'],
  ['/guides', '/router/guides'],
  ['/reference', '/router/reference'],
  ['/tutorials', '/router/tutorials']

  // Deliberately NOT moved: /about (portal-level — community, contributors,
  // faq, terms belong to the site, not to one product), /index, /router
  // (the router set's own landing page, already in place).
]

/** Longest prefix wins, so /concepts/wamp beats /concepts. */
const RULES = [...MOVES].sort((a, b) => b[0].length - a[0].length)

/** Map a URL path (no extension) through the table. Returns null if unmoved. */
export function mapPath(p) {
  for (const [from, to] of RULES) {
    if (p === from || p.startsWith(from + '/')) return to + p.slice(from.length)
  }
  return null
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

// Everything below is the migration itself. It is guarded so that importing
// this module — to unit-test mapPath, say — cannot move a single file: the
// first version had it at the top level and an `import()` ran the whole
// migration with --dry-run absent from that process's argv.
if (process.argv[1] && process.argv[1].endsWith('split-doc-sets.mjs')) run()

function run() {
// ── 1. files to move ────────────────────────────────────────────────────
const files = walk(DOCS).filter((f) => f.endsWith('.md'))
const moves = []
for (const file of files) {
  const url = '/' + relative(DOCS, file).replace(/\.md$/, '')
  const target = mapPath(url)
  if (target) moves.push([file, join(DOCS, target + '.md')])
}

// ── 2. every link that has to follow ────────────────────────────────────
// Markdown links, `related:` frontmatter, and the ::: button container all
// carry root-absolute paths. A single regex over `/`-leading paths catches
// them without having to parse three syntaxes.
const LINK = /(?<=[("'\s])(\/[A-Za-z0-9_\-/.]+)(?=[)"'\s#?]|$)/g

let rewritten = 0
const edits = []
for (const file of files) {
  const src = readFileSync(file, 'utf8')
  let hits = 0
  const out = src.replace(LINK, (m) => {
    const clean = m.replace(/\.(md|html)$/, '')
    const target = mapPath(clean)
    if (!target) return m
    hits++
    return target + (m.endsWith('.md') ? '.md' : m.endsWith('.html') ? '.html' : '')
  })
  if (hits) {
    edits.push([file, out])
    rewritten += hits
  }
}

// ── 3. redirects, so the live URLs keep working ─────────────────────────
// developer.bondy.io is indexed; every moved page needs a 301. Netlify reads
// these from _redirects in the publish root, which is docs/public/.
const redirects = moves
  .map(([from]) => '/' + relative(DOCS, from).replace(/\.md$/, ''))
  .map((url) => [url, mapPath(url)])
  .sort((a, b) => a[0].localeCompare(b[0]))

const REDIRECT_FILE = join(DOCS, 'public', '_redirects')
const header = `# Generated by scripts/split-doc-sets.mjs — do not edit by hand.
#
# developer.bondy.io served every one of these paths at the root before the
# documentation was split into per-product sets. They are indexed and linked
# from outside, so each moved page keeps a permanent redirect to its new home.

`
const body = redirects.map(([from, to]) => `${from}  ${to}  301!`).join('\n') + '\n'

// ── report ──────────────────────────────────────────────────────────────
const bySet = {}
for (const [, to] of moves) {
  const set = relative(DOCS, to).split('/')[0]
  bySet[set] = (bySet[set] ?? 0) + 1
}
console.log(`files moved      ${moves.length}`)
for (const [set, n] of Object.entries(bySet).sort()) console.log(`  ${set.padEnd(14)} ${n}`)
console.log(`links rewritten  ${rewritten}  (in ${edits.length} files)`)
console.log(`redirects        ${redirects.length}`)

if (DRY) {
  console.log('\n--dry-run: nothing written')
  process.exit(0)
}

// ── apply ───────────────────────────────────────────────────────────────
for (const [from, to] of moves) {
  mkdirSync(dirname(to), { recursive: true })
  execFileSync('git', ['mv', from, to])
}
for (const [file, out] of edits) {
  // A moved file is written at its new path.
  const moved = moves.find(([from]) => from === file)
  writeFileSync(moved ? moved[1] : file, out)
}
mkdirSync(dirname(REDIRECT_FILE), { recursive: true })
writeFileSync(REDIRECT_FILE, header + body)
console.log(`\nwrote ${REDIRECT_FILE}`)
}
