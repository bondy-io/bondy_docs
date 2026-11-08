<!-- Diagram: north-south and east-west traffic in an application network.
     Redrawn from the former application_network_traffic.png in
     docs/connect/concepts/application_networks.md. -->
<script setup lang="ts">
const C = { x: 390, y: 196, r: 66 }
const clients = [
  { label: 'Connected Device', x: 190, y: 40 },
  { label: 'Web App', x: 390, y: 40 },
  { label: 'Mobile App', x: 590, y: 40 },
  { label: '(Micro-) Service', x: 190, y: 352 },
  { label: '(Micro-) Service', x: 390, y: 352 },
  { label: '(Micro-) Service', x: 590, y: 352 }
]
const link = (n: { x: number; y: number }) => {
  const top = n.y < C.y
  const sy = top ? n.y + 22 : n.y - 22
  const dx = n.x - C.x, dy = sy - C.y, d = Math.hypot(dx, dy)
  return { x1: n.x, y1: sy, x2: C.x + (dx / d) * (C.r + 2), y2: C.y + (dy / d) * (C.r + 2) }
}
</script>

<template>
  <figure class="postfig">
    <svg viewBox="0 0 680 430" role="img" aria-label="A connected device, a web app and a mobile app at the top, and three micro-services at the bottom, all connected to Bondy over WAMP. Traffic between the top and the bottom, crossing the system boundary, is north-south traffic. Traffic among the services is east-west traffic.">
      <defs>
        <marker id="ntr-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path class="pf-arrow" d="M0,0 L8,4 L0,8 z" />
        </marker>
        <marker id="ntr-arr-acc" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path class="pf-arrow acc" d="M0,0 L8,4 L0,8 z" />
        </marker>
      </defs>
      <line class="pf-msgline acc" x1="34" y1="24" x2="34" y2="370" marker-start="url(#ntr-arr-acc)" marker-end="url(#ntr-arr-acc)" />
      <text class="pf-msg acc pf-halo" x="34" y="194" text-anchor="middle">north–</text>
      <text class="pf-msg acc pf-halo" x="34" y="208" text-anchor="middle">south</text>
      <line class="pf-msgline acc" x1="110" y1="410" x2="670" y2="410" marker-start="url(#ntr-arr-acc)" marker-end="url(#ntr-arr-acc)" />
      <text class="pf-msg acc pf-halo" x="390" y="414" text-anchor="middle">east–west</text>
      <template v-for="(n, i) in clients" :key="i">
        <line class="pf-msgline" v-bind="link(n)" marker-start="url(#ntr-arr)" marker-end="url(#ntr-arr)" />
        <text class="pf-msg pf-halo" :x="(link(n).x1 + link(n).x2) / 2" :y="(link(n).y1 + link(n).y2) / 2 + 4" text-anchor="middle">wamp</text>
      </template>
      <g class="pf-node acc">
        <circle :cx="C.x" :cy="C.y" :r="C.r" />
        <text class="pf-l" :x="C.x" :y="C.y + 7" text-anchor="middle" style="font-size: 20px">Bondy</text>
      </g>
      <g v-for="(n, i) in clients" :key="'n' + i" class="pf-node">
        <rect :x="n.x - 80" :y="n.y - 22" width="160" height="44" rx="10" />
        <text class="pf-l" :x="n.x" :y="n.y + 5" text-anchor="middle" style="font-size: 14px">{{ n.label }}</text>
      </g>
    </svg>
    <figcaption class="postfig-cap">An application network carries both kinds of traffic</figcaption>
  </figure>
</template>
