<!-- Diagram: the RBAC objects of a realm and how they relate. Redrawn from the former
     rbac.png in docs/connect/reference/wamp_api/{user,group,source,grant}.md.
     The original's crow's feet are drawn as 0..* at the many end. -->
<script setup lang="ts">
const N = {
  user: { x: 110, y: 90 },
  group: { x: 570, y: 90 },
  source: { x: 110, y: 250 },
  grant: { x: 570, y: 250 }
}
</script>

<template>
  <figure class="postfig">
    <svg viewBox="0 0 680 312" role="img" aria-label="Inside a realm: a user relates to zero or more groups, zero or more sources and zero or more grants; a group relates to zero or more grants.">
      <rect class="pf-zone" x="8" y="8" width="664" height="296" rx="14" />
      <text class="pf-zone-l" x="340" y="30" text-anchor="middle">realm</text>

      <line class="pf-line" x1="190" y1="90" x2="490" y2="90" />
      <line class="pf-line" x1="110" y1="118" x2="110" y2="222" />
      <line class="pf-line" x1="570" y1="118" x2="570" y2="222" />
      <line class="pf-line" x1="190" y1="112" x2="490" y2="230" />
      <text class="pf-code acc" x="482" y="84" text-anchor="end">0..*</text>
      <text class="pf-code acc" x="118" y="214">0..*</text>
      <text class="pf-code acc" x="578" y="214">0..*</text>
      <text class="pf-code acc pf-halo" x="456" y="206" text-anchor="end">0..*</text>

      <g v-for="(p, k) in N" :key="k" class="pf-node">
        <rect :x="p.x - 80" :y="p.y - 28" width="160" height="56" rx="10" />
        <text class="pf-l" :x="p.x" :y="p.y + 5" text-anchor="middle" style="text-transform: capitalize">{{ k }}</text>
      </g>
    </svg>
    <figcaption class="postfig-cap">Users, groups, sources and grants live in a realm.</figcaption>
  </figure>
</template>
