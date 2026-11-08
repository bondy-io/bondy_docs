<!-- Diagram: the e-commerce order example: one RPC, then one event fanned out. Replaces the ASCII block under "Example: E-commerce Order Processing" in docs/connect/concepts/wamp/communication_patterns.md. -->
<script setup lang="ts">
import Sequence from '../diagram-kit/Sequence.vue'

const actors = [
  { id: 'br', label: 'Browser' },
  { id: 'b', label: 'Bondy', acc: true },
  { id: 'o', label: 'Order svc' },
  { id: 'inv', label: 'Inventory' },
  { id: 'em', label: 'Email' },
  { id: 'an', label: 'Analytics' }
]
const steps = [
  { from: 'br', to: 'b', label: ['CALL', 'com.shop.order.create'], code: true },
  { from: 'b', to: 'o', label: 'INVOCATION' },
  { from: 'o', to: 'b', label: 'YIELD · order id' },
  { from: 'b', to: 'br', label: 'RESULT · order id' },
  { from: 'o', to: 'b', label: ['PUBLISH', 'com.shop.order.created'], code: true, acc: true },
  { from: 'b', to: 'inv', label: 'EVENT', acc: true },
  { note: 'inv', text: 'update stock' },
  { from: 'b', to: 'em', label: 'EVENT', acc: true },
  { note: 'em', text: 'send confirmation' },
  { from: 'b', to: 'an', label: 'EVENT', acc: true },
  { note: 'an', text: 'record metrics' },
  { from: 'b', to: 'br', label: 'EVENT', acc: true },
  { note: 'br', text: 'show confirmation' }
]
</script>

<template>
  <Sequence
    :actors="actors"
    :steps="steps"
    caption="One protocol, one connection: RPC and PubSub together."
    label="Sequence: the user's browser calls com.shop.order.create through Bondy; the order service, as callee, processes the order and the order ID returns to the browser. The order service then publishes com.shop.order.created. Bondy delivers the event to the inventory service, which updates stock, the email service, which sends a confirmation, the analytics service, which records metrics, and the user's browser, which shows the confirmation."
  />
</template>
