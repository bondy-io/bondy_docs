<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

const { theme } = useData()
</script>


# Introduction

> Bondy enables the monitoring of administrative operations via WAMP Events and the management of dynamic resources via WAMP Procedures. These events and procedures include the ones defined by the [WAMP](/concepts/wamp/introduction) Meta API.{.definition}

In Bondy, a Realm and all its entities are dynamically managed using the WAMP Admin API.

Bondy Admin procedures and events URIs start with the reserved `bondy.` prefix, whereas the WAMP Meta procedures and events start with the reserved `wamp.` prefix e.g. `bondy.user.add` and `wamp.session.get`.

::: info HTTP API
Bondy also offers equivalent HTTP APIs for most of the entities in the WAMP API, this is done by the HTTP API Gateway.
:::

## Entities and Resources
The following is a catalogue of APIs organised by entity/resource

<Features
    class="VPHomeFeatures"
    :features="theme.sidebar['/reference/wamp_api'][0].items.filter(function(item){return item.isFeature})"/>
