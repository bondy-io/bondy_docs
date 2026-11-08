<!-- Diagram: one SSO realm holding credentials, several user realms linking to
     it. Replaces the first ASCII block in docs/connect/concepts/single_sign_on.md. -->
<script setup lang="ts">
const users = ['Alice', 'Bob', 'Carol']
const realms = ['com.example.app1', 'com.example.app2', 'com.example.app3']
</script>

<template>
  <figure class="postfig">
    <svg viewBox="0 0 680 248" role="img" aria-label="An SSO realm, com.example.sso, stores the credentials of Alice, Bob and Carol. Three user realms, com.example.app1, app2 and app3, each link to the SSO realm. Alice authenticates to any of these realms with the same credentials stored in the SSO realm.">
      <defs>
        <marker id="ssr-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
          <path class="pf-arrow acc" d="M0,0 L8,4 L0,8 z" />
        </marker>
      </defs>
      <g class="pf-node acc">
        <rect x="170" y="10" width="340" height="96" rx="12" />
        <text class="pf-code" x="340" y="34" text-anchor="middle" style="font-size: 12.5px">com.example.sso</text>
        <text class="pf-s" x="340" y="50" text-anchor="middle">sso realm · stores credentials</text>
      </g>
      <g v-for="(u, i) in users" :key="u" class="pf-chip">
        <rect :x="200 + i * 98" y="66" width="86" height="24" rx="12" />
        <text :x="243 + i * 98" y="82" text-anchor="middle">{{ u }}</text>
      </g>
      <g v-for="(r, i) in realms" :key="r">
        <path class="pf-msgline acc" :d="`M${110 + i * 230},176 V${150} Q${110 + i * 230},132 ${340 + (i - 1) * 60},124 V112`" marker-end="url(#ssr-arr)" />
        <g class="pf-node">
          <rect :x="20 + i * 230" y="176" width="180" height="48" rx="10" />
          <text class="pf-code" :x="110 + i * 230" y="198" text-anchor="middle" style="font-size: 12.5px">{{ r }}</text>
          <text class="pf-s" :x="110 + i * 230" y="214" text-anchor="middle">user realm</text>
        </g>
      </g>
      <text class="pf-msg acc pf-halo" x="340" y="148" text-anchor="middle">sso link</text>
    </svg>
    <figcaption class="postfig-cap">One set of credentials, accepted by every linked realm.</figcaption>
  </figure>
</template>
