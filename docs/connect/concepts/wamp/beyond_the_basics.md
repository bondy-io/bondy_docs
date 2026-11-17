---
draft: false
related:
    - text: Routed RPC
      type: concepts
      link: /connect/concepts/wamp/rpc
      description: Learn the fundamentals of Remote Procedure Calls in WAMP.
    - text: Publish/Subscribe
      type: concepts
      link: /connect/concepts/wamp/pubsub
      description: Learn the fundamentals of Publish/Subscribe in WAMP.
    - text: Advanced RPC
      type: concepts
      link: /connect/concepts/wamp/advanced/rpc
      description: Deep dive into advanced RPC features.
    - text: Advanced PubSub
      type: concepts
      link: /connect/concepts/wamp/advanced/pubsub
      description: Deep dive into advanced PubSub features.
---
# Beyond the Basics

Beyond WAMP's basic RPC and Publish/Subscribe patterns, this guide covers the advanced features a production deployment typically needs: load balancing, progressive results, and pattern-based routing.

## RPC Load Balancing

In production systems, you often need multiple instances of a service for capacity, reliability, or geographic distribution. WAMP's shared registrations enable built-in load balancing without external infrastructure.

### How Shared Registrations Work

Multiple callees can register the same procedure URI. When a call arrives, the router selects one callee using a configured invocation policy:

::: code-group sdk

```javascript [JavaScript]
// Service Instance 1
wampy.register('com.myapp.process_order', {
    rpc: function(args, kwargs) {
        // Process order logic
        return {order_id: kwargs.order_id, processed_by: 'instance_1'};
    },
    invoke: 'roundrobin'  // Load balancing policy
});

// Service Instance 2
wampy.register('com.myapp.process_order', {
    rpc: function(args, kwargs) {
        // Same logic, different instance
        return {order_id: kwargs.order_id, processed_by: 'instance_2'};
    },
    invoke: 'roundrobin'  // Same policy
});

// Callers don't know or care which instance handles the call
wampy.call('com.myapp.process_order', null, {order_id: 123});
```

```erlang [Erlang]
ProcessOrderOn = fun(Instance) ->
    fun(_Args, #{<<"order_id">> := OrderId}, _Details) ->
        %% Process order logic
        {ok, #{args => [#{
            <<"order_id">> => OrderId,
            <<"processed_by">> => Instance
        }]}}
    end
end,
RoundRobin = #{invoke => <<"roundrobin">>},  %% Load balancing policy

%% Service Instance 1
{ok, _} = bondy_connect_client:register(
    Conn1, <<"com.myapp.process_order">>,
    ProcessOrderOn(<<"instance_1">>), RoundRobin
),

%% Service Instance 2: same logic, same policy
{ok, _} = bondy_connect_client:register(
    Conn2, <<"com.myapp.process_order">>,
    ProcessOrderOn(<<"instance_2">>), RoundRobin
),

%% Callers don't know or care which instance handles the call
bondy_connect_client:call(
    Conn, <<"com.myapp.process_order">>, [], #{<<"order_id">> => 123}
).
```

:::

### Invocation Policies

Bondy supports multiple invocation policies:

| Policy | Behavior | Use Case |
|--------|----------|----------|
| **single** | Only one callee allowed | Ensure singleton service |
| **roundrobin** | Distribute calls evenly across callees | Balanced load distribution |
| **random** | Random callee selection | Simple distribution with no ordering |
| **first** | Always use first registered callee | Primary/backup pattern |
| **last** | Always use last registered callee | Rolling deployment with new version |

### Round Robin Load Balancing

Round robin ensures even distribution:

<RoundRobinDiagram />

Perfect for stateless services where any instance can handle any request.

**Example use case:**

::: code-group sdk

```javascript [JavaScript]
// Image processing service with 5 instances
// All register with roundrobin policy
wampy.register('com.myapp.process_image', {
    rpc: processImage,
    invoke: 'roundrobin'
});

// Clients call normally
// Bondy automatically distributes across instances
wampy.call('com.myapp.process_image', [imageData]);
```

