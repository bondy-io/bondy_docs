---
draft: false
related:
    - text: Routed RPC
      type: concepts
      link: /router/concepts/wamp/rpc
      description: Learn the fundamentals of Remote Procedure Calls in WAMP.
    - text: Beyond the Basics
      type: concepts
      link: /router/concepts/wamp/beyond_the_basics
      description: Essential advanced features for production systems.
---
# Advanced RPC

This page explains the WAMP Advanced Profile RPC features that Bondy implements, and the Bondy-specific options that extend them. For the full list of features Bondy announces and implements, see [WAMP protocol support](/router/reference/protocols/wamp#routed-rpc-1).

## Call Cancelling

Cancel in-flight RPC calls when results are no longer needed. This prevents wasted computation and allows callees to free resources.

### Cancelling from Caller

Request cancellation of an outstanding call:

```javascript
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

### Cancellation Modes

The `mode` option of `CANCEL` controls how far the cancellation goes:

```javascript
// Skip mode - don't interrupt callee, just ignore result
wampy.cancel(callId, {mode: 'skip'});

// Kill mode - ask callee to abort and wait for its answer
wampy.cancel(callId, {mode: 'kill'});

// Killnowait mode - ask callee to abort, don't wait for its answer
wampy.cancel(callId, {mode: 'killnowait'});
```

Bondy handles each mode as follows:

- **`skip`** (the default when `mode` is absent): Bondy answers the caller at once with `wamp.error.canceled` and does not send `INTERRUPT` to the callee. The callee keeps working; Bondy discards its result when it arrives.
- **`kill`**: Bondy sends `INTERRUPT` to the callee and does not answer the caller itself. The callee's response settles the call. That response is normally an `ERROR`, but it can be a `RESULT` if the callee finished first.
- **`killnowait`**: Bondy answers the caller at once with `wamp.error.canceled` and sends `INTERRUPT` to the callee. Bondy discards any later response from the callee.

The caller must be authorized for the `wamp.cancel` action on the procedure. When the callee runs on another cluster node, Bondy sends `INTERRUPT` only if the callee announced `call_canceling` in `HELLO`.

### Handling Cancellation in Callee

A callee learns of a `kill` or `killnowait` cancellation through an `INTERRUPT` message. How a client library exposes `INTERRUPT` varies; this example assumes it aborts a signal:

```javascript
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

### Use Cases

- **User-initiated cancellation** - Cancel operations when user navigates away
- **Timeout-based cancellation** - Cancel when local timeout expires
- **Resource management** - Free server resources for cancelled operations
- **Search optimization** - Cancel outdated searches when new query arrives

**Example: Search with automatic cancellation**
```javascript
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

## Call Timeouts

A call timeout bounds how long a caller waits for a result. Bondy enforces it in the router: when the time is up, Bondy sends the caller an `ERROR` with `wamp.error.timeout`. Bondy does not send `INTERRUPT` to the callee, and it discards any result the callee sends later.

Bondy never runs a call without a limit. The WAMP specification reads a missing or zero `timeout` as "no timeout"; Bondy reads them this way:

- `timeout` absent: Bondy uses [`wamp.call_timeout`](/router/reference/configuration/wamp#wamp.call_timeout), 30 seconds by default.
- `timeout` set to `0`: Bondy uses [`wamp.max_call_timeout`](/router/reference/configuration/wamp#wamp.max_call_timeout), 10 minutes by default.
- `timeout` greater than `0`: Bondy uses that value.

### Basic Timeout

Set timeout in milliseconds:

```javascript
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

### Different Timeouts for Different Operations

Adjust timeouts based on expected operation duration:

```javascript
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

### Timeout with Retry

Combine timeouts with retry logic:

```javascript
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

### Use Cases

- **External APIs** - Prevent hanging on slow third-party services
- **Database queries** - Detect runaway queries early
- **User experience** - Provide feedback instead of indefinite loading
- **Resource management** - Free connections from timed-out calls

## Call Trust Levels

Bondy does not implement call trust levels. See [WAMP protocol support](/router/reference/protocols/wamp#routed-rpc-1).

## Caller Identification

Caller identification lets a callee know who is calling its procedure, for audit logging, rate limiting, or checks beyond RBAC.

### What Bondy Discloses

When Bondy discloses the caller, it adds these attributes to `INVOCATION.Details`:

- `caller` — the caller's session ID.
- `caller_authid` — the caller's authentication ID.
- `caller_authrole` — the caller's authentication role.
- `x_caller_guid` — Bondy's internal session identifier for the caller. This is a Bondy extension.

```javascript
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

### When Bondy Discloses the Caller

Two options govern disclosure: `disclose_caller` on the callee's `REGISTER`, and `disclose_me` on the caller's `CALL`. Both default to `true`. Bondy discloses the caller unless **both** are `false`. Either side alone can request disclosure; neither side alone can prevent it.

```javascript
// Caller opts out. The caller is still disclosed unless the
// registration also set disclose_caller: false.
wampy.call('com.myapp.sensitive.operation', [data], {
    disclose_me: false
});
```

The WAMP specification makes disclosure opt-in. Bondy makes it opt-out.

Bondy never discloses a caller that is internal to Bondy itself.

### Per-Caller Rate Limiting

Use caller identification for rate limiting:

```javascript
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

### Authorization Based on Caller

Implement fine-grained access control:

```javascript
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

```javascript
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

### Wildcard Matching

Implement cross-cutting concerns:

```javascript
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

### RESTful Resource Handlers

Build RESTful services with pattern matching:

```javascript
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

### Dynamic Routing Based on Content

Route to different implementations based on arguments:

```javascript
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

A registration with a policy other than `single` requires the callee to announce `shared_registration` in `HELLO`. The first registration of a URI fixes its policy. Bondy refuses a later registration of the same URI with `wamp.error.procedure_already_exists` when the existing policy is `single`, or when the later registration asks for a different policy.

```javascript
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

### Round Robin Load Balancing

Distribute load evenly across service instances:

```javascript
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

Each Bondy node keeps its own round-robin position; Bondy does not replicate load-balancing state across the cluster. When callers are connected to several nodes, the rotation holds per node, not cluster-wide.

### Primary/Backup Pattern

Use `first` policy for active/standby:

```javascript
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

### Canary Deployment

Use `last` policy to route to newest version:

```javascript
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

No manual intervention required—the router adapts automatically.

### Use Cases

- **Horizontal scaling** - Add more instances to increase capacity
- **High availability** - Continue operating when instances fail
- **Rolling deployments** - Deploy new versions without downtime
- **Geographic distribution** - Place instances near users
- **Resource optimization** - Distribute load across available resources

## Sharded Registrations

Bondy does not implement WAMP sharded registration. See [WAMP protocol support](/router/reference/protocols/wamp#routed-rpc-1). To send all calls with the same key to the same callee of a shared registration, use the Bondy [partitioned call](#partitioned-calls) extension.

## Payload Passthru Mode

In Payload Passthru Mode the payload is opaque to Bondy. The caller packs the whole payload into one binary, already serialized and possibly encrypted, and Bondy routes it to the callee without reading it. The router never needs the keys or the serializer, so end-to-end encryption between caller and callee is possible.

A message is in Payload Passthru Mode when its options carry `ppt_scheme`. Four options describe the payload:

| Option | Meaning |
|---|---|
| `ppt_scheme` | The key management scheme. Its presence turns the mode on. |
| `ppt_serializer` | The serializer used to encode the payload, for example `json`, `msgpack` or `cbor`. |
| `ppt_cipher` | The encryption algorithm, when the payload is encrypted. |
| `ppt_keyid` | The ID of the key used to encrypt the payload. |

```javascript
wampy.call('com.myapp.process_video_frame', [encryptedFrame], {
    ppt_scheme: 'x_myapp',
    ppt_serializer: 'cbor',
    ppt_cipher: 'xsalsa20poly1305',
    ppt_keyid: 'key-2024-07'
});
```

Bondy copies the `ppt_*` options of a `CALL` into `INVOCATION.Details`, and the options of a `YIELD` into `RESULT.Details`, so the receiving peer knows how to decode the payload.

The mode constrains the message:

- The payload must be a single binary positional argument, or no payload at all. A message in Payload Passthru Mode with keyword arguments, or with any other arguments, is invalid.
- Bondy cannot read the payload, so it cannot serve a `CALL` in this mode to a procedure that Bondy implements itself. It refuses such a call with `wamp.error.invalid_argument`.
- An `ERROR` that Bondy raises itself, such as an authorization refusal, carries no `ppt_*` details, because it has no opaque payload.

See [Payload Passthru Mode](/router/reference/serialization#payload-passthru-mode) in the serialization reference.

## Progressive Call Results

Stream results from procedures back to callers incrementally, so a long-running operation can report partial output before its final result — paging a large result set, streaming file chunks, or reporting progress on a long computation.

Bondy always offers the feature; it has no configuration setting. It negotiates end to end: it activates only when the caller announced `progressive_call_results` in `HELLO` (paired with `call_canceling`, as the specification requires) and the callee did too. If either side didn't opt in, the option is silently removed — the callee sees a plain invocation, replies once, and the caller gets a single final result. Degradation is silent by design; the call still succeeds.

Callees send partial results:

```javascript
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

Callers opt in with `receive_progress` and receive each progressive result before the single terminal one:

```javascript
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

This holds across the cluster too: when caller and callee are on different nodes, progressive results are relayed between nodes and still arrive in yield order. `CALL.Options.timeout` is the inactivity window between results — each one restarts it — so a healthy, slowly-dripping stream is not cut off; the Bondy extension `CALL.Options._deadline` (milliseconds) additionally caps the whole call regardless of activity. Cancellation works mid-stream, including across nodes. See [Progressive Call Results](/router/reference/clients/bondy_connect_sdk) in the `bondy_connect` reference for the Erlang API.

### Use Cases

- **Large result sets** - Stream database query results
- **Progress feedback** - Update UI as work progresses
- **Real-time processing** - Display results as they're computed
- **Incremental rendering** - Show partial data while loading

## Progressive Calls

The mirror image of progressive results: stream a call's **arguments** from caller to callee in successive chunks under one request, so a caller can send a large payload — a file upload, a client-side stream — without buffering it whole before the call.

Bondy always offers the feature; it has no configuration setting. Unlike progressive results, this is **not** silently downgraded: because the caller has already begun streaming, if either peer didn't announce `progressive_calls` (paired with `call_canceling`) in `HELLO`, the call fails outright with `wamp.error.option_not_allowed` rather than being reinterpreted as a plain call.

Callers send arguments progressively, reusing one request across chunks:

```javascript
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

Callees pull chunks as they arrive:

```javascript
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

Chunks reach the callee in send order, including across cluster nodes. Timeout and cancellation semantics match progressive results: `CALL.Options.timeout` is the inactivity window between chunks, `CALL.Options._deadline` caps the whole call, and cancelling mid-stream works across nodes. See [Progressive Calls](/router/reference/clients/bondy_connect_sdk) in the `bondy_connect` reference for the Erlang API, including the exact `call_stream/5`/`send_input/4`/`finish_input/4` client functions.

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

The answers come from the interface metadata store, not from the live registrations, so a procedure is described whether or not a callee currently serves it. Bondy filters procedure results by what the calling client is authorized to call or register. See [Interface Metadata & Reflection](/router/reference/wamp_api/interface).

## Bondy Extensions

Bondy accepts the following options in addition to those of the WAMP specification. They are specific to Bondy.

### Call Deadline

`CALL.Options._deadline` caps the total duration of a call, in milliseconds. `timeout` measures inactivity: for a progressive call, each progressive result or argument chunk restarts it. `_deadline` does not restart: when it expires, the call ends with `wamp.error.timeout`, however active the call is. A call that sets both ends at whichever limit comes first.

```javascript
wampy.call('com.myapp.large_query', [query], {
    receive_progress: true,
    timeout: 5000,     // at most 5 s between results
    _deadline: 60000   // at most 60 s in total
});
```

### Partitioned Calls

A partitioned call sends all calls that carry the same key to the same callee of a shared registration. Set `runmode` to `partition` and `rkey` to the key:

```javascript
wampy.call('com.myapp.order.process', [orderData], {
    runmode: 'partition',
    rkey: orderData.customer_id
});
```

Bondy maps the key to a callee with jump consistent hashing. The same key reaches the same callee as long as the set of callees does not change. A partitioned call overrides the registration's invocation policy for that call.

A callee can also make partitioning the policy of the registration, with the Bondy invocation policy `jump_consistent_hash`. Every call to such a registration must then carry `rkey`.

```javascript
wampy.register('com.myapp.order.process', {
    rpc: processOrder,
    invoke: 'jump_consistent_hash'
});
```

## Best Practices

### Choose the Right Invocation Policy

Match the policy to your use case:

```javascript
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

### Set Timeouts That Fit the Procedure

A call without `timeout` gets the node-wide `wamp.call_timeout`, which suits no procedure in particular. Set a timeout that matches what the procedure does:

```javascript
// Node default applies (30 s unless configured otherwise)
wampy.call('com.myapp.api', [data]);

// Timeout chosen for this procedure
wampy.call('com.myapp.api', [data], {
    timeout: 10000  // 10 seconds
});
```

### Use Cancellation Appropriately

Cancel operations that are no longer needed:

```javascript
// Search-as-you-type - cancel previous searches
let currentSearch = null;

function search(query) {
    if (currentSearch) {
        wampy.cancel(currentSearch, {mode: 'kill'});
    }
    currentSearch = wampy.call('com.myapp.search', [query], {...});
}
```

### Pattern Registration Strategy

Use the most specific pattern possible:

```javascript
// Too broad - handles everything
wampy.register('com.myapp.', {rpc: handler, match: 'prefix'});

// Better - specific domain
wampy.register('com.myapp.users.', {rpc: handler, match: 'prefix'});

// Best - exact when possible
wampy.register('com.myapp.users.get', {rpc: handler});
```

### Opt Out of Caller Disclosure Deliberately

Bondy discloses the caller by default. To keep a caller's identity from a callee, both sides must opt out:

```javascript
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
- **Bondy extensions** - Call deadlines and partitioned calls

For fundamental concepts, see [Routed RPC](/router/concepts/wamp/rpc). For practical patterns, see [Beyond the Basics](/router/concepts/wamp/beyond_the_basics).
