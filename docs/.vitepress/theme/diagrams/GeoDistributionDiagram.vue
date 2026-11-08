<!-- Diagram: two clusters, each serving its local clients from its local
     instances. Replaces the "Geographic Distribution" ASCII block in
     docs/connect/concepts/wamp/beyond_the_basics.md. -->
<script setup lang="ts">
const clusters = [
  { name: 'us-east cluster', x: 10, inst: ['Instance 1', 'Instance 2'], clients: 'clients in us-east' },
  { name: 'us-west cluster', x: 350, inst: ['Instance 3', 'Instance 4'], clients: 'clients in us-west' }
]
</script>

<template>
  <figure class="postfig">
    <svg viewBox="0 0 680 290" role="img" aria-label="Two clusters. In the US-East cluster, instances 1 and 2 register the procedure, and clients in US-East connect to that cluster, so their calls are distributed to instances 1 and 2. In the US-West cluster, instances 3 and 4 register the procedure, and clients in US-West connect to that cluster, so their calls are distributed to instances 3 and 4.">
      <defs>
        <marker id="geo-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
          <path class="pf-arrow" d="M0,0 L8,4 L0,8 z" />
        </marker>
        <marker id="geo-arr-acc" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
          <path class="pf-arrow acc" d="M0,0 L8,4 L0,8 z" />
        </marker>
      </defs>
      <g v-for="c in clusters" :key="c.name">
        <rect class="pf-zone" :x="c.x" y="10" width="320" height="270" rx="14" />
        <text class="pf-zone-l" :x="c.x + 16" y="30">{{ c.name }}</text>
        <g v-for="(n, k) in c.inst" :key="n">
          <line class="pf-msgline" :x1="c.x + 85 + k * 150" y1="84" :x2="c.x + 130 + k * 60" y2="128" marker-end="url(#geo-arr)" />
          <g class="pf-node">
            <rect :x="c.x + 25 + k * 150" y="44" width="120" height="40" rx="10" />
            <text class="pf-l" :x="c.x + 85 + k * 150" y="69" text-anchor="middle" style="font-size: 13.5px">{{ n }}</text>
          </g>
        </g>
        <text class="pf-msg" :x="c.x + 160" y="104" text-anchor="middle">register</text>
        <g class="pf-node acc">
          <rect :x="c.x + 90" y="134" width="140" height="44" rx="10" />
          <text class="pf-l" :x="c.x + 160" y="161" text-anchor="middle">Bondy</text>
        </g>
        <line class="pf-msgline acc" :x1="c.x + 160" y1="226" :x2="c.x + 160" y2="184" marker-end="url(#geo-arr-acc)" />
        <text class="pf-msg acc" :x="c.x + 170" y="210">calls</text>
        <g class="pf-node">
          <rect :x="c.x + 70" y="226" width="180" height="40" rx="10" />
          <text class="pf-s" :x="c.x + 160" y="250" text-anchor="middle" style="font-size: 10px">{{ c.clients }}</text>
        </g>
      </g>
    </svg>
    <figcaption class="postfig-cap">Each cluster handles its local clients.</figcaption>
  </figure>
</template>
