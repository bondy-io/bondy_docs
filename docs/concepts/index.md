<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'
import slugify from '@sindresorhus/slugify'

const { theme } = useData()
</script>

# Concepts
Learn about Bondy, what is it, what problems does it solve, how it works and how it compares with the alternatives. Explore Bondy's key features and architecture.

<div v-for="section in theme.sidebar['/concepts/']">
    <h2 v-bind:id="slugify(section.text)" tab-index="-1" v-if="section.items.filter(function(item){return item.isFeature}).length > 0">
        {{section.text}}
        <a class="header-anchor" v-bind:id="slugify(section.text)" aria-hidden="true">#</a>
    </h2>
    <p>{{section.description}}</p>
    <Features class="VPHomeFeatures" :features="section.items.filter(function(item){return item.isFeature})"/>
</div>