```erlang [Erlang]
%% Image processing service with 5 instances
%% All register with roundrobin policy
{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.process_image">>, ProcessImage,
    #{invoke => <<"roundrobin">>}
),

%% Clients call normally
%% Bondy automatically distributes across instances
bondy_connect_client:call(Conn, <<"com.myapp.process_image">>, [ImageData]).
```

:::

### Random Distribution

Random selection provides statistical distribution without tracking state:

::: code-group sdk

```javascript [JavaScript]
wampy.register('com.myapp.analytics.track', {
    rpc: trackEvent,
    invoke: 'random'  // Random distribution
});
```

```erlang [Erlang]
{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.analytics.track">>, TrackEvent,
    #{invoke => <<"random">>}  %% Random distribution
).
```

:::

Good for fire-and-forget operations where exact distribution doesn't matter.

### First/Last Policies

Use `first` or `last` for primary/backup or canary deployment patterns:

**Primary/Backup Pattern:**

::: code-group sdk

```javascript [JavaScript]
// Primary instance (registered first)
wampy.register('com.myapp.cache.get', {
    rpc: getCacheValue,
    invoke: 'first'
});

// Backup instance (registered second)
// Only receives calls if primary unregisters
wampy.register('com.myapp.cache.get', {
    rpc: getCacheValue,
    invoke: 'first'
});
```

```erlang [Erlang]
%% Primary instance (registered first)
{ok, _} = bondy_connect_client:register(
    Conn1, <<"com.myapp.cache.get">>, GetCacheValue,
    #{invoke => <<"first">>}
),

%% Backup instance (registered second)
%% Only receives calls if primary unregisters
{ok, _} = bondy_connect_client:register(
    Conn2, <<"com.myapp.cache.get">>, GetCacheValue,
    #{invoke => <<"first">>}
).
```

:::

**Canary Deployment:**

::: code-group sdk

```javascript [JavaScript]
// Existing version (multiple instances)
wampy.register('com.myapp.api.process', {
    rpc: processV1,
    invoke: 'last'
});

// New version (canary instance)
wampy.register('com.myapp.api.process', {
    rpc: processV2,
    invoke: 'last'
});
// All new calls go to canary
// If it works, deploy more v2 instances
```

```erlang [Erlang]
%% Existing version (multiple instances)
{ok, _} = bondy_connect_client:register(
    Conn1, <<"com.myapp.api.process">>, ProcessV1, #{invoke => <<"last">>}
),

%% New version (canary instance)
{ok, _} = bondy_connect_client:register(
    Conn2, <<"com.myapp.api.process">>, ProcessV2, #{invoke => <<"last">>}
).
%% All new calls go to canary
%% If it works, deploy more v2 instances
```

:::

### Geographic Distribution

Combine registration with Bondy clustering for geographic load balancing:

<GeoDistributionDiagram />

Each cluster handles its local clients, reducing latency and improving fault tolerance.

## RPC Failover

Failover ensures service availability even when individual instances fail. WAMP provides automatic failover through dynamic registration and retry mechanisms.

### Automatic Failover

When a callee disconnects, its registrations are automatically removed:

```
1. Instance 1 registers procedure
2. Instance 2 registers procedure (roundrobin)
3. Calls distributed between instances
4. Instance 1 crashes or disconnects
5. Bondy removes Instance 1's registration
6. All subsequent calls go to Instance 2
7. New Instance 3 registers procedure
8. Distribution resumes between Instances 2 & 3
```

No manual intervention required. The router adapts automatically. A call the departing instance was still handling fails with `wamp.error.canceled`, unless Bondy routes it again because it set `CALL.Options._retries` and the registration is idempotent.

### Retry Logic

Implement client-side retry for transient failures:

::: code-group sdk

```javascript [JavaScript]
async function callWithRetry(procedure, args, options = {}, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await new Promise((resolve, reject) => {
                wampy.call(procedure, args, {
                    ...options,
                    onSuccess: resolve,
                    onError: reject
                });
            });
        } catch (error) {
            lastError = error;

            if (attempt < maxRetries) {
                // Exponential backoff
                const delay = Math.pow(2, attempt) * 100;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
}

// Usage
try {
    const result = await callWithRetry('com.myapp.api.process', [data]);
    console.log('Success:', result);
} catch (error) {
    console.error('Failed after retries:', error);
}
```

