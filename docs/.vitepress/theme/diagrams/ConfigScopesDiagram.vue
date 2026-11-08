<!-- Diagram: the parts of a Bondy node and which configuration mechanism
     manages each. Redrawn from the former configuration_scopes.png in
     docs/connect/reference/configuration/basics.md and
     docs/connect/reference/wamp_api/index.md. -->
<script setup lang="ts">
const X = 236
const W = 208
const items = [
  { label: 'Session Store', y: 52 },
  { label: 'Registry', y: 96 },
  { label: 'Processes', y: 166 },
  { label: 'Listeners & Connections', y: 210 },
  { label: 'Distribution / Clustering', y: 254 },
  { label: 'Conf Cache', y: 298 }
]
const stored = ['Realm', 'Identity', 'RBAC model']
</script>

<template>
  <figure class="postfig">
    <svg viewBox="0 0 680 500" role="img" aria-label="A Bondy node holds a session store, a registry, processes, listeners and connections, distribution and clustering, a configuration cache, and storage containing realms, identities and the RBAC model. The session store and registry belong to the WAMP protocol and APIs scope: sessions, registrations and subscriptions. Processes, listeners and connections, distribution and clustering, and the configuration cache are set by static configuration: environment variables feed bondy.conf, which can name a security.json file through security.config_file (optional). Storage — realms, identities and the RBAC model — is managed by dynamic configuration, through the Admin WAMP and HTTP APIs.">
      <defs>
        <marker id="cfs-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
          <path class="pf-arrow" d="M0,0 L8,4 L0,8 z" />
        </marker>
      </defs>
      <!-- scopes -->
      <rect class="pf-zone" x="220" y="38" width="452" height="96" rx="14" />
      <text class="pf-zone-l" x="660" y="62" text-anchor="end">wamp protocol &amp; apis</text>
      <text class="pf-code" x="660" y="78" text-anchor="end" style="font-size: 10px">sessions, registrations</text>
      <text class="pf-code" x="660" y="92" text-anchor="end" style="font-size: 10px">&amp; subscriptions</text>
      <rect class="pf-zone" x="8" y="150" width="452" height="236" rx="14" />
      <text class="pf-zone-l" x="22" y="172">static configuration</text>
      <rect class="pf-zone" x="220" y="352" width="452" height="140" rx="14" />
      <text class="pf-zone-l" x="660" y="376" text-anchor="end">dynamic configuration</text>
      <text class="pf-code" x="660" y="392" text-anchor="end" style="font-size: 10px">admin wamp &amp; http apis</text>

      <!-- the node -->
      <rect class="pf-line" x="228" y="8" width="224" height="484" rx="12" />
      <text class="pf-zone-l" x="340" y="28" text-anchor="middle">bondy node</text>
      <g v-for="it in items" :key="it.label" class="pf-node">
        <rect :x="X" :y="it.y" :width="W" height="32" rx="8" />
        <text class="pf-l" :x="X + W / 2" :y="it.y + 21" text-anchor="middle" style="font-size: 13px">{{ it.label }}</text>
      </g>
      <g class="pf-node">
        <rect :x="X" y="364" :width="W" height="118" rx="10" />
        <text class="pf-l" :x="X + W / 2" y="386" text-anchor="middle" style="font-size: 13px">Storage</text>
      </g>
      <g v-for="(s, k) in stored" :key="s" class="pf-chip">
        <rect :x="X + 24" :y="396 + k * 28" :width="W - 48" height="22" rx="11" />
        <text :x="X + W / 2" :y="411 + k * 28" text-anchor="middle">{{ s }}</text>
      </g>

      <!-- static configuration sources -->
      <g v-for="(f, k) in [{ l: 'env vars', y: 196 }, { l: 'bondy.conf', y: 262 }, { l: 'security.json', y: 336 }]" :key="f.l" class="pf-node">
        <rect x="20" :y="f.y" width="140" height="32" rx="8" />
        <text class="pf-code" x="90" :y="f.y + 20" text-anchor="middle" style="font-size: 12px">{{ f.l }}</text>
      </g>
      <line class="pf-msgline" x1="90" y1="228" x2="90" y2="256" marker-end="url(#cfs-arr)" />
      <line class="pf-msgline" x1="90" y1="294" x2="90" y2="330" marker-end="url(#cfs-arr)" />
      <text class="pf-code pf-halo" x="96" y="306" style="font-size: 9.5px">security.config_file</text>
      <text class="pf-code pf-halo" x="96" y="321" style="font-size: 9.5px">(optional)</text>
    </svg>
    <figcaption class="postfig-cap">Static files set the node; the admin APIs manage what it stores.</figcaption>
  </figure>
</template>
