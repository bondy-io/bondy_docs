<!-- User realms that delegate credentials to one SSO realm. Clients sit above
     their realm, each attached by a numbered session band; inside each realm,
     identities stored locally are solid chips and identities linked to the
     SSO realm are dashed chips with an arrow down to the SSO realm, which
     spans the bottom. Used by the SameSignOn*Diagram wrappers.

     realms: [{ name, cols, clients: [{ label, sub, session }],
                chips: [{ label, ref? }] }]   list local chips first, so the
                                              linked ones sit on the bottom
                                              row with a clear path down
     sso:    { name, chips: [label] } -->
<script setup lang="ts">
import { computed } from 'vue'

type Realm = { name: string; cols: number; clients: { label: string; sub: string; session: number }[]; chips: { label: string; ref?: boolean }[] }
const props = defineProps<{ realms: Realm[]; sso: { name: string; chips: string[] }; caption?: string; label: string }>()

const X0 = 14
const X1 = 666
const GAP = 14
const CLIENT_Y = 10
const CLIENT_H = 46
const REALM_Y = 118
const CHIP_H = 22
const CHIP_DY = 30

const rowsOf = (r: Realm) => Math.ceil(r.chips.length / r.cols)
const realmH = computed(() => 40 + Math.max(...props.realms.map(rowsOf)) * CHIP_DY + 8)
const ssoY = computed(() => REALM_Y + realmH.value + 34)
const height = computed(() => ssoY.value + 116)

const layout = computed(() => {
  const slots = props.realms.map(r => Math.max(r.clients.length, r.cols))
  const unit = (X1 - X0 - GAP * (props.realms.length - 1)) / slots.reduce((a, b) => a + b, 0)
  let x = X0
  return props.realms.map((r, i) => {
    const w = slots[i] * unit
    const cw = w / r.clients.length
    const clients = r.clients.map((c, k) => ({ ...c, cx: x + cw * (k + 0.5), w: Math.min(cw - 10, 120) }))
    const chipW = Math.min(w / r.cols - 12, 130)
    const chips = r.chips.map((c, k) => {
      const col = k % r.cols
      const row = Math.floor(k / r.cols)
      return { ...c, cx: x + (w / r.cols) * (col + 0.5), y: REALM_Y + 40 + row * CHIP_DY, w: chipW }
    })
    const out = { ...r, x, w, clients, chips }
    x += w + GAP
    return out
  })
})
</script>

<template>
  <figure class="postfig">
    <svg :viewBox="`0 0 680 ${height}`" role="img" :aria-label="label">
      <defs>
        <marker id="sso-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path class="pf-arrow acc" d="M0,0 L8,4 L0,8 z" />
        </marker>
        <marker id="sso-arr-s" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path class="pf-arrow" d="M0,0 L8,4 L0,8 z" />
        </marker>
      </defs>
      <rect class="pf-zone" x="4" :y="REALM_Y - 18" width="672" :height="height - REALM_Y - 22" rx="14" />
      <text class="pf-zone-l" x="664" :y="REALM_Y - 4" text-anchor="end">bondy</text>

      <template v-for="r in layout" :key="r.name">
        <g v-for="c in r.clients" :key="c.session">
          <rect class="pf-sess" :x="c.cx - 17" :y="CLIENT_Y + CLIENT_H" width="34" :height="REALM_Y - CLIENT_Y - CLIENT_H" />
          <line class="pf-msgline" :x1="c.cx" :y1="CLIENT_Y + CLIENT_H" :x2="c.cx" :y2="REALM_Y - 6" marker-end="url(#sso-arr-s)" />
          <text class="pf-msg acc pf-halo" :x="c.cx" :y="(CLIENT_Y + CLIENT_H + REALM_Y) / 2 + 4" text-anchor="middle">{{ c.session }}</text>
          <g class="pf-node">
            <rect :x="c.cx - c.w / 2" :y="CLIENT_Y" :width="c.w" :height="CLIENT_H" rx="9" />
            <text class="pf-l" :x="c.cx" :y="CLIENT_Y + 21" text-anchor="middle" style="font-size: 13px">{{ c.label }}</text>
            <text class="pf-s" :x="c.cx" :y="CLIENT_Y + 35" text-anchor="middle">{{ c.sub }}</text>
          </g>
        </g>
        <g class="pf-node">
          <rect :x="r.x" :y="REALM_Y" :width="r.w" :height="realmH" rx="10" />
          <text class="pf-code" :x="r.x + r.w / 2" :y="REALM_Y + 22" text-anchor="middle" style="font-size: 11.5px">{{ r.name }}</text>
        </g>
        <template v-for="c in r.chips" :key="c.label">
          <line v-if="c.ref" class="pf-msgline acc" :x1="c.cx" :y1="c.y + CHIP_H" :x2="c.cx" :y2="ssoY - 6" stroke-dasharray="4 3" marker-end="url(#sso-arr)" />
          <g :class="['pf-chip', { ref: c.ref }]">
            <rect :x="c.cx - c.w / 2" :y="c.y" :width="c.w" :height="CHIP_H" rx="11" />
            <text :x="c.cx" :y="c.y + 15" text-anchor="middle">{{ c.label }}</text>
          </g>
        </template>
      </template>

      <g class="pf-node acc">
        <rect :x="X0" :y="ssoY" :width="X1 - X0" height="62" rx="10" />
        <text class="pf-code" :x="X0 + 16" :y="ssoY + 26" style="font-size: 12px">{{ sso.name }}</text>
        <text class="pf-s" :x="X0 + 16" :y="ssoY + 42">sso realm · holds the credentials</text>
      </g>
      <g v-for="(c, k) in sso.chips" :key="c" class="pf-chip acc">
        <rect :x="X1 - 16 - (sso.chips.length - k) * 104" :y="ssoY + 20" width="94" :height="CHIP_H" rx="11" />
        <text :x="X1 - 16 - (sso.chips.length - k) * 104 + 47" :y="ssoY + 35" text-anchor="middle">{{ c }}</text>
      </g>

      <g class="pf-chip"><rect x="14" :y="height - 31" width="44" height="20" rx="10" /></g>
      <text class="pf-msg" x="66" :y="height - 17">stored in the realm</text>
      <g class="pf-chip ref"><rect x="230" :y="height - 31" width="44" height="20" rx="10" /></g>
      <text class="pf-msg" x="282" :y="height - 17">linked to the sso realm</text>
      <rect class="pf-sess" x="474" :y="height - 31" width="20" height="20" />
      <text class="pf-msg" x="502" :y="height - 17">numbered session</text>
    </svg>
    <figcaption v-if="caption" class="postfig-cap">{{ caption }}</figcaption>
  </figure>
</template>
