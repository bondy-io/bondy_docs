import DefaultTheme from 'vitepress/theme'
import MyLayout from './MyLayout.vue'
import DataTreeView from './DataTreeView.vue'
import ZoomImg from './ZoomImg.vue'
import Features from './Features.vue'
import {Tabs, Tab} from 'vue3-tabs-component';

import './custom.css'

export default {
    ...DefaultTheme,
    Layout: MyLayout,
    enhanceApp({ app }) {
        app.component('Tab', Tab)
        app.component('Tabs', Tabs)
        app.component('DataTreeView', DataTreeView)
        app.component('ZoomImg', ZoomImg)
        app.component('Features', Features)
    }
}
