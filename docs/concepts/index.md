<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

const { theme } = useData()
</script>

# Concepts
> Learn about Bondy key concepts and topics.{.definition}


## Multi-tenant Security

<Features
    class="VPHomeFeatures"
    :features="theme.sidebar['/concepts/'][1].items.filter(function(item){return item.isFeature})"/>
