<!-- Diagram: Alice authenticating to a user realm with credentials held in its SSO realm. Replaces the ASCII block under "Authentication Flow" in docs/connect/concepts/single_sign_on.md. -->
<script setup lang="ts">
import Sequence from '../diagram-kit/Sequence.vue'

const actors = [
  { id: 'a', label: 'Alice' },
  { id: 'b', label: 'Bondy', acc: true }
]
const steps = [
  { from: 'a', to: 'b', label: ['HELLO com.example.app1', 'authid alice@example.com'], code: true },
  { note: 'b', text: ['realm config: sso_realm_uri = com.example.sso', 'look up alice in com.example.app1 → SSO link', 'look up alice in com.example.sso → credentials'] },
  { from: 'b', to: 'a', label: 'CHALLENGE', acc: true },
  { from: 'a', to: 'b', label: 'AUTHENTICATE · password or signature' },
  { note: 'b', text: 'validate against the SSO realm credentials' },
  { from: 'b', to: 'a', label: ['WELCOME', 'session in com.example.app1'], code: true, acc: true },
  { note: 'b', text: 'authorization from com.example.app1 applies' }
]
</script>

<template>
  <Sequence
    :actors="actors"
    :steps="steps"
    caption="The SSO realm checks credentials; app1 authorizes."
    label="Sequence: Alice sends HELLO to com.example.app1 with username alice@example.com. Bondy checks the realm configuration and sees sso_realm_uri com.example.sso, looks Alice up in com.example.app1 and finds a user record with an SSO link, then looks her up in com.example.sso and retrieves her credentials. Bondy sends CHALLENGE using the SSO realm's credentials. Alice answers AUTHENTICATE with a password or signature. Bondy validates it against the SSO realm's credentials and, if valid, sends WELCOME: the session is created in com.example.app1 and that realm's authorization applies."
  />
</template>
