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
There are several ways to get Bondy up and running. The fastest one is using the official Docker images,  but you can also compile Bondy from source depending on your deployment scenarios and needs.

## Installation options
Choose what is the best installation option for you.

<Features class="VPHomeFeatures" :features="$frontmatter.features"/>


## Install from Source

Building from source gives you full control over the build — useful if you're contributing to Bondy, need a platform without a Docker image, or want to customize the build. See [Install from Source](/router/guides/install/source) for the full prerequisites and build steps.

## Install using Docker

The fastest way to get a single node running: pull the official image, mount a config directory, and start it. See [Install using Docker](/router/guides/install/docker) for the full walkthrough.

## Install using Kubernetes

For a production, orchestrated deployment: run the same Docker image as a `StatefulSet` behind a headless `Service`, using DNS-based peer discovery to form a cluster automatically as pods come up. See [Install using Kubernetes](/router/guides/install/kubernetes) for a worked example, and [Running a Cluster](/router/guides/deployment/running_a_cluster) for peer discovery in depth.


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

If you want to change those port numbers checkout the [Configuration Reference](/router/reference/configuration/index).

::: warning Notice
The Websocket (WS) listeners at the moment are the same used for HTTP traffic. This will change in future versions.
:::