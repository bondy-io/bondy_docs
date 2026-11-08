<!-- Diagram: the API Gateway (ingress) and the HTTP Connector (egress) run in
     opposite directions. Replaces the first ASCII block in
     docs/connect/concepts/api_gateway.md. -->
<script setup lang="ts">
const rows = [
  { title: 'http api gateway · ingress', cy: 66, left: ['External', 'http client'], right: ['WAMP service', 'callee'], req: ['HTTP request', 'WAMP call'], res: ['HTTP response', 'WAMP result'] },
  { title: 'http connector · egress', cy: 196, left: ['WAMP client', 'caller'], right: ['External', 'rest api'], req: ['WAMP call', 'HTTP request'], res: ['WAMP result', 'HTTP response'] }
]
const L = 150
const B1 = 265
const B2 = 415
const R = 530
</script>

<template>
  <figure class="postfig">
    <svg viewBox="0 0 680 252" role="img" aria-label="Two flows through Bondy. HTTP API Gateway: an external client sends an HTTP request to Bondy, which makes a WAMP call to a WAMP service; the WAMP result comes back to Bondy, which answers with an HTTP response. HTTP Connector: a WAMP client makes a WAMP call to Bondy, which sends an HTTP request to an external REST API; the HTTP response comes back to Bondy, which answers with a WAMP result.">
      <defs>
        <marker id="gwc-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
          <path class="pf-arrow" d="M0,0 L8,4 L0,8 z" />
        </marker>
      </defs>
      <g v-for="r in rows" :key="r.title">
        <text class="pf-zone-l" x="340" :y="r.cy - 40" text-anchor="middle">{{ r.title }}</text>
        <g class="pf-node">
          <rect x="10" :y="r.cy - 24" :width="L - 10" height="48" rx="10" />
          <text class="pf-l" :x="(10 + L) / 2" :y="r.cy - 2" text-anchor="middle">{{ r.left[0] }}</text>
          <text class="pf-s" :x="(10 + L) / 2" :y="r.cy + 13" text-anchor="middle">{{ r.left[1] }}</text>
        </g>
        <g class="pf-node acc">
          <rect :x="B1" :y="r.cy - 24" :width="B2 - B1" height="48" rx="10" />
          <text class="pf-l" :x="(B1 + B2) / 2" :y="r.cy + 5" text-anchor="middle">Bondy</text>
        </g>
        <g class="pf-node">
          <rect :x="R" :y="r.cy - 24" :width="670 - R" height="48" rx="10" />
          <text class="pf-l" :x="(R + 670) / 2" :y="r.cy - 2" text-anchor="middle">{{ r.right[0] }}</text>
          <text class="pf-s" :x="(R + 670) / 2" :y="r.cy + 13" text-anchor="middle">{{ r.right[1] }}</text>
        </g>
        <template v-for="(seg, k) in [[L, B1], [B2, R]]" :key="k">
          <line class="pf-msgline" :x1="seg[0]" :y1="r.cy - 8" :x2="seg[1] - 6" :y2="r.cy - 8" marker-end="url(#gwc-arr)" />
          <text class="pf-msg" :x="(seg[0] + seg[1]) / 2" :y="r.cy - 14" text-anchor="middle">{{ r.req[k] }}</text>
          <line class="pf-msgline" :x1="seg[1]" :y1="r.cy + 8" :x2="seg[0] + 6" :y2="r.cy + 8" marker-end="url(#gwc-arr)" />
          <text class="pf-msg" :x="(seg[0] + seg[1]) / 2" :y="r.cy + 24" text-anchor="middle">{{ r.res[k] }}</text>
        </template>
      </g>
    </svg>
    <figcaption class="postfig-cap">The gateway lets HTTP in; the connector lets WAMP out.</figcaption>
  </figure>
</template>
