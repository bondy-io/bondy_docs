---
draft: true
---
<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

const { theme } = useData()
</script>

# Introduction
Bondy can be configured, managed and monitored via an HTTP API that exposes some of the  Procedures and Events found in the WAMP API.


## Entities and Resources
The following is a catalogue of APIs organised by entity/resource

<Features
    class="VPHomeFeatures"
    :features="theme.sidebar['/reference/http_api'][0].items.filter(function(item){return item.isFeature})"/>
