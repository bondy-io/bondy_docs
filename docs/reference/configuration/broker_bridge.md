# Broker Bridge Configuration Reference
>Bondy Broker Bridge is a subsystem that enables you to have a set of supervised embedded WAMP subscribers that re-publish events to an external message broker or system.{.definition}

## Bridges
A bridge is a built-in client in Bondy which can connect to another broker and forward messages to it.

The subsystem manages a set of bridges, each one enabled through the `bondy.conf` file.

The following snippet shows how to modify the `bondy.conf` file to tell Bondy where to locate the file. The file should contain a JSON object as defined in the following sections.

```shell
broker_bridge.config_file = $(platform_etc_dir)/broker_bridge_config.json
```

## Broker Bridge Specification Object


```json
{
    "id":"subscribers_1",
    "meta":{},
    "subscriptions" : [ ]
}
```
