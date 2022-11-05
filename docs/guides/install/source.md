# Install from Source
> This guide will show you how to install Bondy from its source.{.definition}

::: tip
If this is your first time trying Bondy, you might prefer to start with one of our [tutorial examples](/tutorials/getting_started/index).
:::


## Prerequisites

* macOS or Linux
* Erlang 24 or later
* Rebar3 3.17.0 or later
* openssl
* libssl
* Libsodium
* libsnappy
* liblz4

## Steps

### Building
Clone the repository and cd to the location where you cloned it.

To generate a Bondy release to be used in production execute the following command which will generate a tarball containing the release at `$(PWD)/_build/prod/rel/`.

```bash
rebar3 as prod tar
```

Untar and copy the resulting tarball to the location where you want to install Bondy e.g. ~/tmp/bondy.

```bash
tar -zxvf _build/prod/rel/bondy-1.0.0-beta.28.tar.qz -C ~/tmp/bondy
```

### Running
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
