---
draft: false
related:
    - text: Routed RPC
      type: concepts
      link: /connect/concepts/wamp/rpc
      description: Learn the fundamentals of Remote Procedure Calls in WAMP.
    - text: Beyond the Basics
      type: concepts
      link: /connect/concepts/wamp/beyond_the_basics
      description: Essential advanced features for production systems.
---
# Advanced RPC

This page explains the WAMP Advanced Profile RPC features that Bondy implements, and the Bondy-specific options that extend them. For the full list of features Bondy announces and implements, see [WAMP protocol support](/connect/reference/protocols/wamp#routed-rpc-1).

## Call Cancelling

Cancel in-flight RPC calls when results are no longer needed. This prevents wasted computation and allows callees to free resources.

### Cancelling from Caller

Request cancellation of an outstanding call:

::: code-group sdk

```javascript [JavaScript]
// Start a long-running operation
const callId = wampy.call('com.myapp.process_large_file', [fileData], {
    onSuccess: function(result) {
        // This won't be called if cancelled
        console.log('Processing complete:', result);
    },
    onError: function(error) {
        if (error.error === 'wamp.error.canceled') {
            console.log('Operation was cancelled');
        }
    }
});

// User cancels the operation
document.getElementById('cancel-button').addEventListener('click', function() {
    wampy.cancel(callId, {
        mode: 'kill'  // Ask callee to abort immediately
    });
});
```

```erlang [Erlang]
%% Start a long-running operation
{ok, Token} = bondy_connect_client:call_async(
    Conn, <<"com.myapp.process_large_file">>, [FileData]
),

%% The user cancels the operation: ask the callee to abort immediately
ok = bondy_connect_client:cancel(Conn, Token, kill),

%% The reply to the call still arrives as a message
receive
    {bondy_connect_client, Token, {ok, Result}} ->
        io:format("Processing complete: ~p~n", [Result]);
    {bondy_connect_client, Token,
        {error, #{kind := wamp, uri := <<"wamp.error.canceled">>}}} ->
        io:format("Operation was cancelled~n")
end.
```

:::

### Cancellation Modes

The `mode` option of `CANCEL` controls how far the cancellation goes:

::: code-group sdk

```javascript [JavaScript]
// Skip mode - don't interrupt callee, just ignore result
wampy.cancel(callId, {mode: 'skip'});

// Kill mode - ask callee to abort and wait for its answer
wampy.cancel(callId, {mode: 'kill'});

// Killnowait mode - ask callee to abort, don't wait for its answer
wampy.cancel(callId, {mode: 'killnowait'});
```

```erlang [Erlang]
%% Skip mode - don't interrupt callee, just ignore result
bondy_connect_client:cancel(Conn, Token, skip),

%% Kill mode - ask callee to abort and wait for its answer
bondy_connect_client:cancel(Conn, Token, kill),

%% Killnowait mode - ask callee to abort, don't wait for its answer.
%% cancel/2 uses this mode.
bondy_connect_client:cancel(Conn, Token, killnowait).
```

:::

Bondy handles each mode as follows:

- **`skip`** (the default when `mode` is absent): Bondy answers the caller at once with `wamp.error.canceled` and does not send `INTERRUPT` to the callee. The callee keeps working; Bondy discards its result when it arrives.
- **`kill`**: Bondy sends `INTERRUPT` to the callee and does not answer the caller itself. The callee's response settles the call. That response is normally an `ERROR`, but it can be a `RESULT` if the callee finished first.
- **`killnowait`**: Bondy answers the caller at once with `wamp.error.canceled` and sends `INTERRUPT` to the callee. Bondy discards any later response from the callee.

The caller must be authorized for the `wamp.cancel` action on the procedure. Bondy sends `INTERRUPT` only to a callee that announced `call_canceling` in `HELLO`. For any other callee, `kill` and `killnowait` act as `skip`, whether the callee runs on the caller's node or on another. A session obtains `call_canceling` only when its `HELLO` announces it.

### Handling Cancellation in Callee

A callee learns of a `kill` or `killnowait` cancellation through an `INTERRUPT` message. How a client library exposes `INTERRUPT` varies; this example assumes it aborts a signal:

::: code-group sdk

```javascript [JavaScript]
wampy.register('com.myapp.process_large_file', {
    rpc: function(args, kwargs, details) {
        const abortController = new AbortController();

        // Wire the library's INTERRUPT notification to
        // abortController.abort(). How depends on the client library.

        // Perform work with ability to abort
        return processFileWithAbort(args[0], abortController.signal);
    }
});

async function processFileWithAbort(fileData, signal) {
    for (let i = 0; i < fileData.chunks.length; i++) {
        if (signal.aborted) {
            throw new Error('Operation cancelled');
        }
        await processChunk(fileData.chunks[i]);
    }
    return {processed: true};
}
```

```erlang [Erlang]
%% The SDK runs each invocation in its own worker process. On INTERRUPT it
%% kills that worker, so the handler needs no abort check of its own.
ProcessLargeFile = fun([FileData], _KWArgs, _Details) ->
    lists:foreach(fun process_chunk/1, maps:get(<<"chunks">>, FileData)),
    {ok, #{args => [#{<<"processed">> => true}]}}
end,

{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.process_large_file">>, ProcessLargeFile
).
```

:::

### Use Cases

- **User-initiated cancellation** - Cancel operations when user navigates away
- **Timeout-based cancellation** - Cancel when local timeout expires
- **Resource management** - Free server resources for cancelled operations
- **Search optimization** - Cancel outdated searches when new query arrives

**Example: Search with automatic cancellation**

::: code-group sdk

```javascript [JavaScript]
let lastSearchCall = null;

function performSearch(query) {
    // Cancel previous search if still running
    if (lastSearchCall) {
        wampy.cancel(lastSearchCall, {mode: 'kill'});
    }

    // Start new search
    lastSearchCall = wampy.call('com.myapp.search', [query], {
        onSuccess: function(results) {
            displayResults(results);
            lastSearchCall = null;
        },
        onError: function(error) {
            if (error.error !== 'wamp.error.canceled') {
                console.error('Search failed:', error);
            }
            lastSearchCall = null;
        }
    });
}

// As user types, only the latest search completes
searchInput.addEventListener('input', function(e) {
    performSearch(e.target.value);
});
```

```erlang [Erlang]
%% Cancels the previous search, if any is still running, and starts a new
%% one. Returns the token of the new search; keep it for the next call.
PerformSearch = fun(Query, LastSearch) ->
    case LastSearch of
        undefined -> ok;
        _ -> bondy_connect_client:cancel(Conn, LastSearch, kill)
    end,
    {ok, Token} = bondy_connect_client:call_async(
        Conn, <<"com.myapp.search">>, [Query]
    ),
    Token
end,

%% As the user types, only the latest search completes. The process that
%% called PerformSearch receives the replies.
HandleReply = fun
    ({bondy_connect_client, _Token, {ok, #{args := [Results]}}}) ->
        display_results(Results);
    ({bondy_connect_client, _Token,
        {error, #{kind := wamp, uri := <<"wamp.error.canceled">>}}}) ->
        ok;
    ({bondy_connect_client, _Token, {error, Error}}) ->
        io:format("Search failed: ~p~n", [Error])
end.
```

:::

## Call Timeouts

A call timeout bounds how long a caller waits for a result. Bondy enforces it in the router: when the time is up, Bondy sends the caller an `ERROR` with `wamp.error.timeout`. Bondy does not send `INTERRUPT` to the callee, and it discards any result the callee sends later.

Bondy never runs a call without a limit. The WAMP specification reads a missing or zero `timeout` as "no timeout"; Bondy reads them this way:

- `timeout` absent: Bondy uses [`wamp.call_timeout`](/connect/reference/configuration/wamp#wamp.call_timeout), 30 seconds by default.
- `timeout` set to `0`: Bondy uses [`wamp.max_call_timeout`](/connect/reference/configuration/wamp#wamp.max_call_timeout), 10 minutes by default.
- `timeout` greater than `0`: Bondy uses that value.

### Basic Timeout

Set timeout in milliseconds:

::: code-group sdk

```javascript [JavaScript]
wampy.call('com.myapp.external_api', [data], {
    timeout: 5000,  // 5 second timeout
    onSuccess: function(result) {
        console.log('Call completed:', result);
    },
    onError: function(error) {
        if (error.error === 'wamp.error.timeout') {
            console.log('Call timed out');
        } else {
            console.error('Call failed:', error);
        }
    }
});
```

```erlang [Erlang]
case
    bondy_connect_client:call(
        Conn, <<"com.myapp.external_api">>, [Data], #{},
        #{timeout => 5000}  %% 5 second timeout
    )
of
    {ok, Result} ->
        io:format("Call completed: ~p~n", [Result]);
    {error, #{kind := wamp, uri := <<"wamp.error.timeout">>}} ->
        io:format("Call timed out~n");
    {error, #{kind := client, reason := timeout}} ->
        %% The SDK's own timer fired before the router answered
        io:format("Call timed out~n");
    {error, Error} ->
        io:format("Call failed: ~p~n", [Error])
end.
```

:::

### Different Timeouts for Different Operations

Adjust timeouts based on expected operation duration:

::: code-group sdk

```javascript [JavaScript]
// Fast operations - short timeout
wampy.call('com.myapp.cache.get', [key], {
    timeout: 1000  // 1 second
});

// Medium operations - moderate timeout
wampy.call('com.myapp.db.query', [sql], {
    timeout: 10000  // 10 seconds
});

// Long operations - extended timeout
wampy.call('com.myapp.report.generate', [params], {
    timeout: 60000  // 60 seconds
});
```

```erlang [Erlang]
%% Fast operations - short timeout
bondy_connect_client:call(
    Conn, <<"com.myapp.cache.get">>, [Key], #{},
    #{timeout => 1000}  %% 1 second
),

%% Medium operations - moderate timeout
bondy_connect_client:call(
    Conn, <<"com.myapp.db.query">>, [Sql], #{},
    #{timeout => 10000}  %% 10 seconds
),

%% Long operations - extended timeout
bondy_connect_client:call(
    Conn, <<"com.myapp.report.generate">>, [Params], #{},
    #{timeout => 60000}  %% 60 seconds
).
```

:::

### Timeout with Retry

Combine timeouts with retry logic:

::: code-group sdk

```javascript [JavaScript]
async function callWithTimeout(procedure, args, timeout, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await new Promise((resolve, reject) => {
                wampy.call(procedure, args, {
                    timeout: timeout,
                    onSuccess: resolve,
                    onError: reject
                });
            });
        } catch (error) {
            if (error.error === 'wamp.error.timeout' && attempt < maxRetries) {
                console.log(`Timeout on attempt ${attempt}, retrying...`);
                // Exponential backoff
                await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 100));
                continue;
            }
            throw error;
        }
    }
}

// Usage
try {
    const result = await callWithTimeout('com.myapp.api', [data], 5000, 3);
    console.log('Success:', result);
} catch (error) {
    console.error('Failed after retries:', error);
}
```

```erlang [Erlang]
IsTimeout = fun
    (#{kind := wamp, uri := <<"wamp.error.timeout">>}) -> true;
    (#{kind := client, reason := timeout}) -> true;
    (_) -> false
end,

CallWithTimeout = fun Retry(Procedure, Args, Timeout, Attempt, MaxRetries) ->
    Options = #{timeout => Timeout},
    case bondy_connect_client:call(Conn, Procedure, Args, #{}, Options) of
        {ok, Result} ->
            {ok, Result};
        {error, Error} ->
            case IsTimeout(Error) andalso Attempt < MaxRetries of
                true ->
                    io:format("Timeout on attempt ~p, retrying...~n", [Attempt]),
                    %% Exponential backoff
                    timer:sleep(trunc(math:pow(2, Attempt)) * 100),
                    Retry(Procedure, Args, Timeout, Attempt + 1, MaxRetries);
                false ->
                    {error, Error}
            end
    end
end,

%% Usage
case CallWithTimeout(<<"com.myapp.api">>, [Data], 5000, 1, 3) of
    {ok, Result} ->
        io:format("Success: ~p~n", [Result]);
    {error, Error} ->
        io:format("Failed after retries: ~p~n", [Error])
end.
```

:::

### Use Cases

- **External APIs** - Prevent hanging on slow third-party services
- **Database queries** - Detect runaway queries early
- **User experience** - Provide feedback instead of indefinite loading
- **Resource management** - Free connections from timed-out calls

## Call Trust Levels

Bondy does not implement call trust levels. See [WAMP protocol support](/connect/reference/protocols/wamp#routed-rpc-1).

## Caller Identification

Caller identification lets a callee know who is calling its procedure, for audit logging, rate limiting, or checks beyond RBAC.

### What Bondy Discloses

When Bondy discloses the caller, it adds these attributes to `INVOCATION.Details`:

- `caller` — the caller's session ID.
- `caller_authid` — the caller's authentication ID.
- `caller_authrole` — the caller's authentication role.
- `x_caller_guid` — Bondy's internal session identifier for the caller. This is a Bondy extension.

::: code-group sdk

```javascript [JavaScript]
wampy.register('com.myapp.sensitive.operation', {
    rpc: function(args, kwargs, details) {
        console.log('Called by session:', details.caller);
        console.log('Authenticated as:', details.caller_authid);

        // Additional authorization
        if (!isAuthorized(details.caller_authid)) {
            throw new Error('Unauthorized caller');
        }

        // Audit logging
        auditLog({
            operation: 'sensitive.operation',
            caller: details.caller_authid,
            timestamp: Date.now()
        });

        return performOperation(args, kwargs);
    }
});
```

```erlang [Erlang]
SensitiveOperation = fun(Args, KWArgs, Details) ->
    #{caller := Caller, caller_authid := Authid} = Details,
    io:format("Called by session: ~p~n", [Caller]),
    io:format("Authenticated as: ~s~n", [Authid]),

    %% Additional authorization
    case is_authorized(Authid) of
        false ->
            {error, #{uri => <<"com.myapp.error.unauthorized">>}};
        true ->
            %% Audit logging
            audit_log(#{
                operation => <<"sensitive.operation">>,
                caller => Authid,
                timestamp => erlang:system_time(millisecond)
            }),
            {ok, #{args => [perform_operation(Args, KWArgs)]}}
    end
end,

{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.sensitive.operation">>, SensitiveOperation
).
```

:::

### When Bondy Discloses the Caller

Two options govern disclosure: `disclose_caller` on the callee's `REGISTER`, and `disclose_me` on the caller's `CALL`. Both default to `true`. Bondy discloses the caller unless **both** are `false`. Either side alone can request disclosure; neither side alone can prevent it.

::: code-group sdk

```javascript [JavaScript]
// Caller opts out. The caller is still disclosed unless the
// registration also set disclose_caller: false.
wampy.call('com.myapp.sensitive.operation', [data], {
    disclose_me: false
});
```

```erlang [Erlang]
%% Caller opts out. The caller is still disclosed unless the
%% registration also set disclose_caller to false.
bondy_connect_client:call(
    Conn, <<"com.myapp.sensitive.operation">>, [Data], #{},
    #{disclose_me => false}
).
```

:::

The WAMP specification makes disclosure opt-in. Bondy makes it opt-out.

Bondy never discloses a caller that is internal to Bondy itself.

### Per-Caller Rate Limiting

Use caller identification for rate limiting:

::: code-group sdk

```javascript [JavaScript]
const callCounts = new Map();

wampy.register('com.myapp.api.search', {
    rpc: function(args, kwargs, details) {
        const caller = details.caller;
        const now = Date.now();

        // Track calls per caller
        if (!callCounts.has(caller)) {
            callCounts.set(caller, []);
        }

        const calls = callCounts.get(caller);
        // Remove calls older than 1 minute
        const recentCalls = calls.filter(t => now - t < 60000);

        if (recentCalls.length >= 100) {
            throw new Error('Rate limit exceeded');
        }

        recentCalls.push(now);
        callCounts.set(caller, recentCalls);

        return performSearch(args[0]);
    }
});
```

```erlang [Erlang]
%% Each invocation runs in its own process, so the handler keeps the call
%% times in a public ETS table rather than in its own state.
CallTimes = ets:new(call_times, [public, duplicate_bag]),

Search = fun([Query], _KWArgs, #{caller := Caller}) ->
    Now = erlang:monotonic_time(millisecond),
    Cutoff = Now - 60000,

    %% Remove calls older than 1 minute
    ets:select_delete(
        CallTimes, [{{Caller, '$1'}, [{'<', '$1', Cutoff}], [true]}]
    ),

    case ets:select_count(CallTimes, [{{Caller, '_'}, [], [true]}]) of
        Count when Count >= 100 ->
            {error, #{uri => <<"com.myapp.error.rate_limit_exceeded">>}};
        _ ->
            ets:insert(CallTimes, {Caller, Now}),
            {ok, #{args => [perform_search(Query)]}}
    end
end,

{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.api.search">>, Search
).
```

:::

### Authorization Based on Caller

Implement fine-grained access control:

::: code-group sdk

```javascript [JavaScript]
const userPermissions = new Map();

wampy.register('com.myapp.admin.delete_user', {
    rpc: async function(args, kwargs, details) {
        // Look up the caller's permissions by its authentication ID
        const permissions = await getUserPermissions(details.caller_authid);

        if (!permissions.includes('user.delete')) {
            throw new Error('Insufficient permissions');
        }

        return deleteUser(args[0]);
    }
});
```

```erlang [Erlang]
DeleteUser = fun([UserId], _KWArgs, #{caller_authid := Authid}) ->
    %% Look up the caller's permissions by its authentication ID
    Permissions = get_user_permissions(Authid),

    case lists:member(<<"user.delete">>, Permissions) of
        true ->
            {ok, #{args => [delete_user(UserId)]}};
        false ->
            {error, #{uri => <<"com.myapp.error.insufficient_permissions">>}}
    end
end,

{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.admin.delete_user">>, DeleteUser
).
```

:::

### Use Cases

- **Audit trails** - Track who performed what operations
- **Rate limiting** - Enforce per-caller quotas
- **Authorization** - Additional access control beyond RBAC
- **Usage analytics** - Understand API usage patterns
- **Debugging** - Trace problematic callers

## Pattern-based Registrations

Register procedures using URI patterns instead of exact URIs, enabling flexible, dynamic service implementations.

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
                return listUsers(kwargs);
            case 'create':
                return createUser(kwargs);
            case 'update':
                return updateUser(args[0], kwargs);
            case 'delete':
                return deleteUser(args[0]);
            default:
                throw new Error('Unknown operation: ' + operation);
        }
    },
    match: 'prefix'
});