```erlang [Erlang]
CallWithRetry = fun Retry(Procedure, Args, Options, Attempt, MaxRetries) ->
    case bondy_connect_client:call(Conn, Procedure, Args, #{}, Options) of
        {ok, Result} ->
            {ok, Result};
        {error, _} when Attempt < MaxRetries ->
            %% Exponential backoff
            timer:sleep(trunc(math:pow(2, Attempt)) * 100),
            Retry(Procedure, Args, Options, Attempt + 1, MaxRetries);
        {error, LastError} ->
            {error, LastError}
    end
end,

%% Usage
case CallWithRetry(<<"com.myapp.api.process">>, [Data], #{}, 1, 3) of
    {ok, Result} ->
        io:format("Success: ~p~n", [Result]);
    {error, Error} ->
        io:format("Failed after retries: ~p~n", [Error])
end.
```

:::

### Health Checks

Implement health check procedures for monitoring:

::: code-group sdk

```javascript [JavaScript]
// Service registers health check
wampy.register('com.myapp.service.health', {
    rpc: function() {
        return {
            status: 'healthy',
            timestamp: Date.now(),
            version: '1.2.3',
            uptime: process.uptime()
        };
    }
});

// Monitor calls health checks
setInterval(async () => {
    try {
        const health = await callWithRetry('com.myapp.service.health', [], {}, 1);
        console.log('Service healthy:', health);
    } catch (error) {
        console.error('Service unhealthy:', error);
        // Alert operations team
    }
}, 30000);  // Check every 30 seconds
```

```erlang [Erlang]
%% Service registers health check
Health = fun(_Args, _KWArgs, _Details) ->
    {Uptime, _} = erlang:statistics(wall_clock),
    {ok, #{args => [#{
        <<"status">> => <<"healthy">>,
        <<"timestamp">> => erlang:system_time(millisecond),
        <<"version">> => <<"1.2.3">>,
        <<"uptime">> => Uptime div 1000
    }]}}
end,

{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.service.health">>, Health
),

%% Monitor calls health checks
{ok, _Timer} = timer:apply_interval(30000, fun() ->  %% Every 30 seconds
    case CallWithRetry(<<"com.myapp.service.health">>, [], #{}, 1, 1) of
        {ok, #{args := [Status]}} ->
            io:format("Service healthy: ~p~n", [Status]);
        {error, Error} ->
            io:format("Service unhealthy: ~p~n", [Error])
            %% Alert operations team
    end
end).
```

:::

### Circuit Breaker Pattern

Prevent cascading failures with circuit breakers:

::: code-group sdk

```javascript [JavaScript]
class CircuitBreaker {
    constructor(procedure, threshold = 5, timeout = 60000) {
        this.procedure = procedure;
        this.threshold = threshold;
        this.timeout = timeout;
        this.failures = 0;
        this.state = 'CLOSED';  // CLOSED, OPEN, HALF_OPEN
        this.nextAttempt = null;
    }

    async call(args, kwargs) {
        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttempt) {
                throw new Error('Circuit breaker OPEN');
            }
            this.state = 'HALF_OPEN';
        }

        try {
            const result = await new Promise((resolve, reject) => {
                wampy.call(this.procedure, args, {
                    ...kwargs,
                    onSuccess: resolve,
                    onError: reject
                });
            });

            // Success: reset or close circuit
            if (this.state === 'HALF_OPEN') {
                this.state = 'CLOSED';
                this.failures = 0;
            }

            return result;
        } catch (error) {
            this.failures++;

            if (this.failures >= this.threshold) {
                this.state = 'OPEN';
                this.nextAttempt = Date.now() + this.timeout;
            }

            throw error;
        }
    }
}

// Usage
const breaker = new CircuitBreaker('com.myapp.external.api', 5, 60000);

try {
    const result = await breaker.call([data]);
} catch (error) {
    console.log('Call failed or circuit open:', error);
}
```

