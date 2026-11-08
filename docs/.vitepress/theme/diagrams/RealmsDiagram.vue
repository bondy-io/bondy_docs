<!-- Diagram: one router hosting several realms, each client attached to one
     realm by a session. Redrawn from the former realm_diagram.png in
     docs/connect/concepts/realms.md and docs/connect/concepts/wamp/what_is_wamp.md. -->
<script setup lang="ts">
const realms = [
  { name: '"bondy"', sub: 'master realm', cy: 70 },
  { name: 'com.example.1', sub: 'realm', cy: 170 },
  { name: 'com.example.N', sub: 'realm', cy: 270 }
]
const sessions = [
  { n: 1, row: 0, side: 'l', roles: ['caller, subscriber'] },
  { n: 2, row: 1, side: 'l', roles: ['caller, callee,', 'subscriber, publisher'] },
  { n: 3, row: 1, side: 'r', roles: ['caller, callee,', 'subscriber, publisher'] },
  { n: 4, row: 2, side: 'l', roles: ['caller, callee,', 'subscriber, publisher'] },
  { n: 5, row: 2, side: 'r', roles: ['caller, callee,', 'subscriber, publisher'] }
]
const RL = 252
const RR = 428
const cx = (s: { side: string }) => (s.side === 'l' ? 4 : 536)
</script>

<template>
  <figure class="postfig">
    <svg viewBox="0 0 680 330" role="img" aria-label="A Bondy router hosts the master realm called bondy and the realms com.example.1 to com.example.N. Five clients each hold one session with one realm: session 1 attaches a caller and subscriber to the bondy realm; sessions 2 and 3 attach clients to com.example.1; sessions 4 and 5 attach clients to com.example.N. Those clients act as caller, callee, subscriber and publisher.">
      <defs>
        <marker id="rlm-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
          <path class="pf-arrow" d="M0,0 L8,4 L0,8 z" />
        </marker>
      </defs>
      <rect class="pf-zone" x="236" y="8" width="208" height="314" rx="14" />
      <text class="pf-zone-l" x="340" y="28" text-anchor="middle">bondy · router</text>

      <g v-for="s in sessions" :key="s.n">
        <rect class="pf-sess" :x="s.side === 'l' ? 144 : RR" :y="realms[s.row].cy - 18" :width="s.side === 'l' ? RL - 144 : 536 - RR" height="36" />
        <line class="pf-msgline" :x1="s.side === 'l' ? 144 : 536" :y1="realms[s.row].cy + 6" :x2="s.side === 'l' ? RL - 6 : RR + 6" :y2="realms[s.row].cy + 6" marker-end="url(#rlm-arr)" />
        <text class="pf-msg" :x="s.side === 'l' ? (144 + RL) / 2 : (RR + 536) / 2" :y="realms[s.row].cy - 4" text-anchor="middle">wamp</text>
        <text class="pf-msg acc" :x="s.side === 'l' ? (144 + RL) / 2 : (RR + 536) / 2" :y="realms[s.row].cy - 24" text-anchor="middle">session {{ s.n }}</text>
        <g class="pf-node">
          <rect :x="cx(s)" :y="realms[s.row].cy - 30" width="140" height="60" rx="10" />
          <text class="pf-l" :x="cx(s) + 70" :y="realms[s.row].cy - 8" text-anchor="middle">Client</text>
          <text v-for="(r, k) in s.roles" :key="k" class="pf-s" :x="cx(s) + 70" :y="realms[s.row].cy + 8 + k * 11" text-anchor="middle">{{ r }}</text>
        </g>
      </g>
      <g v-for="r in realms" :key="r.name" class="pf-node acc">
        <rect :x="RL" :y="r.cy - 26" :width="RR - RL" height="52" rx="10" />
        <text class="pf-code" x="340" :y="r.cy - 1" text-anchor="middle" style="font-size: 12.5px">{{ r.name }}</text>
        <text class="pf-s" x="340" :y="r.cy + 15" text-anchor="middle">{{ r.sub }}</text>
      </g>
    </svg>
    <figcaption class="postfig-cap">Many realms on one router; one realm per session.</figcaption>
  </figure>
</template>
