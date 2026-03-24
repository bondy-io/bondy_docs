---
draft: false
related:
    - text: Routed RPC
      type: concepts
      link: /concepts/wamp/rpc
      description: Learn the fundamentals of Remote Procedure Calls in WAMP.
    - text: Publish/Subscribe
      type: concepts
      link: /concepts/wamp/pubsub
      description: Learn the fundamentals of Publish/Subscribe in WAMP.
    - text: Advanced RPC
      type: concepts
      link: /concepts/wamp/advanced/rpc
      description: Deep dive into advanced RPC features.
    - text: Advanced PubSub
      type: concepts
      link: /concepts/wamp/advanced/pubsub
      description: Deep dive into advanced PubSub features.
---
# Beyond the Basics

Once you've mastered the fundamentals of WAMP's RPC and Publish/Subscribe patterns, you can leverage advanced features that make distributed systems more robust, scalable, and reliable. This guide covers the essential capabilities that elevate WAMP from a simple messaging protocol to a production-ready application networking platform.

## RPC Load Balancing

In production systems, you often need multiple instances of a service for capacity, reliability, or geographic distribution. WAMP's shared registrations enable built-in load balancing without external infrastructure.

### How Shared Registrations Work

Multiple callees can register the same procedure URI. When a call arrives, the router selects one callee using a configured invocation policy:

```javascript
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

```
Call 1 → Instance 1
Call 2 → Instance 2
Call 3 → Instance 3
Call 4 → Instance 1  (wraps around)
Call 5 → Instance 2
...
```

Perfect for stateless services where any instance can handle any request.

**Example use case:**
```javascript
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

### Random Distribution

Random selection provides statistical distribution without tracking state:

```javascript
wampy.register('com.myapp.analytics.track', {
    rpc: trackEvent,
    invoke: 'random'  // Random distribution
});
```

Good for fire-and-forget operations where exact distribution doesn't matter.

### First/Last Policies

Use `first` or `last` for primary/backup or canary deployment patterns:

**Primary/Backup Pattern:**
```javascript
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

**Canary Deployment:**
```javascript
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

### Geographic Distribution

Combine registration with Bondy clustering for geographic load balancing:

```
US-East Cluster:
  - Instance 1 registers procedure
  - Instance 2 registers procedure

US-West Cluster:
  - Instance 3 registers procedure
  - Instance 4 registers procedure

Clients in US-East connect to US-East cluster
  → Calls distributed to Instances 1 & 2

Clients in US-West connect to US-West cluster
  → Calls distributed to Instances 3 & 4
```

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

No manual intervention required. The router adapts automatically.

### Retry Logic

Implement client-side retry for transient failures:

```javascript
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

### Health Checks

Implement health check procedures for monitoring:

```javascript
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

### Circuit Breaker Pattern

Prevent cascading failures with circuit breakers:

```javascript
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

## Pattern-Based Registration

Register procedures using URI patterns instead of exact URIs, enabling dynamic, flexible service implementations.

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

### Wildcard Matching

Implement cross-cutting concerns:

```javascript
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

## Event Filtering

Control which subscribers receive which events based on filters and rules.

### Publisher Exclusion

Don't receive your own publications:

```javascript
wampy.publish('com.myapp.chat.message', ['Hello everyone!'], {}, {
    exclude_me: true  // Don't receive this event
});

wampy.subscribe('com.myapp.chat.message', function(args) {
    // Won't receive messages published by this session
    console.log('Message from someone else:', args[0]);
});
```

### Subscriber Filtering

Control event delivery to specific sessions:

```javascript
// Only send to specific sessions
wampy.publish('com.myapp.admin.alert', ['System issue'], {}, {
    eligible: [session_id_1, session_id_2]  // Only these sessions receive
});

// Exclude specific sessions
wampy.publish('com.myapp.broadcast', ['Update'], {}, {
    exclude: [session_id_3]  // Everyone except this session
});
```

### Pattern-Based Subscriptions

Subscribe to multiple topics with patterns:

```javascript
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

## Call Timeouts

Prevent indefinite waiting with timeouts:

```javascript
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

Timeouts ensure callers don't wait indefinitely for unresponsive services.

## Caller Identification

Know who's calling your procedures:

```javascript
wampy.register('com.myapp.restricted.operation', {
    rpc: function(args, kwargs, details) {
        // details.caller contains caller's session ID
        console.log('Called by session:', details.caller);

        // Can look up caller identity
        // Check additional authorization
        // Log for audit purposes

        return performOperation(args, kwargs);
    },
    disclose_caller: true  // Request caller disclosure
});
```

Useful for:
- Audit logging
- Additional authorization checks
- Rate limiting per caller
- Usage analytics

## Publisher Identification

Know who published events:

```javascript
wampy.subscribe('com.myapp.events', {
    onEvent: function(args, kwargs, details) {
        // details.publisher contains publisher's session ID
        console.log('Published by session:', details.publisher);
        console.log('Event data:', args, kwargs);
    },
    get_publisher: true  // Request publisher disclosure
});
```

## Best Practices

### Design for Failure

Assume services will fail:
- Use shared registrations for redundancy
- Implement client-side retries
- Use circuit breakers for external dependencies
- Monitor service health

### Start Simple, Scale Gradually

Begin with exact registrations and single instances:

```javascript
// Start simple
wampy.register('com.myapp.process', {rpc: handler});
```

Add complexity only when needed:

```javascript
// Scale to multiple instances
wampy.register('com.myapp.process', {
    rpc: handler,
    invoke: 'roundrobin'
});
```

### Monitor and Measure

Track key metrics:
- Call latency and success rates
- Registration/unregistration events
- Load distribution across instances
- Error rates and types

Use WAMP meta events to build monitoring:

```javascript
// Subscribe to registration changes
wampy.subscribe('wamp.registration.on_create', function(args, kwargs) {
    console.log('New registration:', kwargs);
});

wampy.subscribe('wamp.registration.on_delete', function(args, kwargs) {
    console.log('Registration removed:', kwargs);
});
```

### Test Failure Scenarios

Don't wait for production to test failover:

1. **Kill instances** - Verify others take over
2. **Simulate network issues** - Test retry logic
3. **Overload services** - Validate circuit breakers
4. **Partition clusters** - Ensure graceful degradation

### Document Invocation Policies

Make registration policies explicit in service documentation:

```javascript
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

## Summary

WAMP's beyond-the-basics features enable production-ready distributed systems:

- **Load balancing** through shared registrations with configurable policies
- **Automatic failover** as instances come and go
- **Pattern-based registration** for flexible service implementations
- **Event filtering** for fine-grained control over event delivery
- **Timeouts** to prevent indefinite waiting
- **Caller/publisher identification** for audit and authorization

These capabilities are built into the protocol—no external load balancers, service registries, or complex infrastructure required. Bondy provides them all out of the box, making it simple to build systems that are both robust and scalable.

Explore the deep dives for more details:
- [Advanced RPC](/concepts/wamp/advanced/rpc) - Progressive calls, cancellation, trust levels
- [Advanced PubSub](/concepts/wamp/advanced/pubsub) - Event history, retention, sharding
