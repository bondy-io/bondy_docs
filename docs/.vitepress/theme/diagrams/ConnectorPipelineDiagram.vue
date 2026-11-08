<!-- Diagram: what the HTTP Connector does with one WAMP call. Replaces the
     ASCII block under "How It Works" in docs/connect/concepts/http_connector.md. -->
<script setup lang="ts">
const steps = [
  { label: 'WAMP call (KWArgs)', acc: true },
  { n: 1, label: 'Extract custom headers', note: 'from KWArgs["_headers"]' },
  { n: 2, label: 'Interpolate path template', note: 'variables consumed from KWArgs' },
  { n: 3, label: 'Route remaining KWArgs', note: ['GET / DELETE / HEAD → query parameters', 'POST / PUT / PATCH → JSON request body'] },
  { n: 4, label: 'Acquire auth token', note: 'via the token cache' },
  { n: 5, label: 'Apply auth', note: 'to headers / URL' },
  { n: 6, label: 'HTTP request', note: 'retries, plus auth retry on 401/403' },
  { label: 'HTTP response → WAMP result / error', acc: true }
]
const ROW = 58
const H = 34
const X = 20
const BW = 300
const notes = (s: { note?: string | string[] }) => (s.note === undefined ? [] : Array.isArray(s.note) ? s.note : [s.note])
</script>

<template>
  <figure class="postfig">
    <svg :viewBox="`0 0 680 ${steps.length * ROW}`" role="img" aria-label="The HTTP Connector pipeline: a WAMP call with keyword arguments; 1, extract custom headers from KWArgs _headers; 2, interpolate path template variables, consuming them from KWArgs; 3, route the remaining KWArgs by HTTP method, to query parameters for GET, DELETE and HEAD, or to a JSON request body for POST, PUT and PATCH; 4, acquire an auth token via the token cache; 5, apply auth to headers or URL; 6, send the HTTP request, with retries and an auth retry on 401 or 403; the HTTP response becomes the WAMP result or error.">
      <defs>
        <marker id="cpl-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
          <path class="pf-arrow" d="M0,0 L8,4 L0,8 z" />
        </marker>
      </defs>
      <line v-for="k in steps.length - 1" :key="'a' + k" class="pf-msgline" :x1="X + 30" :y1="(k - 1) * ROW + 8 + H" :x2="X + 30" :y2="k * ROW + 6" marker-end="url(#cpl-arr)" />
      <g v-for="(s, i) in steps" :key="i" :class="['pf-node', { acc: s.acc }]">
        <rect :x="X" :y="i * ROW + 8" :width="BW" :height="H" rx="8" />
        <text class="pf-l" :x="X + 14" :y="i * ROW + 30" style="font-size: 13.5px"><tspan v-if="s.n" class="pf-s" style="font-size: 10px">{{ s.n }}&#160;&#160;</tspan>{{ s.label }}</text>
      </g>
      <template v-for="(s, i) in steps" :key="'n' + i">
        <text v-for="(l, k) in notes(s)" :key="k" class="pf-code" :x="X + BW + 20" :y="i * ROW + (notes(s).length > 1 ? 22 : 29) + k * 15">{{ l }}</text>
      </template>
    </svg>
    <figcaption class="postfig-cap">One WAMP call in, one HTTP request out.</figcaption>
  </figure>
</template>
