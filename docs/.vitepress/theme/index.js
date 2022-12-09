// Vitepress
import DefaultTheme from 'vitepress/theme'
import {VPHomeHero} from 'vitepress/theme'

// Custom Layout
import BondyLayout from './BondyLayout.vue'

// Components
import DataTreeView from './DataTreeView.vue'
import ZoomImg from './ZoomImg.vue'
import Features from './Features.vue'
import Badge from './Badge.vue'
import Tabs from './Tabs.vue'
import Tab from './Tab.vue'

import './custom.css'

export default {
    ...DefaultTheme,

    // override the Layout with a wrapper component that
    // injects the slots
    Layout: BondyLayout,
    enhanceApp({ app }) {
        app.component('VPHomeHero', VPHomeHero)
        app.component('Badge', Badge)
        app.component('Tab', Tab)
        app.component('Tabs', Tabs)
        app.component('DataTreeView', DataTreeView)
        app.component('ZoomImg', ZoomImg)
        app.component('Features', Features)
    }
}
