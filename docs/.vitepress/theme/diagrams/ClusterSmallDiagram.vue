<!-- Diagram: a 3-node cluster, every node linked to every other (full mesh,
     as the "Full Mesh Topology" section states; config/prod/sys.config:11-12
     in the bondy repo selects partisan_pluggable_peer_service_manager).
     Replaces the "Small Production" ASCII block in
     docs/connect/concepts/clustering.md. -->
<script setup lang="ts">
const nodes = [
  { id: 'bondy1@host1', x: 130, y: 44 },
  { id: 'bondy2@host2', x: 550, y: 44 },
  { id: 'bondy3@host3', x: 340, y: 150 }
]
const links = [[0, 1], [1, 2], [0, 2]]
</script>

<template>
  <figure class="postfig">
    <svg viewBox="0 0 680 190" role="img" aria-label="Three nodes, bondy1 on host1, bondy2 on host2 and bondy3 on host3, each connected directly to the other two.">
      <line v-for="([a, b], k) in links" :key="k" class="pf-line" :x1="nodes[a].x" :y1="nodes[a].y" :x2="nodes[b].x" :y2="nodes[b].y" />
      <g v-for="n in nodes" :key="n.id" class="pf-node acc">
        <rect :x="n.x - 80" :y="n.y - 22" width="160" height="44" rx="10" />
        <text class="pf-code" :x="n.x" :y="n.y + 4" text-anchor="middle" style="font-size: 12.5px">{{ n.id }}</text>
      </g>
    </svg>
    <figcaption class="postfig-cap">Three nodes, each linked to the other two.</figcaption>
  </figure>
</template>
