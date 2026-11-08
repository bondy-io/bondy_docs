<!-- Diagram: a 5-node cluster across two regions and a core region. The ASCII
     block it replaces (the "Multi-Region" topology in
     docs/connect/concepts/clustering.md) showed only some links; the page's
     "Full Mesh Topology" section, and config/prod/sys.config:11-12 in the
     bondy repo (partisan_pluggable_peer_service_manager), say every node links
     to every other, so all ten links are drawn. Links within the top row that
     skip a node arc above it. -->
<script setup lang="ts">
const ROW = 126
const nodes = [
  { id: 'bondy1', x: 85, y: ROW },
  { id: 'bondy2', x: 230, y: ROW },
  { id: 'bondy4', x: 450, y: ROW },
  { id: 'bondy5', x: 595, y: ROW },
  { id: 'bondy3', x: 340, y: 262 }
]
const W = 110
/* adjacent pairs on the row are straight; others arc over the nodes between */
const row = [[0, 1, 0], [1, 2, 0], [2, 3, 0], [0, 2, 46], [1, 3, 46], [0, 3, 82]]
const arc = (a: number, b: number, h: number) => {
  const A = nodes[a], B = nodes[b]
  return h === 0
    ? `M${A.x},${A.y} L${B.x},${B.y}`
    : `M${A.x},${A.y - 22} Q${(A.x + B.x) / 2},${A.y - 22 - 2 * h} ${B.x},${B.y - 22}`
}
</script>

<template>
  <figure class="postfig">
    <svg viewBox="0 0 680 318" role="img" aria-label="Five nodes: bondy1 and bondy2 in region A, bondy4 and bondy5 in region B, and bondy3 in the core region. Every node is connected directly to every other node.">
      <rect class="pf-zone" x="10" y="92" width="296" height="80" rx="14" />
      <text class="pf-zone-l" x="24" y="164">region a</text>
      <rect class="pf-zone" x="374" y="92" width="296" height="80" rx="14" />
      <text class="pf-zone-l" x="388" y="164">region b</text>
      <rect class="pf-zone" x="240" y="228" width="200" height="80" rx="14" />
      <text class="pf-zone-l" x="254" y="300">core region</text>

      <path v-for="([a, b, h], k) in row" :key="'r' + k" class="pf-line" :d="arc(a, b, h)" />
      <line v-for="k in [0, 1, 2, 3]" :key="'c' + k" class="pf-line" :x1="nodes[k].x" :y1="nodes[k].y" :x2="nodes[4].x" :y2="nodes[4].y" />

      <g v-for="n in nodes" :key="n.id" class="pf-node acc">
        <rect :x="n.x - W / 2" :y="n.y - 22" :width="W" height="44" rx="10" />
        <text class="pf-code" :x="n.x" :y="n.y + 4" text-anchor="middle" style="font-size: 12.5px">{{ n.id }}</text>
      </g>
    </svg>
    <figcaption class="postfig-cap">Five nodes in three regions, still one full mesh.</figcaption>
  </figure>
</template>