```erlang [Erlang]
%% The breaker is a map that the caller keeps between calls.
%% state is closed, open or half_open.
NewBreaker = fun(Procedure, Threshold, Timeout) ->
    #{
        procedure => Procedure,
        threshold => Threshold,
        timeout => Timeout,
        failures => 0,
        state => closed,
        next_attempt => undefined
    }
end,

%% Returns the outcome of the call and the breaker to use for the next one.
BreakerCall = fun(Breaker0, Args, KWArgs) ->
    Now = erlang:monotonic_time(millisecond),
    case Breaker0 of
        #{state := open, next_attempt := NextAttempt} when Now < NextAttempt ->
            {{error, circuit_open}, Breaker0};
        _ ->
            Breaker =
                case Breaker0 of
                    #{state := open} -> Breaker0#{state := half_open};
                    _ -> Breaker0
                end,
            #{
                procedure := Procedure,
                threshold := Threshold,
                timeout := Timeout,
                failures := Failures,
                state := State
            } = Breaker,
            case bondy_connect_client:call(Conn, Procedure, Args, KWArgs) of
                {ok, _} = Result when State =:= half_open ->
                    %% Success: close the circuit
                    {Result, Breaker#{state := closed, failures := 0}};
                {ok, _} = Result ->
                    {Result, Breaker};
                {error, _} = Error when Failures + 1 >= Threshold ->
                    {Error, Breaker#{
                        failures := Failures + 1,
                        state := open,
                        next_attempt := Now + Timeout
                    }};
                {error, _} = Error ->
                    {Error, Breaker#{failures := Failures + 1}}
            end
    end
end,

%% Usage
Breaker0 = NewBreaker(<<"com.myapp.external.api">>, 5, 60000),

{Outcome, Breaker1} = BreakerCall(Breaker0, [Data], #{}),
case Outcome of
    {ok, Result} ->
        io:format("Success: ~p~n", [Result]);
    {error, Error} ->
        io:format("Call failed or circuit open: ~p~n", [Error])
end.
```

:::

## Pattern-Based Registration

Register procedures using URI patterns instead of exact URIs, enabling dynamic, flexible service implementations.

### Prefix Matching

Handle all procedures under a namespace:

::: code-group sdk

```javascript [JavaScript]
wampy.register('com.myapp.users.', {
    rpc: function(args, kwargs, details) {
        // details.procedure contains exact URI called
        const operation = details.procedure.split('.').pop();

        switch (operation) {
            case 'get':
                return getUser(args[0]);
            case 'list':
                return listUsers();
            case 'create':
                return createUser(kwargs);
            case 'delete':
                return deleteUser(args[0]);
            default:
                throw new Error('Unknown operation');
        }
    },
    match: 'prefix'
});

// All these calls route to the same handler
wampy.call('com.myapp.users.get', [123]);
wampy.call('com.myapp.users.list');
wampy.call('com.myapp.users.create', null, {name: 'Alice'});
wampy.call('com.myapp.users.delete', [123]);
```

```erlang [Erlang]
Users = fun(Args, KWArgs, #{procedure := Procedure}) ->
    %% The procedure detail contains the exact URI called
    case lists:last(binary:split(Procedure, <<".">>, [global])) of
        <<"get">> ->
            {ok, #{args => [get_user(hd(Args))]}};
        <<"list">> ->
            {ok, #{args => [list_users(KWArgs)]}};
        <<"create">> ->
            {ok, #{args => [create_user(KWArgs)]}};
        <<"delete">> ->
            {ok, #{args => [delete_user(hd(Args))]}};
        _ ->
            {error, #{uri => <<"com.myapp.error.unknown_operation">>}}
    end
end,

{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.users.">>, Users, #{match => <<"prefix">>}
),

%% All these calls route to the same handler
bondy_connect_client:call(Conn, <<"com.myapp.users.get">>, [123]),
bondy_connect_client:call(Conn, <<"com.myapp.users.list">>),
bondy_connect_client:call(
    Conn, <<"com.myapp.users.create">>, [], #{<<"name">> => <<"Alice">>}
),
bondy_connect_client:call(Conn, <<"com.myapp.users.delete">>, [123]).
```

