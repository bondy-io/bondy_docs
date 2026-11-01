---
related:
    - type: concepts
      text: Introduction to WAMP
      link: /router/concepts/wamp/introduction
      description: 'Learn the WAMP basics including how to establish a session and use RPC and Publish/Subscribe.'
---

<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

const { theme } = useData()
</script>


# WAMP API
Bondy can be configured, managed and monitored via WAMP Procedures and Events. These events and procedures include the ones defined by the WAMP Meta API specification.

In Bondy, a Realm and all its entities are dynamically configured using the WAMP Admin API, these are procedures and events URIs that start with the reserved `bondy.` prefix e.g. `bondy.user.add`.

Additionally, Bondy offers WAMP Meta procedures and events (as defined by the WAMP Specification) which start with the reserved `wamp.` prefix e.g. `wamp.session.get`.

::: details Context Diagram
The following diagram shows how the WAMP APIs described in this reference fit within the overall configuration and management landscape:

<ZoomImg src="/assets/configuration_scopes.png"/>
:::

::: tip HTTP/REST API
Bondy also offers equivalent [HTTP APIs](/router/reference/http_api/index) for most of the entities in the WAMP API. The `admin_api` service serves them.
:::

## Services
The following is a catalogue of APIs organised by service. Each service provides APIs to manage (or get information about) an Entity or Feature.

<div v-for="section in theme.sidebar['/router/reference/wamp_api']">
    <h3 v-if="section.items.filter(function(item){return item.isFeature}).length > 0">{{section.text}}</h3>
    <Features
        class="VPHomeFeatures"
        :features="section.items.filter(function(item){return item.isFeature})"/>
</div>

## Utility Procedures

A small number of procedures don't belong to any single entity or feature.

##### bondy.ping() -> "pong" {.wamp-procedure}
A liveness check. It returns the string `"pong"` in any realm. Like every call, it needs the `wamp.call` permission on `bondy.ping` when the realm has security enabled.

## Listener Procedures

These two procedures take a node out of rotation and put it back, without a restart or a configuration change. Both are master realm only: a call from any other realm fails with `wamp.error.not_authorized`. Neither procedure stops a listener or closes an established connection. A suspended listener stops accepting new connections, so the node drains as its sessions end.

Each procedure takes one positional argument, a listener **phase**:

| Phase | Listeners |
|---|---|
| `early` | The listeners whose [`start_phase`](/router/reference/configuration/listeners#listeners.$name.start_phase) is `early`. The reserved `admin` listener is one of them, and it carries the liveness and readiness probes. |
| `normal` | The listeners whose `start_phase` is `normal`. |
| `all` | Both of the above. |

Suspending `early` or `all` can also take down liveness and readiness. An orchestrator that probes them can then read the node as dead and kill it.

Both procedures support `dry_run: true` as a keyword argument. A dry run changes nothing. Its result carries `dry_run` (`true`), `would`, `phase` and `listeners`, the names of the listeners in the phase. No other procedure reports listener state.

##### bondy.listener.suspend(phase) {.wamp-procedure}
Stops the listeners of `phase` accepting new connections. The result carries no arguments. Bondy logs a notice for each call.

##### bondy.listener.resume(phase) {.wamp-procedure}
Makes the listeners of `phase` accept new connections again. The result carries no arguments. Bondy logs a notice for each call.

Both procedures raise `wamp.error.invalid_argument` when `phase` is not `early`, `normal` or `all`.

The [task catalogue](/router/reference/wamp_api/task) grades both procedures. See [Network Listeners](/router/reference/configuration/listeners) for the listener configuration.

::: tip Metrics are not part of the WAMP API
Bondy exposes its metrics over the Prometheus protocol, not over WAMP. See the [Prometheus Metrics Reference](/router/reference/metrics) for the catalogue and the `/metrics` endpoint.
:::
