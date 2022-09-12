# Traffic Management

## Load Regulation


@[config](load_regulation.enabled,on|off,on,v0.8.8)

@[config](load_regulation.router.pool.type,permanent|transient,transient,v0.8.8)

@[config](load_regulation.router.pool.size,pos_integer,8,v0.8.8)

The size of the router process pool.
The actual size will be the maximum between the configured value and
the number of Erlang schedulers (which by default is the number of CPU cores) of the host or the number assigned by the virtualization|container layer.


@[config](load_regulation.router.pool.capacity,pos_integer,100000,v0.8.8)

The capacity of the router process pool, i.e. the maximum number of
active erlang processes handling router events (default = 100000).
Once the maximum has been reached, Bondy will respond with an overload error.

@[config](load_regulation.session_manager.pool.size,pos_integer,32,v1.0.0)

The capacity of the session manager process pool, i.e. the maximum
number of active erlang processes handling session events (default = 32).


@[config](registry.partitions,pos_integer,32,v1.0.0)

The number of registry partitions, i.e. the maximum
number of active erlang processes handling registry trie serialised
operations.

Check with the documentation which operations are concurrent and which are
serialised to understand the impact.

Notice that all registrations and subcritions for a realm are stored in the
same (single) partition and partition assignment is based on hashing the
realm uri across the number of partitions. So increasing the number of
partitions will only  affect use cases in which you have a decent amount of
realms.

