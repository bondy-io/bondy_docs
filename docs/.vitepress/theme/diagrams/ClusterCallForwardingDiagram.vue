<!-- Diagram: a call forwarded between cluster nodes. Replaces the numbered ASCII list in docs/connect/concepts/how_does_bondy_work.md. -->
<script setup lang="ts">
import Sequence from '../diagram-kit/Sequence.vue'

const actors = [
  { id: 'c', label: 'Client' },
  { id: 'a', label: 'Node A', acc: true },
  { id: 'b', label: 'Node B', acc: true },
  { id: 'callee', label: 'Callee' }
]
const steps = [
  { from: 'c', to: 'a', label: 'CALL' },
  { note: 'a', text: ['merged RIB summary:', 'Node B serves it'] },
  { from: 'a', to: 'b', label: ['forward CALL', 'node-addressed'], acc: true },
  { note: 'b', text: ['re-select callee among', 'live local registrations'] },
  { from: 'b', to: 'callee', label: 'INVOCATION' },
  { from: 'callee', to: 'b', label: 'YIELD' },
  { from: 'b', to: 'a', label: 'forward RESULT', acc: true },
  { from: 'a', to: 'c', label: 'RESULT' }
]
</script>

<template>
  <Sequence
    :actors="actors"
    :steps="steps"
    caption="Node A forwards to Node B; Node B picks the callee."
    label="Sequence: the client sends CALL to Node A. Node A consults its merged RIB summary, which indicates Node B serves the procedure, and forwards the CALL to Node B, node-addressed. Node B re-selects the callee among its own live local registrations and delivers an INVOCATION. The callee returns YIELD to Node B, Node B forwards the RESULT to Node A, and Node A delivers the RESULT to the client."
  />
</template>
