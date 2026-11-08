<!-- Diagram: the router's dealer and broker roles and the messages each
     exchanges. Redrawn from the former wamp_flows.png in
     docs/connect/concepts/wamp/what_is_wamp.md. The original labelled the
     broker's reply to the publisher "ACK"; the WAMP message is PUBLISHED and
     is sent only when the publish asks for acknowledgement
     (bondy_router/src/bondy_broker.erl:568-571). -->
<template>
  <figure class="postfig">
    <svg viewBox="0 0 680 384" role="img" aria-label="A WAMP router plays two roles. As dealer, for routed RPC: the caller sends CALL to the dealer, which sends INVOCATION to the callee; the callee answers YIELD and the dealer returns RESULT to the caller. As broker, for publish/subscribe: the publisher sends PUBLISH to the broker, which sends EVENT to the subscriber, and answers the publisher with PUBLISHED if acknowledgement was requested.">
      <defs>
        <marker id="wfl-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
          <path class="pf-arrow" d="M0,0 L8,4 L0,8 z" />
        </marker>
        <marker id="wfl-arr-acc" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
          <path class="pf-arrow acc" d="M0,0 L8,4 L0,8 z" />
        </marker>
      </defs>
      <rect class="pf-zone" x="250" y="8" width="180" height="368" rx="14" />
      <text class="pf-zone-l" x="340" y="190" text-anchor="middle">wamp router</text>

      <!-- routed RPC -->
      <path class="pf-msgline" d="M80,130 V58 H264" marker-end="url(#wfl-arr)" />
      <text class="pf-msg" x="170" y="52" text-anchor="middle">CALL</text>
      <path class="pf-msgline" d="M270,82 H130 V124" marker-end="url(#wfl-arr)" />
      <text class="pf-msg" x="200" y="98" text-anchor="middle">RESULT</text>
      <path class="pf-msgline acc" d="M410,58 H600 V124" marker-end="url(#wfl-arr-acc)" />
      <text class="pf-msg acc" x="505" y="52" text-anchor="middle">INVOCATION</text>
      <path class="pf-msgline acc" d="M550,130 V82 H416" marker-end="url(#wfl-arr-acc)" />
      <text class="pf-msg acc" x="480" y="98" text-anchor="middle">YIELD</text>

      <!-- publish/subscribe -->
      <path class="pf-msgline" d="M80,270 V340 H264" marker-end="url(#wfl-arr)" />
      <text class="pf-msg" x="170" y="356" text-anchor="middle">PUBLISH</text>
      <path class="pf-msgline" d="M270,316 H130 V276" marker-end="url(#wfl-arr)" />
      <text class="pf-msg" x="200" y="296" text-anchor="middle">PUBLISHED</text>
      <path class="pf-msgline acc" d="M410,328 H600 V276" marker-end="url(#wfl-arr-acc)" />
      <text class="pf-msg acc" x="505" y="322" text-anchor="middle">EVENT</text>
      <text class="pf-code" x="200" y="310" text-anchor="middle" style="font-size: 9.5px">if acknowledged</text>

      <g class="pf-node acc">
        <rect x="270" y="34" width="140" height="62" rx="10" />
        <text class="pf-l" x="340" y="62" text-anchor="middle">Dealer</text>
        <text class="pf-s" x="340" y="78" text-anchor="middle">routed rpc</text>
      </g>
      <g class="pf-node acc">
        <rect x="270" y="298" width="140" height="62" rx="10" />
        <text class="pf-l" x="340" y="326" text-anchor="middle">Broker</text>
        <text class="pf-s" x="340" y="342" text-anchor="middle">publish / subscribe</text>
      </g>
      <g v-for="n in [{ l: 'Caller', s: 'routed rpc', x: 20, y: 130 }, { l: 'Callee', s: 'routed rpc', x: 490, y: 130 }, { l: 'Publisher', s: 'publish / subscribe', x: 20, y: 214 }, { l: 'Subscriber', s: 'publish / subscribe', x: 490, y: 214 }]" :key="n.l" class="pf-node">
        <rect :x="n.x" :y="n.y" width="170" height="56" rx="10" />
        <text class="pf-l" :x="n.x + 85" :y="n.y + 26" text-anchor="middle">{{ n.l }}</text>
        <text class="pf-s" :x="n.x + 85" :y="n.y + 42" text-anchor="middle">{{ n.s }}</text>
      </g>
    </svg>
    <figcaption class="postfig-cap">One router, two roles: dealer and broker.</figcaption>
  </figure>
</template>
