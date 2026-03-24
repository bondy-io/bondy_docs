---
related:
    - text: Communication Patterns
      type: concepts
      link: /concepts/wamp/communication_patterns
      description: Understanding RPC and PubSub patterns in WAMP.
    - text: Advanced RPC
      type: concepts
      link: /concepts/wamp/advanced/rpc
      description: Progressive call results, call cancellation, and pattern-based registration.
    - text: Introduction to WAMP
      type: concepts
      link: /concepts/wamp/introduction
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

```
1. Callee registers procedure "com.myapp.add"
   → Router tracks registration

2. Caller calls "com.myapp.add" with arguments [2, 3]
   → Router receives CALL message

3. Router routes to appropriate Callee
   → Callee receives INVOCATION message

4. Callee executes procedure and returns result 5
   → Router receives YIELD message

5. Router returns result to Caller
   → Caller receives RESULT message
```

### WAMP Messages

**Register** (Callee)
```javascript
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

**Call** (Caller)
```javascript
wampy.call('com.myapp.add', [2, 3], {
    onSuccess: function(result) {
        console.log('Result:', result);  // 5
    },
    onError: function(error) {
        console.error('Call failed:', error);
    }
});
```

## Registration

### Simple Registration

```javascript
wampy.register('com.myapp.get_user', {
    rpc: function(args) {
        const userId = args[0];
        return {id: userId, name: 'Alice'};
    }
});
```

### With Keyword Arguments

```javascript
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

### Registration Options

```javascript
wampy.register('com.myapp.procedure', {
    rpc: handler,
    match: 'exact',  // exact | prefix | wildcard
    invoke: 'single'  // single | roundrobin | random | first | last
});
```

### Multiple Callees

Multiple sessions can register the same procedure:

```javascript
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

### Unregistering

```javascript
// Register procedure
wampy.register('com.myapp.temp', { rpc: handler });

// Later, unregister by URI
wampy.unregister('com.myapp.temp');
```

## Calling Procedures

### Simple Call

```javascript
wampy.call('com.myapp.get_time', null, {
    onSuccess: function(time) {
        console.log('Server time:', time);
    }
});
```

### With Positional Arguments

```javascript
wampy.call('com.myapp.multiply', [4, 5], {
    onSuccess: function(result) {
        console.log('4 * 5 =', result);  // 20
    }
});
```

### With Keyword Arguments

```javascript
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

### Call Options

```javascript
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

## Error Handling

### Returning Errors (Callee)

```javascript
wampy.register('com.myapp.divide', {
    rpc: function(args) {
        const [a, b] = args;

        if (b === 0) {
            throw new Error('wamp.error.division_by_zero');
        }

        return a / b;
    }
});
```

### Handling Errors (Caller)

```javascript
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

## Pattern Matching

### Exact Match (Default)

```javascript
wampy.register('com.myapp.users.get', { rpc: handler });

// Matches only
wampy.call('com.myapp.users.get', [123]);
```

### Prefix Match

```javascript
wampy.register('com.myapp.users.', {
    rpc: handler,
    match: 'prefix'
});

// Matches all with prefix
wampy.call('com.myapp.users.get', [123]);
wampy.call('com.myapp.users.list', []);
wampy.call('com.myapp.users.delete', [123]);
```

### Wildcard Match

```javascript
wampy.register('com.myapp..get', {
    rpc: handler,
    match: 'wildcard'
});

// Matches pattern
wampy.call('com.myapp.users.get', [123]);
wampy.call('com.myapp.orders.get', [456]);
wampy.call('com.myapp.products.get', [789]);
```

## Invocation Policies

When multiple Callees register the same procedure, the Router uses the invocation policy to select which one:

| Policy | Behavior |
|--------|----------|
| **single** | Only one Callee allowed (default) |
| **roundrobin** | Rotate through Callees sequentially |
| **random** | Random selection |
| **first** | First registered Callee |
| **last** | Last registered Callee |

```javascript
// Enable load balancing
wampy.register('com.myapp.api.process', {
    rpc: handler,
    invoke: 'roundrobin'
});
```

## Use Cases

### Microservice APIs

Exposing service operations:

```javascript
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

### Distributed Computation

Offloading heavy processing:

```javascript
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

### Device Control

IoT device control:

```javascript
// Device registers control procedures
wampy.register('com.iot.device.{device_id}.set_temperature', {
    rpc: function(args) {
        setTemperature(args[0]);
        return {status: 'ok', value: args[0]};
    }
});

// Controller calls
wampy.call('com.iot.device.livingroom.set_temperature', [22]);
```

### Real-Time Queries

Data retrieval:

```javascript
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
```javascript
// Good
return {status: 'success', user_id: 123, created_at: Date.now()};

// Avoid
return 123;  // Unclear what this number means
```

### Error Handling

**Use descriptive error URIs:**
```javascript
// In RPC handler
throw {
    error: 'com.myapp.error.invalid_input',
    args: ['Invalid email format'],
    kwargs: {field: 'email', value: email}
};
```

**Handle timeouts:**
```javascript
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

### Performance

**Keep procedures fast:**
- Aim for < 100ms response time
- Offload heavy work to async tasks
- Use progressive results for long operations

**Keep registration references:**
```javascript
// Register and keep reference for later unregistration
wampy.register('com.myapp.proc', { rpc: handler });
```

**Batch related calls:**
```javascript
// Instead of multiple calls
wampy.call('com.myapp.get', [1]);
wampy.call('com.myapp.get', [2]);
wampy.call('com.myapp.get', [3]);

// Consider single batch call
wampy.call('com.myapp.get_batch', [[1, 2, 3]]);
```

## Security

### Authorization

RPC operations are authorized per procedure URI:

- **Register permission** - Who can register procedures
- **Call permission** - Who can call procedures

```
# Allow registration of user procedures
com.myapp.users.

# Allow calling public APIs only
com.myapp.public.
```

### Input Validation

Always validate inputs:

```javascript
wampy.register('com.myapp.create_user', {
    rpc: function(args, kwargs) {
        if (!kwargs.email || !isValidEmail(kwargs.email)) {
            throw new Error('com.myapp.error.invalid_email');
        }

        // Process valid input
    }
});
```

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

- [Advanced RPC](/concepts/wamp/advanced/rpc) - Progressive results, cancellation, pattern registration
- [Communication Patterns](/concepts/wamp/communication_patterns) - RPC vs PubSub
- [Publish/Subscribe](/concepts/wamp/pubsub) - Event-driven pattern
- [Security](/concepts/wamp/security) - Authentication and authorization
