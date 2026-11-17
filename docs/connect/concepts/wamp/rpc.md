---
related:
    - text: Communication Patterns
      type: concepts
      link: /connect/concepts/wamp/communication_patterns
      description: Understanding RPC and PubSub patterns in WAMP.
    - text: Advanced RPC
      type: concepts
      link: /connect/concepts/wamp/advanced/rpc
      description: Progressive call results, call cancellation, and pattern-based registration.
    - text: Introduction to WAMP
      type: concepts
      link: /connect/concepts/wamp/introduction
      description: Core WAMP concepts and architecture.
---
# Routed Remote Procedure Calls (RPC)

Remote Procedure Calls (RPC) in WAMP enable request-response communication where a Caller invokes a procedure implemented by a Callee, receiving a result or error through the Router.

## Overview

Unlike traditional RPC systems (like HTTP/REST or gRPC) where clients make direct connections to servers, WAMP RPC is **routed** through the Router. This routing provides:

- **Decoupling** - Caller doesn't need to know Callee's location or identity
- **Dynamic discovery** - Procedures registered and unregistered at runtime
- **Load balancing** - Multiple Callees can implement the same procedure
- **Bidirectional** - Any client can be both Caller and Callee

::: info Traditional vs. Routed RPC
**Traditional RPC** (HTTP, gRPC): Client connects directly to Server
```
Client -----> Server (fixed address)
```

**WAMP Routed RPC**: All communication through Router
```
Caller <-----> Router (Dealer) <-----> Callee
       (dynamic routing)
```
:::

## How It Works

### Basic Flow

<RpcBasicFlowDiagram />

### WAMP Messages

**Register** (Callee)

::: code-group sdk

```javascript [JavaScript]
function add(args, kwargs, details) {
    return args[0] + args[1];
}

wampy.register('com.myapp.add', {
    rpc: add,
    onSuccess: function() {
        console.log('Procedure registered');
    }
});
```

```erlang [Erlang]
Add = fun([A, B], _KWArgs, _Details) ->
    {ok, #{args => [A + B]}}
end,

{ok, _RegistrationId} = bondy_connect_client:register(
    Conn, <<"com.myapp.add">>, Add
),
io:format("Procedure registered~n").
```

:::

**Call** (Caller)

::: code-group sdk

```javascript [JavaScript]
wampy.call('com.myapp.add', [2, 3], {
    onSuccess: function(result) {
        console.log('Result:', result);  // 5
    },
    onError: function(error) {
        console.error('Call failed:', error);
    }
});
```

```erlang [Erlang]
case bondy_connect_client:call(Conn, <<"com.myapp.add">>, [2, 3]) of
    {ok, #{args := [Result]}} ->
        io:format("Result: ~p~n", [Result]);  %% 5
    {error, Error} ->
        io:format("Call failed: ~p~n", [Error])
end.
```

:::

## Registration

### Simple Registration

::: code-group sdk

```javascript [JavaScript]
wampy.register('com.myapp.get_user', {
    rpc: function(args) {
        const userId = args[0];
        return {id: userId, name: 'Alice'};
    }
});
```

```erlang [Erlang]
GetUser = fun([UserId], _KWArgs, _Details) ->
    {ok, #{args => [#{<<"id">> => UserId, <<"name">> => <<"Alice">>}]}}
end,

{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.get_user">>, GetUser
).
```

:::

### With Keyword Arguments

::: code-group sdk

```javascript [JavaScript]
wampy.register('com.myapp.create_order', {
    rpc: function(args, kwargs) {
        return {
            order_id: 123,
            items: kwargs.items,
            total: kwargs.total
        };
    }
});
```

```erlang [Erlang]
CreateOrder = fun(_Args, KWArgs, _Details) ->
    #{<<"items">> := Items, <<"total">> := Total} = KWArgs,
    {ok, #{args => [#{
        <<"order_id">> => 123,
        <<"items">> => Items,
        <<"total">> => Total
    }]}}
end,

{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.create_order">>, CreateOrder
).
```

:::

### Registration Options

::: code-group sdk

```javascript [JavaScript]
wampy.register('com.myapp.procedure', {
    rpc: handler,
    match: 'exact',  // exact | prefix | wildcard
    invoke: 'single'  // single | roundrobin | random | first | last
});
```

```erlang [Erlang]
{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.procedure">>, Handler, #{
        match => <<"exact">>,   %% exact | prefix | wildcard
        invoke => <<"single">>  %% single | roundrobin | random | first | last
    }
).
```

:::

### Multiple Callees

Multiple sessions can register the same procedure:

::: code-group sdk

