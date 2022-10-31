# Get Bondy
>There are several ways to get Bondy up and running. The fastest one is using the official Docker images,  but you can also compile Bondy from source depending on your deployment scenarios and needs.{.definition}

## Overview

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

## Installation

:::::: columns 1
::: column 1
### Installing using Docker

:::
::: column 2
### Installing from Source
:::
::::::

:::::: columns 1
:::: column 1
::: big-button https://hub.docker.com/r/leapsight/bondy
Get Docker Image
::::

:::: column 2
::: big-button https://github.com/Leapsight/bondy/tree/develop/deployment
Github Repository
:::
::::
::::::

## Using Docker

### Prerequisites
* Docker

### Steps
You can install and run Bondy by using Docker images from the official [Docker Hub](https://hub.docker.com/r/leapsight/bondy) repository.

::: info Docker Image Sources
The official image source files are available on the Bondy [source code repository](https://github.com/Leapsight/bondy/tree/develop/deployment).
:::

To run an official Bondy Docker image you will use the `docker run` command with an image name using the following syntax: `leapsight/bondy:{VERSION}[-{VARIANT}]` where:

- `{VERSION}` can be `master`, `develop` or a tag like `1.0.0-beta.56`
- `{VARIANT}` can be null or `slim` (we will provide the `alpine` variant in the future).



For example to run the 1.0.0-beta.56 release you would use:

```bash
docker run \
    -p 18080:18080 \
    -p 18081:18081 \
    -p 18082:18082 \
    -p 18086:18086 \
    --name bondy \
    -d leapsight/bondy:1.0.0-beta.56
```



To run the slim variant of the same release you would use:

```bash
docker run \
    -p 18080:18080 \
    -p 18081:18081 \
    -p 18082:18082 \
    -p 18086:18086 \
    --name bondy \
    -d leapsight/bondy:1.0.0-beta.56-slim
```

## Installing using Kubernetes

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

## Installing from Source

### Prerequisites

* Erlang 24 or later
* Rebar3 3.17.0 or later
* openssl
* libssl
* Libsodium
* libsnappy
* liblz4

### Steps

#### Building
Clone the repository and cd to the location where you cloned it.

To generate a Bondy release to be used in production execute the following command which will generate a tarball containing the release at `$(PWD)/_build/prod/rel/`.

```bash
rebar3 as prod tar
```

Untar and copy the resulting tarball to the location where you want to install Bondy e.g. ~/tmp/bondy.

```bash
tar -zxvf _build/prod/rel/bondy-1.0.0-beta.28.tar.qz -C ~/tmp/bondy
```

#### Running
To run Bondy, cd to the location where you installed it e.g. ~/tmp/bondy and run the following command which will print all the options.

```bash
bin/bondy
```

For example, to run Bondy with output to stdout do

```bash
bin/bondy foreground
```

And to run Bondy with an interactive Erlang shell do

```bash
bin/bondy console
```