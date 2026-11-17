---
draft: false
outline: [2,3]
related:
    - text: Advanced RPC
      type: Concept
      link: /connect/concepts/wamp/advanced/rpc
      description: Call deadlines, call retries and the other Bondy extensions to routed RPC, explained.
    - text: Registry Routing (RIB)
      type: Concept
      link: /connect/concepts/registry_routing
      description: How a node decides which nodes can serve a procedure, and what happens when that view is behind.
    - text: Diagnosing Calls That Find No Callee
      type: How-to Guide
      link: /connect/guides/troubleshooting/calls_that_find_no_callee
      description: Use the metrics to tell a missing registration from a routing view that is behind.
    - text: WAMP Compliance
      type: Reference
      link: /connect/reference/protocols/wamp
      description: Which parts of the WAMP specification Bondy implements.
---

# Call Routing and Retry Options

The options that bound how long a call lasts, whether Bondy tries it again, and how many cluster nodes Bondy routes it to.

`timeout` is a WAMP option. The others are Bondy extensions, so their names start with an underscore. Bondy does not validate the type of an extension option: a value of the wrong type disables the option, and the call proceeds without it.

> **Concept:** [Advanced RPC](/connect/concepts/wamp/advanced/rpc#bondy-extensions) · [Registry Routing (RIB)](/connect/concepts/registry_routing)

|Option|Set in|Type|Default|Purpose|
|---|---|---|---|---|
|[`timeout`](#timeout)|`CALL.Options`|integer, milliseconds|[`wamp.call_timeout`](/connect/reference/configuration/wamp#wamp.call_timeout)|The time one attempt waits for an answer.|
|[`_deadline`](#deadline)|`CALL.Options`|integer, milliseconds|none|The total time of the call, across every attempt.|
|[`_retries`](#retries)|`CALL.Options`|integer|`0`|The attempts Bondy can add after the first.|
|[`_idempotent`](#idempotent)|`REGISTER.Options`|boolean|`false`|Allows Bondy to invoke the procedure again for one call.|
|[`_routing_max_candidates`](#routing-max-candidates)|`CALL.Options`|integer|`2`|The distinct cluster nodes Bondy routes the call to.|
|[`retries`](#api-gateway-retries)|API Gateway action|integer|`defaults.retries`|Sets `_retries` on the call an HTTP request makes.|

## Bounding the duration

### `timeout` {#timeout}

The time one attempt waits for an answer, in milliseconds.

- **Set in:** `CALL.Options`.
- **Value:** a positive integer. With `0`, the attempt waits [`wamp.max_call_timeout`](/connect/reference/configuration/wamp#wamp.max_call_timeout).
- **Default:** [`wamp.call_timeout`](/connect/reference/configuration/wamp#wamp.call_timeout).

For a progressive call, each progressive result or argument chunk restarts the timeout. When the timeout expires and Bondy does not retry the call, the caller receives `wamp.error.timeout`.

Bondy checks for expired calls once a second, so a call can end up to one second after its timeout.

### `_deadline` {#deadline}

The total time of the call, in milliseconds from the moment Bondy receives the `CALL`.

- **Set in:** `CALL.Options`.
- **Value:** a positive integer. Any other value means no deadline.
- **Default:** none.

The deadline does not restart. Progressive results, argument chunks and retries all run inside it. When the deadline expires, the call ends with `wamp.error.timeout`. A call that sets both `timeout` and `_deadline` ends at whichever limit comes first.

A `bondy.*` procedure reads `_deadline` as its own time budget. A caller can shorten that budget with `_deadline`, and cannot lengthen it. See [`wamp.error.timeout`](/connect/reference/wamp_api/errors/wamp_timeout).

## Trying a call again

### `_retries` {#retries}

The number of attempts Bondy can add after the first attempt.

- **Set in:** `CALL.Options`.
- **Value:** a positive integer. Any other value means no retries.
- **Default:** `0`.

Bondy starts a new attempt in two cases:

|Case|Condition|What Bondy does|
|---|---|---|
|The call got no answer|The callee did not answer before `timeout`, or its session ended while it held the invocation. The registration set [`_idempotent`](#idempotent) to `true`.|Bondy routes the call again and sends a new `INVOCATION`.|
|The call found no callee|The node has no candidate for the procedure: no local registration, and no other node that it knows serves the procedure.|Bondy holds the call, waits, and routes it again.|

In the second case no callee ran the call, so the registration does not have to be idempotent. The first wait is about one second. Each later wait is longer, and the waits carry random jitter.

Every attempt counts against `_retries`. A new attempt routes like the first, so it reaches a registration made since the first attempt. On a cluster, a new attempt also reaches a registration that the node learned of since the first attempt.

**Limits.**

- Bondy starts no attempt after `_deadline`. Without `_deadline`, the call lasts at most `_retries + 1` timeouts.
- Bondy does not retry a progressive call, in either direction, because the caller might already hold part of its results.
- Bondy does not retry a call that a callee answered, whether with `RESULT` or with `ERROR`.

**Result.** When the attempts run out, the caller receives the error of the last attempt: `wamp.error.timeout`, `wamp.error.canceled` or `wamp.error.no_such_procedure`.

**What `_retries` does not do.** A retry does not ask another node whether it serves the procedure. Each attempt selects from what the routing node knows at that moment. See [`_routing_max_candidates`](#routing-max-candidates) for the option that moves a call between nodes.

### `_idempotent` {#idempotent}

Declares that running one invocation of the procedure twice is safe.

- **Set in:** `REGISTER.Options`.
- **Value:** `true`. Any other value means not idempotent.
- **Default:** `false`.

Bondy invokes a procedure again for the same call only when the registration sets `_idempotent` to `true` and the call sets [`_retries`](#retries). Without `_idempotent`, a call that timed out or lost its callee fails, because the callee might already have run it.

`_idempotent` has no effect on a call that found no callee. That retry needs no permission, because nothing ran.

## Routing across a cluster

### `_routing_max_candidates` {#routing-max-candidates}

The number of distinct cluster nodes Bondy routes the call to before the routing failure is final.

- **Set in:** `CALL.Options`.
- **Value:** an integer of `1` or more. Any other value means the default.
- **Default:** `2`: the node Bondy selects first, and one more.

When the callee is on another node, the caller's node forwards the call to that node. That node then selects a callee among its own registrations. When that node has no live registration for the procedure, it answers with a miss, and the caller's node selects again among the nodes it has not tried. Its own registrations take part in that selection.

A miss happens before any `INVOCATION` is sent. Moving the call to another node therefore never runs the procedure twice, and needs neither `_retries` nor `_idempotent`.

**Limits.**

- Bondy selects only among the nodes that the caller's node knows serve the procedure. A node that the caller's node has not learned about is not a candidate, whatever the value of this option.
- Every node Bondy tries shares the time of one attempt. Trying another node does not extend `timeout`.
- Bondy does not move a call that sends progressive input, because the later chunks follow the first to the node it reached.
- With `1`, Bondy tries one node and the first miss is final.

**Result.** When every candidate misses, the caller receives `wamp.error.no_eligible_callee`. When the caller's node knows of no candidate at all, the caller receives `wamp.error.no_such_procedure`, and this option has no effect.

**With `_retries`.** A call that sets both options keeps its remaining retries when it moves to another node.

## HTTP API Gateway

### `retries` {#api-gateway-retries}

The number of retries of the action that an HTTP request runs.

- **Set in:** a `wamp_call` action of an API Gateway specification, or `defaults.retries` for every action.
- **Value:** an integer.
- **Default:** `defaults.retries`.

For a `wamp_call` action, the gateway passes `retries` as the `CALL` option `_retries`. A non-zero `_retries` in the action's `options` takes precedence. A `wamp_publish` action does not accept `retries`.

See the [API Gateway specification](/connect/reference/api_gateway/specification) for the `forward` action, where `retries` governs HTTP requests to an upstream.

## Errors

|Error|Meaning for these options|
|---|---|
|`wamp.error.no_such_procedure`|The caller's node knows of no callee for the procedure, on any node, after every attempt.|
|`wamp.error.no_eligible_callee`|The caller's node knew of callees, and every node it tried had none.|
|`wamp.error.timeout`|The `timeout` of the last attempt, or the `_deadline`, expired.|
|`wamp.error.canceled`|The callee's session ended while it held the invocation, and Bondy did not retry.|

## See also

- [Advanced RPC](/connect/concepts/wamp/advanced/rpc#bondy-extensions) explains the options with examples.
- [Diagnosing Calls That Find No Callee](/connect/guides/troubleshooting/calls_that_find_no_callee) uses the metrics to find which case a failing call is in.
- [Prometheus Metrics Reference](/connect/reference/metrics#registry-rib) lists the counters that record misses and retries.
