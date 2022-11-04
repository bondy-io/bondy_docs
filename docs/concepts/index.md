<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

const { theme } = useData()
</script>

# Concepts
> Learn about Bondy, what is it, what problems solve, how it works and how it compares with the alternatives. Explore Bondy's key features and architecture.{.definition}

<div v-for="section in theme.sidebar['/concepts/']">
    <h2 v-if="section.items.filter(function(item){return item.isFeature}).length > 0">{{section.text}}</h2>
    <p>{{section.description}}</p>
    <Features class="VPHomeFeatures" :features="section.items.filter(function(item){return item.isFeature})"/>
</div>
