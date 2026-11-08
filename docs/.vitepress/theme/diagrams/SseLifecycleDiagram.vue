<!-- Diagram: a WAMP session over the HTTP SSE transport. Replaces the ASCII block under "Session Lifecycle" (SSE) in docs/connect/concepts/http_transports.md. -->
<script setup lang="ts">
import Sequence from '../diagram-kit/Sequence.vue'

const actors = [
  { id: 'c', label: 'Client' },
  { id: 'b', label: 'Bondy', acc: true }
]
const steps = [
  { from: 'c', to: 'b', label: ['POST /wamp/sse/open', '{"protocols": ["wamp.2.json.sse"]}'], code: true },
  { from: 'b', to: 'c', label: '200 {"transport": "<id>"}', code: true },
  { from: 'c', to: 'b', label: 'GET /<id>/receive', code: true },
  { from: 'b', to: 'c', label: '200 text/event-stream · sse stream opens', code: true, acc: true },
  { from: 'c', to: 'b', label: ['POST /<id>/send', '[HELLO, …]'], code: true },
  { from: 'b', to: 'c', label: '202 Accepted', code: true },
  { from: 'b', to: 'c', label: ['event: wamp', 'data: [WELCOME, …]'], code: true, acc: true },
  { gap: true, text: '… send / receive cycle …' },
  { from: 'c', to: 'b', label: 'POST /<id>/close', code: true },
  { from: 'b', to: 'c', label: '202 Accepted', code: true }
]
</script>

<template>
  <Sequence
    :actors="actors"
    :steps="steps"
    caption="POSTs go in; one SSE stream comes back."
    label="Sequence: the client opens an SSE transport with POST /wamp/sse/open and protocols wamp.2.json.sse, and Bondy answers 200 with a transport id. The client calls GET /id/receive and Bondy answers 200 text/event-stream, opening the SSE stream. The client sends HELLO with POST /id/send and gets 202 Accepted. Bondy pushes WELCOME on the stream as event wamp. Send and receive repeat. Finally the client calls POST /id/close and gets 202 Accepted."
  />
</template>
