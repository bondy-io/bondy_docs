<!-- Diagram: people, things and processes integrated point to point through
     assorted infrastructure (left), and the same parties connected through
     Bondy (right). Redrawn from the former without_with.png in
     docs/connect/concepts/why_bondy.md. The unlabelled shapes on the left
     stand, as in the original, for heterogeneous middleware. -->
<script setup lang="ts">
const PW = 326
const apps = ['Mobile App · User #1', 'Mobile App · User #2', 'Web App · User #3']
const things = ['Thing #3', 'Thing #2', 'Thing #1']
const svc = ['(Micro-) Service', '(Micro-) Service', '(Micro-) Service']
const AY = 46
const SY = 306
const colX = (p: number, i: number) => p + 82 + i * 86
const thingY = (i: number) => 112 + i * 62

/* left panel: middleware shapes and a tangle of point-to-point links */
const mw = [
  { kind: 'circle', x: 150, y: 140 },
  { kind: 'rect', x: 112, y: 210 },
  { kind: 'tri', x: 200, y: 198 },
  { kind: 'hex', x: 160, y: 262 },
  { kind: 'pent', x: 248, y: 258 },
  { kind: 'circle', x: 252, y: 146 }
]
const tangle: [number, number, number, number, string][] = [
  [82, 64, 150, 140, ''], [168, 64, 150, 140, '4 3'], [254, 64, 252, 146, ''], [82, 64, 252, 146, '6 3 1 3'],
  [168, 64, 252, 146, ''], [254, 64, 200, 198, '4 3'], [62, 112, 112, 210, '1 3'], [62, 174, 112, 210, '1 3'],
  [62, 236, 112, 210, '1 3'], [150, 140, 252, 146, ''], [150, 140, 160, 262, ''], [200, 198, 160, 262, ''],
  [112, 210, 248, 258, '6 3 1 3'], [252, 146, 248, 258, ''], [160, 262, 82, 306, ''], [160, 262, 168, 306, ''],
  [200, 198, 254, 306, '4 3'], [248, 258, 254, 306, ''], [200, 198, 82, 306, '4 3'], [82, 64, 62, 112, '2 3']
]
const shape = (m: { kind: string; x: number; y: number }) => {
  const { x, y } = m
  if (m.kind === 'tri') return `M${x - 16},${y + 14} L${x + 16},${y + 14} L${x - 16},${y - 16} Z`
  if (m.kind === 'hex') return `M${x - 16},${y} L${x - 8},${y - 14} L${x + 8},${y - 14} L${x + 16},${y} L${x + 8},${y + 14} L${x - 8},${y + 14} Z`
  if (m.kind === 'pent') return `M${x},${y - 16} L${x + 16},${y - 4} L${x + 10},${y + 14} L${x - 10},${y + 14} L${x - 16},${y - 4} Z`
  return ''
}
</script>

<template>
  <figure class="postfig">
    <svg viewBox="0 0 680 372" role="img" aria-label="Two panels. Without Bondy: mobile and web app users, things, and micro-services are wired to each other point to point through an assortment of different infrastructure components, with links of many kinds crossing each other. With Bondy: the same users, things and services, plus third-party integrations, each connect to Bondy alone.">
      <line class="pf-line" x1="340" y1="8" x2="340" y2="364" />
      <text class="pf-zone-l" x="166" y="16" text-anchor="middle">without</text>
      <text class="pf-zone-l acc" x="514" y="16" text-anchor="middle" style="fill: var(--blue)">with bondy</text>

      <template v-for="(p, side) in [4, 350]" :key="side">
        <!-- links (drawn first) -->
        <template v-if="side === 0">
          <line v-for="(l, k) in tangle" :key="k" class="pf-msgline" :x1="l[0] + p - 4" :y1="l[1]" :x2="l[2] + p - 4" :y2="l[3]" :style="l[4] ? `stroke-dasharray: ${l[4]}` : ''" />
          <g v-for="(m, k) in mw" :key="'m' + k" class="pf-node dim">
            <circle v-if="m.kind === 'circle'" :cx="m.x + p - 4" :cy="m.y" r="16" />
            <rect v-else-if="m.kind === 'rect'" :x="m.x + p - 20" :y="m.y - 16" width="32" height="32" rx="3" />
            <path v-else :d="shape({ ...m, x: m.x + p - 4 })" />
          </g>
        </template>
        <template v-else>
          <line v-for="i in [0, 1, 2]" :key="'a' + i" class="pf-msgline" :x1="colX(p, i)" :y1="AY + 18" :x2="p + 168" y2="185" />
          <line v-for="i in [0, 1, 2]" :key="'s' + i" class="pf-msgline" :x1="colX(p, i)" :y1="SY" :x2="p + 168" y2="185" />
          <line v-for="i in [0, 1, 2]" :key="'t' + i" class="pf-msgline" :x1="p + 62" :y1="thingY(i) + 20" :x2="p + 168" y2="185" />
          <line v-for="i in [0, 1, 2]" :key="'i' + i" class="pf-msgline" :x1="p + 262" :y1="thingY(i) + 20" :x2="p + 168" y2="185" />
          <g class="pf-node acc">
            <circle :cx="p + 168" cy="185" r="50" />
            <text class="pf-l" :x="p + 168" cy="185" y="191" text-anchor="middle" style="font-size: 18px">Bondy</text>
          </g>
          <g v-for="i in [0, 1, 2]" :key="'x' + i" class="pf-node">
            <rect :x="p + 262" :y="thingY(i)" width="64" height="40" rx="7" />
            <text class="pf-s" :x="p + 294" :y="thingY(i) + 17" text-anchor="middle">3rd-party</text>
            <text class="pf-s" :x="p + 294" :y="thingY(i) + 28" text-anchor="middle">integr.</text>
          </g>
          <text class="pf-zone-l" :x="p + 326" y="102" text-anchor="end">infrastructure</text>
        </template>

        <text class="pf-zone-l" :x="p + 168" y="34" text-anchor="middle">people / apps</text>
        <g v-for="(a, i) in apps" :key="'ap' + i" class="pf-node">
          <rect :x="colX(p, i) - 40" :y="AY" width="80" height="36" rx="7" />
          <text class="pf-s" :x="colX(p, i)" :y="AY + 15" text-anchor="middle">{{ a.split(' · ')[0] }}</text>
          <text class="pf-s" :x="colX(p, i)" :y="AY + 27" text-anchor="middle">{{ a.split(' · ')[1] }}</text>
        </g>
        <text class="pf-zone-l" :x="p + 32" y="102" text-anchor="middle">things</text>
        <g v-for="(t, i) in things" :key="'th' + i" class="pf-node">
          <rect :x="p + 6" :y="thingY(i)" width="54" height="40" rx="7" />
          <text class="pf-s" :x="p + 33" :y="thingY(i) + 23" text-anchor="middle">{{ t }}</text>
        </g>
        <g v-for="(s, i) in svc" :key="'sv' + i" class="pf-node">
          <rect :x="colX(p, i) - 40" :y="SY" width="80" height="36" rx="7" />
          <text class="pf-s" :x="colX(p, i)" :y="SY + 15" text-anchor="middle">(micro-)</text>
          <text class="pf-s" :x="colX(p, i)" :y="SY + 27" text-anchor="middle">service</text>
        </g>
        <text class="pf-zone-l" :x="p + 168" y="360" text-anchor="middle">processes</text>
      </template>
    </svg>
    <figcaption class="postfig-cap">Point-to-point integration, or one hub.</figcaption>
  </figure>
</template>
