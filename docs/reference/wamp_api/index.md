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

::: tip HTTP/REST API
Bondy also offers equivalent [HTTP APIs](/reference/http_api/index) for most of the entities in the WAMP API, this is implemented by the HTTP API Gateway.
:::

## Services
The following is a catalogue of APIs organised by service. Each service provides APIs to manage (or get information about) an Entity or Feature.

<Features
    class="VPHomeFeatures"
    :features="theme.sidebar['/reference/wamp_api'][0].items.filter(function(item){return item.isFeature})"/>

## Utility Procedures

A small number of procedures don't belong to any single entity or feature.

##### bondy.ping() -> "pong" {.wamp-procedure}
A liveness check: always succeeds and returns the string `"pong"`, regardless of the caller's realm, authentication, or permissions — there is nothing to configure and no error it can raise.

##### bondy.telemetry.metrics {.wamp-procedure}
Reserved, not implemented — calling it raises `wamp.error.no_such_procedure`. Bondy's actual metrics are exposed over Prometheus's own protocol, not WAMP; see the [Prometheus Metrics Reference](/reference/metrics) for the full catalogue and the `/metrics` endpoint it's served from.
