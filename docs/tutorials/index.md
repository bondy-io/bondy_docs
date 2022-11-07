---
draft: true
---
<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'
import slugify from '@sindresorhus/slugify'
const { theme } = useData()
</script>

# Tutorials
A hands-on introduction to Bondy for developers and devops engineers through a series of tutorials.

<div v-for="section in theme.sidebar['/tutorials/']">
    <h2 v-bind:id="slugify(section.text)" tab-index="-1" v-if="section.items.filter(function(item){return item.isFeature}).length > 0">
        {{section.text}}
        <a class="header-anchor" v-bind:id="slugify(section.text)" aria-hidden="true">#</a>
    </h2>
    <p>{{section.description}}</p>
    <Features class="VPHomeFeatures" :features="section.items.filter(function(item){return item.isFeature})"/>
</div>