<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

const { theme } = useData()
</script>


# Introduction

> Bondy enables the monitoring of certain administrative operations via WAMP Events and the management of certain resources via WAMP Procedures. These events and procedures include the ones defined by the [WAMP](/concepts/wamp/introduction) Meta API.

Bondy Admin procedures and events URIs start with the `bondy.` prefix, whereas the WAMP Meta procedures and events start with the `wamp.` prefix.

## Bondy Admin API

<Features
    class="VPHomeFeatures"
    :features="theme.sidebar['/reference/wamp_api'][0].items.filter(function(item){return item.isFeature})"/>
