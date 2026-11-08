<!-- Diagram: the basic RPC flow, register then call. Replaces the ASCII block
     under "Basic Flow" in docs/connect/concepts/wamp/rpc.md. -->
<script setup lang="ts">
import Sequence from '../diagram-kit/Sequence.vue'

const actors = [
  { id: 'caller', label: 'Caller' },
  { id: 'router', label: 'Router', sub: 'dealer', acc: true },
  { id: 'callee', label: 'Callee' }
]
const steps = [
  { from: 'callee', to: 'router', label: 'REGISTER com.myapp.add', code: true },
  { note: 'router', text: 'tracks the registration' },
  { from: 'caller', to: 'router', label: 'CALL com.myapp.add [2, 3]', code: true },
  { note: 'router', text: 'routes to a callee' },
  { from: 'router', to: 'callee', label: 'INVOCATION [2, 3]', code: true, acc: true },
  { note: 'callee', text: 'executes the procedure' },
  { from: 'callee', to: 'router', label: 'YIELD [5]', code: true, acc: true },
  { from: 'router', to: 'caller', label: 'RESULT [5]', code: true }
]
</script>

<template>
  <Sequence
    :actors="actors"
    :steps="steps"
    caption="Register once; every call then goes through the dealer."
    label="Sequence: the callee registers com.myapp.add with the router, which tracks the registration. The caller sends CALL com.myapp.add with arguments 2 and 3. The router routes it to a callee as an INVOCATION. The callee executes the procedure and returns YIELD with 5, and the router returns RESULT 5 to the caller."
  />
</template>
