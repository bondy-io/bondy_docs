<!-- A tree drawn as indented nodes joined by elbow connectors, in the
     pf-node style. Used by the *Diagram.vue wrappers in ../diagrams.

     items: [{ depth, label, sub?, note?, acc?, code? }] in pre-order;
            code: true sets the label in mono (module names, identifiers).
     nodeW: node width; noteX: x where the right-hand notes start. -->
<script setup lang="ts">
import { computed } from 'vue'

type Item = { depth: number; label: string; sub?: string; note?: string; acc?: boolean; code?: boolean }
const props = defineProps<{ items: Item[]; nodeW: number; noteX: number; caption?: string; label: string }>()

const ROW = 46
const H = 34
const INDENT = 34
const X0 = 8

const rows = computed(() =>
  props.items.map((it, i) => {
    const x = X0 + it.depth * INDENT
    const y = 8 + i * ROW
    let parent = -1
    for (let j = i - 1; j >= 0; j--) if (props.items[j].depth === it.depth - 1) { parent = j; break }
    return { ...it, x, y, parent }
  })
)
const elbow = (r: any) => {
  const p = rows.value[r.parent]
  const px = p.x + 16
  return `M${px},${p.y + H} V${r.y + H / 2} H${r.x}`
}
const height = computed(() => 8 + props.items.length * ROW)
</script>

<template>
  <figure class="postfig">
    <svg :viewBox="`0 0 680 ${height}`" role="img" :aria-label="label">
      <path v-for="(r, i) in rows.filter(r => r.parent >= 0)" :key="'e' + i" class="pf-line" :d="elbow(r)" />
      <g v-for="(r, i) in rows" :key="i" :class="['pf-node', { acc: r.acc }]">
        <rect :x="r.x" :y="r.y" :width="nodeW" :height="H" rx="8" />
        <text :class="r.code ? 'pf-code' : 'pf-l'" :x="r.x + 12" :y="r.y + (r.sub ? 15 : 21)" :style="r.code ? 'font-size: 12px' : 'font-size: 13.5px'">{{ r.label }}</text>
        <text v-if="r.sub" class="pf-s" :x="r.x + 12" :y="r.y + 27">{{ r.sub }}</text>
      </g>
      <text v-for="(r, i) in rows.filter(r => r.note)" :key="'n' + i" class="pf-code" :x="noteX" :y="r.y + 21">{{ r.note }}</text>
    </svg>
    <figcaption v-if="caption" class="postfig-cap">{{ caption }}</figcaption>
  </figure>
</template>
