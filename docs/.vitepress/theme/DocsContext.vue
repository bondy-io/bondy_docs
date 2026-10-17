<!-- The documentation context row, rendered in SiteNav's #context slot.

     Names the documentation set being read, its four Diataxis sections with
     the current one marked, and the version. These stay true on every page
     of a set, so they belong in the header, which keeps them in view, rather
     than above each page's H1. The page's own position within a section is
     the sidebar's job.

     Layout.vue renders this only on pages that belong to a set (see
     `docsContext`), and passes the slot only then, so the portal has no
     context row. -->
<script setup>
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import { withBase, useRouter } from 'vitepress'
import { NavbarVersion } from '@leapsight/vitepress-template/theme'

const props = defineProps({
  /** The result of `docsContext(path)`. */
  ctx: { type: Object, required: true }
})

const sections = computed(() =>
  props.ctx.sections.map((s) => ({ ...s, href: withBase(s.link) }))
)

// Between the tab row's natural width and a phone, the tabs scroll
// sideways. Bring the current one into view so the row shows where the
// reader is, not always the first tab. Scrolls the tab strip only, never
// the page.
const strip = ref(null)
function revealCurrent() {
  const el = strip.value
  const on = el?.querySelector('.on')
  if (!el || !on || el.scrollWidth <= el.clientWidth) return
  el.scrollLeft = on.offsetLeft - (el.clientWidth - on.offsetWidth) / 2
}
onMounted(revealCurrent)
watch(() => props.ctx.section, () => nextTick(revealCurrent))

// On a phone there is no room for four tabs beside the set's name, so the
// sections become a native picker: the phone's own list UI, with nothing
// to scroll and nothing cut off.
const router = useRouter()
const pick = (e) => {
  const s = sections.value.find((x) => x.id === e.target.value)
  if (s) router.go(s.href)
}
</script>

<template>
  <div class="dctx">
    <a v-if="ctx.link" class="dctx-set" :href="withBase(ctx.link)">{{ ctx.text }}</a>
    <span v-else class="dctx-set">{{ ctx.text }}</span>

    <nav v-if="sections.length" ref="strip" class="dctx-sections" aria-label="Sections">
      <a
        v-for="s in sections"
        :key="s.id"
        :href="s.href"
        :class="{ on: s.id === ctx.section }"
        :aria-current="s.id === ctx.section ? 'true' : undefined"
      >{{ s.text }}</a>
    </nav>

    <label v-if="sections.length" class="dctx-pick">
      <span class="sr-only">Section</span>
      <select :value="ctx.section ?? ''" @change="pick">
        <option v-if="!ctx.section" value="" disabled>Sections</option>
        <option v-for="s in sections" :key="s.id" :value="s.id">{{ s.text }}</option>
      </select>
      <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </label>

    <NavbarVersion class="dctx-version" />
  </div>
</template>

<style>
.dctx {
  display: flex; align-items: stretch; gap: 32px;
  width: 100%; height: 100%; min-width: 0;
  font-family: var(--f); font-size: 14px;
}
.dctx-set {
  display: flex; align-items: center; flex: none;
  font-weight: 600; color: var(--ink);
}
a.dctx-set:hover { color: var(--blue); }

.dctx-sections {
  display: flex; align-items: stretch; gap: 24px; min-width: 0;
  overflow-x: auto; scrollbar-width: none;
}
.dctx-sections::-webkit-scrollbar { display: none; }
.dctx-sections a {
  display: flex; align-items: center; flex: none;
  color: var(--ink-2); white-space: nowrap;
  /* The marker sits on the row's bottom hairline, so the current section
     reads as the tab the page hangs from. */
  border-bottom: 2px solid transparent; margin-bottom: -1px;
  transition: color 0.15s, border-color 0.15s;
}
.dctx-sections a:hover { color: var(--ink); }
.dctx-sections a.on { color: var(--ink); border-bottom-color: var(--blue); }

.dctx-version { display: flex; align-items: center; margin: 0 0 0 auto; flex: none; }
/* The picker comes from the template in a monospace chip; in this row it
   takes the row's own type, so the row reads as one line of text. */
.dctx .ls-nav-version,
.dctx .ls-nav-version * { font-family: var(--f); letter-spacing: 0; }

.dctx-pick { display: none; }
.dctx .sr-only {
  position: absolute; width: 1px; height: 1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap;
}

@media (max-width: 640px) {
  .dctx { gap: 14px; }
  .dctx-sections { display: none; }
  .dctx-pick {
    position: relative; display: flex; align-items: center; min-width: 0;
    color: var(--ink);
  }
  /* The set's name and the section read as one path: "Bondy Connect / Reference". */
  .dctx-pick::before { content: '/'; color: var(--ink-3, var(--ink-2)); margin-right: 14px; }
  .dctx-pick select {
    appearance: none; -webkit-appearance: none;
    min-width: 0; max-width: 100%; text-overflow: ellipsis;
    border: 0; background: none; color: inherit;
    font: inherit; padding: 0 18px 0 0; cursor: pointer;
  }
  .dctx-pick svg {
    position: absolute; right: 0; width: 12px; height: 12px;
    pointer-events: none; color: var(--ink-2);
  }
}
</style>