```javascript [JavaScript]
// Service Instance 1
wampy.register('com.myapp.process', {
    rpc: handler,
    invoke: 'roundrobin'
});

// Service Instance 2
wampy.register('com.myapp.process', {
    rpc: handler,
    invoke: 'roundrobin'
});

// Calls distributed across both instances
```

```erlang [Erlang]
%% Service Instance 1
{ok, _} = bondy_connect_client:register(
    Conn1, <<"com.myapp.process">>, Handler, #{invoke => <<"roundrobin">>}
),

%% Service Instance 2
{ok, _} = bondy_connect_client:register(
    Conn2, <<"com.myapp.process">>, Handler, #{invoke => <<"roundrobin">>}
).

%% Calls distributed across both instances
```

:::

### Unregistering

::: code-group sdk

```javascript [JavaScript]
// Register procedure
wampy.register('com.myapp.temp', { rpc: handler });

// Later, unregister by URI
wampy.unregister('com.myapp.temp');
```

```erlang [Erlang]
%% Register procedure
{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.temp">>, Handler
),

%% Later, unregister by URI
ok = bondy_connect_client:unregister(Conn, <<"com.myapp.temp">>).
```

:::

## Calling Procedures

### Simple Call

::: code-group sdk

```javascript [JavaScript]
wampy.call('com.myapp.get_time', null, {
    onSuccess: function(time) {
        console.log('Server time:', time);
    }
});
```

```erlang [Erlang]
{ok, #{args := [Time]}} = bondy_connect_client:call(
    Conn, <<"com.myapp.get_time">>
),
io:format("Server time: ~p~n", [Time]).
```

:::

### With Positional Arguments

::: code-group sdk

```javascript [JavaScript]
wampy.call('com.myapp.multiply', [4, 5], {
    onSuccess: function(result) {
        console.log('4 * 5 =', result);  // 20
    }
});
```

```erlang [Erlang]
{ok, #{args := [Result]}} = bondy_connect_client:call(
    Conn, <<"com.myapp.multiply">>, [4, 5]
),
io:format("4 * 5 = ~p~n", [Result]).  %% 20
```

:::

### With Keyword Arguments

::: code-group sdk

```javascript [JavaScript]
wampy.call('com.myapp.create_user', null, {
    username: 'bob',
    email: 'bob@example.com',
    age: 30
}, {
    onSuccess: function(user) {
        console.log('Created user:', user.id);
    }
});
```

```erlang [Erlang]
{ok, #{args := [User]}} = bondy_connect_client:call(
    Conn, <<"com.myapp.create_user">>, [], #{
        <<"username">> => <<"bob">>,
        <<"email">> => <<"bob@example.com">>,
        <<"age">> => 30
    }
),
io:format("Created user: ~p~n", [maps:get(<<"id">>, User)]).
```

:::

### Call Options

::: code-group sdk

```javascript [JavaScript]
wampy.call('com.myapp.slow_operation', null, null, {
    timeout: 5000,  // 5 second timeout
    receive_progress: true,  // Enable progressive results
    onSuccess: function(result) {
        console.log('Final result:', result);
    },
    onError: function(error) {
        console.error('Call failed:', error);
    }
});
```

```erlang [Erlang]
%% 5 second timeout
case
    bondy_connect_client:call(
        Conn, <<"com.myapp.slow_operation">>, [], #{}, #{timeout => 5000}
    )
of
    {ok, #{args := [Result]}} ->
        io:format("Final result: ~p~n", [Result]);
    {error, Error} ->
        io:format("Call failed: ~p~n", [Error])
end,

%% Progressive results need the asynchronous call. Each one arrives as a
%% message, before the final result.
{ok, Token} = bondy_connect_client:call_async(
    Conn, <<"com.myapp.slow_operation">>, [], #{},
    #{timeout => 5000, receive_progress => true}
).
```

:::

## Error Handling

### Returning Errors (Callee)

::: code-group sdk

```javascript [JavaScript]
wampy.register('com.myapp.divide', {
    rpc: function(args) {
        const [a, b] = args;

        if (b === 0) {
            throw new Error('com.myapp.error.division_by_zero');
        }

        return a / b;
    }
});
```

```erlang [Erlang]
Divide = fun
    ([_A, B], _KWArgs, _Details) when B == 0 ->
        {error, #{uri => <<"com.myapp.error.division_by_zero">>}};
    ([A, B], _KWArgs, _Details) ->
        {ok, #{args => [A / B]}}
end,

{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.divide">>, Divide
).
```

:::

Name application errors under your own URI prefix, as for procedures and topics. The specification reserves the `wamp.` prefix for errors the protocol itself defines.

