<!-- Diagram: the integration stack Bondy replaces. Replaces the "Instead of:"
     ASCII block in docs/connect/concepts/why_bondy.md. -->
<script setup lang="ts">
const chain = ['Web App', 'API Gateway', 'gRPC', 'Service A', 'Kafka', 'Service B']
const W = 96
const GAP = 18
const x = (i: number) => 7 + i * (W + GAP)
const below = [
  { col: 1, items: ['Load Balancer', 'Service Mesh'] },
  { col: 4, items: ['Message Queue', 'More Services'] }
]
</script>

<template>
  <figure class="postfig">
    <svg viewBox="0 0 680 200" role="img" aria-label="Without Bondy: a web app calls an API gateway, which calls gRPC, then service A, which writes to Kafka, read by service B. Under the API gateway sit a load balancer and then a service mesh; under Kafka sit a message queue and then more services.">
      <defs>
        <marker id="sbf-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
          <path class="pf-arrow" d="M0,0 L8,4 L0,8 z" />
        </marker>
      </defs>
      <line v-for="i in chain.length - 1" :key="'a' + i" class="pf-msgline" :x1="x(i - 1) + W" y1="40" :x2="x(i) - 4" y2="40" marker-end="url(#sbf-arr)" />
      <g v-for="(n, i) in chain" :key="n" class="pf-node">
        <rect :x="x(i)" y="20" :width="W" height="40" rx="9" />
        <text class="pf-l" :x="x(i) + W / 2" y="45" text-anchor="middle" style="font-size: 12.5px">{{ n }}</text>
      </g>
      <g v-for="b in below" :key="b.col">
        <template v-for="(n, k) in b.items" :key="n">
          <line class="pf-msgline" :x1="x(b.col) + W / 2" :y1="60 + k * 64" :x2="x(b.col) + W / 2" :y2="80 + k * 64" marker-end="url(#sbf-arr)" />
          <g class="pf-node">
            <rect :x="x(b.col) - 8" :y="84 + k * 64" :width="W + 16" height="40" rx="9" />
            <text class="pf-l" :x="x(b.col) + W / 2" :y="109 + k * 64" text-anchor="middle" style="font-size: 12.5px">{{ n }}</text>
          </g>
        </template>
      </g>
    </svg>
    <figcaption class="postfig-cap">Many components, many protocols, many adapters.</figcaption>
  </figure>
</template>
