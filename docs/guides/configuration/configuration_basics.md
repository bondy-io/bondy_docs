# Configuration Basics

## The `bondy.conf` file
Bondy configuration file is used to set a wide variety of *static configuration options*. The file location depends on the installation method you've used as shown in the following table.

|Installation method|Location|
|:---|:---|
|Source tarball|`/etc/bondy.conf`|
|Docker image|`/bondy/etc/bondy.conf`|


### Syntax
The file uses a sysctl-like syntax that looks like this:

```text
nodename = bondy@127.0.0.1
distributed_cookie = bondy
security.allow_anonymous_user = off
```

::: warning Notice
Notice that for every option not provided by your configuration, Bondy will define a default value (also specified in the following sections).
:::


### Variable replacement

Within the `bondy.conf` file you can use the following variables which Bondy will substitute before running.

- `platform_etc_dir`

The following is an example of how to use variable substitution.

```
broker_bridge.config_file = $(platform_etc_dir)/broker_bridge_config.json
```

::: warning Notice
These mechanism cannot be used to do OS environment variables substitution.
However, Bondy provides a tool for OS variable substitution that is automatically used by the Bondy Docker image start script. To understand how to use OS environment variables substitution in Docker read [this](https://www.notion.so/Installing-Bondy-ae4e908297e44a02a82f1d4b7e7ff0b4) section, otherwise take a look at how the `start.sh` script uses it in the official docker images.
:::

### Feature-specific configuration files

Some features and/or subsystems in Bondy allow providing an additional JSON configuration file e.g. the Security subsystem.

In those cases, we need to let Bondy know where to find those specific files. This is done in the `bondy.conf` under the desired section e.g. the following configuration file adds the location for the `security_conf.json` file.

```
nodename = bondy@127.0.0.1
distributed_cookie = bondy
security.allow_anonymous_user = off
security.config_file = /bondy/etc/security_conf.json
```

## Environment variables

## Operating System Configuration

### Configuring Open File Limits

Bondy can accumulate a large number of open file handles during operation. The creation of numerous data files is normal, and the storage backend performs periodic merges of data file collections to avoid accumulating file handles.

To accommodate this you should increase the open files limit on your system. We recommend setting a soft limit of `65536`` and a hard limit of `200000``.

Most operating systems can check and change the open-files limit for the current shell session using the `ulimit`command.

Start by checking the current open file limit values with:

```bash
ulimit -Hn # Hard limit
ulimit -Sn # Soft limit
```

Set the limit by using:

```bash
ulimit -n 200000
```

This configuration persists only for the duration of your shell session. To change the limit on a system-wide, permanent basis read the following sections.

::: details Open file limits on Linux
On most Linux distributions, the total limit for open files is controlled by `sysctl`.

If you installed Bondy from a binary package, you will need to the add the following settings to the `/etc/security/limits.conf` file for the `bondy` user:

```bash
bondy soft nofile 65536
bondy hard nofile 200000
```
:::


::: details Open file limits on Debian and Ubuntu using PAM

You can enable PAM-based user limits so that non-root users, such as the `bondy` user, may specify a higher value for maximum open files.

Edit `/etc/pam.d/common-session` and add the following line:

```bash
session required pam_limits.so
```

Save and close the file.
If `/etc/pam.d/common-session-noninteractive` exists, append the same line as above.

Then, edit `/etc/security/limits.conf` and append the following lines to the file:

```bash
soft nofile 65536
hard nofile 200000
```

Save and close the file.

(Optional) If you will be accessing the Bondy nodes via secure shell (SSH), you should also edit `/etc/ssh/sshd_config` and set the following line:

```
UseLogin yes
```



Restart the machine so the limits take effect and verify that the new limits are set with the following command:

```bash
ulimit -a
```
:::

::: details Open file limits on Docker running on K8s
Docker ulimits limit a program's resource utilization to prevent a run-away bug or security breach from bringing the whole system down.

The instructions below describe how to check what your current value is, and then increase it to allow Bondy to run.

**To increase the ulimit value:**

1. Connect to the desired worker node and execute the following command:

```bash
systemctl show docker
```

1. Search for NOFILE.
2. If the output is “1024”, edit the file:

```bash
/etc/sysconfig/docker
```

and replace the line:

```bash
OPTIONS=" — default-ulimit nofile=1024:4096"
```

with:

```bash
OPTIONS="--default-ulimit nofile=2000000:2000000"
```

1. Restart the Docker daemon

```bash
sudo systemctl restart docker
```
:::

::: details Open file limits on DockerUser
Use docker run `--ulimit`

```bash
$ docker run --ulimit nofile=2000000:2000000
```
:::