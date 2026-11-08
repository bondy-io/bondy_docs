<!-- Diagram: the API Gateway specification object model, every object with
     its fields and types. Redrawn from the former api_gateway_spec.png in
     docs/connect/reference/api_gateway/specification.md.

     Transcribed from docs/connect/reference/api_gateway/specification_data.md
     (the data behind that page's DataTreeViews), not from the PNG, which had
     drifted: it read body_max_byte for body_max_bytes, arguments/arguments_kw
     for args/kwargs, listed wamp_register/subscribe/… as actions, gave Path
     timeouts and retries, gave Response flat fields instead of
     on_result/on_error, and had no OIDC security or verify_path. Keep the two
     in step: a field changed in specification_data.md changes here.

     `*` marks a required field; `expr` marks a value that may be an
     expression (the data file's `() => type`). -->
<script setup lang="ts">
type F = [string, string]
type Box = { name: string; x: number; y: number; fields: F[]; heading?: number; sub?: string }

const W = 200
const ROW = 14
const COL = [8, 240, 472]
const h = (b: { fields: F[] }) => 26 + b.fields.length * ROW + 8

const boxes: Box[] = [
  { name: 'API', x: COL[0], y: 8, fields: [['id*', 'string'], ['host*', 'string'], ['realm_uri*', 'string'], ['name', 'string'], ['meta', 'map'], ['variables', 'map'], ['defaults', 'Defaults'], ['status_codes', 'map'], ['versions*', 'map of Version']] },
  { name: 'Version', x: COL[0], y: 202, fields: [['base_path*', 'string'], ['paths*', 'map of Path'], ['is_active', 'boolean'], ['is_deprecated', 'boolean'], ['pool_size', 'integer'], ['info', 'map'], ['variables', 'map'], ['defaults', 'Defaults'], ['status_codes', 'map'], ['languages', 'string[]']] },
  { name: 'Operation', x: COL[0], y: 410, fields: [['action*', 'Action'], ['response*', 'Response'], ['info', 'map'], ['body_max_bytes', 'integer'], ['body_read_bytes', 'integer'], ['body_read_seconds', 'integer']] },
  { name: 'Response', x: COL[0], y: 562, fields: [['on_result*', 'object'], ['  headers', 'map | expr'], ['  body*', 'any | expr'], ['  uri', 'string | expr'], ['  status_code', 'integer | expr'], ['on_error*', 'object'], ['  headers', 'map | expr'], ['  body*', 'any | expr'], ['  status_code', 'integer | expr']] },

  { name: 'Path', x: COL[1], y: 8, fields: [['summary', 'string'], ['description', 'string'], ['variables', 'map'], ['defaults', 'Defaults'], ['is_collection', 'boolean'], ['accepts', 'string[]'], ['provides', 'string[]'], ['schemes', 'string[]'], ['security', 'Security'], ['delete', 'Operation'], ['get', 'Operation'], ['head', 'Operation'], ['options', 'Operation'], ['patch', 'Operation'], ['post', 'Operation'], ['put', 'Operation']] },
  { name: 'static', sub: 'action', x: COL[1], y: 318, fields: [['type*', '"static"'], ['headers', 'map | expr'], ['body', 'any | expr']] },
  { name: 'forward', sub: 'action', x: COL[1], y: 404, fields: [['type*', '"forward"'], ['http_method', 'string'], ['host*', 'string'], ['path*', 'string | expr'], ['query_string', 'string | expr'], ['headers', 'map | expr'], ['body', 'any | expr'], ['timeout', 'integer | expr'], ['connect_timeout', 'integer | expr'], ['retries', 'integer | expr'], ['retry_timeout', 'integer | expr']] },
  { name: 'wamp_call', sub: 'action', x: COL[1], y: 600, fields: [['type*', '"wamp_call"'], ['procedure*', 'string | expr'], ['options', 'map'], ['args', '[any | expr]'], ['kwargs', 'map | expr'], ['timeout', 'integer | expr'], ['retries', 'integer | expr']] },

  { name: 'Defaults', x: COL[2], y: 8, fields: [['schemes', 'string[]'], ['accepts', 'string[]'], ['provides', 'string[]'], ['headers', 'map | expr'], ['security', 'Security'], ['body_max_bytes', 'integer'], ['body_read_bytes', 'integer'], ['body_read_seconds', 'integer'], ['timeout', 'integer | expr'], ['connect_timeout', 'integer | expr'], ['retries', 'integer | expr'], ['retry_timeout', 'integer | expr']] },
  { name: 'basic', sub: 'security', x: COL[2], y: 246, fields: [['type*', '"basic"'], ['schemes', 'string[]']] },
  { name: 'api_key', sub: 'security', x: COL[2], y: 314, fields: [['type*', '"api_key"'], ['schemes', 'string[]'], ['header_name*', 'string']] },
  { name: 'oauth2', sub: 'security', x: COL[2], y: 396, fields: [['type*', '"oauth2"'], ['schemes', 'string[]'], ['flow*', 'string'], ['token_path', 'string'], ['revoke_token_path', 'string'], ['verify_path', 'string'], ['description', 'string']] },
  { name: 'oidc', sub: 'security', x: COL[2], y: 538, fields: [['type*', '"oidc"'], ['provider*', 'string'], ['verify_path', 'string'], ['description', 'string']] }
]
const by = (n: string) => boxes.find(b => b.name === n)!

/* relations, drawn as arrows only: each is already named by the field row it
   leaves from (e.g. `paths*  map of Path`), so only the two vertical arrows,
   which have room, carry a label */
const rel = [
  { d: `M${COL[0] + 100},${8 + h(by('API'))} V${202 - 6}`, l: 'versions', lx: COL[0] + 108, ly: 186 },
  { d: `M${COL[0] + W},${202 + 26 + 1.5 * ROW} H${COL[1] - 6}` },
  { d: `M${COL[1]},${8 + h(by('Path')) - 30} H${COL[0] + W + 10} V${410 + 20} H${COL[0] + W + 6}` },
  { d: `M${COL[0] + W},${410 + 26 + 0.5 * ROW} H${COL[1] - 18} V${300} H${COL[1] - 14}` },
  { d: `M${COL[0] + 100},${410 + h(by('Operation'))} V${562 - 6}`, l: 'response', lx: COL[0] + 108, ly: 548 },
  { d: `M${COL[1] + W},${8 + 26 + 3.5 * ROW} H${COL[2] - 6}` },
  { d: `M${COL[1] + W},${8 + 26 + 8.5 * ROW} H${COL[2] - 18} V${232} H${COL[2] - 14}` }
]
</script>

<template>
  <figure class="postfig">
    <svg viewBox="0 0 680 796" role="img" aria-label="The API Gateway specification object model. An API object (id, host, realm_uri, name, meta, variables, defaults, status_codes, versions) holds a map of Version objects (base_path, paths, is_active, is_deprecated, pool_size, info, variables, defaults, status_codes, languages). A version holds a map of Path objects (summary, description, variables, defaults, is_collection, accepts, provides, schemes, security, and one Operation per HTTP method: delete, get, head, options, patch, post, put). An Operation has an action, a response, info and body limits. The action is one of static, forward or wamp_call; wamp_publish is like wamp_call with topic in place of procedure and no retries. The Response object has on_result (headers, body, uri, status_code) and on_error (headers, body, status_code). The Defaults object sets default schemes, accepts, provides, headers, security, body limits, timeouts and retries. Security is one of basic, api_key, oauth2 or oidc.">
      <defs>
        <marker id="ags-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path class="pf-arrow" d="M0,0 L8,4 L0,8 z" />
        </marker>
      </defs>

      <rect class="pf-zone" :x="COL[1] - 8" y="290" :width="W + 16" height="452" rx="12" />
      <text class="pf-zone-l" :x="COL[1]" y="308">action · type selects one</text>
      <text class="pf-code" :x="COL[1]" y="752" style="font-size: 9.5px">wamp_publish: as wamp_call, with topic</text>
      <text class="pf-code" :x="COL[1]" y="765" style="font-size: 9.5px">in place of procedure; no retries</text>
      <rect class="pf-zone" :x="COL[2] - 8" y="218" :width="W + 16" height="430" rx="12" />
      <text class="pf-zone-l" :x="COL[2]" y="236">security · type selects one</text>

      <path v-for="(r, i) in rel" :key="i" class="pf-msgline" :d="r.d" marker-end="url(#ags-arr)" />
      <text v-for="r in rel.filter(r => r.l)" :key="r.l" class="pf-msg" :x="r.lx" :y="r.ly" style="font-size: 9px">{{ r.l }}</text>

      <g v-for="b in boxes" :key="b.name">
        <g :class="['pf-node', { acc: !b.sub }]">
          <rect :x="b.x" :y="b.y" :width="W" :height="h(b)" rx="8" />
          <text v-if="b.sub" class="pf-code" :x="b.x + 10" :y="b.y + 17" style="font-size: 11.5px">{{ b.name }}</text>
          <text v-else class="pf-l" :x="b.x + 10" :y="b.y + 18" style="font-size: 13.5px">{{ b.name }}</text>
          <text v-if="b.sub" class="pf-s" :x="b.x + W - 10" :y="b.y + 16" text-anchor="end">{{ b.sub }}</text>
        </g>
        <line class="pf-line" :x1="b.x" :y1="b.y + 24" :x2="b.x + W" :y2="b.y + 24" />
        <template v-for="(f, k) in b.fields" :key="k">
          <text class="pf-code" :x="b.x + (f[0].startsWith(' ') ? 22 : 10)" :y="b.y + 38 + k * ROW" style="font-size: 9.5px; fill: var(--ink)">{{ f[0].trim() }}</text>
          <text class="pf-code" :x="b.x + W - 10" :y="b.y + 38 + k * ROW" text-anchor="end" style="font-size: 9.5px; fill: var(--ink-3)">{{ f[1] }}</text>
        </template>
      </g>

      <text class="pf-code" :x="COL[2]" y="672" style="font-size: 9.5px">* required</text>
      <text class="pf-code" :x="COL[2]" y="686" style="font-size: 9.5px">expr  may be an expression</text>
      <text class="pf-code" :x="COL[2]" y="706" style="font-size: 9.5px">oauth2 flow: implicit,</text>
      <text class="pf-code" :x="COL[2]" y="719" style="font-size: 9.5px">authorization_code,</text>
      <text class="pf-code" :x="COL[2]" y="732" style="font-size: 9.5px">client_credentials,</text>
      <text class="pf-code" :x="COL[2]" y="745" style="font-size: 9.5px">resource_owner_password_credentials</text>
      <text class="pf-code" :x="COL[2]" y="765" style="font-size: 9.5px">schemes: http | https</text>
    </svg>
    <figcaption class="postfig-cap">Every object in a specification, with its fields.</figcaption>
  </figure>
</template>
