<!-- Diagram: the RPC message sequence. Replaces the RPC ASCII block in docs/connect/concepts/wamp/communication_patterns.md. -->
<script setup lang="ts">
import Sequence from '../diagram-kit/Sequence.vue'

const actors = [
  { id: 'caller', label: 'Caller' },
  { id: 'r', label: 'Router', sub: 'dealer', acc: true },
  { id: 'callee', label: 'Callee' }
]
const steps = [
  { from: 'caller', to: 'r', label: 'CALL' },
  { from: 'r', to: 'callee', label: 'INVOCATION', acc: true },
  { note: 'callee', text: 'process' },
  { from: 'callee', to: 'r', label: 'YIELD', acc: true },
  { from: 'r', to: 'caller', label: 'RESULT' }
]
</script>

<template>
  <Sequence
    :actors="actors"
    :steps="steps"
    caption="CALL in, INVOCATION out, YIELD back, RESULT home."
    label="Sequence: the caller sends CALL to the router, acting as dealer. The router sends INVOCATION to the callee, which processes it and returns YIELD. The router returns RESULT to the caller."
  />
</template>