### Handling Errors (Caller)

::: code-group sdk

```javascript [JavaScript]
wampy.call('com.myapp.divide', [10, 0], {
    onSuccess: function(result) {
        console.log('Result:', result);
    },
    onError: function(error) {
        console.error('Error URI:', error.error);
        console.error('Error args:', error.args);
        console.error('Error kwargs:', error.kwargs);
    }
});
```

```erlang [Erlang]
case bondy_connect_client:call(Conn, <<"com.myapp.divide">>, [10, 0]) of
    {ok, #{args := [Result]}} ->
        io:format("Result: ~p~n", [Result]);
    {error, #{kind := wamp, uri := Uri, args := Args, kwargs := KWArgs}} ->
        io:format("Error URI: ~s~n", [Uri]),
        io:format("Error args: ~p~n", [Args]),
        io:format("Error kwargs: ~p~n", [KWArgs]);
    {error, #{kind := client, reason := Reason}} ->
        %% A local failure, such as a timeout or a dropped connection
        io:format("Call failed: ~p~n", [Reason])
end.
```

:::

## Pattern Matching

### Exact Match (Default)

::: code-group sdk

```javascript [JavaScript]
wampy.register('com.myapp.users.get', { rpc: handler });

// Matches only
wampy.call('com.myapp.users.get', [123]);
```

```erlang [Erlang]
{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.users.get">>, Handler
),

%% Matches only
bondy_connect_client:call(Conn, <<"com.myapp.users.get">>, [123]).
```

:::

### Prefix Match

::: code-group sdk

```javascript [JavaScript]
wampy.register('com.myapp.users.', {
    rpc: handler,
    match: 'prefix'
});

// Matches all with prefix
wampy.call('com.myapp.users.get', [123]);
wampy.call('com.myapp.users.list', []);
wampy.call('com.myapp.users.delete', [123]);
```

```erlang [Erlang]
{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.users.">>, Handler, #{match => <<"prefix">>}
),

%% Matches all with prefix
bondy_connect_client:call(Conn, <<"com.myapp.users.get">>, [123]),
bondy_connect_client:call(Conn, <<"com.myapp.users.list">>, []),
bondy_connect_client:call(Conn, <<"com.myapp.users.delete">>, [123]).
```

:::

### Wildcard Match

::: code-group sdk

```javascript [JavaScript]
wampy.register('com.myapp..get', {
    rpc: handler,
    match: 'wildcard'
});

// Matches pattern
wampy.call('com.myapp.users.get', [123]);
wampy.call('com.myapp.orders.get', [456]);
wampy.call('com.myapp.products.get', [789]);
```

```erlang [Erlang]
{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp..get">>, Handler, #{match => <<"wildcard">>}
),

%% Matches pattern
bondy_connect_client:call(Conn, <<"com.myapp.users.get">>, [123]),
bondy_connect_client:call(Conn, <<"com.myapp.orders.get">>, [456]),
bondy_connect_client:call(Conn, <<"com.myapp.products.get">>, [789]).
```

:::

## Invocation Policies

When multiple Callees register the same procedure, the Router uses the invocation policy to select which one:

| Policy | Behavior |
|--------|----------|
| **single** | Only one Callee allowed (default) |
| **roundrobin** | Rotate through Callees sequentially |
| **random** | Random selection |
| **first** | First registered Callee |
| **last** | Last registered Callee |

::: code-group sdk

```javascript [JavaScript]
// Enable load balancing
wampy.register('com.myapp.api.process', {
    rpc: handler,
    invoke: 'roundrobin'
});
```

```erlang [Erlang]
%% Enable load balancing
{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.api.process">>, Handler,
    #{invoke => <<"roundrobin">>}
).
```

:::

## Use Cases

### Microservice APIs

Exposing service operations:

::: code-group sdk

```javascript [JavaScript]
// Order Service
wampy.register('com.shop.orders.create', {
    rpc: async function(args, kwargs) {
        const order = await createOrder(kwargs);
        return {order_id: order.id, status: 'created'};
    }
});

// Frontend calls
wampy.call('com.shop.orders.create', null, {
    user_id: 123,
    items: [{product_id: 1, quantity: 2}]
});
```

```erlang [Erlang]
%% Order Service
CreateOrder = fun(_Args, KWArgs, _Details) ->
    #{id := OrderId} = create_order(KWArgs),
    {ok, #{args => [#{
        <<"order_id">> => OrderId,
        <<"status">> => <<"created">>
    }]}}
end,

{ok, _} = bondy_connect_client:register(
    Conn, <<"com.shop.orders.create">>, CreateOrder
),

%% Frontend calls
bondy_connect_client:call(Conn, <<"com.shop.orders.create">>, [], #{
    <<"user_id">> => 123,
    <<"items">> => [#{<<"product_id">> => 1, <<"quantity">> => 2}]
}).
```

