<!-- Diagram: the PubSub message sequence. Replaces the PubSub ASCII block in docs/connect/concepts/wamp/communication_patterns.md. PUBLISHED is sent only for a publish with acknowledge set (bondy_router/src/bondy_broker.erl:568-571). -->
<script setup lang="ts">
import Sequence from '../diagram-kit/Sequence.vue'

const actors = [
  { id: 'p', label: 'Publisher' },
  { id: 'r', label: 'Router', sub: 'broker', acc: true },
  { id: 's1', label: 'Subscriber 1' },
  { id: 's2', label: 'Subscriber 2' },
  { id: 's3', label: 'Subscriber 3' }
]
const steps = [
  { from: 'p', to: 'r', label: 'PUBLISH' },
  { from: 'r', to: 's1', label: 'EVENT', acc: true },
  { from: 'r', to: 's2', label: 'EVENT', acc: true },
  { from: 'r', to: 's3', label: 'EVENT', acc: true },
  { from: 'r', to: 'p', label: ['PUBLISHED', '(acknowledge only)'] }
]
</script>

<template>
  <Sequence
    :actors="actors"
    :steps="steps"
    caption="One PUBLISH fans out to every subscriber."
    label="Sequence: the publisher sends PUBLISH to the router, acting as broker. The router sends an EVENT to each of three subscribers. If the publish asked for acknowledgement, the router answers the publisher with PUBLISHED."
  />
</template>