:::

### Wildcard Matching

Implement cross-cutting concerns:

::: code-group sdk

```javascript [JavaScript]
// Logging middleware using wildcard
wampy.register('com.myapp..audit', {
    rpc: function(args, kwargs, details) {
        console.log('Audit called:', {
            procedure: details.procedure,
            caller: details.caller,
            timestamp: Date.now()
        });

        // Forward to actual handler
        const actualProcedure = details.procedure.replace('.audit', '');
        return wampy.call(actualProcedure, args, kwargs);
    },
    match: 'wildcard'
});

// Matches:
// com.myapp.users.audit
// com.myapp.orders.audit
// com.myapp.products.audit
```

```erlang [Erlang]
%% Logging middleware using wildcard
Audit = fun(Args, KWArgs, #{procedure := Procedure, caller := Caller}) ->
    io:format("Audit called: ~p~n", [#{
        procedure => Procedure,
        caller => Caller,
        timestamp => erlang:system_time(millisecond)
    }]),

    %% Forward to actual handler
    Actual = binary:replace(Procedure, <<".audit">>, <<>>),
    case bondy_connect_client:call(Conn, Actual, Args, KWArgs) of
        {ok, #{args := ResultArgs, kwargs := ResultKWArgs}} ->
            {ok, #{args => ResultArgs, kwargs => ResultKWArgs}};
        {error, #{kind := wamp, uri := Uri}} ->
            {error, #{uri => Uri}}
    end
end,

{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp..audit">>, Audit, #{match => <<"wildcard">>}
).

%% Matches:
%% com.myapp.users.audit
%% com.myapp.orders.audit
%% com.myapp.products.audit
```

:::

## Event Filtering

Control which subscribers receive which events based on filters and rules.

### Publisher Exclusion

Don't receive your own publications:

::: code-group sdk

```javascript [JavaScript]
wampy.publish('com.myapp.chat.message', ['Hello everyone!'], {}, {
    exclude_me: true  // Don't receive this event
});

wampy.subscribe('com.myapp.chat.message', function(args) {
    // Won't receive messages published by this session
    console.log('Message from someone else:', args[0]);
});
```

```erlang [Erlang]
ok = bondy_connect_client:publish(
    Conn, <<"com.myapp.chat.message">>, [<<"Hello everyone!">>], #{},
    #{exclude_me => true}  %% Don't receive this event
),

OnMessage = fun([Message], _KWArgs, _Details) ->
    %% Won't receive messages published by this session
    io:format("Message from someone else: ~s~n", [Message])
end,

{ok, _} = bondy_connect_client:subscribe(
    Conn, <<"com.myapp.chat.message">>, OnMessage
).
```

:::

### Subscriber Filtering

Control event delivery to specific sessions:

::: code-group sdk

```javascript [JavaScript]
// Only send to specific sessions
wampy.publish('com.myapp.admin.alert', ['System issue'], {}, {
    eligible: [session_id_1, session_id_2]  // Only these sessions receive
});

// Exclude specific sessions
wampy.publish('com.myapp.broadcast', ['Update'], {}, {
    exclude: [session_id_3]  // Everyone except this session
});
```

```erlang [Erlang]
%% Only send to specific sessions
ok = bondy_connect_client:publish(
    Conn, <<"com.myapp.admin.alert">>, [<<"System issue">>], #{},
    #{eligible => [SessionId1, SessionId2]}  %% Only these sessions receive
),

%% Exclude specific sessions
ok = bondy_connect_client:publish(
    Conn, <<"com.myapp.broadcast">>, [<<"Update">>], #{},
    #{exclude => [SessionId3]}  %% Everyone except this session
).
```

:::

### Pattern-Based Subscriptions

Subscribe to multiple topics with patterns:

::: code-group sdk

