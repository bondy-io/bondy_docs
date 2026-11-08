<!-- A sequence diagram in the style of bondy.io's DialOutSequence.vue:
     participants on top, dashed lifelines, horizontal messages with a label
     above each arrow, and notes beside a lifeline. Used by the *Diagram.vue
     wrappers in ../diagrams, which only supply data; it lives outside that
     folder so it is not registered as a diagram itself.

     actors: [{ id, label, sub?, acc? }]
     steps:  { from, to, label, code?, acc? }   a message; label may be an
                                                array of lines; code: true
                                                keeps case (paths, URIs)
             { note, text }                     a note beside lifeline
                                                `note`; text may be an array
             { gap, text? }                     a break, e.g. "… repeat …" -->
<script setup lang="ts">
import { computed, useId } from 'vue'

type Actor = { id: string; label: string; sub?: string; acc?: boolean }
type Step =
  | { from: string; to: string; label: string | string[]; code?: boolean; acc?: boolean }
  | { note: string; text: string | string[] }
  | { gap: true; text?: string }

const props = defineProps<{ actors: Actor[]; steps: Step[]; caption?: string; label: string }>()

const W = 680
const NODE_H = 44
const TOP = 8
const id = useId()

const lines = (t: string | string[] | undefined) => (t === undefined ? [] : Array.isArray(t) ? t : [t])

const xs = computed(() => {
  const n = props.actors.length
  const half = Math.min(75, (W - 16) / n / 2 - 6)
  const m = half + 6
  return Object.fromEntries(props.actors.map((a, i) => [a.id, n === 1 ? W / 2 : m + (i * (W - 2 * m)) / (n - 1)]))
})
const nodeW = computed(() => {
  const n = props.actors.length
  return Math.min(150, (W - 16) / n - 12)
})

const layout = computed(() => {
  let y = TOP + NODE_H + 14
  const out: any[] = []
  for (const s of props.steps) {
    if ('note' in s) {
      const ls = lines(s.text)
      const x = xs.value[s.note]
      const right = x < W - 200
      out.push({ kind: 'note', x: right ? x + 10 : x - 10, anchor: right ? 'start' : 'end', y: y + 12, ls })
      y += 14 * ls.length + 14
    } else if ('gap' in s) {
      out.push({ kind: 'gap', y: y + 12, text: s.text ?? '…' })
      y += 30
    } else {
      const ls = lines(s.label)
      y += 14 * ls.length + 12
      const x1 = xs.value[s.from]
      const x2 = xs.value[s.to]
      const dir = x2 > x1 ? 1 : -1
      out.push({ kind: 'msg', x1, x2: x2 - dir * 6, y, mid: (x1 + x2) / 2, ls, code: s.code, acc: s.acc })
      y += 12
    }
  }
  return { items: out, h: y + 12 }
})
</script>

<template>
  <figure class="postfig">
    <svg :viewBox="`0 0 ${W} ${layout.h}`" role="img" :aria-label="label">
      <defs>
        <marker :id="id + 'a'" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
          <path class="pf-arrow" d="M0,0 L8,4 L0,8 z" />
        </marker>
        <marker :id="id + 'b'" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
          <path class="pf-arrow acc" d="M0,0 L8,4 L0,8 z" />
        </marker>
      </defs>

      <line v-for="a in actors" :key="'life-' + a.id" class="pf-life" :x1="xs[a.id]" :y1="TOP + NODE_H" :x2="xs[a.id]" :y2="layout.h - 4" />

      <g v-for="a in actors" :key="a.id" :class="['pf-node', { acc: a.acc }]">
        <rect :x="xs[a.id] - nodeW / 2" :y="TOP" :width="nodeW" :height="NODE_H" rx="10" />
        <text class="pf-l" :x="xs[a.id]" :y="a.sub ? TOP + 20 : TOP + 27" text-anchor="middle" :style="nodeW < 120 ? 'font-size: 13px' : ''">{{ a.label }}</text>
        <text v-if="a.sub" class="pf-s" :x="xs[a.id]" :y="TOP + 35" text-anchor="middle">{{ a.sub }}</text>
      </g>

      <template v-for="(it, i) in layout.items" :key="i">
        <g v-if="it.kind === 'msg'">
          <line :class="['pf-msgline', { acc: it.acc }]" :x1="it.x1" :y1="it.y" :x2="it.x2" :y2="it.y" :marker-end="`url(#${id}${it.acc ? 'b' : 'a'})`" />
          <text v-for="(l, k) in it.ls" :key="k" :class="[it.code ? 'pf-code' : 'pf-msg', 'pf-halo', { acc: it.acc }]" :x="it.mid" :y="it.y - 7 - (it.ls.length - 1 - k) * 14" text-anchor="middle">{{ l }}</text>
        </g>
        <g v-else-if="it.kind === 'note'">
          <text v-for="(l, k) in it.ls" :key="k" class="pf-code pf-halo" :x="it.x" :y="it.y + k * 14" :text-anchor="it.anchor" style="font-style: italic">{{ l }}</text>
        </g>
        <text v-else class="pf-msg" :x="W / 2" :y="it.y" text-anchor="middle">{{ it.text }}</text>
      </template>
    </svg>
    <figcaption v-if="caption" class="postfig-cap">{{ caption }}</figcaption>
  </figure>
</template>
