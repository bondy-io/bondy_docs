---
draft: false
related:
    - text: Routed RPC
      type: concepts
      link: /concepts/wamp/rpc
      description: Learn the fundamentals of Remote Procedure Calls in WAMP.
    - text: Beyond the Basics
      type: concepts
      link: /concepts/wamp/beyond_the_basics
      description: Essential advanced features for production systems.
---
# Advanced RPC

This reference covers advanced RPC features for building sophisticated distributed systems. These capabilities extend basic remote procedure calls with fine-grained control, reliability patterns, and performance optimizations.

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

Control how aggressively to cancel:

```javascript
// Skip mode - don't interrupt callee, just ignore result
wampy.cancel(callId, {mode: 'skip'});

// Kill mode - ask callee to abort (if supported)
wampy.cancel(callId, {mode: 'kill'});

// Killnowait mode - abort and don't wait for confirmation
wampy.cancel(callId, {mode: 'killnowait'});
```

### Handling Cancellation in Callee

Callees can detect and respond to cancellation:

```javascript
wampy.register('com.myapp.process_large_file', {
    rpc: function(args, kwargs, details) {
        const abortController = new AbortController();

        // Listen for cancellation
        if (details.receive_progress) {
            // Bondy will send interrupt message
            // Implementation depends on client library
        }

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

Prevent indefinite waiting by setting maximum time for RPC calls to complete.

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

## Call Trust Levels<Badge text="Roadmap"/>

Trust levels will provide reliability guarantees for RPC calls, allowing callers and callees to indicate criticality and desired delivery semantics.

### Planned Levels

- **Best effort** - Fire and forget, no guarantees (default)
- **Acknowledged** - Caller receives confirmation that callee received the invocation
- **Persistent** - Call survives callee disconnection, delivered when callee reconnects
- **Transactional** - Atomic execution with rollback support

### Anticipated Use Cases

- **Critical operations** - Ensure payment processing calls aren't lost
- **Audit operations** - Guarantee logging calls are delivered
- **High-throughput telemetry** - Use best effort for metrics
- **Financial transactions** - Require transactional semantics

**Conceptual API:**
```javascript
// Critical payment operation
wampy.call('com.myapp.payments.charge', [transaction], {
    trust_level: 'persistent',  // Ensure delivery
    timeout: 30000
});

// High-volume telemetry
wampy.call('com.myapp.metrics.record', [datapoint], {
    trust_level: 'best_effort'  // Don't block on delivery
});
```

## Caller Identification

Allow callees to know who's calling their procedures for authorization, audit logging, and rate limiting.

### Requesting Caller Disclosure

Callee requests caller information:

```javascript
wampy.register('com.myapp.sensitive.operation', {
    rpc: function(args, kwargs, details) {
        // details.caller contains caller's session ID
        console.log('Called by session:', details.caller);

        // Can implement additional authorization
        if (!isAuthorized(details.caller)) {
            throw new Error('Unauthorized caller');
        }

        // Audit logging
        auditLog({
            operation: 'sensitive.operation',
            caller: details.caller,
            timestamp: Date.now()
        });

        return performOperation(args, kwargs);
    },
    disclose_caller: true  // Request caller disclosure
});
```

### Caller Must Consent

Callers must allow disclosure for their identity to be revealed:

```javascript
// Caller allows identity disclosure
wampy.call('com.myapp.sensitive.operation', [data], {
    disclose_me: true  // Allow callee to see my session ID
});
```

Only when both callee requests (`disclose_caller: true`) and caller allows (`disclose_me: true`) is the caller's session ID disclosed.

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
    },
    disclose_caller: true
});
```

### Authorization Based on Caller

Implement fine-grained access control:

```javascript
const userPermissions = new Map();

wampy.register('com.myapp.admin.delete_user', {
    rpc: async function(args, kwargs, details) {
        const caller = details.caller;

        // Look up caller's permissions
        const permissions = await getUserPermissions(caller);

        if (!permissions.includes('user.delete')) {
            throw new Error('Insufficient permissions');
        }

        return deleteUser(args[0]);
    },
    disclose_caller: true
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

Control how calls are distributed across multiple callees:

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

## Sharded Registrations<Badge text="Roadmap"/>

Distribute calls across callees based on a key, ensuring calls with the same key always route to the same callee. This enables stateful processing and ordering guarantees.

### Planned Capabilities

Instead of random or round-robin distribution, sharding routes based on a key:

```javascript
// Callees join a shard group
wampy.register('com.myapp.user.session', {
    rpc: handleUserSession,
    shard: 'user_sessions',  // Shard group name
    shard_strategy: 'hash'    // Hash-based routing
});

// Calls routed by key (e.g., user ID)
wampy.call('com.myapp.user.session', [userId], {
    shard_key: userId  // Consistent routing for this user
});
```

All calls for the same `userId` route to the same callee, enabling stateful session handling.

### Anticipated Strategies

- **Hash-based** - Consistent hashing for even distribution
- **Range-based** - Route by key ranges
- **Custom** - Application-defined routing logic

### Use Cases

- **Stateful services** - Keep user sessions on specific instances
- **Event ordering** - Process events in order per entity
- **Cache locality** - Keep cached data with processor
- **Connection pooling** - Maintain database connections per shard

**Conceptual example:**
```javascript
// Order processing with per-customer sharding
wampy.register('com.myapp.order.process', {
    rpc: processOrder,
    shard: 'order_processor',
    shard_strategy: 'hash'
});

