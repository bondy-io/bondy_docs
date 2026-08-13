// Bondy documentation theme.
//
//   @leapsight/vitepress-template  the doc-site toolkit: Layout, Tabs,
//                                  Features, ZoomImg, NavbarVersion, ...
//   @bondy/site-chrome             the Bondy chrome: top bar, footer and
//                                  palette shared with bondy.io and the
//                                  Bondy Language docs
//
// Only genuinely bondy_docs-specific pieces live here.
import Theme from '@leapsight/vitepress-template/theme'
import '@bondy/site-chrome/styles/chrome.css'

// Swaps in the shared chrome around the template's Layout.
import Layout from './Layout.vue'

// Bondy-specific: a small floating badge (e.g. <Badge text="WIP"/>),
// not part of the shared component set.
import Badge from './Badge.vue'

// The Diataxis directory for the router docs, used by docs/router.md.
import DocsHome from './DocsHome.vue'

// The portal index (developer.bondy.io/), used by docs/index.md.
import DocsPortal from './DocsPortal.vue'

import './docs-home.css'
import './brand.css'

export default {
  extends: Theme,
  Layout,
  enhanceApp({ app }) {
    app.component('Badge', Badge)
    app.component('DocsHome', DocsHome)
    app.component('DocsPortal', DocsPortal)
  }
}