```javascript [JavaScript]
// Subscribe to all user events with prefix
wampy.subscribe('com.myapp.users.', {
    onEvent: function(args, kwargs, details) {
        console.log('User event:', details.topic, args);
    },
    match: 'prefix'
});

// Receives events from:
// com.myapp.users.created
// com.myapp.users.updated
// com.myapp.users.deleted
```

```erlang [Erlang]
%% Subscribe to all user events with prefix
OnUserEvent = fun(Args, _KWArgs, #{topic := Topic}) ->
    io:format("User event: ~s ~p~n", [Topic, Args])
end,

{ok, _} = bondy_connect_client:subscribe(
    Conn, <<"com.myapp.users.">>, OnUserEvent, #{match => <<"prefix">>}
).

%% Receives events from:
%% com.myapp.users.created
%% com.myapp.users.updated
%% com.myapp.users.deleted
```

:::

## Call Timeouts

Prevent indefinite waiting with timeouts:

::: code-group sdk

```javascript [JavaScript]
wampy.call('com.myapp.slow_operation', [data], {
    timeout: 5000,  // 5 second timeout
    onSuccess: function(result) {
        console.log('Completed:', result);
    },
    onError: function(error) {
        if (error.error === 'wamp.error.timeout') {
            console.log('Operation timed out');
        } else {
            console.error('Operation failed:', error);
        }
    }
});
```

```erlang [Erlang]
case
    bondy_connect_client:call(
        Conn, <<"com.myapp.slow_operation">>, [Data], #{},
        #{timeout => 5000}  %% 5 second timeout
    )
of
    {ok, Result} ->
        io:format("Completed: ~p~n", [Result]);
    {error, #{kind := wamp, uri := <<"wamp.error.timeout">>}} ->
        io:format("Operation timed out~n");
    {error, #{kind := client, reason := timeout}} ->
        %% The SDK's own timer fired before the router answered
        io:format("Operation timed out~n");
    {error, Error} ->
        io:format("Operation failed: ~p~n", [Error])
end.
```

:::

Timeouts ensure callers don't wait indefinitely for unresponsive services.

## Caller Identification

Know who's calling your procedures:

::: code-group sdk

```javascript [JavaScript]
wampy.register('com.myapp.restricted.operation', {
    rpc: function(args, kwargs, details) {
        // details.caller contains caller's session ID
        console.log('Called by session:', details.caller);

        // Can look up caller identity
        // Check additional authorization
        // Log for audit purposes

        return performOperation(args, kwargs);
    }
});
```

```erlang [Erlang]
RestrictedOperation = fun(Args, KWArgs, #{caller := Caller}) ->
    %% The caller detail contains the caller's session ID
    io:format("Called by session: ~p~n", [Caller]),

    %% Can look up caller identity
    %% Check additional authorization
    %% Log for audit purposes

    {ok, #{args => [perform_operation(Args, KWArgs)]}}
end,

{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.restricted.operation">>, RestrictedOperation
).
```

:::

