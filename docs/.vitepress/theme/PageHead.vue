<!-- The strip at the top of every page: where the reader is (the breadcrumb)
     and which release they are reading (the version picker).

     Both describe the page, not the site, so they sit with the page, directly
     above the H1 the breadcrumb exists to explain, rather than in the
     site-wide bar. Rendered by Layout.vue into VitePress's `doc-before` slot
     on doc pages and `page-top` on the portal, so it scrolls with the page at
     every width. -->
<script setup>
import { NavbarVersion } from '@leapsight/vitepress-template/theme'
import Breadcrumb from './Breadcrumb.vue'
</script>

<template>
  <div class="page-head">
    <Breadcrumb />
    <NavbarVersion />
  </div>
</template>

<style>
.page-head {
  display: flex; align-items: flex-start; gap: 24px;
  margin-bottom: 28px; padding-bottom: 14px;
  border-bottom: 1px solid var(--line-2);
}
/* A deep path wraps onto further lines rather than being cut off; the
   version picker stays on the first line, hard right. */
.page-head .crumb {
  display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; min-width: 0;
  line-height: 26px;
}
.page-head .crumb a,
.page-head .crumb span {
  font-family: var(--m); font-size: 13px; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--ink-2); white-space: nowrap;
}
.page-head .crumb a:hover { color: var(--blue); }
.page-head .crumb .sep { opacity: 0.45; }
.page-head .ls-nav-version { margin-left: auto; flex: none; }
</style>
