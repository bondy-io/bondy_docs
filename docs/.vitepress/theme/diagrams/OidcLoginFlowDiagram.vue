<!-- Diagram: OIDC login, from the browser to an authenticated WAMP session. Replaces the ASCII block in docs/connect/concepts/oidc_authentication.md. -->
<script setup lang="ts">
import Sequence from '../diagram-kit/Sequence.vue'

const actors = [
  { id: 'br', label: 'Browser' },
  { id: 'b', label: 'Bondy', acc: true },
  { id: 'idp', label: 'IdP' }
]
const steps = [
  { from: 'br', to: 'b', label: 'GET /oidc/login', code: true },
  { note: 'b', text: 'generate state, nonce, PKCE' },
  { from: 'b', to: 'br', label: '302 → IdP', code: true },
  { from: 'br', to: 'idp', label: 'authorization request' },
  { note: 'idp', text: 'user authenticates' },
  { from: 'idp', to: 'br', label: '302 → callback?code=…', code: true },
  { from: 'br', to: 'b', label: ['GET /oidc/<provider>/', 'callback?code=…'], code: true },
  { from: 'b', to: 'idp', label: ['exchange code for tokens', 'fetch userinfo'] },
  { note: 'b', text: 'issue bondy_ticket' },
  { from: 'b', to: 'br', label: ['302 + Set-Cookie', 'bondy_ticket_<realm>, bondy_csrf_<realm>'], code: true, acc: true },
  { from: 'br', to: 'b', label: ['POST /wamp/longpoll/open', '(with cookie)'], code: true },
  { note: 'b', text: ['verify ticket', 'open WAMP session'] },
  { from: 'b', to: 'br', label: '200 {transport}', code: true }
]
</script>

<template>
  <Sequence
    :actors="actors"
    :steps="steps"
    caption="The browser ends with a ticket cookie that opens WAMP sessions."
    label="Sequence: the browser sends GET /oidc/login to Bondy. Bondy generates state, nonce and PKCE and redirects the browser to the IdP with a 302. The user authenticates at the IdP, which redirects the browser to Bondy's callback with an authorization code. The browser sends GET /oidc/provider/callback with the code. Bondy exchanges the code for tokens and fetches userinfo from the IdP, issues a bondy_ticket, and answers 302 with Set-Cookie for the bondy_ticket and bondy_csrf cookies of the realm. The browser then sends POST /wamp/longpoll/open with the cookie; Bondy verifies the ticket, opens the WAMP session and answers 200 with the transport."
  />
</template>
