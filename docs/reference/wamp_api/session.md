
# Session

Blabblabla


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