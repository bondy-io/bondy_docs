import DefaultTheme from 'vitepress/theme'
import './custom.css'
import MyLayout from './MyLayout.vue'
import DataTreeView from './DataTreeView.vue'
// import TreeView from "@grapoza/vue-tree"


export default {
    ...DefaultTheme,
    Layout: MyLayout,
    enhanceApp({ app }) {
        app.component('DataTreeView', DataTreeView)
    }
}
