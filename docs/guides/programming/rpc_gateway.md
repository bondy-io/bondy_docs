---
outline: [2,3]
related:
    - text: RPC Gateway
      type: Concepts
      link: /concepts/rpc_gateway
      description: Understand the architecture, request routing, and authentication model of the RPC Gateway.
    - text: RPC Gateway Configuration Reference
      type: Configuration Reference
      link: /reference/configuration/rpc_gateway
      description: Complete bondy.conf reference for all RPC Gateway service configuration keys.
---
# Using the RPC Gateway

This guide walks through setting up the RPC Gateway to expose an upstream HTTP/REST API as WAMP procedures.

## Defining a Service

Add the following to your `bondy.conf` to define a service that proxies to a billing API:

```ini
## Upstream base URL
rpc_gateway.services.billing.base_url = https://billing.example.com/api
rpc_gateway.services.billing.timeout = 15s
rpc_gateway.services.billing.retries = 2

## Map WAMP procedures to HTTP endpoints
rpc_gateway.services.billing.procedures.get_invoice.uri = com.billing.get_invoice
rpc_gateway.services.billing.procedures.get_invoice.realm = com.example.myrealm
rpc_gateway.services.billing.procedures.get_invoice.method = get
rpc_gateway.services.billing.procedures.get_invoice.path = /invoices/{{id}}

rpc_gateway.services.billing.procedures.create_invoice.uri = com.billing.create_invoice
rpc_gateway.services.billing.procedures.create_invoice.realm = com.example.myrealm
rpc_gateway.services.billing.procedures.create_invoice.method = post
rpc_gateway.services.billing.procedures.create_invoice.path = /invoices
```

After restarting Bondy, any WAMP client connected to `com.example.myrealm` can call `com.billing.get_invoice` and `com.billing.create_invoice`.


## Calling Procedures

### GET — Fetch a Resource

Remaining kwargs (after path interpolation) become query parameters:

::: code-group
```json [WAMP Call]
// Call: com.billing.get_invoice
// KWArgs:
{
    "id": "INV-001",
    "expand": "lines"
}
```

```bash [HTTP Request]
GET https://billing.example.com/api/invoices/INV-001?expand=lines
```

```json [WAMP Result]
{
    "status": 200,
    "body": {
        "id": "INV-001",
        "amount": 1500,
        "status": "paid"
    }
}
```
:::

The `id` kwarg is consumed by the path template `{{id}}`. The remaining `expand` kwarg becomes a query parameter.

### POST — Create a Resource

Remaining kwargs become the JSON request body:

::: code-group
```json [WAMP Call]
// Call: com.billing.create_invoice
// KWArgs:
{
    "customer": "cust-42",
    "amount": 2500,
    "currency": "USD",
    "lines": [
        {"desc": "Widget", "qty": 5, "price": 500}
    ]
}
```

```bash [HTTP Request]
POST https://billing.example.com/api/invoices
Content-Type: application/json

{"customer":"cust-42","amount":2500,"currency":"USD",
 "lines":[{"desc":"Widget","qty":5,"price":500}]}
```

```json [WAMP Result]
{
    "status": 201,
    "body": {
        "id": "INV-002",
        "customer": "cust-42",
        "amount": 2500,
        "status": "draft"
    }
}
```
:::

### PATCH — Partial Update

Path variables are consumed; remaining kwargs become the body:

::: code-group
```json [WAMP Call]
// Call: com.billing.update_invoice
// KWArgs:
{
    "id": "INV-001",
    "status": "paid",
    "notes": "Paid in full"
}
```

```bash [HTTP Request]
PATCH https://billing.example.com/api/invoices/INV-001
Content-Type: application/json

{"status":"paid","notes":"Paid in full"}
```

```json [WAMP Result]
{
    "status": 200,
    "body": {
        "id": "INV-001",
        "status": "paid",
        "notes": "Paid in full"
    }
}
```
:::


### DELETE — Remove a Resource

Same as GET — remaining kwargs become query parameters, body is empty:

::: code-group
```json [WAMP Call]
// Call: com.billing.delete_invoice
// KWArgs:
{
    "id": "INV-001"
}
```

```bash [HTTP Request]
DELETE https://billing.example.com/api/invoices/INV-001
```

```json [WAMP Result]
{
    "status": 204,
    "body": ""
}
```
:::


## Custom Headers

Pass a `_headers` key in kwargs to inject custom HTTP headers:

```json
{
    "_headers": {
        "X-Request-ID": "req-42",
        "X-Tenant": "acme"
    },
    "id": "INV-001",
    "expand": "lines"
}
```

The `_headers` value is merged with the default headers (`Content-Type: application/json`, `Accept: application/json`) and any auth headers. The `_headers` key is removed before kwargs routing.


## Authentication Setup

### OAuth2 Client Credentials

The most common pattern — acquire a bearer token from an OAuth2 token endpoint:

