<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

const { theme } = useData()
</script>

# Concepts
> Learn about Bondy key concepts and topics.{.definition}

<div v-for="section in theme.sidebar['/concepts/']">
    <h2 v-if="section.items.filter(function(item){return item.isFeature}).length > 0">{{section.text}}</h2>
    <Features class="VPHomeFeatures" :features="section.items.filter(function(item){return item.isFeature})"/>
</div>
