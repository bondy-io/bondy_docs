<script setup>
import { useData } from 'vitepress';

const { theme } = useData();
const bondyVersion = theme.value.metadata.bondyVersion;
</script>

# Install using Docker
This guide provides steps to install and configure Bondy on Docker using the official Docker images.

::: tip Using your own image instead

If you want to build and use your own Docker image, make sure you check the official images sources first as you might want to use them as your template.

These are located at the Bondy's Github repository under the ["deployment" directory](https://github.com/bondy-io/bondy-connect/tree/develop/deployment).
:::

The images include the Erlang runtime they were built with, so the host needs no Erlang. `deployment/Dockerfile` builds on Erlang/OTP 29.1.2 and runs on Debian trixie (slim); `deployment/alpine.Dockerfile` builds on Erlang/OTP 29.1.2 and runs on Alpine 3.24.2.

## Prerequisites
* A Docker-enabled system with proper Docker access

## Steps    

### 1. Setup directory

Bondy needs access to a configuration file and the ability to store its embedded database. Choose a directory (or create one) e.g. `bondy-docker` and define it as `BONDY_HOME`.

```bash
BONDY_HOME=~/bondy-docker
```

Create the `etc` and `data` directories within your chosen directory.

```bash
mkdir -p ${BONDY_HOME}/etc
mkdir -p ${BONDY_HOME}/data
```

The `etc` directory will be used by you to store Bondy's configuration, while the `data` directory will be used by Bondy to store its embedded database files.

### 2. Prepare a `security.config.json` file

Using your preferred text editor, create a file named `security.config.json` (
This file can have any other name you like but make sure to use the same name in the following step.).

Then copy the following content and save the file in the `${BONDY_HOME}/etc` directory we created in the previous step.

```json
[
    {
        "uri": "bondy",
        "authmethods": [
            "wampcra",
            "ticket",
            "anonymous"
        ],
        "security_enabled": true,
        "users": [],
        "groups": [
            {
                "name": "administrators",
                "groups": [],
                "meta": {
                    "description": "The administrators of Bondy."
                }
            }
        ],
        "sources": [
            {
                "usernames": "all",
                "authmethod": "password",
                "cidr": "0.0.0.0/0",
                "meta": {
                    "description": "Allows all users from any network authenticate using password credentials."
                }
            },
            {
                "usernames": [
                    "anonymous"
                ],
                "authmethod": "trust",
                "cidr": "0.0.0.0/0",
                "meta": {
                    "description": "Allows all users from any network authenticate as anonymous."
                }
            }
        ],
        "grants": [
            {
                "permissions": [
                    "wamp.register",
                    "wamp.unregister",
                    "wamp.subscribe",
                    "wamp.unsubscribe",
                    "wamp.call",
                    "wamp.cancel",
                    "wamp.publish"
                ],
                "uri": "*",
                "roles": "all"
            },
            {
                "permissions": [
                    "wamp.register",
                    "wamp.unregister",
                    "wamp.subscribe",
                    "wamp.unsubscribe",
                    "wamp.call",
                    "wamp.cancel",
                    "wamp.publish"
                ],
                "uri": "*",
                "roles": [
                    "anonymous"
                ]
            }
        ]
    }
]
```

This snippet allows any user (from any network) to authenticate to Bondy using `anonymous` authentication and perform all operations.

::: warning
For production use make sure you understand Bondy's Security system and configure it accordingly.
:::

### 3. Prepare the `bondy.conf` file

Again using your text editor create a file name `bondy.conf` in the `${BONDY_HOME}/etc` directory we created in the previous steps, containing the following content:

```text
security.config_file = /bondy/etc/security.config.json
cluster.enabled = off
```

::: warning `cluster.enabled = off` is required for a single node
This guide runs one node, so it turns clustering off. A node left on the default `cluster.enabled = on` with no other member never compacts its history. Under the default fence policy, it also refuses every authentication, anonymous included, from its first boot: only an anti-entropy round that reaches a peer confirms its security tables, and a node with no peer never completes one. To run a cluster instead, follow [Running a Cluster](/connect/guides/deployment/running_a_cluster) and see [Enabling clustering](/connect/reference/configuration/cluster#enabling-clustering).
:::

### 4. Verify your setup

```bash
cd ${BONDY_HOME}
tree -L 2
```

You should get the following output:

```text
.
├── data
└── etc
    ├── bondy.conf
    └── security.config.json
```

### 5. Run Bondy

Run the official image with `docker run`. The image is `leapsight/bondy-connect:{TAG}`, also published as `ghcr.io/bondy-io/bondy-connect:{TAG}`, where `{TAG}` is one of:

- a release version, such as <SiteMeta k="bondyVersion"/>;
- `latest`, the most recent stable release;
- `main` or `develop`, a build of that branch.

These tags name the Debian build of `deployment/Dockerfile`. The Alpine build of `deployment/alpine.Dockerfile` takes the same tags with an `-alpine` suffix, such as `1.1.0-alpine` or `develop-alpine`. It has no `latest` tag. Both builds are published for `linux/amd64` and `linux/arm64`.

To run the <SiteMeta k="bondyVersion"/> release:

```bash-vue
docker run \
    -e BONDY_ERL_NODENAME=bondy1@127.0.0.1 \
    -e BONDY_ERL_DISTRIBUTED_COOKIE=bondy \
    -p 18080:18080 \
    -p 18082:18082 \
    -p 18086:18086 \
    -u 0:1000 \
    --name bondy \
    -v "${BONDY_HOME}/etc:/bondy/etc" \
    -v "${BONDY_HOME}/data:/bondy/data" \
    -d leapsight/bondy-connect:{{bondyVersion}}
```

The command does not publish port `18081`. The `admin` listener serves the Admin API on that port, and it binds `127.0.0.1` inside the container, so a published port does not reach it. To expose the Admin API outside the container, declare the node's listeners in `bondy.conf` and give the `admin` listener an explicit `ip`. See [Configuring Network Listeners](/connect/guides/administration/configuring_listeners#declare-the-inventory).



