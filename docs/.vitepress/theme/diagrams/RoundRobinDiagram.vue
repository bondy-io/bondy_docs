<!-- Diagram: round-robin invocation, calls 1-5 over three instances. Redrawn from
     the first ASCII block in docs/connect/concepts/wamp/beyond_the_basics.md. -->
<script setup lang="ts">
const instances = ['Instance 1', 'Instance 2', 'Instance 3']
const calls = [0, 1, 2, 0, 1] /* instance index for calls 1..5 */
const X0 = 230
const DX = 96
const Y0 = 60
const DY = 52
const pt = (c: number) => [X0 + c * DX, Y0 + calls[c] * DY]
const path = calls.map((_, c) => (c === 0 ? 'M' : 'L') + pt(c).join(',')).join(' ')
</script>

<template>
  <figure class="postfig">
    <svg viewBox="0 0 680 196" role="img" aria-label="Round robin: call 1 goes to instance 1, call 2 to instance 2, call 3 to instance 3, call 4 wraps around to instance 1, and call 5 goes to instance 2.">
      <text v-for="(_, c) in calls" :key="'h' + c" class="pf-msg" :x="X0 + c * DX" y="20" text-anchor="middle">call {{ c + 1 }}</text>
      <line v-for="(_, i) in instances" :key="'g' + i" class="pf-life" :x1="X0 - 30" :y1="Y0 + i * DY" :x2="X0 + 4 * DX + 30" :y2="Y0 + i * DY" />
      <g v-for="(name, i) in instances" :key="name" class="pf-node">
        <rect x="20" :y="Y0 + i * DY - 18" width="150" height="36" rx="9" />
        <text class="pf-l" x="95" :y="Y0 + i * DY + 5" text-anchor="middle" style="font-size: 13.5px">{{ name }}</text>
      </g>
      <path class="pf-msgline acc" :d="path" />
      <circle v-for="(_, c) in calls" :key="'p' + c" class="pf-origin" :cx="pt(c)[0]" :cy="pt(c)[1]" r="5" />
      <text class="pf-msg acc" :x="X0 + 3 * DX + 10" :y="Y0 - 12">wraps around</text>
    </svg>
    <figcaption class="postfig-cap">Each call goes to the next instance in turn.</figcaption>
  </figure>
</template>