// All orders for same customer go to same instance
wampy.call('com.myapp.order.process', [orderData], {
    shard_key: orderData.customer_id
});
```

## Payload Passthru Mode<Badge text="WIP"/>

Bypass router payload processing for performance-critical scenarios where milliseconds matter.

### Planned Behavior

In passthru mode:
- Router doesn't deserialize call arguments
- Router doesn't validate payload structure
- Router forwards raw bytes directly to callee
- Significant performance improvement for large payloads

### Tradeoffs

**Benefits:**
- Lower latency for large arguments
- Reduced router CPU usage
- Higher throughput

**Limitations:**
- No argument validation
- No transformation or filtering on arguments
- Caller and callee must use same serialization

### Anticipated Use Cases

- **Large binary data** - Video frames, file chunks
- **High-frequency calls** - Sensor data, market data
- **Pre-serialized payloads** - Application handles serialization
- **Performance-critical RPC** - Every millisecond counts

**Conceptual API:**
```javascript
wampy.call('com.myapp.process_video_frame', [rawFrameData], {
    passthru: true  // Skip router deserialization
});
```

## Progressive Call Results<Badge text="WIP"/>

Stream results from procedures back to callers incrementally, enabling long-running operations to provide feedback before completion.

### Planned Capabilities

Callees will be able to send partial results:

```javascript
wampy.register('com.myapp.large_query', {
    rpc: async function(args, kwargs, details) {
        const results = [];

        // Execute query that returns many rows
        for await (const row of executeQuery(args[0])) {
            results.push(row);

            // Send progress update
            details.progress({
                rows_processed: results.length,
                current_row: row
            });
        }

        // Final result
        return {total_rows: results.length, results: results};
    }
});
```

Callers receive progress updates:

```javascript
wampy.call('com.myapp.large_query', [query], {
    onSuccess: function(finalResult) {
        console.log('Query complete:', finalResult);
    },
    onProgress: function(progressData) {
        // Called multiple times as results stream in
        console.log('Progress:', progressData.rows_processed);
        updateUI(progressData.current_row);
    }
});
```

### Anticipated Use Cases

- **Large result sets** - Stream database query results
- **Progress feedback** - Update UI as work progresses
- **Real-time processing** - Display results as they're computed
- **Incremental rendering** - Show partial data while loading

## Progressive Calls<Badge text="WIP"/>

Stream arguments to procedures incrementally, enabling callers to send large datasets without blocking.

### Planned Capabilities

Callers will be able to send arguments progressively:

```javascript
const call = wampy.call('com.myapp.process_stream', [], {
    onSuccess: function(result) {
        console.log('Stream processing complete:', result);
    },
    progressive: true
});

// Send data in chunks
for (const chunk of largeDataset) {
    call.progress(chunk);
}

// Signal completion
call.complete();
```

Callees receive arguments progressively:

```javascript
wampy.register('com.myapp.process_stream', {
    rpc: async function(args, kwargs, details) {
        let total = 0;

        // Receive progressive arguments
        for await (const chunk of details.progressiveArgs()) {
            total += processChunk(chunk);
        }

        return {total_processed: total};
    }
});
```

### Anticipated Use Cases

- **Large file uploads** - Stream file data without buffering
- **Video streaming** - Send video frames continuously
- **Sensor data streams** - Push real-time sensor readings
- **Log aggregation** - Stream log entries for processing

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

### Always Set Timeouts

Prevent indefinite waiting:

```javascript
// Bad - no timeout
wampy.call('com.myapp.api', [data]);

// Good - reasonable timeout
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
wampy.register('com.myapp.', {...}, 'prefix');

// Better - specific domain
wampy.register('com.myapp.users.', {...}, 'prefix');

// Best - exact when possible
wampy.register('com.myapp.users.get', {...});
```

### Caller Identification Security

Only disclose caller when necessary:

```javascript
// Enable when:
// - Audit requirements
// - Authorization depends on caller
// - Rate limiting per caller

// Disable when:
// - Privacy required
// - Caller identity irrelevant
// - Performance critical
```

## Summary

Advanced RPC features provide fine-grained control over remote procedure calls:

- **Call cancelling** - Cancel in-flight operations
- **Call timeouts** - Prevent indefinite waiting
- **Call trust levels** (roadmap) - Reliability guarantees
- **Caller identification** - Track who's calling
- **Pattern-based registrations** - Flexible procedure handling
- **Shared registrations** - Load balancing and failover
- **Sharded registrations** (roadmap) - Stateful routing by key
- **Payload passthru** (WIP) - Performance optimization
- **Progressive call results** (WIP) - Stream results to callers
- **Progressive calls** (WIP) - Stream arguments to callees

These capabilities make WAMP RPC suitable for production systems requiring sophisticated distributed request-response patterns.

For fundamental concepts, see [Routed RPC](/concepts/wamp/rpc). For practical patterns, see [Beyond the Basics](/concepts/wamp/beyond_the_basics).
