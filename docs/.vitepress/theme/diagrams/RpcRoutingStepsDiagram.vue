<!-- Diagram: how Bondy routes a call. Replaces the RPC ASCII block in docs/connect/concepts/how_does_bondy_work.md. -->
<script setup lang="ts">
import Sequence from '../diagram-kit/Sequence.vue'

const actors = [
  { id: 'caller', label: 'Caller' },
  { id: 'b', label: 'Bondy', sub: 'dealer', acc: true },
  { id: 'callee', label: 'Callee' }
]
const steps = [
  { from: 'callee', to: 'b', label: 'REGISTER com.myapp.calculate', code: true },
  { note: 'b', text: 'store registration in routing table' },
  { from: 'caller', to: 'b', label: 'CALL com.myapp.calculate', code: true },
  { note: 'b', text: ['look up procedure → registered callees', 'apply invocation policy', '(single, roundrobin, random, …)', 'select target callee'] },
  { from: 'b', to: 'callee', label: ['INVOCATION', 'args + caller details (if authorized)'], acc: true },
  { from: 'callee', to: 'b', label: 'YIELD', acc: true },
  { from: 'b', to: 'caller', label: 'RESULT · values or error' }
]
</script>

<template>
  <Sequence
    :actors="actors"
    :steps="steps"
    caption="Bondy selects one callee per call, by invocation policy."
    label="Sequence: the callee registers com.myapp.calculate and Bondy stores the registration in its routing table. The caller sends CALL com.myapp.calculate with arguments. Bondy looks the procedure up in the routing table, finds the registered callees, applies the invocation policy (single, roundrobin, random and others) and selects a target callee. It forwards an INVOCATION with the call arguments and, if authorized, caller details. The callee processes the request and sends YIELD. Bondy forwards the RESULT, with the returned values or error, to the original caller."
  />
</template>
