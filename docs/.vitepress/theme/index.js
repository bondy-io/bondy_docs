import DefaultTheme from 'vitepress/theme'
import MyLayout from './MyLayout.vue'
import DataTreeView from './DataTreeView.vue'
import ZoomImg from './ZoomImg.vue'
import Features from './Features.vue'

import './custom.css'

export default {
    ...DefaultTheme,
    Layout: MyLayout,
    enhanceApp({ app }) {
        app.component('DataTreeView', DataTreeView)
        app.component('ZoomImg', ZoomImg)
        app.component('Features', Features)
    }
}
