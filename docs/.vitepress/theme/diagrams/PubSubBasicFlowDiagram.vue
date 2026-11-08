<!-- Diagram: the basic PubSub flow. Replaces the ASCII block under "Basic Flow" in docs/connect/concepts/wamp/pubsub.md. -->
<script setup lang="ts">
import Sequence from '../diagram-kit/Sequence.vue'

const actors = [
  { id: 'p', label: 'Publisher' },
  { id: 'r', label: 'Router', sub: 'broker', acc: true },
  { id: 's1', label: 'Subscriber' },
  { id: 's2', label: 'Subscriber' }
]
const steps = [
  { from: 's1', to: 'r', label: ['SUBSCRIBE', 'com.myapp.events.user.login'], code: true },
  { from: 's2', to: 'r', label: 'SUBSCRIBE' },
  { note: 'r', text: 'tracks the subscriptions' },
  { from: 'p', to: 'r', label: ['PUBLISH', 'com.myapp.events.user.login'], code: true },
  { from: 'r', to: 's1', label: 'EVENT', acc: true },
  { from: 'r', to: 's2', label: 'EVENT', acc: true }
]
</script>

<template>
  <Sequence
    :actors="actors"
    :steps="steps"
    caption="Each subscriber receives the event independently."
    label="Sequence: a subscriber subscribes to com.myapp.events.user.login and the router tracks the subscription. A publisher publishes an event to that topic and the router receives it. The router delivers the event to all subscribers; each receives it independently."
  />
</template>
