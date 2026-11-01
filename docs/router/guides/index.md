<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'
import slugify from '@sindresorhus/slugify'
const { theme } = useData()
</script>

# How-to Guides
Steps for a task you already understand. The guides follow the life of an application: building components that use Bondy, securing who can connect and what they can reach, then installing, configuring, deploying and administering the nodes they run on.

<div v-for="section in theme.sidebar['/router/guides/']">
    <h2 v-bind:id="slugify(section.text)" tab-index="-1" v-if="section.items.filter(function(item){return item.isFeature}).length > 0">
        {{section.text}}
        <a class="header-anchor" v-bind:id="slugify(section.text)" aria-hidden="true">#</a>
    </h2>
    <p>{{section.description}}</p>
    <Features class="VPHomeFeatures" :features="section.items.filter(function(item){return item.isFeature})"/>
</div>