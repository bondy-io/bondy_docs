---
draft: true
---
# Getting Started with WAMP
WAMP is a routed protocol for distributed applications with all application components connecting to a WAMP Router, where the WAMP Router performs message routing between them. WAMP provides two communication patterns: Publish-Subscribe and Routed Remote Procedure Calls.


## Establishing a Session

The typical data exchange workflow is:

- Clients connect to the *Router* using a transport, serialisation format and authentication method of choice, establishing a session onto a realm.
- The *Router* authenticates the clients and grants them permissions for the current session.
- Clients send messages to the router which routes them to the targets using message URIs.


## Routed RPC Message Flows
The clients send these messages using the two high-level primitives that are routed RPC and PubSub, doing four core interactions:

- **register**: a client (*Callee*) exposes a procedure to be called remotely with an URI (also a URI pattern if Router provides this feature).

    ```javascript
    wampy.register('com.example.add', {
        rpc: function(args) {
            return args[0] + args[1];
        }
    });
    ```

- **call**: a client (*Caller*) asks the *Router* to invoke procedure from another client by providing the procedure URI.

    ```javascript
    wampy.call('com.example.add', [3, 4], {
        onSuccess: function(result) {
            // result = 7
            console.log('Result:', result);
        }
    });
    ```

## Pub/Sub Message Flows

- **subscribe**: a client (*Subscriber*) notifies its interest in a topic, by providing the topic URI (or URI pattern).
- **publish**: a client (*Publisher*) publishes events on a topic, by providing the topic URI.


## Registering a procedure

## Making Calls

## Publishing to a topic

## Subscribing to a topic

