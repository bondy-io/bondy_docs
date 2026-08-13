# Quickstart Configuration
The minimal configuration you must do for a quick start.


```text [bondy.conf]
security.allow_anonymous_user = on
```

This configuration snippet above enables `anonymous` access to the Bondy WAMP API.  You can then use WAMP to attach a session to the `bondy` realm and create a realm dynamically you can then attach to.
