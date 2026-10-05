#!/usr/bin/env node
/**
 * Move documentation pages and keep every old URL working.
 *
 * One table drives the file moves, the link rewrite and the redirect list,
 * so the three cannot disagree. To move pages, edit MOVES and RETIRE and run
 * against a clean tree:
 *
 *   node scripts/move-pages.mjs --dry-run    report, change nothing
 *   node scripts/move-pages.mjs              move files, rewrite links, update redirects
 *
 * MOVES     path prefixes; each page under `from` is moved to `to`.
 * RETIRE    single pages deleted outright; their URL redirects to `to`.
 *
 * Paths are URL paths without the .md extension. The longest prefix wins.
 *
 * Redirects are cumulative. Every rule already in docs/public/_redirects is
 * kept, and its target is passed through the table, so a URL moved twice
 * gets one hop to its final home rather than a chain.
 *
 * Links are rewritten in Markdown pages, the VitePress config and the theme
 * components. Relative links are not rewritten; the script reports them.
 */

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

const DOCS = 'docs'
const DRY = process.argv.includes('--dry-run')

/**
 * The WAMP set is folded into Bondy Connect. Protocol is a facet of the
 * developer's work on the platform, not a documentation set of its own:
 * realms, URIs, authentication and RBAC are shared by every interface
 * (WAMP, HTTP/REST, MCP, and BAMP when it ships).
 */
const MOVES = [
  ['/wamp/concepts/compliance', '/router/reference/protocols/wamp'],
  ['/wamp/concepts', '/router/concepts/wamp'],
  ['/wamp/guides/programming', '/router/guides/programming/wamp'],
  ['/wamp/tutorials/wampy', '/router/tutorials/wamp/wampy'],
  ['/wamp/tutorials/bondy_connect_sdk', '/router/tutorials/wamp/bondy_connect_sdk'],
  ['/wamp/reference/clients', '/router/reference/clients']
]

/** Section indexes whose content the Bondy Connect indexes already carry. */
const RETIRE = [
  ['/wamp', '/router'],
  ['/wamp/guides/index', '/router/guides/index'],
  ['/wamp/tutorials/index', '/router/tutorials/index'],
  ['/wamp/reference/index', '/router/reference/index']
]

const RULES = [...MOVES].sort((a, b) => b[0].length - a[0].length)
const RETIRED = new Map(RETIRE)

export function mapPath(p) {
  if (RETIRED.has(p)) return RETIRED.get(p)
  for (const [from, to] of RULES) {
    if (p === from || p.startsWith(from + '/')) return to + p.slice(from.length)
  }
  return null
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'cache' || name === 'dist' || name === 'node_modules') continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

if (process.argv[1] && process.argv[1].endsWith('move-pages.mjs')) run()

function run() {
  const all = walk(DOCS)
  const pages = all.filter((f) => f.endsWith('.md'))
  const code = all.filter((f) => /\.vitepress\/(config\.mjs|theme\/.*\.(vue|js))$/.test(f))
  const urlOf = (file) => '/' + relative(DOCS, file).replace(/\.md$/, '')

  const moves = []
  const retired = []
  for (const file of pages) {
    const url = urlOf(file)
    if (RETIRED.has(url)) retired.push(file)
    else {
      const target = mapPath(url)
      if (target) moves.push([file, join(DOCS, target + '.md')])
    }
  }
  for (const [, to] of moves) {
    if (existsSync(to)) throw new Error(`refusing to overwrite ${to}`)
  }

  // Root-absolute paths in Markdown links, `related:` frontmatter, the
  // ::: button container, and quoted strings in config and theme code.
  const LINK = /(?<=[("'\s])(\/[A-Za-z0-9_\-/.]+)(?=[)"'\s#?]|$)/g
  const RELATIVE = /\]\((\.{1,2}\/[^)]+)\)/g

  let rewritten = 0
  const edits = []
  const relativeLinks = []
  for (const file of [...pages, ...code]) {
    if (retired.includes(file)) continue
    const src = readFileSync(file, 'utf8')
    let hits = 0
    const out = src.replace(LINK, (m) => {
      const ext = m.match(/\.(md|html)$/)?.[0] ?? ''
      const target = mapPath(m.slice(0, m.length - ext.length))
      if (!target) return m
      hits++
      return target + ext
    })
    if (hits) {
      edits.push([file, out])
      rewritten += hits
    }
    if (moves.some(([from]) => from === file)) {
      for (const r of src.matchAll(RELATIVE)) relativeLinks.push(`${file}: ${r[1]}`)
    }
  }

  const REDIRECT_FILE = join(DOCS, 'public', '_redirects')
  const existing = existsSync(REDIRECT_FILE)
    ? readFileSync(REDIRECT_FILE, 'utf8')
        .split('\n')
        .filter((l) => l.trim() && !l.startsWith('#'))
        .map((l) => l.trim().split(/\s+/))
    : []
  const rules = new Map(existing.map(([from, to, status]) => [from, [mapPath(to) ?? to, status]]))
  for (const [from] of moves) rules.set(urlOf(from), [mapPath(urlOf(from)), '301!'])
  for (const file of retired) rules.set(urlOf(file), [mapPath(urlOf(file)), '301!'])
  const header = `# Generated by scripts/move-pages.mjs — do not edit by hand.
#
# Every path here was once served by developer.bondy.io. They are indexed and
# linked from outside, so each moved page keeps a permanent redirect to its
# current home.

`
  const body =
    [...rules.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([from, [to, status]]) => `${from}  ${to}  ${status}`)
      .join('\n') + '\n'

  console.log(`files moved      ${moves.length}`)
  console.log(`pages retired    ${retired.length}`)
  console.log(`links rewritten  ${rewritten}  (in ${edits.length} files)`)
  console.log(`redirects        ${rules.size}  (${rules.size - existing.length} new)`)
  if (relativeLinks.length) {
    console.log('\nrelative links in moved pages (not rewritten):')
    for (const r of relativeLinks) console.log('  ' + r)
  }

  if (DRY) {
    for (const [from, to] of moves) console.log(`  ${from} -> ${to}`)
    for (const f of retired) console.log(`  ${f} -> (retired) ${mapPath(urlOf(f))}`)
    console.log('\n--dry-run: nothing written')
    return
  }

  for (const [from, to] of moves) {
    mkdirSync(dirname(to), { recursive: true })
    execFileSync('git', ['mv', from, to])
  }
  for (const file of retired) execFileSync('git', ['rm', '-q', file])
  for (const [file, out] of edits) {
    const moved = moves.find(([from]) => from === file)
    writeFileSync(moved ? moved[1] : file, out)
  }
  writeFileSync(REDIRECT_FILE, header + body)
  console.log(`\nwrote ${REDIRECT_FILE}`)
}
