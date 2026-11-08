<!-- Diagram: essential and accidental complexity growing together as
     architectures evolve. Redrawn from the former accidental_complexity.png in
     docs/connect/concepts/why_bondy.md; same curves, eras and labels, redrawn
     flat. The bubbles between the curves stand for services: fewer and larger
     on the left, more and smaller on the right. -->
<script setup lang="ts">
const X0 = 56
const X1 = 476
const up = (t: number) => 334 - 286 * Math.pow(t, 2.4) /* essential: product requirements */
const lo = (t: number) => 372 - 160 * Math.pow(t, 1.7) /* architecture */
const xt = (t: number) => X0 + t * (X1 - X0)
const curve = (f: (t: number) => number) =>
  Array.from({ length: 41 }, (_, i) => i / 40).map((t, i) => `${i ? 'L' : 'M'}${xt(t).toFixed(1)},${f(t).toFixed(1)}`).join(' ')
const area = `${curve(lo)} L${X1},380 L${X0},380 Z`

const apps = [['Mainframe', 0.0], ['Client-server', 0.2], ['Web Apps', 0.34], ['Mobile Apps', 0.5], ['SPA', 0.64], ['IoT', 0.8], ['IoE', 0.96]] as const
const eras = [['Monoliths', 0.12], ['Services', 0.36], ['VMs', 0.48], ['Containers', 0.58], ['Microservices', 0.7], ['FaaS', 0.84], ['P2P / CRDTs', 0.97]] as const
const accidental = ['Local-first', 'Event Graphs', 'Service Graphs', 'Observability', 'Reliability', 'Event Mesh', 'Service Mesh', 'Orchestration', 'Service Discovery', 'AuthN/Z', 'API Gateway', 'Pub/Sub', 'RPC']

/* services between the curves: shrinking, multiplying */
const bubbles = (() => {
  const out: { x: number; y: number; r: number }[] = []
  for (let t = 0.07; t < 0.97; ) {
    const r = Math.max(4, 19 * (1 - t) + 2)
    const top = up(t) + 4, bot = lo(t) - 4
    const n = Math.max(1, Math.floor((bot - top) / (2 * r + 3)))
    for (let k = 0; k < n; k++) out.push({ x: xt(t), y: bot - r - k * (2 * r + 3), r })
    t += (2 * r + 4) / (X1 - X0)
  }
  return out
})()
</script>

<template>
  <figure class="postfig">
    <svg viewBox="0 0 680 410" role="img" aria-label="A chart of UX and product requirements against architecture complexity. The upper curve, essential complexity, rises steeply through mainframe, client-server, web apps, mobile apps, single-page apps, IoT and the Internet of Everything. The lower curve, architecture, rises through monoliths, services, VMs, containers, microservices, FaaS and peer-to-peer with CRDTs. Between them, services become more numerous and smaller. The area under the lower curve is accidental complexity: RPC, Pub/Sub, API gateway, AuthN/Z, service discovery, orchestration, service mesh, event mesh, reliability, observability, service graphs, event graphs, local-first. Rising essential complexity — service granularity, number of services, number of communication patterns — brings rising accidental complexity: developer fatigue, time-to-market and TCO up, ROI down.">
      <defs>
        <marker id="acx-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path class="pf-arrow" d="M0,0 L8,4 L0,8 z" />
        </marker>
      </defs>
      <path class="pf-sess" :d="area" />
      <circle v-for="(b, i) in bubbles" :key="i" class="pf-line" :cx="b.x" :cy="b.y" :r="b.r" />
      <path class="pf-msgline" :d="curve(up)" style="stroke-width: 1.8" />
      <path class="pf-msgline acc" :d="curve(lo)" style="stroke-width: 1.8" />

      <line class="pf-msgline" :x1="X0 - 12" y1="384" :x2="X0 - 12" y2="16" marker-end="url(#acx-arr)" />
      <line class="pf-msgline" :x1="X0 - 12" y1="384" :x2="X1 + 14" y2="384" marker-end="url(#acx-arr)" />
      <text class="pf-msg" :x="X0 - 22" y="200" text-anchor="middle" :transform="`rotate(-90 ${X0 - 22} 200)`">ux / product requirements</text>
      <text class="pf-msg" :x="X1 + 10" y="402" text-anchor="end">architecture complexity</text>

      <text v-for="([l, t], i) in apps" :key="l" class="pf-code pf-halo" :x="i < 2 ? xt(t) : xt(t) - 4" :y="up(t) - 10" :text-anchor="i < 2 ? 'start' : 'end'" style="font-size: 10.5px; fill: var(--ink)">{{ l }}</text>
      <template v-for="[l, t] in eras" :key="l">
        <circle class="pf-origin" :cx="xt(t)" :cy="lo(t)" r="3" />
        <text class="pf-code acc pf-halo" :x="t > 0.9 ? xt(t) - 5 : xt(t) + 5" :y="lo(t) + 15" :text-anchor="t > 0.9 ? 'end' : 'start'" style="font-size: 10px">{{ l }}</text>
      </template>

      <text class="pf-msg" x="64" y="40">↑ essential complexity</text>
      <text class="pf-code" x="64" y="56" style="font-size: 10px">↑ service granularity</text>
      <text class="pf-code" x="64" y="70" style="font-size: 10px">↑ no. of services</text>
      <text class="pf-code" x="64" y="84" style="font-size: 10px">↑ no. of comm. patterns</text>
      <text class="pf-msg" x="222" y="62">⇒</text>
      <text class="pf-msg acc" x="244" y="40">↑ accidental complexity</text>
      <text class="pf-code" x="244" y="56" style="font-size: 10px">↑ developer fatigue</text>
      <text class="pf-code" x="244" y="70" style="font-size: 10px">↑ time-to-market</text>
      <text class="pf-code" x="244" y="84" style="font-size: 10px">↑ TCO   ↓ ROI</text>

      <line class="pf-line" x1="502" y1="40" x2="502" y2="196" style="stroke-dasharray: 2 3" />
      <text class="pf-msg" x="512" y="124">essential</text>
      <text class="pf-msg" x="512" y="138">complexity</text>
      <line class="pf-line" x1="502" y1="206" x2="502" y2="380" style="stroke-dasharray: 2 3; stroke: var(--blue)" />
      <text class="pf-msg acc" x="512" y="216">accidental complexity</text>
      <text v-for="(a, i) in accidental" :key="a" class="pf-code" x="512" :y="233 + i * 11.6" style="font-size: 9px">{{ a }}</text>
    </svg>
    <figcaption class="postfig-cap">More granular systems, more accidental complexity.</figcaption>
  </figure>
</template>
