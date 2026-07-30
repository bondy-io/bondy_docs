# bondy.error.property_range_limit
When a property's value would exceed the maximum number of values allowed for it.

## Description
Some properties cap how many values they can hold — for example, a [User](/reference/wamp_api/user)'s `aliases` list accepts at most 5 entries. Adding one more once the cap is reached raises this error instead of silently truncating the list; remove an existing value first if you need to add a new one.

##### Positional Results
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        0: {
            'type': 'string',
            'description': 'The error message'
        }
	})"
/>

##### Keyword Results
<DataTreeView
	:maxDepth="10"
	:data="JSON.stringify({
        'code': {
            'type': 'string',
            'description': 'property_range_limit'
        },
        'description': {
            'type': 'string',
            'description': 'The error description, naming the property and its limit'
        },
        'message': {
            'type': 'string',
            'description': 'The error message'
        }
	})"
/>
