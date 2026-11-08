<!-- Diagram: a WAMP session over the HTTP long-poll transport. Replaces the ASCII block under "Session Lifecycle" (Longpoll) in docs/connect/concepts/http_transports.md. -->
<script setup lang="ts">
import Sequence from '../diagram-kit/Sequence.vue'

const actors = [
  { id: 'c', label: 'Client' },
  { id: 'b', label: 'Bondy', acc: true }
]
const steps = [
  { from: 'c', to: 'b', label: ['POST /wamp/longpoll/open', '{"protocols": ["wamp.2.json"]}'], code: true },
  { from: 'b', to: 'c', label: '200 {"transport": "<id>"}', code: true },
  { from: 'c', to: 'b', label: ['POST /<id>/send', '[HELLO, …]'], code: true },
  { from: 'b', to: 'c', label: '202 Accepted', code: true },
  { from: 'c', to: 'b', label: 'POST /<id>/receive', code: true },
  { note: 'b', text: 'blocks until a message is ready' },
  { from: 'b', to: 'c', label: '200 [WELCOME, …]', code: true, acc: true },
  { gap: true, text: '… send / receive cycle …' },
  { from: 'c', to: 'b', label: 'POST /<id>/close', code: true },
  { from: 'b', to: 'c', label: '202 Accepted', code: true }
]
</script>

<template>
  <Sequence
    :actors="actors"
    :steps="steps"
    caption="Each receive blocks until the router has a message."
    label="Sequence: the client opens a long-poll transport with POST /wamp/longpoll/open and protocols wamp.2.json, and Bondy answers 200 with a transport id. The client sends HELLO with POST /id/send and gets 202 Accepted. It then calls POST /id/receive, which blocks until a message is ready, and gets 200 with WELCOME. Send and receive repeat. Finally the client calls POST /id/close and gets 202 Accepted."
  />
</template>
