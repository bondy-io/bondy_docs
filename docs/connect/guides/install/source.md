---
autonumber: true
---
# Install from Source
This guide will show you how to install Bondy from its source.

::: tip
If this is your first time trying Bondy, you might prefer to start with one of our [tutorial examples](/connect/tutorials/getting_started/marketplace). Some of them use Docker Compose so you can start reviewing Bondy without installing it locally.
:::


## Prerequisites

* Operating Systems: macOS (Intel|Apple Silicon) or Linux (AMD64|ARM64)
* [Erlang/OTP](https://www.erlang.org/downloads) 29 or later
* [Rebar3](http://www.rebar3.org/) 3.27.0 or later
* [just](https://just.systems/), the task runner
* A C and C++ toolchain, `cmake` and `git`, to build the native dependencies
* OpenSSL

## Steps

### 1. Building
Clone the repository and cd to the location where you cloned it.

To build a production release tarball, run the following command. It writes the tarball to `_build/prod/rel/bondy-connect/bondy-connect-1.0.0.tar.gz`.

```bash
just release-tar
```

Unpack the tarball in the location where you want to install Bondy, for example `~/tmp/bondy`.

```bash
mkdir -p ~/tmp/bondy
tar -zxvf _build/prod/rel/bondy-connect/bondy-connect-1.0.0.tar.gz -C ~/tmp/bondy
```

### 2. Running

::: warning Set `cluster.enabled = off` to run a single node
Before starting a node meant to run alone, set `cluster.enabled = off` in the release's `etc/bondy.conf`. A node left on the default `cluster.enabled = on` with no other member never compacts its history. Under the default fence policy, it also refuses every authentication once its security tables stay unconfirmed for longer than `db.aae.fence.max_lag`. See [Enabling clustering](/connect/reference/configuration/cluster#enabling-clustering).
:::

To run Bondy, cd to the location where you installed it e.g. ~/tmp/bondy and run the following command which will print all the options.

```bash
bin/bondy-connect
```

For example, to run Bondy with output to stdout do

```bash
bin/bondy-connect foreground
```

And to run Bondy with an interactive Erlang shell do

```bash
bin/bondy-connect console
```
