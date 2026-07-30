# Configuration Basics
Learn about the Bondy runtime configuration, the Bondy configuration file, its syntax, variable replacement and the required OS-specific configuration.

The complete behaviour of Bondy is defined by the combination of 3 types of "configuration" data:

1. **Bondy node runtime configuration**, which controls things like network listeners, availability of optional services, security defaults, clustering and load regulation. This is mostly **static configuration** done by modifying the `bondy.conf` file and a set of environment variables.
1. **Multi-tenancy security configuration**, which controls the definition of realms and its security including user identities, authentication and authorization policies, Same Sign-on and Single Sign-on. This is done dynamically via the [Admin API](/reference/wamp_api/index). However, it can also be configured via the `bondy.conf` file.
1. **RPC and Pub/Sub configuration**, a.k.a **Control Plane**, which defines the available RPC procedures–their invocation policies e.g. load balancing–and PubSub subscriptions and their respective routing information. This is dynamic configured by clients and maintained in the Registry via [WAMP](/concepts/what_is_wamp).


The following diagram shows the scopes and mechanism for managing each configuration type:

<ZoomImg src="/assets/configuration_scopes.png"/>

::: tip Documentation Scope
This reference documentation covers only the **Bondy node runtime configuration** using environment variables and the `bondy.conf` file.
:::

To learn more about **Multi-tenancy security configuration** check the [WAMP](/reference/wamp_api/index) and [HTTP](/reference/http_api/index) references.

As opposed to other application networking options i.e. Service Mesh, in which services are configured using a proprietary API e.g. Istio APIs and YAML for Kubernetes resources, Bondy **RPC and Pub/Sub configuration** is entirely managed by [WAMP](/concepts/what_is_wamp).


## Bondy environment variables

Bondy will use the following environment variables to configure the node identity and the paths it uses to store data.


|Variable Name|Description|Default|
|---|---|---|
|`BONDY_ERL_NODENAME`|Name of the Bondy node.|`bondy`|
|`BONDY_ERL_DISTRIBUTED_COOKIE`|Erlang distributed cookie to be used to connect a remote shell to a Bondy node|`bondy`|
|`BONDY_ETC_DIR`|The directory where the `bondy.conf` will be located. The host should Bondy executable to READ and WRITE files on this directory|See [File Location](#file-location) section below|
|`BONDY_DATA_DIR`|The directory where Bondy will store its embedded database. Check the relevant requirements in the [Operating System Configuration](#operating-system-configuration) section below|`./data`|
|`BONDY_LOG_DIR`|The directory where Bondy will write any defined logs|`./log`|
|`BONDY_TMP_DIR`|The directory where Bondy will store any temporary data|`./tmp`|

:::info Notice
In previous version of Bondy these options where configured using the `bondy.conf` file but that introduced certain issues with the configuration system.
:::


## The Bondy configuration file
Bondy configuration file, named `bondy.conf`, is used to set a wide variety of **node runtime configuration options**.

During node startup, Bondy will check the existence of the file, parse it and validate its contents. In case of a syntax or validation error, Bondy will stop printing the reason to standard output.

If a configuration file is not found at the [expected location](#file-location), Bondy will create one using default values.


:::danger Cluster deployment
When deploying a Bondy cluster it is vital that the same `bondy.conf` file is used with all nodes.
:::

### File Location
The default file location depends on the installation method you've used as shown in the following table.


|Installation method|Default Location|
|:---|:---|
|Source tarball|`/etc/bondy.conf`|
|[Official Docker image](https://hub.docker.com/r/leapsight/bondy)|`/bondy/etc/bondy.conf`|

The location can be overridden using the `BONDY_ETC_DIR` environment variable.

### File Syntax
The file uses a sysctl-like syntax that looks like this:

```text
# comment
key = value
```

Note that blank lines are ignored, and whitespace before and after a key or value is ignored, although a value can contain whitespace within. Lines which begin with a `#` are considered comments and ignored.

The documentation for each key defines the acceptable datatype and format for each value and the default value (if any).

#### Value Datatypes

The following are the set of acceptable datatypes used in the documentation.

|Type|Description|Example|
|---|---|---|
|`string()`|Any string. Although each token might add specific formatting rules via the documentation| `100`|
|`integer()`|An integer| `100`|
|`bytesize()`|Work pretty much like duration but with three differences.<br>The units are `MB`, `KB` and `GB`<br>If not unit is specified, the value defaults to bytes<br>You can only use one unit.<br> Lowercase units (i.e. `gb`, `mb`, and `kb`) are ok, but mixed case are not. That's to avoid confusion with Megabits|`1KB`|
|`flag()`|Equivalent to a boolean value| `on` \| `off`|
|`time_duration_units()`|Durations are fixed intervals of time, the largest unit of which will be a one week. Anything larger will have to be expressed in terms of weeks, since larger units (month, year) are of variable duration. The following units are supported:<br>- `f`: fortnight<br>- `w`: week<br>- `d`: day<br>- `h`: hour<br>- `m`: minute<br>- `s`: second<br>- `ms`: millisecond<br>You can use any combination of these. | `1w2d`|
|`ip()`|The IP datatype exists currently as an IP/Port combo|`127.0.0.1:8098`|
|`path()`|file and directory are effectively strings. In the future they could allow for included validators like valid path and exists. Some files may need to exist, some may not. some may need to be writable.|`$(platform_etc_dir)/`<br>`cacert.pem`|


#### Example

```text [bondy.conf]
nodename = bondy@127.0.0.1
distributed_cookie = bondy
security.allow_anonymous_user = off
```


### Default values
For every option not provided by your configuration, Bondy might define a default value (check the default value for each key in each Configuration Reference section).

:::info How options and their defaults are documented

Take the following snippet of the [Node section](/reference/configuration/node.html#node-identity) as an example.

@[config](nodename,string,'bondy@127.0.0.1',v0.1.0)

<br>It defines the token `nodename` which takes a `string` value and defaults to `bondy@127.0.0.1`. Notice the documentation will further specify which strings are acceptable.
:::

:::tip
Start a Bondy node without providing a configuration file and inspect the one generated by Bondy once the node has started. Bondy would have created the file using the default values. You can copy this file and use it as template to make your modifications.

When you are done copy your modified file to the [expected location](#file-location) and start Bondy again.
:::


### Variable Substitution
Within the `bondy.conf` file you can use the following variables which Bondy will substitute before running.

- `platform_etc_dir`

The following is an example of how to use variable substitution.


```text [bondy.conf]
broker_bridge.config_file = $(platform_etc_dir)/bb_conf.json
```

## User environment variable substitution

If you want to use environment variables in the `bondy.conf` you have to rename the file to `bondy.conf.template`.

During startup, Bondy considers all files with suffix `.template` for OS variable substitution and if successful results in a new file of the same name stripped of the `.template` suffix and where all environment variables have been replaced.

The syntax for environment variables is `${VAR_NAME}`.

Notice the `BONDY_*` variables mentioned above will always be used by Bondy.

#### Example


```text [bondy.conf.template]
nodename = ${BONDY_NODENAME}
distributed_cookie = bondy
security.allow_anonymous_user = off
security.config_file = ${BONDY_SECURITY_CONF_FILE}
```

## Operating System Configuration

### Open file limits

Bondy can accumulate a large number of open file handles during operation — the storage backend's periodic merges of data files are normal and expected. Raise your system's open-file limit to accommodate this: see [How to Raise Bondy's Open File Limit](/guides/administration/raising_open_file_limits) for the OS-specific steps.

