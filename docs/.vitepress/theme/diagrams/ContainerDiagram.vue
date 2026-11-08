<!-- Diagram: C4-style container view of a Bondy cluster and what talks to it.
     Redrawn from the former bondy_container_diagram.png in docs/connect/concepts/architecture.md. -->
<script setup lang="ts">
const row2 = [
  { l: 'IoT Device', s: 'device', x: 20 },
  { l: 'App', s: 'software system', x: 270 },
  { l: 'External Services', s: 'software system', x: 500 }
]
const N2 = { x: 200, y: 222 }
const N1 = { x: 30, y: 342 }
const NN = { x: 370, y: 342 }
const NW = 140
const NH = 52
</script>

<template>
  <figure class="postfig">
    <svg viewBox="0 0 680 556" role="img" aria-label="A user reads and edits information through an app. An IoT device, the app and external services send and receive messages over WAMP with Bondy node 2. Bondy nodes 1, 2 and N form a Bondy cluster and synchronize data with each other over TCP/IP with TLS. Services send and receive messages over WAMP with node N, and an Admin HTTP API client accesses and manages the cluster over HTTP/S through node N. Node N forwards events to an external broker using the external broker's protocol.">
      <defs>
        <marker id="ctn-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path class="pf-arrow" d="M0,0 L8,4 L0,8 z" />
        </marker>
        <marker id="ctn-arr-acc" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path class="pf-arrow acc" d="M0,0 L8,4 L0,8 z" />
        </marker>
      </defs>

      <g class="pf-node">
        <rect x="270" y="8" width="140" height="48" rx="10" />
        <text class="pf-l" x="340" y="30" text-anchor="middle">User</text>
        <text class="pf-s" x="340" y="45" text-anchor="middle">person</text>
      </g>
      <line class="pf-msgline" x1="340" y1="56" x2="340" y2="94" marker-end="url(#ctn-arr)" />
      <text class="pf-msg pf-halo" x="348" y="80">read and edit information</text>

      <g v-for="n in row2" :key="n.l">
        <line class="pf-msgline" :x1="n.x + 80" y1="152" :x2="N2.x + NW / 2 + (n.x - 270) / 6" :y2="N2.y - 6" marker-end="url(#ctn-arr)" />
        <g class="pf-node">
          <rect :x="n.x" y="100" :width="n.l === 'App' ? 140 : 160" height="52" rx="10" />
          <text class="pf-l" :x="n.x + (n.l === 'App' ? 70 : 80)" y="123" text-anchor="middle">{{ n.l }}</text>
          <text class="pf-s" :x="n.x + (n.l === 'App' ? 70 : 80)" y="139" text-anchor="middle">{{ n.s }}</text>
        </g>
      </g>
      <text class="pf-msg pf-halo" x="420" y="186" text-anchor="middle">send and receive messages · wamp</text>

      <rect class="pf-zone" x="10" y="204" width="526" height="236" rx="14" />
      <text class="pf-zone-l" x="24" y="226">bondy cluster</text>

      <line class="pf-msgline acc" :x1="N2.x + 20" :y1="N2.y + NH" :x2="N1.x + NW - 20" :y2="N1.y" marker-start="url(#ctn-arr-acc)" marker-end="url(#ctn-arr-acc)" />
      <line class="pf-msgline acc" :x1="N2.x + NW - 20" :y1="N2.y + NH" :x2="NN.x + 20" :y2="NN.y" marker-start="url(#ctn-arr-acc)" marker-end="url(#ctn-arr-acc)" />
      <line class="pf-msgline acc" :x1="N1.x + NW" :y1="N1.y + NH / 2" :x2="NN.x" :y2="NN.y + NH / 2" marker-start="url(#ctn-arr-acc)" marker-end="url(#ctn-arr-acc)" />
      <text class="pf-msg acc pf-halo" x="270" y="364" text-anchor="middle">synchronizes data</text>
      <text class="pf-msg acc pf-halo" x="270" y="378" text-anchor="middle">tcp/ip, tls</text>

      <g v-for="n in [{ ...N2, l: 'Bondy Node #2' }, { ...N1, l: 'Bondy Node #1' }, { ...NN, l: 'Bondy Node #N' }]" :key="n.l" class="pf-node acc">
        <rect :x="n.x" :y="n.y" :width="NW" :height="NH" rx="10" />
        <text class="pf-l" :x="n.x + NW / 2" :y="n.y + 24" text-anchor="middle">{{ n.l }}</text>
        <text class="pf-s" :x="n.x + NW / 2" :y="n.y + 40" text-anchor="middle">software system</text>
      </g>

      <g class="pf-node">
        <rect x="556" y="250" width="116" height="52" rx="10" />
        <text class="pf-l" x="614" y="273" text-anchor="middle">Services</text>
        <text class="pf-s" x="614" y="289" text-anchor="middle">software system</text>
      </g>
      <path class="pf-msgline" d="M556,286 L516,342" marker-end="url(#ctn-arr)" />
      <text class="pf-msg pf-halo" x="546" y="326" text-anchor="end">wamp</text>
      <g class="pf-node">
        <rect x="556" y="372" width="116" height="62" rx="10" />
        <text class="pf-l" x="614" y="391" text-anchor="middle" style="font-size: 13px">Admin HTTP</text>
        <text class="pf-l" x="614" y="408" text-anchor="middle" style="font-size: 13px">API client</text>
        <text class="pf-s" x="614" y="425" text-anchor="middle">software system</text>
      </g>
      <line class="pf-msgline" x1="556" y1="388" x2="516" y2="380" marker-end="url(#ctn-arr)" />
      <text class="pf-msg" x="614" y="452" text-anchor="middle">manages the cluster</text>
      <text class="pf-msg" x="614" y="466" text-anchor="middle">http/s</text>

      <line class="pf-msgline" :x1="NN.x + NW / 2" :y1="NN.y + NH" :x2="NN.x + NW / 2" y2="484" stroke-dasharray="2 4" marker-end="url(#ctn-arr)" />
      <text class="pf-msg pf-halo" :x="NN.x + NW / 2 - 8" y="456" text-anchor="end">forwards events</text>
      <text class="pf-msg pf-halo" :x="NN.x + NW / 2 - 8" y="470" text-anchor="end">ext. broker protocol</text>
      <g class="pf-node">
        <rect :x="NN.x" y="490" :width="NW" height="52" rx="10" />
        <text class="pf-l" :x="NN.x + NW / 2" y="513" text-anchor="middle">External Broker</text>
        <text class="pf-s" :x="NN.x + NW / 2" y="529" text-anchor="middle">software system</text>
      </g>
    </svg>
    <figcaption class="postfig-cap">Clients reach any node; nodes keep each other in sync.</figcaption>
  </figure>
</template>
