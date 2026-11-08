<!-- Diagram: the Marketplace tutorial's architecture. Redrawn from the former
     tutorials/marketplace/marketplace.png (docs/connect/tutorials/getting_started/marketplace.md)
     and, with the `gateway` prop, the former tutorials/marketplace_api_gateway/marketplace.png
     (docs/connect/tutorials/getting_started/marketplace_api_gateway.md), which
     adds the API Gateway and an HTTP client. -->
<script setup lang="ts">
defineProps<{ gateway?: boolean }>()

const api = [
  { u: 'com.market.get', t: 'p' },
  { u: 'com.market.bidder.add', t: 'p' },
  { u: 'com.market.bidder.gone', t: 'p' },
  { u: 'com.market.item.add', t: 'p' },
  { u: 'com.market.item.get', t: 'p' },
  { u: 'com.market.item.sell', t: 'p' },
  { u: 'com.market.item.bid', t: 'p' },
  { u: 'com.market.item.added', t: 't' },
  { u: 'com.market.item.new_price', t: 't' }
]
const R = { x: 256, y: 232, w: 168, h: 50 } /* the realm */
</script>

<template>
  <figure class="postfig">
    <svg viewBox="0 0 680 520" role="img" :aria-label="'Marketplace architecture. A user sells items and bids through the CLI, a Python interactive client, or the Web App, a VueJS web app that also receives real-time events. The CLI, the Web App, the Bot — a Python microservice that bids automatically — and the Market — a Python microservice acting as market maker, like a mini eBay — each hold a WAMP session attached to the realm com.market.demo on Bondy, the router. The Market registers the procedures com.market.get, com.market.bidder.add, com.market.bidder.gone, com.market.item.add, com.market.item.get, com.market.item.sell and com.market.item.bid, and publishes the topics com.market.item.added and com.market.item.new_price.' + (gateway ? ' Bondy also runs the API Gateway, which an HTTP client uses over HTTP request-response.' : '')">
      <defs>
        <marker id="mkt-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path class="pf-arrow" d="M0,0 L8,4 L0,8 z" />
        </marker>
      </defs>

      <!-- sessions to the realm -->
      <rect class="pf-sess" x="306" y="102" width="68" height="94" />
      <rect class="pf-sess" x="170" y="226" width="70" height="62" />
      <rect class="pf-sess" x="440" y="226" width="60" height="62" />
      <rect class="pf-sess" x="306" y="336" width="68" height="74" />
      <line class="pf-msgline" x1="340" y1="102" x2="340" y2="196" marker-start="url(#mkt-arr)" marker-end="url(#mkt-arr)" />
      <line class="pf-msgline" x1="170" y1="257" x2="240" y2="257" marker-start="url(#mkt-arr)" marker-end="url(#mkt-arr)" />
      <line class="pf-msgline" x1="440" y1="257" x2="500" y2="257" marker-start="url(#mkt-arr)" marker-end="url(#mkt-arr)" />
      <line class="pf-msgline" x1="340" y1="336" x2="340" y2="410" marker-start="url(#mkt-arr)" marker-end="url(#mkt-arr)" />
      <text v-for="p in [[340, 152], [205, 249], [470, 249], [340, 376]]" :key="p.join()" class="pf-msg pf-halo" :x="p[0]" :y="p[1]" text-anchor="middle">wamp</text>

      <g class="pf-node">
        <rect x="240" y="196" width="200" height="140" rx="12" />
        <text class="pf-l" x="340" y="218" text-anchor="middle">Bondy</text>
      </g>
      <g class="pf-node acc">
        <rect :x="R.x" :y="R.y" :width="R.w" :height="R.h" rx="10" />
        <text class="pf-code" x="340" :y="R.y + 22" text-anchor="middle" style="font-size: 12px">com.market.demo</text>
        <text class="pf-s" x="340" :y="R.y + 38" text-anchor="middle">realm</text>
      </g>
      <g v-if="gateway" class="pf-chip acc">
        <rect x="290" y="298" width="100" height="24" rx="8" />
        <text x="340" y="314" text-anchor="middle">API Gateway</text>
      </g>

      <!-- user -->
      <g class="pf-node">
        <rect x="10" y="20" width="130" height="50" rx="10" />
        <text class="pf-l" x="75" y="43" text-anchor="middle">User</text>
        <text class="pf-s" x="75" y="58" text-anchor="middle">person</text>
      </g>
      <line class="pf-msgline" x1="140" y1="45" x2="254" y2="45" marker-end="url(#mkt-arr)" />
      <line class="pf-msgline" x1="75" y1="70" x2="75" y2="200" marker-end="url(#mkt-arr)" />
      <text class="pf-msg pf-halo" x="197" y="39" text-anchor="middle">sell / bid</text>
      <text class="pf-msg pf-halo" x="75" y="140" text-anchor="middle">sell / bid</text>

      <g v-for="n in [
        { l: 'CLI', s: 'python', d: ['interactive client to', 'sell items and bid'], x: 260, y: 20, w: 160 },
        { l: 'Web App', s: 'vuejs', d: ['sell, bid and receive', 'real-time events'], x: 10, y: 206, w: 160 },
        { l: 'Market', s: 'microservice, python', d: ['market maker,', 'e.g. mini eBay'], x: 500, y: 206, w: 170 },
        { l: 'Bot', s: 'microservice, python', d: ['bids for items', 'automatically'], x: 260, y: 410, w: 160 }
      ]" :key="n.l" class="pf-node">
        <rect :x="n.x" :y="n.y" :width="n.w" height="82" rx="10" />
        <text class="pf-l" :x="n.x + n.w / 2" :y="n.y + 22" text-anchor="middle">{{ n.l }}</text>
        <text class="pf-s" :x="n.x + n.w / 2" :y="n.y + 37" text-anchor="middle">{{ n.s }}</text>
        <text v-for="(d, k) in n.d" :key="k" class="pf-code" :x="n.x + n.w / 2" :y="n.y + 56 + k * 13" text-anchor="middle" style="font-size: 10px">{{ d }}</text>
      </g>

      <!-- the market's API -->
      <line class="pf-line" x1="585" y1="288" x2="585" y2="306" />
      <rect class="pf-zone" x="452" y="306" width="222" height="206" rx="12" />
      <text class="pf-zone-l" x="466" y="326">market api</text>
      <g v-for="(a, k) in api" :key="a.u">
        <circle v-if="a.t === 'p'" class="pf-line" :cx="472" :cy="345 + k * 18" r="5" style="stroke: var(--blue)" />
        <rect v-else class="pf-line" :x="467" :y="340 + k * 18" width="10" height="10" :transform="`rotate(45 472 ${345 + k * 18})`" style="stroke: var(--blue)" />
        <text class="pf-code" x="486" :y="349 + k * 18" style="font-size: 10.5px">{{ a.u }}</text>
      </g>

      <!-- key -->
      <circle class="pf-line" cx="22" cy="470" r="5" style="stroke: var(--blue)" />
      <text class="pf-msg" x="34" y="474">procedure (rpc)</text>
      <rect class="pf-line" x="17" y="485" width="10" height="10" transform="rotate(45 22 490)" style="stroke: var(--blue)" />
      <text class="pf-msg" x="34" y="494">topic (pub/sub)</text>

      <template v-if="gateway">
        <g class="pf-node">
          <rect x="10" y="330" width="150" height="50" rx="10" />
          <text class="pf-l" x="85" y="353" text-anchor="middle">HTTP Client</text>
          <text class="pf-s" x="85" y="368" text-anchor="middle">any</text>
        </g>
        <path class="pf-msgline" d="M160,355 H230 Q240,355 240,345 V318 H284" marker-start="url(#mkt-arr)" marker-end="url(#mkt-arr)" />
        <text class="pf-msg pf-halo" x="200" y="349" text-anchor="middle">http</text>
        <text class="pf-msg" x="85" y="398" text-anchor="middle">request–response</text>
      </template>
    </svg>
    <figcaption class="postfig-cap">{{ gateway ? 'The same market, now also reachable over HTTP.' : 'Every component holds a session on one realm.' }}</figcaption>
  </figure>
</template>
