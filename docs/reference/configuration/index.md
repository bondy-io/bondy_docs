<script setup>
import { useData } from 'vitepress'
const { theme } = useData()
</script>


# Overview
> Learn how to configure Bondy to match your particular needs. The following reference material covers evertyhing from single node to multi-node cluster deployments.{.definition}



<div v-for="section in theme.sidebar['/reference/configuration']">
    <h2 v-if="section.items.filter(function(item){return item.isFeature}).length > 0">{{section.text}}</h2>
    <Features class="VPHomeFeatures" :features="section.items.filter(function(item){return item.isFeature})"/>
</div>