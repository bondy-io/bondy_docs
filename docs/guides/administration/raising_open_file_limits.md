---
related:
    - text: Configuration Basics
      type: Guide
      link: /guides/configuration/configuration_basics
      description: Locating and writing bondy.conf, datatypes, defaults, and variable substitution.
---
# How to Raise Bondy's Open File Limit

Bondy can accumulate a large number of open file handles during operation — the storage backend's periodic merges of data files are normal and expected, but they mean a low open-files limit will eventually block Bondy from creating new files it needs.

**Prerequisites:** shell access to the host or container running Bondy, with permission to change system limits (root, or `sudo`, for a permanent change).

## Steps

1. **Check the current limit.**

   ```bash
   ulimit -Hn # Hard limit
   ulimit -Sn # Soft limit
   ```

2. **Raise it for the current shell session.**

   ```bash
   ulimit -n 200000
   ```

   ::: warning
   This only lasts for the current shell session. To make the change permanent, follow the OS-specific steps below.
   :::

3. **Make the change permanent**, following whichever of these matches your deployment:

<tabs cache-lifetime="1000">
<tab name="Linux">

On most Linux distributions, the total limit for open files is controlled by `sysctl`.

If you installed Bondy from a binary package, add the following settings to the `/etc/security/limits.conf` file for the `bondy` user:

```bash
bondy soft nofile 65536
bondy hard nofile 200000
```

</tab>

<tab name="Debian and Ubuntu using PAM">

Enable PAM-based user limits so that non-root users, such as the `bondy` user, may specify a higher value for maximum open files.

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

(Optional) If you will be accessing the Bondy nodes via secure shell (SSH), also edit `/etc/ssh/sshd_config` and set the following line:

```
UseLogin yes
```

Restart the machine so the limits take effect and verify the new limits are set:

```bash
ulimit -a
```
</tab>

<tab name="Docker running on Kubernetes">

Docker's own ulimit caps a container's resource use, independently of the guest OS limits above.

1. Connect to the desired worker node and check the current value:

```bash
systemctl show docker
```

Look for `NOFILE` in the output.

2. If it shows `1024`, edit `/etc/sysconfig/docker` and replace:

```bash
OPTIONS="--default-ulimit nofile=1024:4096"
```

with:

```bash
OPTIONS="--default-ulimit nofile=2000000:2000000"
```

3. Restart the Docker daemon:

```bash
sudo systemctl restart docker
```
</tab>

<tab name="Docker (standalone)">

Set the ulimit directly on `docker run`:

```bash
docker run --ulimit nofile=2000000:2000000 ...
```
</tab>
</tabs>

## Result

Bondy's process can hold open a soft limit of `65536` files and a hard limit of `200000`, surviving both a shell restart and (where configured) a Docker daemon or container restart. Confirm with `ulimit -a` (or, for a running Bondy process, by inspecting `/proc/<pid>/limits` on Linux).

## See also

- [Configuration Basics](/guides/configuration/configuration_basics) — locating and writing `bondy.conf`.
