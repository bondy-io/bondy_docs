<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

const { theme } = useData()

</script>


# Introduction
> Bondy enables the monitoring of certain administrative operations via WAMP Events and the management of certain resources via WAMP Procedures. These events and procedures include the ones defined by the [WAMP](/concepts/wamp/introduction) Meta API.

## Bondy Admin API
<Features
    class="VPHomeFeatures"
    :features="theme.sidebar['/reference/wamp_api'][1].items.filter(function(item){return item.isFeature})"/>

## WAMP Meta API
<Features
    class="VPHomeFeatures"
    :features="theme.sidebar['/reference/wamp_api'][2].items.filter(function(item){return item.isFeature})"/>