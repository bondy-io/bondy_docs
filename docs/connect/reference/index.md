<script setup>
import { useData } from 'vitepress'
import slugify from '@sindresorhus/slugify'

const { theme } = useData()
const featured = (section) => section.items.filter((item) => item.isFeature)
</script>

# Reference

Material to consult while working, not to read start to end. If you are new to Bondy, start with [Concepts](/connect/concepts/index): this section assumes you already know what you are looking for.

<div v-for="section in theme.sidebar['/connect/reference'].filter((s) => featured(s).length > 0)">
    <h2 v-bind:id="slugify(section.text)" tab-index="-1">
        {{section.text}}
        <a class="header-anchor" v-bind:id="slugify(section.text)" aria-hidden="true">#</a>
    </h2>
    <p>{{section.description}}</p>
    <Features class="VPHomeFeatures" :features="featured(section)"/>
</div>
