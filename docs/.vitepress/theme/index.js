import DefaultTheme from 'vitepress/theme'
import './custom.css'
import MyLayout from './MyLayout.vue'


export default {
    ...DefaultTheme,
    Layout: MyLayout
}