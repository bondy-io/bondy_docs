# Quickstart Configuration
The minimal configuration you must do for a quick start.


```text [bondy.conf]
cluster.enabled = off
security.allow_anonymous_user = on
```

This configuration snippet above runs a single node without clustering and enables `anonymous` access to the Bondy WAMP API. A single node needs [`cluster.enabled = off`](/router/reference/configuration/cluster#cluster.enabled). With the default `on` and no other member, the node never compacts its history. Under the default `db.aae.fence.*` settings it also refuses every authentication, anonymous included. You can then use WAMP to attach a session to the `bondy` realm and create a realm dynamically you can then attach to.
