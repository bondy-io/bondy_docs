---
related:
    - type: concepts
      text: Introduction to WAMP
      link: /concepts/wamp/introduction
      description: 'Learn the WAMP basics including how to establish a session and use RPC and Publish/Subscribe.'
---

<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

const { theme } = useData()
</script>


# Introduction
Bondy can be configured, managed and monitored via WAMP Procedures and Events. These events and procedures include the ones defined by the WAMP Meta API specification.

In Bondy, a Realm and all its entities are dynamically configured using the WAMP Admin API, these are procedures and events URIs that start with the reserved `bondy.` prefix e.g. `bondy.user.add`.

Additionally, Bondy offers WAMP Meta procedures and events (as defined by the WAMP Specification) which start with the reserved `wamp.` prefix e.g. `wamp.session.get`.

::: details Context Diagram
The following diagram shows how the WAMP APIs described in this reference fit within the overall configuration and management landscape:

<ZoomImg src="/assets/configuration_scopes.png"/>
:::

::: tip HTTP API
Bondy also offers equivalent [HTTP APIs](/reference/http_api/index) for most of the entities in the WAMP API, this is implemented by the HTTP API Gateway.
:::

## Services
The following is a catalogue of APIs organised by service. Each service provides APIs to manage (or get information about) an Entity or Feature.

<Features
    class="VPHomeFeatures"
    :features="theme.sidebar['/reference/wamp_api'][0].items.filter(function(item){return item.isFeature})"/>