Bondy discloses the caller by default. It omits the caller only when the registration sets `disclose_caller: false` and the call sets `disclose_me: false`. See [Caller Identification](/connect/concepts/wamp/advanced/rpc#caller-identification).

Useful for:
- Audit logging
- Additional authorization checks
- Rate limiting per caller
- Usage analytics

## Publisher Identification

Know who published events:

::: code-group sdk

```javascript [JavaScript]
wampy.subscribe('com.myapp.events', {
    onEvent: function(args, kwargs, details) {
        // details.publisher contains publisher's session ID
        console.log('Published by session:', details.publisher);
        console.log('Event data:', args, kwargs);
    }
});
```

```erlang [Erlang]
OnEvent = fun(Args, KWArgs, #{publisher := Publisher}) ->
    %% The publisher detail contains the publisher's session ID
    io:format("Published by session: ~p~n", [Publisher]),
    io:format("Event data: ~p ~p~n", [Args, KWArgs])
end,

{ok, _} = bondy_connect_client:subscribe(
    Conn, <<"com.myapp.events">>, OnEvent
).
```

:::

The subscriber does not ask for this information. Bondy discloses the publisher unless the publisher sets `disclose_me: false`. See [Publisher Identification](/connect/concepts/wamp/advanced/pubsub#publisher-identification).

## Best Practices

### Design for Failure

Assume services will fail:
- Use shared registrations for redundancy
- Implement client-side retries
- Use circuit breakers for external dependencies
- Monitor service health

### Start Simple, Scale Gradually

Begin with exact registrations and single instances:

::: code-group sdk

```javascript [JavaScript]
// Start simple
wampy.register('com.myapp.process', {rpc: handler});
```

```erlang [Erlang]
%% Start simple
{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.process">>, Handler
).
```

:::

Add complexity only when needed:

::: code-group sdk

```javascript [JavaScript]
// Scale to multiple instances
wampy.register('com.myapp.process', {
    rpc: handler,
    invoke: 'roundrobin'
});
```

```erlang [Erlang]
%% Scale to multiple instances
{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.process">>, Handler, #{invoke => <<"roundrobin">>}
).
```

:::

### Monitor and Measure

Track key metrics:
- Call latency and success rates
- Registration/unregistration events
- Load distribution across instances
- Error rates and types

Use WAMP meta events to build monitoring. Bondy publishes `wamp.registration.on_register` and `wamp.registration.on_unregister`, but not `on_create` or `on_delete`:

::: code-group sdk

```javascript [JavaScript]
// Subscribe to registration changes
wampy.subscribe('wamp.registration.on_register', function(args, kwargs) {
    console.log('New registration:', kwargs);
});

wampy.subscribe('wamp.registration.on_unregister', function(args, kwargs) {
    console.log('Registration removed:', kwargs);
});
```

```erlang [Erlang]
%% Subscribe to registration changes
OnRegister = fun(Args, KWArgs, _Details) ->
    io:format("New registration: ~p ~p~n", [Args, KWArgs])
end,
OnUnregister = fun(Args, KWArgs, _Details) ->
    io:format("Registration removed: ~p ~p~n", [Args, KWArgs])
end,

{ok, _} = bondy_connect_client:subscribe(
    Conn, <<"wamp.registration.on_register">>, OnRegister
),
{ok, _} = bondy_connect_client:subscribe(
    Conn, <<"wamp.registration.on_unregister">>, OnUnregister
).
```

:::

### Test Failure Scenarios

Don't wait for production to test failover:

1. **Kill instances** - Verify others take over
2. **Simulate network issues** - Test retry logic
3. **Overload services** - Validate circuit breakers
4. **Partition clusters** - Ensure graceful degradation

### Document Invocation Policies

Make registration policies explicit in service documentation:

::: code-group sdk

```javascript [JavaScript]
/**
 * Process Order API
 *
 * Procedure: com.myapp.order.process
 * Invocation: roundrobin (multiple instances)
 * Timeout: 30 seconds recommended
 * Idempotent: Yes (safe to retry)
 */
wampy.register('com.myapp.order.process', {
    rpc: processOrder,
    invoke: 'roundrobin'
});
```

```erlang [Erlang]
%% Process Order API
%%
%% Procedure: com.myapp.order.process
%% Invocation: roundrobin (multiple instances)
%% Timeout: 30 seconds recommended
%% Idempotent: Yes (safe to retry)
{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.order.process">>, ProcessOrder,
    #{invoke => <<"roundrobin">>}
).
```

:::

## Summary

WAMP's beyond-the-basics features enable production-ready distributed systems:

- **Load balancing** through shared registrations with configurable policies
- **Automatic failover** as instances come and go
- **Pattern-based registration** for flexible service implementations
- **Event filtering** for fine-grained control over event delivery
- **Timeouts** to prevent indefinite waiting
- **Caller/publisher identification** for audit and authorization

These capabilities are built into the protocol — Bondy provides all of them without a separate load balancer, service registry, or other external infrastructure.

Explore the deep dives for more details:
- [Advanced RPC](/connect/concepts/wamp/advanced/rpc) - Progressive calls, cancellation, call retries
- [Advanced PubSub](/connect/concepts/wamp/advanced/pubsub) - Event retention, subscriber lists, Payload Passthru Mode
