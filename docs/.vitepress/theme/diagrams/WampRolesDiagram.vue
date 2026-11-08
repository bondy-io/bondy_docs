<!-- Diagram: two clients, each attached to the same realm of a router by one
     WAMP session. Redrawn from the former wamp_roles.png. Theme-adaptive. Placed via
     <WampRolesDiagram /> in docs/connect/concepts/wamp/introduction.md. -->
<script setup lang="ts">
const CY = 104
const sessions = [
  { name: 'session 1', x1: 150, x2: 252, tip: 246, from: 150 },
  { name: 'session 2', x1: 428, x2: 530, tip: 434, from: 530 }
]
</script>

<template>
  <figure class="postfig">
    <svg viewBox="0 0 680 196" role="img" aria-label="Two clients, each acting as caller, callee, subscriber and publisher, are each attached by one WAMP session to the same realm. The realm lives inside a router, which plays the dealer and broker roles.">
      <defs>
        <marker id="wro-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
          <path class="pf-arrow" d="M0,0 L8,4 L0,8 z" />
        </marker>
      </defs>

      <rect class="pf-zone" x="240" y="20" width="200" height="160" rx="14" />
      <text class="pf-zone-l" x="340" y="40" text-anchor="middle">router · dealer, broker</text>

      <g v-for="s in sessions" :key="s.name">
        <rect class="pf-sess" :x="s.x1" :y="CY - 20" :width="s.x2 - s.x1" height="40" />
        <line class="pf-msgline" :x1="s.from" :y1="CY + 6" :x2="s.tip" :y2="CY + 6" marker-end="url(#wro-arr)" />
        <text class="pf-msg" :x="(s.x1 + s.x2) / 2" :y="CY - 4" text-anchor="middle">wamp</text>
        <text class="pf-msg acc" :x="(s.x1 + s.x2) / 2" :y="CY - 28" text-anchor="middle">{{ s.name }}</text>
      </g>

      <g class="pf-node acc">
        <rect x="252" :y="CY - 34" width="176" height="68" rx="10" />
        <text class="pf-l" x="340" :y="CY + 5" text-anchor="middle">Realm</text>
      </g>

      <g v-for="x in [10, 530]" :key="x" class="pf-node">
        <rect :x="x" :y="CY - 34" width="140" height="68" rx="10" />
        <text class="pf-l" :x="x + 70" :y="CY - 4" text-anchor="middle">Client</text>
        <text class="pf-s" :x="x + 70" :y="CY + 13" text-anchor="middle">caller, callee,</text>
        <text class="pf-s" :x="x + 70" :y="CY + 25" text-anchor="middle">subscriber, publisher</text>
      </g>
    </svg>
    <figcaption class="postfig-cap">Each client joins a realm through one session.</figcaption>
  </figure>
</template>
