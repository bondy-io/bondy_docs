<!-- Diagram: the internal states of a Bondy Connect SDK connection process.
     Replaces the ASCII block under "Losing and regaining the session" in
     docs/connect/concepts/bondy_connect_sdk.md. Checked against
     apps/bondy_connect_sdk/src/bondy_connect_connection.erl: connecting →
     handshaking (:486) → establishing (:538) → established (:854); a transport
     failure outside connecting re-enters connecting (:2050, :2063);
     connecting ⇄ waiting_for_network (:491, :511); waiting_for_network times
     out and stops (:509); non-retriable failures and exhausted retries
     stop (stop_fail at :2014, :2037, :2067). -->
<script setup lang="ts">
const CY = 66
const states = [
  { id: 'connecting', x: 10 },
  { id: 'handshaking', x: 180 },
  { id: 'establishing', x: 350 },
  { id: 'established', x: 520, acc: true }
]
</script>

<template>
  <figure class="postfig">
    <svg viewBox="0 0 680 228" role="img" aria-label="State machine of the connection process: connecting, then handshaking, then establishing, then established. A transport failure in handshaking, establishing or established returns to connecting, which reconnects. From connecting, a network outage moves to waiting_for_network, and the network coming back returns to connecting. If the network does not return in time, or a failure is not retriable, or retries are exhausted, the process stops.">
      <defs>
        <marker id="scs-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
          <path class="pf-arrow" d="M0,0 L8,4 L0,8 z" />
        </marker>
        <marker id="scs-arr-acc" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
          <path class="pf-arrow acc" d="M0,0 L8,4 L0,8 z" />
        </marker>
      </defs>

      <!-- reconnect: any post-connect state falls back to connecting -->
      <path class="pf-msgline acc" d="M590,44 V22 H80 V38" marker-end="url(#scs-arr-acc)" />
      <line class="pf-msgline acc" x1="250" y1="44" x2="250" y2="22" />
      <line class="pf-msgline acc" x1="420" y1="44" x2="420" y2="22" />
      <text class="pf-msg acc" x="335" y="14" text-anchor="middle">transport failure · reconnect</text>

      <line v-for="k in [0, 1, 2]" :key="k" class="pf-msgline" :x1="states[k].x + 140" :y1="CY" :x2="states[k + 1].x - 6" :y2="CY" marker-end="url(#scs-arr)" />

      <g v-for="s in states" :key="s.id" :class="['pf-node', { acc: s.acc }]">
        <rect :x="s.x" :y="CY - 22" width="140" height="44" rx="10" />
        <text class="pf-code" :x="s.x + 70" :y="CY + 4" text-anchor="middle" style="font-size: 12px">{{ s.id }}</text>
      </g>

      <line class="pf-msgline" x1="60" y1="88" x2="60" y2="164" marker-end="url(#scs-arr)" />
      <line class="pf-msgline" x1="100" y1="170" x2="100" y2="94" marker-end="url(#scs-arr)" />
      <text class="pf-msg" x="112" y="124">↓ network down</text>
      <text class="pf-msg" x="112" y="140">↑ network back</text>

      <g class="pf-node">
        <rect x="10" y="170" width="140" height="44" rx="10" />
        <text class="pf-code" x="80" y="196" text-anchor="middle" style="font-size: 11px">waiting_for_network</text>
      </g>

      <line class="pf-msgline" x1="150" y1="192" x2="344" y2="192" marker-end="url(#scs-arr)" />
      <text class="pf-msg" x="247" y="185" text-anchor="middle">network timeout</text>
      <g class="pf-node dim">
        <rect x="350" y="170" width="260" height="44" rx="10" />
        <text class="pf-l" x="480" y="189" text-anchor="middle" style="font-size: 13px">process stops</text>
        <text class="pf-s" x="480" y="204" text-anchor="middle">also: non-retriable, out of retries</text>
      </g>
    </svg>
    <figcaption class="postfig-cap">A dropped link reconnects inside the same process.</figcaption>
  </figure>
</template>
