# Install using Docker
This guide provides steps to install and configure Bondy on Docker using the official Docker images.


::: tip Using your own image instead

If you want to build and use your own Docker image, make sure you check the official images sources first as you might want to use them as your template.

These are located at the Bondy's Github repository under the ["deployment" directory](https://github.com/bondy-io/bondy/tree/develop/deployment).
:::

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

Thew `etc` directory will be used by you to store Bondy's configuration, while the `data` directory will be used by Bondy to store its embedded database files.

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
security.config_file = /bondy/etc/security_config.json
```

### 4. Verify your setup

```bash
cd ${BONDY_HOME}
tree -L 2
```

You should get the following output:

```bash
└── etc
    ├── bondy.conf
    ├── security.config.json
````

### 5. Run Bondy

We will run an official Bondy Docker image using the `docker run` command with an image name using the following syntax: `leapsight/bondy:{VERSION}[-{VARIANT}]` where:

- `{VERSION}` can be `master`, `develop` or a tag like {{latestBondyVersion}}
- `{VARIANT}` can be null or `slim` (we will provide the `alpine` variant in the future).

For example to run the `1.0.0-rc.4` release you would use:

::: code-group
```bash [Debian]
docker run \
    -e BONDY_ERL_NODENAME=bondy1@127.0.0.1 \
    -e BONDY_ERL_DISTRIBUTED_COOKIE=bondy \
    -p 18080:18080 \
    -p 18081:18081 \
    -p 18082:18082 \
    -p 18086:18086 \
    -u 0:1000 \
    --name bondy \
    -v "${BONDY_HOME}/etc:/bondy/etc" \
    -v "${BONDY_HOME}/data:/bondy/data" \
    -d leapsight/bondy:1.0.0-rc.4
```

```bash [Alpine]
docker run \
    -e BONDY_ERL_NODENAME=bondy1@127.0.0.1 \
    -e BONDY_ERL_DISTRIBUTED_COOKIE=bondy \
    -p 18080:18080 \
    -p 18081:18081 \
    -p 18082:18082 \
    -p 18086:18086 \
    -u 0:1000 \
    --name bondy \
    -v "${BONDY_HOME}/etc:/bondy/etc" \
    -v "${BONDY_HOME}/data:/bondy/data" \
    -d leapsight/bondy:1.0.0-rc.4-alpine
```
:::