// All these calls route to the same handler
wampy.call('com.myapp.users.get', [123]);
wampy.call('com.myapp.users.list', null, {limit: 10});
wampy.call('com.myapp.users.create', null, {name: 'Alice'});
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
        <<"update">> ->
            {ok, #{args => [update_user(hd(Args), KWArgs)]}};
        <<"delete">> ->
            {ok, #{args => [delete_user(hd(Args))]}};
        Operation ->
            {error, #{
                uri => <<"com.myapp.error.unknown_operation">>,
                args => [Operation]
            }}
    end
end,

{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.users.">>, Users, #{match => <<"prefix">>}
),

%% All these calls route to the same handler
bondy_connect_client:call(Conn, <<"com.myapp.users.get">>, [123]),
bondy_connect_client:call(
    Conn, <<"com.myapp.users.list">>, [], #{<<"limit">> => 10}
),
bondy_connect_client:call(
    Conn, <<"com.myapp.users.create">>, [], #{<<"name">> => <<"Alice">>}
).
```

:::

### Wildcard Matching

Implement cross-cutting concerns:

::: code-group sdk

```javascript [JavaScript]
// Logging middleware for all operations
wampy.register('com.myapp..log', {
    rpc: function(args, kwargs, details) {
        console.log('Logged operation:', {
            procedure: details.procedure,
            caller: details.caller,
            timestamp: Date.now()
        });

        // Forward to actual handler
        const actualProcedure = details.procedure.replace('.log', '');
        return wampy.call(actualProcedure, args, kwargs);
    },
    match: 'wildcard'
});

// Matches:
// com.myapp.users.log
// com.myapp.orders.log
// com.myapp.products.log
```

```erlang [Erlang]
%% Logging middleware for all operations
Log = fun(Args, KWArgs, #{procedure := Procedure, caller := Caller}) ->
    io:format("Logged operation: ~p~n", [#{
        procedure => Procedure,
        caller => Caller,
        timestamp => erlang:system_time(millisecond)
    }]),

    %% Forward to actual handler
    Actual = binary:replace(Procedure, <<".log">>, <<>>),
    case bondy_connect_client:call(Conn, Actual, Args, KWArgs) of
        {ok, #{args := ResultArgs, kwargs := ResultKWArgs}} ->
            {ok, #{args => ResultArgs, kwargs => ResultKWArgs}};
        {error, #{kind := wamp, uri := Uri}} ->
            {error, #{uri => Uri}}
    end
end,

{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp..log">>, Log, #{match => <<"wildcard">>}
).

%% Matches:
%% com.myapp.users.log
%% com.myapp.orders.log
%% com.myapp.products.log
```

:::

### RESTful Resource Handlers

Build RESTful services with pattern matching:

::: code-group sdk

```javascript [JavaScript]
wampy.register('com.myapp.api.', {
    rpc: function(args, kwargs, details) {
        const parts = details.procedure.split('.');
        const resource = parts[3];  // users, orders, products, etc.
        const operation = parts[4];  // get, list, create, etc.

        return handleResourceOperation(resource, operation, args, kwargs);
    },
    match: 'prefix'
});

async function handleResourceOperation(resource, operation, args, kwargs) {
    const handler = handlers[resource];
    if (!handler) {
        throw new Error('Unknown resource: ' + resource);
    }

    const method = handler[operation];
    if (!method) {
        throw new Error('Unknown operation: ' + operation);
    }

    return method(args, kwargs);
}

// Single registration handles all:
// com.myapp.api.users.get
// com.myapp.api.users.list
// com.myapp.api.orders.create
// com.myapp.api.products.update
```

```erlang [Erlang]
%% Handlers maps a resource to its operations, for example
%% #{<<"users">> => #{<<"get">> => fun get_user/2}}
Api = fun(Args, KWArgs, #{procedure := Procedure}) ->
    %% com.myapp.api.<resource>.<operation>
    [_, _, _, Resource, Operation] =
        binary:split(Procedure, <<".">>, [global]),

    case Handlers of
        #{Resource := #{Operation := Method}} ->
            Method(Args, KWArgs);
        #{Resource := _} ->
            {error, #{
                uri => <<"com.myapp.error.unknown_operation">>,
                args => [Operation]
            }};
        _ ->
            {error, #{
                uri => <<"com.myapp.error.unknown_resource">>,
                args => [Resource]
            }}
    end
end,

{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.api.">>, Api, #{match => <<"prefix">>}
).

%% Single registration handles all:
%% com.myapp.api.users.get
%% com.myapp.api.users.list
%% com.myapp.api.orders.create
%% com.myapp.api.products.update
```

:::

### Dynamic Routing Based on Content

Route to different implementations based on arguments:

::: code-group sdk

```javascript [JavaScript]
wampy.register('com.myapp.payment.', {
    rpc: function(args, kwargs, details) {
        const method = details.procedure.split('.').pop();
        const provider = kwargs.payment_provider;

        // Route to provider-specific handler
        switch (provider) {
            case 'stripe':
                return handleStripePayment(method, args, kwargs);
            case 'paypal':
                return handlePaypalPayment(method, args, kwargs);
            default:
                throw new Error('Unsupported provider: ' + provider);
        }
    },
    match: 'prefix'
});
```

```erlang [Erlang]
Payment = fun(Args, KWArgs, #{procedure := Procedure}) ->
    Method = lists:last(binary:split(Procedure, <<".">>, [global])),

    %% Route to provider-specific handler
    case maps:get(<<"payment_provider">>, KWArgs, undefined) of
        <<"stripe">> ->
            handle_stripe_payment(Method, Args, KWArgs);
        <<"paypal">> ->
            handle_paypal_payment(Method, Args, KWArgs);
        Provider ->
            {error, #{
                uri => <<"com.myapp.error.unsupported_provider">>,
                args => [Provider]
            }}
    end
end,

{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.payment.">>, Payment, #{match => <<"prefix">>}
).
```

:::

### Use Cases

- **Resource-based APIs** - Single handler for CRUD operations
- **Versioned APIs** - Route different versions to different implementations
- **Cross-cutting concerns** - Logging, metrics, tracing
- **Plugin architectures** - Dynamically handle plugin-provided operations
- **Gradual migration** - Intercept and forward to new implementations

## Shared Registrations

Multiple callees can register the same procedure URI, enabling built-in load balancing, redundancy, and scaling.

### Invocation Policies

The `invoke` option of `REGISTER` sets the invocation policy. Bondy accepts the five policies of the WAMP specification: `single`, `roundrobin`, `random`, `first` and `last`. When `invoke` is absent, the policy is `single`.

A registration with a policy other than `single` requires the callee to announce `shared_registration` in `HELLO`. The first registration of a URI fixes its policy. Bondy refuses a later registration of the same URI with `wamp.error.procedure_already_exists` when the existing policy is `single`, or when the later registration asks for a different policy. A node checks and records each registration in one step, so when two callees on the same node register a URI with `single` at the same time, exactly one succeeds.

::: code-group sdk

```javascript [JavaScript]
// Round robin - distribute evenly
wampy.register('com.myapp.process', {
    rpc: processHandler,
    invoke: 'roundrobin'
});

// Random - statistical distribution
wampy.register('com.myapp.process', {
    rpc: processHandler,
    invoke: 'random'
});

// First - always use first registered
wampy.register('com.myapp.process', {
    rpc: processHandler,
    invoke: 'first'
});

// Last - always use last registered
wampy.register('com.myapp.process', {
    rpc: processHandler,
    invoke: 'last'
});

// Single - only one registration allowed
wampy.register('com.myapp.process', {
    rpc: processHandler,
    invoke: 'single'
});
```

```erlang [Erlang]
%% Round robin - distribute evenly
bondy_connect_client:register(
    Conn, <<"com.myapp.process">>, ProcessHandler,
    #{invoke => <<"roundrobin">>}
),

%% Random - statistical distribution
bondy_connect_client:register(
    Conn, <<"com.myapp.process">>, ProcessHandler,
    #{invoke => <<"random">>}
),

%% First - always use first registered
bondy_connect_client:register(
    Conn, <<"com.myapp.process">>, ProcessHandler,
    #{invoke => <<"first">>}
),

%% Last - always use last registered
bondy_connect_client:register(
    Conn, <<"com.myapp.process">>, ProcessHandler,
    #{invoke => <<"last">>}
),

%% Single - only one registration allowed
bondy_connect_client:register(
    Conn, <<"com.myapp.process">>, ProcessHandler,
    #{invoke => <<"single">>}
).
```

:::

### Round Robin Load Balancing

Distribute load evenly across service instances:

::: code-group sdk

```javascript [JavaScript]
// Instance 1
wampy.register('com.myapp.image.process', {
    rpc: function(args, kwargs) {
        return processImage(args[0], 'instance_1');
    },
    invoke: 'roundrobin'
});

// Instance 2
wampy.register('com.myapp.image.process', {
    rpc: function(args, kwargs) {
        return processImage(args[0], 'instance_2');
    },
    invoke: 'roundrobin'
});

// Instance 3
wampy.register('com.myapp.image.process', {
    rpc: function(args, kwargs) {
        return processImage(args[0], 'instance_3');
    },
    invoke: 'roundrobin'
});

// Callers automatically load balanced
// Call 1 → Instance 1
// Call 2 → Instance 2
// Call 3 → Instance 3
// Call 4 → Instance 1 (wraps around)
```

```erlang [Erlang]
ProcessOn = fun(Instance) ->
    fun([Image], _KWArgs, _Details) ->
        {ok, #{args => [process_image(Image, Instance)]}}
    end
end,
RoundRobin = #{invoke => <<"roundrobin">>},

%% Instance 1
{ok, _} = bondy_connect_client:register(
    Conn1, <<"com.myapp.image.process">>, ProcessOn(instance_1), RoundRobin
),

%% Instance 2
{ok, _} = bondy_connect_client:register(
    Conn2, <<"com.myapp.image.process">>, ProcessOn(instance_2), RoundRobin
),

%% Instance 3
{ok, _} = bondy_connect_client:register(
    Conn3, <<"com.myapp.image.process">>, ProcessOn(instance_3), RoundRobin
).

%% Callers automatically load balanced
%% Call 1 → Instance 1
%% Call 2 → Instance 2
%% Call 3 → Instance 3
%% Call 4 → Instance 1 (wraps around)
```

:::

Each Bondy node keeps its own round-robin position; Bondy does not replicate load-balancing state across the cluster. When callers are connected to several nodes, the rotation holds per node, not cluster-wide.

### Primary/Backup Pattern

Use `first` policy for active/standby:

::: code-group sdk

```javascript [JavaScript]
// Primary instance (registered first)
wampy.register('com.myapp.cache.get', {
    rpc: getCacheFromPrimary,
    invoke: 'first'
});

// Backup instance (registered second)
// Only receives calls if primary unregisters
wampy.register('com.myapp.cache.get', {
    rpc: getCacheFromBackup,
    invoke: 'first'
});
```

```erlang [Erlang]
%% Primary instance (registered first)
{ok, _} = bondy_connect_client:register(
    Conn1, <<"com.myapp.cache.get">>, GetCacheFromPrimary,
    #{invoke => <<"first">>}
),

%% Backup instance (registered second)
%% Only receives calls if primary unregisters
{ok, _} = bondy_connect_client:register(
    Conn2, <<"com.myapp.cache.get">>, GetCacheFromBackup,
    #{invoke => <<"first">>}
).
```

:::

### Canary Deployment

Use `last` policy to route to newest version:

::: code-group sdk

```javascript [JavaScript]
// Existing v1 instances
wampy.register('com.myapp.api.process', {
    rpc: processV1,
    invoke: 'last'
});

// Deploy canary v2 instance
// All new calls go to v2
wampy.register('com.myapp.api.process', {
    rpc: processV2,
    invoke: 'last'
});

// If v2 works well, deploy more v2 instances
// If v2 has issues, unregister and traffic returns to v1
```

```erlang [Erlang]
%% Existing v1 instances
{ok, _} = bondy_connect_client:register(
    Conn1, <<"com.myapp.api.process">>, ProcessV1, #{invoke => <<"last">>}
),

%% Deploy canary v2 instance
%% All new calls go to v2
{ok, _} = bondy_connect_client:register(
    Conn2, <<"com.myapp.api.process">>, ProcessV2, #{invoke => <<"last">>}
).

%% If v2 works well, deploy more v2 instances
%% If v2 has issues, unregister and traffic returns to v1
```

:::

### Automatic Failover

When a callee disconnects, Bondy automatically removes its registration:

```javascript
// Start with 3 instances handling calls
// Instance 1 crashes
// Bondy removes Instance 1's registration
// Subsequent calls distributed to Instances 2 & 3
// New Instance 4 comes online
// Bondy includes Instance 4 in distribution
```

No manual intervention required—the router adapts automatically. A call the departing instance was still handling fails with `wamp.error.canceled`, unless Bondy routes it again because it set `CALL.Options._retries` and the registration is idempotent.

### Use Cases

- **Horizontal scaling** - Add more instances to increase capacity
- **High availability** - Continue operating when instances fail
- **Rolling deployments** - Deploy new versions without downtime
- **Geographic distribution** - Place instances near users
- **Resource optimization** - Distribute load across available resources

## Sharded Registrations

Bondy does not implement WAMP sharded registration. See [WAMP protocol support](/connect/reference/protocols/wamp#routed-rpc-1). To send all calls with the same key to the same callee of a shared registration, use the Bondy [partitioned call](#partitioned-calls) extension.

## Payload Passthru Mode

In Payload Passthru Mode the payload is opaque to Bondy. The caller packs the whole payload into one binary, already serialized and possibly encrypted, and Bondy routes it to the callee without reading it. The router never needs the keys or the serializer, so end-to-end encryption between caller and callee is possible.

A message is in Payload Passthru Mode when its options carry `ppt_scheme`. Four options describe the payload:

| Option | Meaning |
|---|---|
| `ppt_scheme` | The key management scheme. Its presence turns the mode on. |
| `ppt_serializer` | The serializer used to encode the payload, for example `json`, `msgpack` or `cbor`. |
| `ppt_cipher` | The encryption algorithm, when the payload is encrypted. |
| `ppt_keyid` | The ID of the key used to encrypt the payload. |

::: code-group sdk

```javascript [JavaScript]
wampy.call('com.myapp.process_video_frame', [encryptedFrame], {
    ppt_scheme: 'x_myapp',
    ppt_serializer: 'cbor',
    ppt_cipher: 'xsalsa20poly1305',
    ppt_keyid: 'key-2024-07'
});
```

:::

Bondy copies the `ppt_*` options of a `CALL` into `INVOCATION.Details`, and the options of a `YIELD` into `RESULT.Details`, so the receiving peer knows how to decode the payload.

The mode constrains the message:

- The payload must be a single binary positional argument, or no payload at all. A message in Payload Passthru Mode with keyword arguments, or with any other arguments, is invalid.
- Bondy cannot read the payload, so it cannot serve a `CALL` in this mode to a procedure that Bondy implements itself. It refuses such a call with `wamp.error.invalid_argument`.
- An `ERROR` that Bondy raises itself, such as an authorization refusal, carries no `ppt_*` details, because it has no opaque payload.

See [Payload Passthru Mode](/connect/reference/serialization#payload-passthru-mode) in the serialization reference.

## Progressive Call Results

Stream results from procedures back to callers incrementally, so a long-running operation can report partial output before its final result — paging a large result set, streaming file chunks, or reporting progress on a long computation.

Bondy always offers the feature; it has no configuration setting. It negotiates end to end: it activates only when the caller announced `progressive_call_results` in `HELLO` and the callee announced both `progressive_call_results` and `call_canceling`. The specification requires a callee that supports progressive results to support call canceling, so that Bondy can interrupt it when its caller leaves. If either side didn't opt in, the option is silently removed — the callee sees a plain invocation, replies once, and the caller gets a single final result. Degradation is silent by design; the call still succeeds.

Callees send partial results:

::: code-group sdk

```javascript [JavaScript]
wampy.register('com.myapp.large_query', {
    rpc: async function(args, kwargs, details) {
        const results = [];

        // Only present when the caller requested progressive results.
        if (details.progress) {
            for await (const row of executeQuery(args[0])) {
                results.push(row);
                details.progress({rows_processed: results.length, current_row: row});
            }
        }

        // Final result either way.
        return {total_rows: results.length, results: results};
    }
});
```

```erlang [Erlang]
LargeQuery = fun([Query], _KWArgs, Details) ->
    Rows = execute_query(Query),

    %% Only present when the caller requested progressive results.
    case Details of
        #{progress := Progress} ->
            lists:foldl(
                fun(Row, Count) ->
                    ok = Progress([#{
                        <<"rows_processed">> => Count + 1,
                        <<"current_row">> => Row
                    }], #{}),
                    Count + 1
                end,
                0,
                Rows
            );
        _ ->
            ok
    end,

    %% Final result either way.
    {ok, #{args => [#{
        <<"total_rows">> => length(Rows),
        <<"results">> => Rows
    }]}}
end,

{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.large_query">>, LargeQuery
).
```

:::

Callers opt in with `receive_progress` and receive each progressive result before the single terminal one:

::: code-group sdk

```javascript [JavaScript]
wampy.call('com.myapp.large_query', [query], {
    receive_progress: true,
    onSuccess: function(finalResult) {
        console.log('Query complete:', finalResult);
    },
    onProgress: function(progressData) {
        // Called once per progressive result, in order, before onSuccess.
        console.log('Progress:', progressData.rows_processed);
        updateUI(progressData.current_row);
    }
});
```

```erlang [Erlang]
{ok, Token} = bondy_connect_client:call_async(
    Conn, <<"com.myapp.large_query">>, [Query], #{},
    #{receive_progress => true}
),

Receive = fun Loop() ->
    receive
        {bondy_connect_client, Token, {progress, #{args := [Progress]}}} ->
            %% One message per progressive result, in order, before the
            %% final result.
            io:format("Progress: ~p~n", [
                maps:get(<<"rows_processed">>, Progress)
            ]),
            update_ui(maps:get(<<"current_row">>, Progress)),
            Loop();
        {bondy_connect_client, Token, {ok, #{args := [FinalResult]}}} ->
            io:format("Query complete: ~p~n", [FinalResult]);
        {bondy_connect_client, Token, {error, Error}} ->
            io:format("Query failed: ~p~n", [Error])
    end
end,

Receive().
```

:::

This holds across the cluster too: when caller and callee are on different nodes, progressive results are relayed between nodes and still arrive in yield order. `CALL.Options.timeout` is the inactivity window between results — each one restarts it — so a healthy, slowly-dripping stream is not cut off; the Bondy extension `CALL.Options._deadline` (milliseconds) additionally caps the whole call regardless of activity. Cancellation works mid-stream, including across nodes. See [Progressive Call Results](/connect/sdk/erlang/reference) in the `bondy_connect` reference for the Erlang API.

### Use Cases

- **Large result sets** - Stream database query results
- **Progress feedback** - Update UI as work progresses
- **Real-time processing** - Display results as they're computed
- **Incremental rendering** - Show partial data while loading

## Progressive Call Invocations

The mirror image of progressive results: stream a call's **arguments** from caller to callee in successive chunks under one request, so a caller can send a large payload — a file upload, a client-side stream — without buffering it whole before the call.

Bondy always offers the feature; it has no configuration setting. Unlike progressive results, this is **not** silently downgraded: because the caller has already begun streaming, the call fails outright rather than being reinterpreted as a plain call. A progressive `CALL` from a caller that didn't announce `progressive_call_invocations` in `HELLO` is a protocol error: Bondy aborts the caller's session with `wamp.error.protocol_violation`. A caller that announced the feature must number its requests in sequence, as WAMP requires: Bondy aborts its session on a `CALL` whose request id skips ahead or reuses the id of a live call to the same procedure that is not a progressive call, and discards a chunk that arrives after its call has completed or that names another procedure. The first chunk's options apply to the whole stream, and the first chunk is the only one authorized: a permission revoked during a stream refuses the caller's next call, not the open stream. A callee supports the feature only if it announced both `progressive_call_invocations` and `call_canceling`; a call to any other callee, or to a `wamp.*` or `bondy.*` procedure, gets `wamp.error.feature_not_supported`.

Callers send arguments progressively, reusing one request across chunks:

::: code-group sdk

```javascript [JavaScript]
const call = wampy.call('com.myapp.process_stream', [firstChunk], {
    onSuccess: function(result) {
        console.log('Stream processing complete:', result);
    },
    progressive: true
});

// Send further chunks under the same call.
for (const chunk of remainingChunks) {
    call.progress(chunk);
}

// Final chunk closes the input stream.
call.complete(lastChunk);
```

```erlang [Erlang]
{ok, Token} = bondy_connect_client:call_stream(
    Conn, <<"com.myapp.process_stream">>, [FirstChunk], #{}, #{}
),

%% Send further chunks under the same call.
lists:foreach(
    fun(Chunk) ->
        ok = bondy_connect_client:send_input(Conn, Token, [Chunk], #{})
    end,
    RemainingChunks
),

%% Final chunk closes the input stream.
ok = bondy_connect_client:finish_input(Conn, Token, [LastChunk], #{}),

receive
    {bondy_connect_client, Token, {ok, #{args := [Result]}}} ->
        io:format("Stream processing complete: ~p~n", [Result])
end.
```

:::

Callees pull chunks as they arrive:

::: code-group sdk

```javascript [JavaScript]
wampy.register('com.myapp.process_stream', {
    rpc: async function(firstChunk, kwargs, details) {
        let total = processChunk(firstChunk);

        // Only present when the caller opened a progressive call.
        if (details.input) {
            for await (const chunk of details.input()) {
                total += processChunk(chunk);
            }
        }

        return {total_processed: total};
    }
});
```

```erlang [Erlang]
ProcessStream = fun([FirstChunk], _KWArgs, Details) ->
    First = process_chunk(FirstChunk),

    %% Only present when the caller opened a progressive call.
    Total =
        case Details of
            #{input := Input} ->
                Pull = fun Next(Acc) ->
                    case Input() of
                        {more, [Chunk], _} ->
                            Next(Acc + process_chunk(Chunk));
                        {last, [Chunk], _} ->
                            Acc + process_chunk(Chunk)
                    end
                end,
                Pull(First);
            _ ->
                First
        end,

    {ok, #{args => [#{<<"total_processed">> => Total}]}}
end,

{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.process_stream">>, ProcessStream
).
```

:::

Chunks reach the callee in send order, including across cluster nodes and to a callee behind a bridge relay that ends on the caller's router. Timeout and cancellation semantics match progressive results: `CALL.Options.timeout` is the inactivity window between chunks, `CALL.Options._deadline` caps the whole call, and cancelling mid-stream works across nodes. See [Progressive Call Invocations](/connect/sdk/erlang/reference) in the `bondy_connect` reference for the Erlang API, including the exact `call_stream/5`/`send_input/4`/`finish_input/4` client functions.

::: warning Mixed-version clusters
Use either feature only once every node in the cluster runs a Bondy release that implements it — a node running an older release settles a call on its first progressive result (or cannot continue a caller's argument stream), truncating it.
:::

### Use Cases

- **Large file uploads** - Stream file data without buffering
- **Video streaming** - Send video frames continuously
- **Sensor data streams** - Push real-time sensor readings
- **Log aggregation** - Stream log entries for processing

## Procedure Reflection

Procedure reflection lets a client discover which procedures exist on a realm and how to call them. Bondy answers four reflection procedures:

- `wamp.reflection.procedure.list` and `wamp.reflection.procedure.describe`
- `wamp.reflection.error.list` and `wamp.reflection.error.describe`

The answers come from the interface metadata store, not from the live registrations, so a procedure is described whether or not a callee currently serves it. Bondy filters procedure results by what the calling client is authorized to call or register. See [Interface Metadata & Reflection](/connect/reference/wamp_api/interface).

## Bondy Extensions

Bondy accepts the following options in addition to those of the WAMP specification. They are specific to Bondy.

### Call Deadline

`CALL.Options._deadline` caps the total duration of a call, in milliseconds. `timeout` measures inactivity: for a progressive call, each progressive result or argument chunk restarts it. `_deadline` does not restart: when it expires, the call ends with `wamp.error.timeout`, however active the call is. A call that sets both ends at whichever limit comes first.

::: code-group sdk

```javascript [JavaScript]
wampy.call('com.myapp.large_query', [query], {
    receive_progress: true,
    timeout: 5000,     // at most 5 s between results
    _deadline: 60000   // at most 60 s in total
});
```

```erlang [Erlang]
{ok, Token} = bondy_connect_client:call_async(
    Conn, <<"com.myapp.large_query">>, [Query], #{}, #{
        receive_progress => true,
        timeout => 5000,      %% at most 5 s between results
        '_deadline' => 60000  %% at most 60 s in total
    }
).
```

:::

### Call Retries

`CALL.Options._retries` asks Bondy to try a call again when it got no answer. Its value is a positive integer: the number of attempts Bondy can add after the first. Any other value is ignored, and Bondy does not retry the call.

Bondy retries a call in two cases:

- The callee did not answer before the call timeout, or its session ended while it held the invocation. Bondy retries only when the registration set `REGISTER.Options._idempotent` to `true`, because the callee might have run the call already.
- No callee was registered for the procedure. No callee ran the call, so the registration need not be idempotent. Bondy waits for a registration, and backs off between attempts.

Each attempt counts against `_retries`. Bondy starts no attempt after the call's `_deadline`. Without a `_deadline`, a call can last `_retries + 1` call timeouts. Bondy does not retry a progressive call, in either direction, because the caller may already hold part of its results.

::: code-group sdk

```javascript [JavaScript]
// Callee: running this procedure twice is safe
wampy.register('com.myapp.inventory.get', {
    rpc: getInventory,
    _idempotent: true
});

// Caller: at most two more attempts, within 10 s in total
wampy.call('com.myapp.inventory.get', [sku], {
    timeout: 3000,
    _retries: 2,
    _deadline: 10000
});
```

```erlang [Erlang]
%% Callee: running this procedure twice is safe
{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.inventory.get">>, GetInventory,
    #{'_idempotent' => true}
),

%% Caller: at most two more attempts, within 10 s in total
bondy_connect_client:call(
    Conn, <<"com.myapp.inventory.get">>, [Sku], #{}, #{
        timeout => 3000,
        '_retries' => 2,
        '_deadline' => 10000
    }
).
```

:::

A retry selects a callee from what the caller's node knows when the attempt starts. It does not ask another node whether that node serves the procedure. On a cluster, a retry therefore helps when the registration, or the news of it, arrives within the call's deadline. See [When the routing view is behind](/connect/concepts/registry_routing#when-the-routing-view-is-behind).

### Cluster Failover

`CALL.Options._routing_max_candidates` sets how many distinct cluster nodes Bondy routes a call to. Its default is `2`: the node Bondy selects first, and one more.

When the callee is on another node, the caller's node forwards the call there, and that node selects the callee among its own registrations. The caller's node can be wrong about that node: the callee might have left a moment ago. In that case the node answers with a miss, and the caller's node selects again among the nodes it has not tried.

A miss happens before Bondy sends any `INVOCATION`, so moving the call cannot run the procedure twice. That is why failover between nodes needs neither `_retries` nor `_idempotent`, and why Bondy does it by default. The attempts share one call timeout: trying a second node does not give the call more time.

::: code-group sdk

```javascript [JavaScript]
// Try up to three nodes before the call fails
wampy.call('com.myapp.inventory.get', [sku], {
    _routing_max_candidates: 3
});
```

```erlang [Erlang]
%% Try up to three nodes before the call fails
bondy_connect_client:call(
    Conn, <<"com.myapp.inventory.get">>, [Sku], #{},
    #{'_routing_max_candidates' => 3}
).
```

:::

When every node Bondy tries has no callee, the call fails with `wamp.error.no_eligible_callee`. Raise the value when several nodes can lose their callees at once, for example during a deployment that restarts callees node by node.

The [Call Routing and Retry Options](/connect/reference/protocols/wamp_call_options) reference gives the exact contract of each option in this section.

### Partitioned Calls

A partitioned call sends all calls that carry the same key to the same callee of a shared registration. Set `runmode` to `partition` and `rkey` to the key:

::: code-group sdk

```javascript [JavaScript]
wampy.call('com.myapp.order.process', [orderData], {
    runmode: 'partition',
    rkey: orderData.customer_id
});
```

```erlang [Erlang]
bondy_connect_client:call(
    Conn, <<"com.myapp.order.process">>, [OrderData], #{}, #{
        runmode => <<"partition">>,
        rkey => maps:get(<<"customer_id">>, OrderData)
    }
).
```

:::

Bondy maps the key to a callee with jump consistent hashing. The same key reaches the same callee as long as the set of callees does not change. A partitioned call overrides the registration's invocation policy for that call. Bondy refuses a partitioned call without `rkey` with `wamp.error.invalid_argument`.

Partitioning is a property of the call, not of the registration. `REGISTER.Options.invoke` accepts only the five WAMP invocation policies.

## Best Practices

### Choose the Right Invocation Policy

Match the policy to your use case:

::: code-group sdk

```javascript [JavaScript]
// Stateless services - use roundrobin
wampy.register('com.myapp.calculate', {
    rpc: handler,
    invoke: 'roundrobin'  // Even distribution
});

// Singleton services - use single
wampy.register('com.myapp.leader.election', {
    rpc: handler,
    invoke: 'single'  // Only one instance allowed
});

// Active/standby - use first
wampy.register('com.myapp.cache', {
    rpc: handler,
    invoke: 'first'  // Primary/backup pattern
});
```

```erlang [Erlang]
%% Stateless services - use roundrobin
{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.calculate">>, Handler,
    #{invoke => <<"roundrobin">>}  %% Even distribution
),

%% Singleton services - use single
{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.leader.election">>, Handler,
    #{invoke => <<"single">>}  %% Only one instance allowed
),

%% Active/standby - use first
{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.cache">>, Handler,
    #{invoke => <<"first">>}  %% Primary/backup pattern
).
```

:::

### Set Timeouts That Fit the Procedure

A call without `timeout` gets the node-wide `wamp.call_timeout`, which suits no procedure in particular. Set a timeout that matches what the procedure does:

::: code-group sdk

```javascript [JavaScript]
// Node default applies (30 s unless configured otherwise)
wampy.call('com.myapp.api', [data]);

// Timeout chosen for this procedure
wampy.call('com.myapp.api', [data], {
    timeout: 10000  // 10 seconds
});
```

```erlang [Erlang]
%% Node default applies (30 s unless configured otherwise).
%% The SDK's own timer also waits 30 s.
bondy_connect_client:call(Conn, <<"com.myapp.api">>, [Data]),

%% Timeout chosen for this procedure
bondy_connect_client:call(
    Conn, <<"com.myapp.api">>, [Data], #{},
    #{timeout => 10000}  %% 10 seconds
).
```

:::

### Use Cancellation Appropriately

Cancel operations that are no longer needed:

::: code-group sdk

```javascript [JavaScript]
// Search-as-you-type - cancel previous searches
let currentSearch = null;

function search(query) {
    if (currentSearch) {
        wampy.cancel(currentSearch, {mode: 'kill'});
    }
    currentSearch = wampy.call('com.myapp.search', [query], {...});
}
```

```erlang [Erlang]
%% Search-as-you-type - cancel previous searches.
%% CurrentSearch is the token of the search in flight, or undefined.
Search = fun(Query, CurrentSearch) ->
    case CurrentSearch of
        undefined -> ok;
        _ -> bondy_connect_client:cancel(Conn, CurrentSearch, kill)
    end,
    {ok, Token} = bondy_connect_client:call_async(
        Conn, <<"com.myapp.search">>, [Query]
    ),
    Token
end.
```

:::

### Pattern Registration Strategy

Use the most specific pattern possible:

::: code-group sdk

```javascript [JavaScript]
// Too broad - handles everything
wampy.register('com.myapp.', {rpc: handler, match: 'prefix'});

// Better - specific domain
wampy.register('com.myapp.users.', {rpc: handler, match: 'prefix'});

// Best - exact when possible
wampy.register('com.myapp.users.get', {rpc: handler});
```

```erlang [Erlang]
%% Too broad - handles everything
bondy_connect_client:register(
    Conn, <<"com.myapp.">>, Handler, #{match => <<"prefix">>}
),

%% Better - specific domain
bondy_connect_client:register(
    Conn, <<"com.myapp.users.">>, Handler, #{match => <<"prefix">>}
),

%% Best - exact when possible
bondy_connect_client:register(Conn, <<"com.myapp.users.get">>, Handler).
```

:::

### Opt Out of Caller Disclosure Deliberately

Bondy discloses the caller by default. To keep a caller's identity from a callee, both sides must opt out:

::: code-group sdk

```javascript [JavaScript]
// Callee: do not ask for the caller's identity
wampy.register('com.myapp.anonymous.feedback', {
    rpc: handler,
    disclose_caller: false
});

// Caller: do not offer it
wampy.call('com.myapp.anonymous.feedback', [text], {
    disclose_me: false
});
```

```erlang [Erlang]
%% Callee: do not ask for the caller's identity
{ok, _} = bondy_connect_client:register(
    Conn, <<"com.myapp.anonymous.feedback">>, Handler,
    #{disclose_caller => false}
),

%% Caller: do not offer it
bondy_connect_client:call(
    Conn, <<"com.myapp.anonymous.feedback">>, [Text], #{},
    #{disclose_me => false}
).
```

:::

## Summary

Bondy implements these advanced RPC features:

- **Call cancelling** - Cancel in-flight operations
- **Call timeouts** - Bound how long a caller waits
- **Caller identification** - Track who's calling
- **Pattern-based registrations** - Flexible procedure handling
- **Shared registrations** - Load balancing and failover
- **Payload passthru mode** - Route opaque, possibly encrypted payloads
- **Progressive call results** - Stream results to callers, when both peers announce the feature
- **Progressive calls** - Stream arguments to callees, when both peers announce the feature
- **Procedure reflection** - Discover the procedures of a realm
- **Bondy extensions** - Call deadlines, call retries and partitioned calls

For fundamental concepts, see [Routed RPC](/connect/concepts/wamp/rpc). For practical patterns, see [Beyond the Basics](/connect/concepts/wamp/beyond_the_basics).
