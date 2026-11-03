---
related:
    - text: Network Listeners
      type: Configuration Reference
      link: /connect/reference/configuration/listeners#identity-and-mount
      description: Configure the network listeners for the HTTP API Gateway.
    - text: Security
      type: Configuration Reference
      link: /connect/reference/configuration/security#authentication-oauth2
      description: Configure OAuth2 authentication for HTTP/REST APIs
    - text: HTTP API Gateway
      type: HTTP API Reference
      link: /connect/reference/http_api/api_gateway
      description: Load and manage API Gateway specifications.
    - text: Marketplace HTTP API Gateway
      type: Tutorial
      link: /connect/tutorials/getting_started/marketplace_api_gateway
      description: A tutorial that demonstrates a simple marketplace with Python microservices and a VueJS Web App.
---
<script setup>
import { useData } from 'vitepress'
const { theme } = useData()
</script>



# Introduction
Bondy HTTP API Gateway is a reverse proxy that lets you manage, configure, and route incoming HTTP requests to your WAMP APIs or to external HTTP/REST APIs. It allows Bondy to be easily integrated into an existing HTTP/REST API ecosystem.


## Overview
Bondy API Gateway is mainly used to expose a WAMP API via an HTTP/REST API. However, it can also target external HTTP/REST APIs i.e. acting as a traditional HTTP API Gateway.

Bondy API Gateway can host one or more HTTP/REST APIs where each API can only be associated with a single [Realm](/connect/concepts/realms).

## Defining an HTTP/REST API

Each API is defined using an [API Gateway Specification](/connect/reference/api_gateway/specification) document, a JSON data structure that _declaratively_ defines how Bondy should handle each HTTP Request e.g. convert into a WAMP operation or forward it to an external HTTP/REST API. This includes capabilities for data transformation.

[API Gateway Specification](/connect/reference/api_gateway/specification) declarations make use of a logic-less [domain-specific language expressions](/connect/reference/api_gateway/expressions) (internally called _"mops"_) for data transformation and dynamic configuration.

## Loading and managing HTTP/REST APIs

You can load, inspect and delete API Specifications using the [Admin HTTP API](/connect/reference/http_api/api_gateway).


::: tip Cluster deployments
Bondy replicates each API specification to every node of the cluster. Each node rebuilds its HTTP routes when a specification changes, so every node serves all the defined APIs. Replication between nodes requires anti-entropy, so [`db.aae`](/connect/reference/configuration/data_storage#db.aae) has to be `on` (the default).
:::

## Next Steps
<Features
    class="VPHomeFeatures"
    :features="theme.sidebar['/connect/reference/api_gateway'][0].items.filter(function(item){return item.isFeature})"/>