<!-- Diagram: the three layers of a Bondy node, and the Partisan channels that
     join nodes. Redrawn from the former bondy_architecture.png in
     docs/connect/concepts/architecture.md. Drawn from that page's "How Bondy
     Is Built" text rather than from the PNG, which showed an older design
     (Plumtree/HyParView trees; a storage list of registry entry, realm, user,
     RBAC object) that the text no longer describes. Names checked in the bondy
     repo: apps/bondy_router, apps/bondy_db (leveled: bondy_db_leveled_sup.erl),
     apps/bondy_oplog, apps/bondy_log, apps/bondy_mst; channels wamp_relay and
     bondy_aae (apps/bondy_router/src/bondy_config.erl:14-15) and default,
     data, control_plane (:441); full mesh (config/prod/sys.config:11-12). -->
<script setup lang="ts">
const nodes = [{ x: 10, name: 'bondy node #1' }, { x: 440, name: 'bondy node #n' }]
const W = 230
const channels = [
  { c: 'wamp_relay', d: 'calls & events', acc: true },
  { c: 'bondy_aae', d: 'anti-entropy' },
  { c: 'data' },
  { c: 'control_plane' },
  { c: 'default' }
]
</script>

<template>
  <figure class="postfig">
    <svg viewBox="0 0 680 410" role="img" aria-label="Two Bondy nodes, each built in three layers. The router, bondy_router, implements the dealer and broker roles, the HTTP API Gateway and the Admin API. Storage and replication: bondy_db, a sharded key/value facade with per-table CRDTs, over bondy_oplog, a write-ahead log on bondy_log with a Merkle Search Tree for anti-entropy, persisted to leveled. Clustering: Partisan, a full mesh with no leader. Between the nodes, Partisan carries separate channels: wamp_relay for calls and events routed between nodes, bondy_aae for anti-entropy sync, and the data, control_plane and default channels.">
      <rect class="pf-sess" x="230" y="292" width="220" height="104" />
      <text class="pf-zone-l" x="340" y="282" text-anchor="middle">partisan channels</text>
      <g v-for="(ch, k) in channels" :key="ch.c" :class="['pf-chip', { acc: ch.acc }]">
        <rect x="248" :y="298 + k * 19" width="184" height="16" rx="8" />
        <text x="258" :y="310 + k * 19" style="font-size: 10px">{{ ch.c }}</text>
        <text v-if="ch.d" x="424" :y="310 + k * 19" text-anchor="end" style="font-size: 9px; fill: var(--ink-3)">{{ ch.d }}</text>
      </g>

      <g v-for="n in nodes" :key="n.name">
        <rect class="pf-zone" :x="n.x" y="8" :width="W" height="394" rx="14" />
        <text class="pf-zone-l" :x="n.x + W / 2" y="28" text-anchor="middle">{{ n.name }}</text>

        <g class="pf-node acc">
          <rect :x="n.x + 12" y="40" :width="W - 24" height="70" rx="10" />
          <text class="pf-l" :x="n.x + 26" y="62">Router</text>
          <text class="pf-code" :x="n.x + W - 26" y="62" text-anchor="end" style="font-size: 10px">bondy_router</text>
          <text class="pf-s" :x="n.x + 26" y="82">dealer · broker</text>
          <text class="pf-s" :x="n.x + 26" y="96">http api gateway · admin api</text>
        </g>

        <g class="pf-node">
          <rect :x="n.x + 12" y="122" :width="W - 24" height="144" rx="10" />
          <text class="pf-l" :x="n.x + 26" y="144" style="font-size: 14px">Storage &amp; replication</text>
        </g>
        <g v-for="(s, k) in [{ c: 'bondy_db', d: 'per-table CRDTs' }, { c: 'bondy_oplog', d: 'WAL + MST' }, { c: 'bondy_log', d: 'append-only log' }, { c: 'leveled', d: 'LSM store' }]" :key="s.c" class="pf-chip">
          <rect :x="n.x + 24" :y="156 + k * 26" :width="W - 48" height="20" rx="10" />
          <text :x="n.x + 34" :y="170 + k * 26" style="font-size: 10.5px">{{ s.c }}</text>
          <text :x="n.x + W - 34" :y="170 + k * 26" text-anchor="end" style="font-size: 9px; fill: var(--ink-3)">{{ s.d }}</text>
        </g>

        <g class="pf-node">
          <rect :x="n.x + 12" y="278" :width="W - 24" height="70" rx="10" />
          <text class="pf-l" :x="n.x + 26" y="300">Clustering</text>
          <text class="pf-code" :x="n.x + W - 26" y="300" text-anchor="end" style="font-size: 10px">partisan</text>
          <text class="pf-s" :x="n.x + 26" y="320">full mesh · no leader</text>
        </g>
      </g>
    </svg>
    <figcaption class="postfig-cap">Router, storage, clustering — on every node.</figcaption>
  </figure>
</template>
