#!/usr/bin/env node
/**
 * Assert that every internal link with a fragment points at an id (or an
 * `<a name>`) that exists on the target page.
 *
 * VitePress's dead-link check covers pages but not fragments, so a renamed
 * heading or a guessed slug ships as a link that lands at the top of the page.
 * This reads the BUILT site, so it checks the ids VitePress actually emitted,
 * including the ones the config-key macro generates.
 *
 * Run after a build:  npm run docs:build && node scripts/check-anchors.mjs
 * Exits non-zero on any broken fragment.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, dirname, posix } from 'node:path'

const DIST = process.env.DOCS_DIST ?? 'docs/.vitepress/dist'

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (name.endsWith('.html')) out.push(full)
  }
  return out
}

const pages = walk(DIST)
const ids = new Map()
const idsOf = (file) => {
  if (!ids.has(file)) {
    const html = readFileSync(file, 'utf8')
    // Both `id` and the older `<a name>` resolve a fragment in browsers; the
    // URI macro in config.mjs emits the latter.
    ids.set(file, new Set([...html.matchAll(/\s(?:id|name)="([^"]+)"/g)].map((m) => decode(m[1]))))
  }
  return ids.get(file)
}
const decode = (s) => {
  try {
    return decodeURIComponent(s.replace(/&amp;/g, '&'))
  } catch {
    return s
  }
}

function resolve(fromFile, path) {
  const base = path.startsWith('/')
    ? path
    : posix.join('/' + relative(DIST, dirname(fromFile)), path)
  const clean = base.replace(/\.(md|html)$/, '').replace(/\/$/, '/index')
  for (const candidate of [clean + '.html', clean + '/index.html']) {
    const file = join(DIST, candidate)
    if (existsSync(file)) return file
  }
  return null
}

const broken = []
for (const file of pages) {
  const html = readFileSync(file, 'utf8')
  for (const m of html.matchAll(/href="([^"]*#[^"]+)"/g)) {
    const href = m[1].replace(/&amp;/g, '&')
    if (/^[a-z]+:/i.test(href)) continue
    const [path, frag] = href.split('#')
    const target = path === '' ? file : resolve(file, path)
    if (!target) continue // a missing page is VitePress's dead-link check
    if (!idsOf(target).has(decode(frag))) {
      broken.push(`${relative(DIST, file)}: ${href}`)
    }
  }
}

const unique = [...new Set(broken)]
if (unique.length) {
  console.error(unique.join('\n'))
  console.error(`\n${unique.length} broken fragment link(s)`)
  process.exit(1)
}
console.log(`fragments ok — ${pages.length} pages checked`)
