import DefaultTheme from 'vitepress/theme'
import DataTreeView from './DataTreeView.vue'
import ZoomImg from './ZoomImg.vue'
import Features from './Features.vue'
import {Tabs, Tab} from 'vue3-tabs-component';
import './custom.css'

export default {
    ...DefaultTheme,
    enhanceApp({ app }) {
        app.component('Tabs', Tabs)
        app.component('DataTreeView', DataTreeView)
        app.component('ZoomImg', ZoomImg)
        app.component('Features', Features)
    }
}
