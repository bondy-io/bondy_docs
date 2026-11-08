<!-- Diagram: a Bondy application network, every kind of client connected to
     Bondy over WAMP. Redrawn from the former bondy_diagram.png in
     docs/connect/concepts/what_is_bondy.md. -->
<script setup lang="ts">
const C = { x: 340, y: 200, r: 72 }
const clients = [
  { label: 'Connected Device', x: 110, y: 42 },
  { label: 'Web | Mobile App', x: 340, y: 42 },
  { label: '(Micro-) Service', x: 570, y: 42 },
  { label: 'Connected Device', x: 110, y: 358 },
  { label: 'Web | Mobile App', x: 340, y: 358 },
  { label: '(Micro-) Service', x: 570, y: 358 }
]
/* a link from a client's facing edge to the hub's rim */
const link = (n: { x: number; y: number }) => {
  const top = n.y < C.y
  const sy = top ? n.y + 22 : n.y - 22
  const dx = n.x - C.x, dy = sy - C.y, d = Math.hypot(dx, dy)
  return { x1: n.x, y1: sy, x2: C.x + (dx / d) * (C.r + 2), y2: C.y + (dy / d) * (C.r + 2) }
}
</script>

<template>
  <figure class="postfig">
    <svg viewBox="0 0 680 392" role="img" aria-label="A Bondy application network: connected devices, web and mobile apps, and micro-services all connect to Bondy, each over WAMP in both directions.">
      <defs>
        <marker id="bhb-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path class="pf-arrow" d="M0,0 L8,4 L0,8 z" />
        </marker>
      </defs>
      <template v-for="(n, i) in clients" :key="i">
        <line class="pf-msgline" v-bind="link(n)" marker-start="url(#bhb-arr)" marker-end="url(#bhb-arr)" />
        <text class="pf-msg pf-halo" :x="(link(n).x1 + link(n).x2) / 2" :y="(link(n).y1 + link(n).y2) / 2 + 4" text-anchor="middle">wamp</text>
      </template>
      <g class="pf-node acc">
        <circle :cx="C.x" :cy="C.y" :r="C.r" />
        <text class="pf-l" :x="C.x" :y="C.y + 2" text-anchor="middle" style="font-size: 20px">Bondy</text>
        <text class="pf-s" :x="C.x" :y="C.y + 20" text-anchor="middle">cluster of nodes</text>
      </g>
      <g v-for="(n, i) in clients" :key="'n' + i" class="pf-node">
        <rect :x="n.x - 80" :y="n.y - 22" width="160" height="44" rx="10" />
        <text class="pf-l" :x="n.x" :y="n.y + 5" text-anchor="middle" style="font-size: 14px">{{ n.label }}</text>
      </g>
    </svg>
    <figcaption class="postfig-cap">Bondy application network</figcaption>
  </figure>
</template>