:::

### Distributed Computation

Offloading heavy processing:

::: code-group sdk

```javascript [JavaScript]
// Worker registers
wampy.register('com.app.process_image', {
    rpc: async function(args) {
        const imageUrl = args[0];
        const processed = await heavyImageProcessing(imageUrl);
        return {url: processed.url};
    }
});

// Client calls
wampy.call('com.app.process_image', ['https://example.com/photo.jpg']);
```

```erlang [Erlang]
%% Worker registers
ProcessImage = fun([ImageUrl], _KWArgs, _Details) ->
    #{url := Url} = heavy_image_processing(ImageUrl),
    {ok, #{args => [#{<<"url">> => Url}]}}
end,

{ok, _} = bondy_connect_client:register(
    Conn, <<"com.app.process_image">>, ProcessImage
),

%% Client calls
bondy_connect_client:call(
    Conn, <<"com.app.process_image">>, [<<"https://example.com/photo.jpg">>]
).
```

:::

### Device Control

IoT device control:

::: code-group sdk

```javascript [JavaScript]
// Device service registers one handler for every device.
// details.procedure carries the concrete URI, e.g.
// com.iot.device.livingroom.set_temperature
wampy.register('com.iot.device..set_temperature', {
    rpc: function(args, kwargs, details) {
        const deviceId = details.procedure.split('.')[3];
        setTemperature(deviceId, args[0]);
        return {status: 'ok', value: args[0]};
    },
    match: 'wildcard'
});

// Controller calls
wampy.call('com.iot.device.livingroom.set_temperature', [22]);
```

```erlang [Erlang]
%% Device service registers one handler for every device.
%% The procedure detail carries the concrete URI, e.g.
%% com.iot.device.livingroom.set_temperature
SetTemperature = fun([Value], _KWArgs, #{procedure := Procedure}) ->
    DeviceId = lists:nth(4, binary:split(Procedure, <<".">>, [global])),
    ok = set_temperature(DeviceId, Value),
    {ok, #{args => [#{<<"status">> => <<"ok">>, <<"value">> => Value}]}}
end,

{ok, _} = bondy_connect_client:register(
    Conn, <<"com.iot.device..set_temperature">>, SetTemperature,
    #{match => <<"wildcard">>}
),

%% Controller calls
bondy_connect_client:call(
    Conn, <<"com.iot.device.livingroom.set_temperature">>, [22]
).
```

:::

### Real-Time Queries

Data retrieval:

::: code-group sdk

```javascript [JavaScript]
// Database service
wampy.register('com.db.users.search', {
    rpc: function(args, kwargs) {
        return database.search('users', kwargs.query);
    }
});

// Application calls
wampy.call('com.db.users.search', null, {
    query: {age: {$gt: 18}},
    limit: 10
});
```

```erlang [Erlang]
%% Database service
Search = fun(_Args, #{<<"query">> := Query}, _Details) ->
    {ok, #{args => [database:search(users, Query)]}}
end,

{ok, _} = bondy_connect_client:register(
    Conn, <<"com.db.users.search">>, Search
),

%% Application calls
bondy_connect_client:call(Conn, <<"com.db.users.search">>, [], #{
    <<"query">> => #{<<"age">> => #{<<"$gt">> => 18}},
    <<"limit">> => 10
}).
```

:::

## Best Practices

### Procedure Design

**Use verb-noun structure:**
```
com.myapp.users.user.create
com.myapp.orders.order.get
com.myapp.products.product.search
```

**Be idempotent when possible:**
- Same input → same output
- Safe to retry on failure
- Important for network reliability

**Return structured data:**

::: code-group sdk

```javascript [JavaScript]
// Good
return {status: 'success', user_id: 123, created_at: Date.now()};

// Avoid
return 123;  // Unclear what this number means
```

```erlang [Erlang]
%% Good
Good = {ok, #{args => [#{
    <<"status">> => <<"success">>,
    <<"user_id">> => 123,
    <<"created_at">> => erlang:system_time(millisecond)
}]}},

%% Avoid: unclear what this number means
Avoid = {ok, #{args => [123]}}.
```

:::

### Error Handling

**Use descriptive error URIs:**

::: code-group sdk

```javascript [JavaScript]
// In RPC handler
throw {
    error: 'com.myapp.error.invalid_input',
    args: ['Invalid email format'],
    kwargs: {field: 'email', value: email}
};
```

