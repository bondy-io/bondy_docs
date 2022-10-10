import DefaultTheme from 'vitepress/theme'
import BondyLayout from './BondyLayout.vue'
import {VPHomeHero} from 'vitepress/theme'
import DataTreeView from './DataTreeView.vue'
import ZoomImg from './ZoomImg.vue'
import Features from './Features.vue'
import {Tabs, Tab} from 'vue3-tabs-component';
import './custom.css'
// import './custom_home.css'

export default {
    ...DefaultTheme,
    // override the Layout with a wrapper component that
    // injects the slots
    Layout: BondyLayout,
    enhanceApp({ app }) {
        app.component('VPHomeHero', VPHomeHero)
        app.component('Tab', Tab)
        app.component('Tabs', Tabs)
        app.component('DataTreeView', DataTreeView)
        app.component('ZoomImg', ZoomImg)
        app.component('Features', Features)
    }
}
