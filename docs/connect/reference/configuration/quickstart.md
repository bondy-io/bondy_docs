# Quickstart Configuration
The minimal configuration for a quick start.


```text [bondy.conf]
cluster.enabled = off
security.allow_anonymous_user = on
```

This configuration snippet above runs a single node without clustering and enables `anonymous` access to the Bondy WAMP API. A single node needs [`cluster.enabled = off`](/connect/reference/configuration/cluster#cluster.enabled). With the default `on` and no other member, the node never compacts its history. Under the default `db.oplog.aae.fence.*` settings it also refuses every authentication, anonymous included. You can then use WAMP to attach a session to the master realm, `com.leapsight.bondy`, and create a realm dynamically you can then attach to.
