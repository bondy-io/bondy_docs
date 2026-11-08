<!-- Diagram: every component connected directly to Bondy. Replaces the ASCII
     block after "Every component connects directly to Bondy:" in
     docs/connect/concepts/why_bondy.md. -->
<template>
  <figure class="postfig">
    <svg viewBox="0 0 680 84" role="img" aria-label="With Bondy: the web app connects to Bondy, and the services connect to Bondy.">
      <defs>
        <marker id="saf-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
          <path class="pf-arrow" d="M0,0 L8,4 L0,8 z" />
        </marker>
      </defs>
      <line class="pf-msgline" x1="200" y1="42" x2="264" y2="42" marker-end="url(#saf-arr)" />
      <line class="pf-msgline" x1="480" y1="42" x2="416" y2="42" marker-end="url(#saf-arr)" />
      <g class="pf-node">
        <rect x="40" y="18" width="160" height="48" rx="10" />
        <text class="pf-l" x="120" y="47" text-anchor="middle">Web App</text>
      </g>
      <g class="pf-node acc">
        <rect x="270" y="14" width="140" height="56" rx="12" />
        <text class="pf-l" x="340" y="47" text-anchor="middle">Bondy</text>
      </g>
      <g class="pf-node">
        <rect x="480" y="18" width="160" height="48" rx="10" />
        <text class="pf-l" x="560" y="47" text-anchor="middle">Services</text>
      </g>
    </svg>
    <figcaption class="postfig-cap">One protocol, one hub.</figcaption>
  </figure>
</template>
