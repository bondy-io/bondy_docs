<!-- Diagram: an HTTP request turned into a WAMP call by the API Gateway. Replaces the ASCII block under "Request Flow" in docs/connect/concepts/api_gateway.md. -->
<script setup lang="ts">
import Sequence from '../diagram-kit/Sequence.vue'

const actors = [
  { id: 'client', label: 'HTTP client' },
  { id: 'gw', label: 'API Gateway', sub: 'bondy', acc: true },
  { id: 'svc', label: 'WAMP service' }
]
const steps = [
  { from: 'client', to: 'gw', label: 'GET /v1.0/invoices/42', code: true },
  { note: 'gw', text: ['match path + method', 'evaluate expressions', 'build the API context'] },
  { from: 'gw', to: 'svc', label: 'CALL com.billing.get(42)', code: true, acc: true },
  { from: 'svc', to: 'gw', label: 'RESULT {id: 42, …}', code: true, acc: true },
  { note: 'gw', text: 'apply the response transformation' },
  { from: 'gw', to: 'client', label: '200 {"id": 42, …}', code: true }
]
</script>

<template>
  <Sequence
    :actors="actors"
    :steps="steps"
    caption="The gateway translates HTTP to WAMP and back."
    label="Sequence: an HTTP client sends GET /v1.0/invoices/42 to the Bondy API Gateway. The gateway matches the path and method, evaluates expressions and builds the API context, then sends the WAMP call com.billing.get(42) to the WAMP service. The service returns a WAMP result with id 42. The gateway applies the response transformation and answers the client with 200 and the invoice."
  />
</template>
