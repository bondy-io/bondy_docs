DRAFT{.watermark}
# Session
> A Session is an authenticated two-way link between a client and the Router, enabling real-time, interactive communication between the client and other peers (incl. the Router itself) over a single [Realm](/reference/wamp_api/realm).{.definition}

Key characteristics:

* A session is established at a certain point in time, and then ‘torn down’–brought to an end–at some later point.
* A session is attached to a single Realm
* A session is authenticated on the Realm (unless `anonymous` is being used as `authmethod`)
* A session is **stateful**, meaning that Bondy holds current state information about the session to be able to communicate, as opposed to stateless communication, where the communication consists of independent request-response interactions.



## Types
### session{.datatype}

<DataTreeView :data="session" :maxDepth="10" />

## Procedures

|Name|URI|
|:---|:---|
|[Retrieve a session](#retrieve-a-realm)|`wamp.session.get`|


### Retrieve a session
### wamp.session.get(id) -> session() {.wamp-procedure}
Retrieves information on a specific session

#### Call
##### Positional Args
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'id',
            'description' : 'The session identifier.'
        }
    })"
/>

##### Keyword Args
None.

#### Result

##### Positional Results

##### Keyword Results
None.

#### Errors

## Topics

### wamp.session.on_join{.wamp-topic}
##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'The URI of the realm you have created.'
        }
    })"
/>

##### Keyword Results
None.

### wamp.session.on_leave{.wamp-topic}
##### Positional Results
<DataTreeView
    :maxDepth="10"
    :data="JSON.stringify({
        '0':{
            'type': 'uri',
            'description' : 'The URI of the realm you have created.'
        }
    })"
/>

##### Keyword Results
None.

<script>
export default {
    data() {
        return {
            session: `{
                "name" : {
                    "description": "The name of the thing",
                    "type": "string",
                    "required": true,
                    "mutable": true
                }

            }`
        }
    }
}
</script>