```erlang [Erlang]
%% In the handler
{error, #{
    uri => <<"com.myapp.error.invalid_input">>,
    args => [<<"Invalid email format">>],
    kwargs => #{<<"field">> => <<"email">>, <<"value">> => Email}
}}.
```

:::

**Handle timeouts:**

::: code-group sdk

```javascript [JavaScript]
wampy.call('com.myapp.slow_op', null, null, {
    timeout: 10000,
    onSuccess: result => console.log(result),
    onError: error => {
        if (error.error === 'wamp.error.timeout') {
            console.log('Operation timed out');
        }
    }
});
```

```erlang [Erlang]
case
    bondy_connect_client:call(
        Conn, <<"com.myapp.slow_op">>, [], #{}, #{timeout => 10000}
    )
of
    {ok, Result} ->
        io:format("~p~n", [Result]);
    {error, #{kind := wamp, uri := <<"wamp.error.timeout">>}} ->
        io:format("Operation timed out~n");
    {error, #{kind := client, reason := timeout}} ->
        %% The SDK's own timer fired before the router answered
        io:format("Operation timed out~n");
    {error, Error} ->
        io:format("Call failed: ~p~n", [Error])
end.
```

:::

### Performance

**Keep procedures fast:**
- Aim for < 100ms response time
- Offload heavy work to async tasks
- Use progressive results for long operations

**Keep registration references:**

::: code-group sdk

```javascript [JavaScript]
// Register and keep reference for later unregistration
wampy.register('com.myapp.proc', { rpc: handler });
```

```erlang [Erlang]
%% Register and keep the id for later unregistration
{ok, RegistrationId} = bondy_connect_client:register(
    Conn, <<"com.myapp.proc">>, Handler
),

ok = bondy_connect_client:unregister(Conn, RegistrationId).
```

:::

**Batch related calls:**

::: code-group sdk

```javascript [JavaScript]
// Instead of multiple calls
wampy.call('com.myapp.get', [1]);
wampy.call('com.myapp.get', [2]);
wampy.call('com.myapp.get', [3]);

// Consider single batch call
wampy.call('com.myapp.get_batch', [[1, 2, 3]]);
```

```erlang [Erlang]
%% Instead of multiple calls
bondy_connect_client:call(Conn, <<"com.myapp.get">>, [1]),
bondy_connect_client:call(Conn, <<"com.myapp.get">>, [2]),
bondy_connect_client:call(Conn, <<"com.myapp.get">>, [3]),

%% Consider single batch call
bondy_connect_client:call(Conn, <<"com.myapp.get_batch">>, [[1, 2, 3]]).
```

:::

## Security

### Authorization

RPC operations are authorized per procedure URI:

- **Register permission** - Who can register procedures
- **Call permission** - Who can call procedures

```
# Allow registration of user procedures (match: prefix)
com.myapp.users.

# Allow calling public APIs only (match: prefix)
com.myapp.public.
```

### Input Validation

Always validate inputs:

::: code-group sdk

```javascript [JavaScript]
wampy.register('com.myapp.create_user', {
    rpc: function(args, kwargs) {
        if (!kwargs.email || !isValidEmail(kwargs.email)) {
            throw new Error('com.myapp.error.invalid_email');
        }

        // Process valid input
    }
});
```

```erlang [Erlang]
CreateUser = fun(_Args, KWArgs, _Details) ->
    Email = maps:get(<<"email">>, KWArgs, undefined),
    case is_valid_email(Email) of
        true ->
            %% Process valid input
            {ok, #{}};
        false ->
            {error, #{uri => <<"com.myapp.error.invalid_email">>}}
    end
end,

{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.create_user">>, CreateUser
).
```

:::

## Comparison with Other RPC Systems

| Feature | WAMP RPC | HTTP/REST | gRPC |
|---------|----------|-----------|------|
| **Routing** | Through Router | Direct | Direct |
| **Discovery** | Dynamic | Static/Service discovery | Static/Service discovery |
| **Bidirectional** | Yes | No | Yes (streaming) |
| **Load Balancing** | Built-in | External LB | External LB |
| **Connection** | Persistent | Per-request | Persistent (HTTP/2) |
| **Peer-to-Peer** | Yes | No | No |

## See Also

- [Advanced RPC](/connect/concepts/wamp/advanced/rpc) - Progressive results, cancellation, pattern registration
- [Communication Patterns](/connect/concepts/wamp/communication_patterns) - RPC vs PubSub
- [Publish/Subscribe](/connect/concepts/wamp/pubsub) - Event-driven pattern
- [Security](/connect/concepts/wamp/security) - Authentication and authorization
