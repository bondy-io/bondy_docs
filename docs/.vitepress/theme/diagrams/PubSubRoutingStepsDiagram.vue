<!-- Diagram: how Bondy routes an event. Replaces the PubSub ASCII block in docs/connect/concepts/how_does_bondy_work.md. -->
<script setup lang="ts">
import Sequence from '../diagram-kit/Sequence.vue'

const actors = [
  { id: 'p', label: 'Publisher' },
  { id: 'b', label: 'Bondy', sub: 'broker', acc: true },
  { id: 's1', label: 'Subscriber' },
  { id: 's2', label: 'Subscriber' }
]
const steps = [
  { from: 's1', to: 'b', label: 'SUBSCRIBE', code: false },
  { from: 's2', to: 'b', label: 'SUBSCRIBE' },
  { note: 'b', text: 'store subscriptions in routing table' },
  { from: 'p', to: 'b', label: ['PUBLISH', 'com.myapp.events.user.login'], code: true },
  { note: 'b', text: ['find matching subscribers', 'apply filtering rules', '(eligibility, exclusions)'] },
  { from: 'b', to: 's1', label: 'EVENT', acc: true },
  { from: 'b', to: 's2', label: 'EVENT', acc: true }
]
</script>

<template>
  <Sequence
    :actors="actors"
    :steps="steps"
    caption="One publish, one EVENT per matching, eligible subscriber."
    label="Sequence: subscribers subscribe to com.myapp.events.user.login and Bondy stores the subscriptions in its routing table. The publisher sends PUBLISH to that topic with event data. Bondy looks up the subscriptions, finds all matching subscribers and applies filtering rules (eligibility, exclusions). It delivers an EVENT, with the payload and, if authorized, publisher details, to each subscriber."
  />
</template>
