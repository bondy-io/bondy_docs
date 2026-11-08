<!-- Diagram: clients connected to a WAMP router, never to each other.
     Redrawn from the former wamp_routing.png in docs/connect/concepts/wamp/introduction.md. -->
<script setup lang="ts">
const C = { x: 340, y: 214, r: 74 }
const nodes = [
  { label: 'Connected Device 1', x: 130, y: 56, chips: ['C'] },
  { label: 'App Instance 1', sub: 'web browser, mobile', x: 550, y: 56, chips: ['C'] },
  { label: 'Connected Device N', x: 95, y: 214, chips: ['C'] },
  { label: 'App Instance N', sub: 'web browser, mobile', x: 585, y: 214, chips: ['C'] },
  { label: '(Micro-) Service 1', x: 130, y: 372, chips: ['C'] },
  { label: '(Micro-) Service N', x: 550, y: 372, chips: ['C', 'DB'] }
]
const NW = 170
const NH = 72
/* from the node's edge facing the hub to the hub's rim */
const link = (n: { x: number; y: number }) => {
  const dx = n.x - C.x, dy = n.y - C.y
  const t = Math.min(Math.abs(dx) > 1 ? (NW / 2) / Math.abs(dx) : 1e9, Math.abs(dy) > 1 ? (NH / 2) / Math.abs(dy) : 1e9)
  const d = Math.hypot(dx, dy)
  return { x1: n.x - dx * t, y1: n.y - dy * t, x2: C.x + (dx / d) * (C.r + 2), y2: C.y + (dy / d) * (C.r + 2) }
}
</script>

<template>
  <figure class="postfig">
    <svg viewBox="0 0 680 470" role="img" aria-label="A WAMP router at the centre. Connected devices 1 to N, app instances 1 to N running in web browsers or on mobile, and micro-services 1 to N each connect to the router, never to each other. Every one of them embeds a WAMP client; micro-service N also embeds a database client.">
      <defs>
        <marker id="wrt-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path class="pf-arrow" d="M0,0 L8,4 L0,8 z" />
        </marker>
      </defs>
      <line v-for="(n, i) in nodes" :key="'l' + i" class="pf-msgline" v-bind="link(n)" marker-start="url(#wrt-arr)" marker-end="url(#wrt-arr)" />
      <g class="pf-node acc">
        <circle :cx="C.x" :cy="C.y" :r="C.r" />
        <text class="pf-l" :x="C.x" :y="C.y - 2" text-anchor="middle" style="font-size: 18px">WAMP</text>
        <text class="pf-l" :x="C.x" :y="C.y + 20" text-anchor="middle" style="font-size: 18px">Router</text>
      </g>
      <g v-for="(n, i) in nodes" :key="i">
        <g class="pf-node">
          <rect :x="n.x - NW / 2" :y="n.y - NH / 2" :width="NW" :height="NH" rx="10" />
          <text class="pf-l" :x="n.x" :y="n.y - 14" text-anchor="middle" style="font-size: 13.5px">{{ n.label }}</text>
          <text v-if="n.sub" class="pf-s" :x="n.x" :y="n.y" text-anchor="middle">{{ n.sub }}</text>
        </g>
        <g v-for="(c, k) in n.chips" :key="c" class="pf-chip">
          <rect :x="n.x - n.chips.length * 17 + k * 34 + 2" :y="n.y + 8" width="30" height="20" rx="5" />
          <text :x="n.x - n.chips.length * 17 + k * 34 + 17" :y="n.y + 22" text-anchor="middle" style="font-size: 10px">{{ c }}</text>
        </g>
      </g>
      <g class="pf-chip"><rect x="214" y="440" width="30" height="20" rx="5" /><text x="229" y="454" text-anchor="middle" style="font-size: 10px">C</text></g>
      <text class="pf-msg" x="252" y="454">wamp client</text>
      <g class="pf-chip"><rect x="364" y="440" width="30" height="20" rx="5" /><text x="379" y="454" text-anchor="middle" style="font-size: 10px">DB</text></g>
      <text class="pf-msg" x="402" y="454">db client</text>
    </svg>
    <figcaption class="postfig-cap">Clients connect to the router, never to each other.</figcaption>
  </figure>
</template>