```ini
## Token acquisition
rpc_gateway.services.billing.auth.fetch.method = post
rpc_gateway.services.billing.auth.fetch.url = https://idp.example.com/oauth/token
rpc_gateway.services.billing.auth.fetch.body_encoding = form
rpc_gateway.services.billing.auth.fetch.body.grant_type = client_credentials
rpc_gateway.services.billing.auth.fetch.body.client_id = {{client_id}}
rpc_gateway.services.billing.auth.fetch.body.client_secret = {{client_secret}}
rpc_gateway.services.billing.auth.fetch.token_path = access_token
rpc_gateway.services.billing.auth.fetch.expires_in_path = expires_in

## Token placement
rpc_gateway.services.billing.auth.apply.placement = header
rpc_gateway.services.billing.auth.apply.name = Authorization
rpc_gateway.services.billing.auth.apply.format = Bearer {{token}}

## Credentials
rpc_gateway.services.billing.auth.vars.client_id = my-client-id
rpc_gateway.services.billing.auth.vars.client_secret = my-client-secret

## Cache
rpc_gateway.services.billing.auth.cache.default_ttl = 1h
rpc_gateway.services.billing.auth.cache.refresh_margin = 2m
```

### API Key

For services that use a static API key:

```ini
## No token fetch needed — use the key directly
rpc_gateway.services.maps.auth.apply.placement = query_param
rpc_gateway.services.maps.auth.apply.name = api_key

## The "token" is the static key value
rpc_gateway.services.maps.auth.vars.token = my-api-key-123
rpc_gateway.services.maps.auth.apply.format = {{token}}
```

### Basic Auth on Token Request

Some IdPs require HTTP Basic authentication on the token endpoint itself:

```ini
rpc_gateway.services.billing.auth.fetch.basic_auth.username = {{client_id}}
rpc_gateway.services.billing.auth.fetch.basic_auth.password = {{client_secret}}
```


## Using AWS Secrets Manager

Instead of putting credentials in `bondy.conf`, resolve them from AWS Secrets Manager at startup:

```ini
## External secrets
rpc_gateway.services.billing.auth.secrets.provider = aws_sm
rpc_gateway.services.billing.auth.secrets.secret_id = arn:aws:secretsmanager:us-east-1:123456789:secret:billing-creds
rpc_gateway.services.billing.auth.secrets.region = us-east-1

## Map secret fields to auth variables
rpc_gateway.services.billing.auth.secrets.vars.client_id.field = CLIENT_ID
rpc_gateway.services.billing.auth.secrets.vars.client_id.transform = none

rpc_gateway.services.billing.auth.secrets.vars.client_secret.field = CLIENT_SECRET
rpc_gateway.services.billing.auth.secrets.vars.client_secret.transform = none
```

The secret JSON is expected to contain the referenced fields:
```json
{
    "CLIENT_ID": "my-client-id",
    "CLIENT_SECRET": "my-client-secret"
}
```

Resolved values override static `auth.vars` values with the same name.

::: tip Transforms
If the secret contains a `Basic base64(user:pass)` encoded value, use the `basic_username` and `basic_password` transforms to extract the components:

```ini
rpc_gateway.services.billing.auth.secrets.vars.client_id.field = AUTHORIZATION_HEADER
rpc_gateway.services.billing.auth.secrets.vars.client_id.transform = basic_username

rpc_gateway.services.billing.auth.secrets.vars.client_secret.field = AUTHORIZATION_HEADER
rpc_gateway.services.billing.auth.secrets.vars.client_secret.transform = basic_password
```
:::

::: warning
If secret resolution fails at startup, the service starts but returns `bondy.error.bad_gateway` (503) for all calls until the secrets are resolved. Resolution is retried automatically with exponential backoff.
:::


## Error Handling in Client Code

The RPC Gateway maps HTTP errors to standard WAMP error URIs. Your client code should handle these errors based on the URI and the kwargs payload:

::: code-group
```python [Python (autobahn)]
from autobahn.asyncio.wamp import ApplicationSession

class MyComponent(ApplicationSession):
    async def onJoin(self, details):
        try:
            result = await self.call('com.billing.get_invoice', id='INV-001')
            print(f"Status: {result['status']}, Body: {result['body']}")
        except Exception as e:
            # e.error contains the WAMP error URI
            # e.kwargs contains {"status": <http_code>, "body": <response>}
            if e.error == 'wamp.error.not_found':
                print("Invoice not found")
            elif e.error == 'wamp.error.not_authorized':
                print("Not authorized")
            elif e.error == 'bondy.error.bad_gateway':
                print(f"Upstream error: {e.kwargs.get('body')}")
```

```javascript [JavaScript (autobahn-js)]
session.call('com.billing.get_invoice', [], {id: 'INV-001'})
    .then(result => {
        console.log('Status:', result.kwargs.status);
        console.log('Body:', result.kwargs.body);
    })
    .catch(error => {
        // error.error contains the WAMP error URI
        // error.kwargs contains {status: <http_code>, body: <response>}
        switch (error.error) {
            case 'wamp.error.not_found':
                console.log('Invoice not found');
                break;
            case 'wamp.error.not_authorized':
                console.log('Not authorized');
                break;
            case 'bondy.error.bad_gateway':
                console.log('Upstream error:', error.kwargs.body);
                break;
        }
    });
```
:::
