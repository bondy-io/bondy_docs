<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

const { theme } = useData()
</script>

DRAFT{.watermark}
# Introduction

> Bondy povides an HTTP API Gateway that exposes some of the WAMP Admin and Meta APIs via HTTP.

In Bondy, a Realm and all its entities are dynamically managed using a WAMP API. Some additional resource in Bondy can also be managed via the WAMP API.

Bondy Admin procedures and events URIs start with the `bondy.` prefix, whereas the WAMP Meta procedures and events start with the `wamp.` prefix.


## Entities and Resources
The following is a catalogue of APIs organised by entity/resource

<Features
    class="VPHomeFeatures"
    :features="theme.sidebar['/reference/http_api'][0].items.filter(function(item){return item.isFeature})"/>
