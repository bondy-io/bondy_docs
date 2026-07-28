// Bondy's site-specific theme layer, built on the shared
// @leapsight/vitepress-theme (layout, nav version picker, Tabs,
// Features, DataTreeView, ZoomImg, SiteMeta, etc.). Only genuinely
// bondy-specific pieces live here — see THEMING.md in the template
// repo for the extension pattern.
import Theme from '@leapsight/vitepress-theme'

// Bondy-specific: a small floating badge (e.g. <Badge text="WIP"/>),
// not part of the shared component set.
import Badge from './Badge.vue'

import './brand.css'

export default {
  extends: Theme,
  enhanceApp({ app }) {
    app.component('Badge', Badge)
  }
}
