# bondy.error.export_in_progress
When an export or import is requested while an export is already running.

## Description
Raised by [`bondy.export.create`](/reference/wamp_api/export#create-an-export) or [`bondy.export.import`](/reference/wamp_api/export#import-an-export) — only one export or import runs at a time, node-wide. Check [`bondy.export.status`](/reference/wamp_api/export#check-status) and retry once it reports idle.

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
            'description': 'export_in_progress'
        },
        'description': {
            'type': 'string',
            'description': 'The error description'
        },
        'message': {
            'type': 'string',
            'description': 'The error message'
        }
	})"
/>
