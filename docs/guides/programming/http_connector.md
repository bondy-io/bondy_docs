---
outline: [2,3]
related:
    - text: HTTP Connector
      type: Concepts
      link: /concepts/http_connector
      description: Understand the architecture, request routing, and authentication model of the HTTP Connector.
    - text: HTTP Connector Configuration Reference
      type: Configuration Reference
      link: /reference/configuration/http_connector
      description: Complete bondy.conf reference for all HTTP Connector service configuration keys.
---
# Using the HTTP Connector

This guide walks through setting up the HTTP Connector to expose an upstream HTTP/REST API as WAMP procedures.

## Defining a Service

Add the following to your `bondy.conf` to define a service that proxies to a billing API:

```ini
## Upstream base URL
http_connector.services.billing.base_url = https://billing.example.com/api
http_connector.services.billing.timeout = 15s
http_connector.services.billing.retries = 2

## Map WAMP procedures to HTTP endpoints
http_connector.services.billing.procedures.get_invoice.uri = com.billing.get_invoice
http_connector.services.billing.procedures.get_invoice.realm = com.example.myrealm
http_connector.services.billing.procedures.get_invoice.method = get
http_connector.services.billing.procedures.get_invoice.path = /invoices/{{id}}

http_connector.services.billing.procedures.create_invoice.uri = com.billing.create_invoice
http_connector.services.billing.procedures.create_invoice.realm = com.example.myrealm
http_connector.services.billing.procedures.create_invoice.method = post
http_connector.services.billing.procedures.create_invoice.path = /invoices
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
http_connector.services.billing.auth.fetch.method = post
http_connector.services.billing.auth.fetch.url = https://idp.example.com/oauth/token
http_connector.services.billing.auth.fetch.body_encoding = form
http_connector.services.billing.auth.fetch.body.grant_type = client_credentials
http_connector.services.billing.auth.fetch.body.client_id = {{client_id}}
http_connector.services.billing.auth.fetch.body.client_secret = {{client_secret}}
http_connector.services.billing.auth.fetch.token_path = access_token
http_connector.services.billing.auth.fetch.expires_in_path = expires_in

## Token placement
http_connector.services.billing.auth.apply.placement = header
http_connector.services.billing.auth.apply.name = Authorization
http_connector.services.billing.auth.apply.format = Bearer {{token}}

## Credentials
http_connector.services.billing.auth.vars.client_id = my-client-id
http_connector.services.billing.auth.vars.client_secret = my-client-secret

## Cache
http_connector.services.billing.auth.cache.default_ttl = 1h
http_connector.services.billing.auth.cache.refresh_margin = 2m
```

### API Key

For services that use a static API key:

```ini
## No token fetch needed — use the key directly
http_connector.services.maps.auth.apply.placement = query_param
http_connector.services.maps.auth.apply.name = api_key

## The "token" is the static key value
http_connector.services.maps.auth.vars.token = my-api-key-123
http_connector.services.maps.auth.apply.format = {{token}}
```

### Basic Auth on Token Request

Some IdPs require HTTP Basic authentication on the token endpoint itself:

```ini
http_connector.services.billing.auth.fetch.basic_auth.username = {{client_id}}
http_connector.services.billing.auth.fetch.basic_auth.password = {{client_secret}}
```


## Using AWS Secrets Manager

Instead of putting credentials in `bondy.conf`, resolve them from AWS Secrets Manager at startup:

```ini
## External secrets
http_connector.services.billing.auth.secrets.provider = aws_sm
http_connector.services.billing.auth.secrets.secret_id = arn:aws:secretsmanager:us-east-1:123456789:secret:billing-creds
http_connector.services.billing.auth.secrets.region = us-east-1

## Map secret fields to auth variables
http_connector.services.billing.auth.secrets.vars.client_id.field = CLIENT_ID
http_connector.services.billing.auth.secrets.vars.client_id.transform = none

http_connector.services.billing.auth.secrets.vars.client_secret.field = CLIENT_SECRET
http_connector.services.billing.auth.secrets.vars.client_secret.transform = none
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
http_connector.services.billing.auth.secrets.vars.client_id.field = AUTHORIZATION_HEADER
http_connector.services.billing.auth.secrets.vars.client_id.transform = basic_username

http_connector.services.billing.auth.secrets.vars.client_secret.field = AUTHORIZATION_HEADER
http_connector.services.billing.auth.secrets.vars.client_secret.transform = basic_password
```
:::

::: warning
If secret resolution fails at startup, the service starts but returns `bondy.error.bad_gateway` (503) for all calls until the secrets are resolved. Resolution is retried automatically with exponential backoff.
:::


## Error Handling in Client Code

The HTTP Connector maps HTTP errors to standard WAMP error URIs. Your client code should handle these errors based on the URI and the kwargs payload:

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
