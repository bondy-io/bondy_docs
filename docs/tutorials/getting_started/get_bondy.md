---
draft: true
features:
  - text: Install from Source
    link: '#install-from-source'
    description: Build and install Bondy from source.
  - text: Install using Docker
    link: '#install-using-docker'
    description: Use the official docker image
  - text: Install using Kubernetes
    link: '#install-using-kubernetes'
    description: See a starter manifest recipe and taylor it based on your needs.

---

# Get Bondy
>There are several ways to get Bondy up and running. The fastest one is using the official Docker images,  but you can also compile Bondy from source depending on your deployment scenarios and needs.{.definition}

## Installation options
Choose what is the best installation option for you.

<Features class="VPHomeFeatures" :features="$frontmatter.features"/>


## Install from Source

## Install using Docker

## Install using Kubernetes

### Prerequisites
* Docker
* Kubernetes

### Steps
Bondy provides a Peer Discovery feature which enables a Bondy node to discover other nodes using a defined discovery type and form a cluster automatically. This is very handy when deploying using orchestration technologies like Kubernetes.

Check this [example K8s manifest](https://gitlab.com/leapsight/bondy_kubernetes).

In the example `bondy.conf` file you will find the following snippet that enables Peer Discovery and uses `bondy_peer_discovery_dns_agent` as type.

```
cluster.parallelism = 2
cluster.peer_port = ${BONDY_CLUSTER_PEER_PORT}
cluster.peer_discovery.enabled = on
cluster.peer_discovery.automatic_join = on
cluster.peer_discovery.polling_interval = 10s
cluster.peer_discovery.timeout = 5s
cluster.peer_discovery.type = bondy_peer_discovery_dns_agent
cluster.peer_discovery.config.service_name = ${BONDY_SERVICE_NAME}
cluster.tls.enabled = off
```

For more information about this options check the [Complete Configuration Reference]() section.


## Default Port Numbers

Regardless of the installation method, Bondy exposes the following ports by default:

|Listener|Port|
|:---|---|
|WAMP WS|`18080`|
|WAMP WSS|`18083`|
|WAMP RAW SOCKET TCP|`18082`|
|WAMP RAW SOCKET TLS|`18085`|
|API GATEWAY HTTP|`18080`|
|API GATEWAY HTTPS|`18083`|
|ADMIN API HTTP|`18081`|
|ADMIN API HTTPS|`18084`|
|CLUSTER PEER SERVICE|`18086`|

If you want to change those port numbers checkout the [Configuration Reference](/reference/configuration/index).

::: warning Notice
The Websocket (WS) listeners at the moment are the same used for HTTP traffic. This will change in future versions.
:::