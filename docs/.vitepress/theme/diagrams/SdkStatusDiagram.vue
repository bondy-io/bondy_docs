<!-- Diagram: the values status/1 reports over a connection's life. Redrawn from
     the ASCII block under "Connection status" in
     docs/connect/reference/clients/bondy_connect_sdk.md. Checked against
     apps/bondy_connect_sdk/src/bondy_connect_connection.erl:2494-2500
     (public_status/2): handshaking reports `connecting` even after a
     reconnect, so the cycle runs reconnecting → connecting → establishing;
     and bondy_connect_client.erl:160 (no live process → down). -->
<script setup lang="ts">
const row = [
  { id: 'connecting', x: 10 },
  { id: 'establishing', x: 180 },
  { id: 'established', x: 350, acc: true }
]
</script>

<template>
  <figure class="postfig">
    <svg viewBox="0 0 680 214" role="img" aria-label="Status values: connecting, then establishing, then established. When the link drops, status becomes reconnecting; once the transport is back it reports connecting again, then establishing and established. down is reported when the connection gave up or was closed, from any state, or when no live process stands behind the handle.">
      <defs>
        <marker id="sst-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
          <path class="pf-arrow" d="M0,0 L8,4 L0,8 z" />
        </marker>
        <marker id="sst-arr-acc" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
          <path class="pf-arrow acc" d="M0,0 L8,4 L0,8 z" />
        </marker>
      </defs>

      <line v-for="k in [0, 1]" :key="k" class="pf-msgline" :x1="row[k].x + 140" y1="52" :x2="row[k + 1].x - 6" y2="52" marker-end="url(#sst-arr)" />
      <g v-for="s in row" :key="s.id" :class="['pf-node', { acc: s.acc }]">
        <rect :x="s.x" y="30" width="140" height="44" rx="10" />
        <text class="pf-code" :x="s.x + 70" y="56" text-anchor="middle" style="font-size: 12px">{{ s.id }}</text>
      </g>

      <path class="pf-msgline acc" d="M420,74 V160 H326" marker-end="url(#sst-arr-acc)" />
      <text class="pf-msg acc" x="430" y="122">link drops</text>
      <g class="pf-node">
        <rect x="180" y="138" width="140" height="44" rx="10" />
        <text class="pf-code" x="250" y="164" text-anchor="middle" style="font-size: 12px">reconnecting</text>
      </g>
      <path class="pf-msgline acc" d="M180,160 H80 V80" marker-end="url(#sst-arr-acc)" />
      <text class="pf-msg acc" x="90" y="122">transport up</text>

      <g class="pf-node dim">
        <rect x="520" y="138" width="150" height="44" rx="10" />
        <text class="pf-code" x="595" y="157" text-anchor="middle" style="font-size: 12px">down</text>
        <text class="pf-s" x="595" y="172" text-anchor="middle">gave up or closed</text>
      </g>
      <text class="pf-msg" x="595" y="200" text-anchor="middle">from any state</text>
    </svg>
    <figcaption class="postfig-cap">reconnecting until the transport is back.</figcaption>
  </figure>
</template>
