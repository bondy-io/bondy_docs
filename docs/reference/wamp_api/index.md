<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

const { theme } = useData()
</script>


# Introduction

> Bondy enables the monitoring of administrative operations via WAMP Events and the management of dynamic resources via WAMP Procedures. These events and procedures include the ones defined by the [WAMP](/concepts/wamp/introduction) Meta API.

In Bondy, a Realm and all its entities are dynamically managed using a WAMP API. Some additional resource in Bondy can also be managed via the WAMP API.

Bondy Admin procedures and events URIs start with the `bondy.` prefix, whereas the WAMP Meta procedures and events start with the `wamp.` prefix.

::: info HTTP API
Bondy also offers equivalent HTTP APIs for most of the entities in the WAMP API.
:::

## Entities and Resources
The following is a catalogue of APIs organised by entity/resource

<Features
    class="VPHomeFeatures"
    :features="theme.sidebar['/reference/wamp_api'][0].items.filter(function(item){return item.isFeature})"/>
