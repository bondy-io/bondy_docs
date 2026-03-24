---
outline: [2,3]
related:
    - type: tutorial
      text: Marketplace HTTP API Gateway Tutorial
      link: /tutorials/getting_started/marketplace_api_gateway
      description: Learn how to use OAuth2 tokens with the HTTP API Gateway
    - type: reference
      text: HTTP API Gateway Specification
      link: /reference/api_gateway/specification
      description: Configure OAuth2 authentication in API Gateway specifications
---

# OAuth2 Token

OAuth2 tokens in Bondy are JWT (JSON Web Tokens) that can be used to authenticate HTTP API requests via the HTTP API Gateway.

## Description

OAuth2-based authentication allows clients to present an authentication token when making HTTP requests to Bondy's HTTP API Gateway. These tokens are issued and managed through HTTP endpoints, not WAMP procedures.

## Important Considerations

### Requires HTTP API Gateway
OAuth2 tokens are obtained and used exclusively through Bondy's HTTP API Gateway. If you are primarily using WAMP for communication, consider using [Ticket](/reference/wamp_api/ticket) authentication instead, which works natively with WAMP.

### Requires Base Authentication Method
Bondy's OAuth2-based authentication does not work independently. It requires a user to be authenticated using either `wampcra` or `cryptosign` (base authentication method) before the user can obtain an OAuth2 token.

When defining [Sources](/reference/wamp_api/source) for a user, you need to add two rules:
1. One for `oauth2`
2. Another for the base method (`wampcra` or `cryptosign`)

## HTTP Endpoints

OAuth2 tokens are managed through the following HTTP endpoints:

### Token Endpoint
- **Default Path**: `/oauth/token`
- **Purpose**: Obtain or refresh an OAuth2 token
- **Methods**: POST
- **Grant Types Supported**:
  - `password` - Resource Owner Password Credentials flow
  - `refresh_token` - Token refresh flow

### Revoke Endpoint
- **Default Path**: `/oauth/revoke`
- **Purpose**: Revoke an existing OAuth2 token
- **Methods**: POST

## Configuration

OAuth2 authentication is configured in the [HTTP API Gateway Specification](/reference/api_gateway/specification) for each API. The token and revoke endpoints can be customized if needed.

Example configuration:

```json
{
  "oauth2": {
    "flow": "resource_owner_password_credentials",
    "token_path": "/oauth/token",
    "revoke_token_path": "/oauth/revoke",
    "type": "oauth2"
  }
}
```

## Usage Example

### Obtaining a Token

```bash
curl --location --request POST 'http://localhost:18080/oauth/token' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --header 'Authorization: Basic <base64_encoded_client_credentials>' \
  --data-urlencode 'username=myuser' \
  --data-urlencode 'password=mypassword' \
  --data-urlencode 'grant_type=password'
```

### Using the Token

Once obtained, the token can be used in the `Authorization` header for subsequent API requests:

```bash
curl --location --request GET 'http://localhost:18080/api/resource' \
  --header 'Authorization: Bearer <access_token>'
```

### Refreshing a Token

```bash
curl --location --request POST 'http://localhost:18080/oauth/token' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'refresh_token=<refresh_token>' \
  --data-urlencode 'grant_type=refresh_token'
```

### Revoking a Token

```bash
curl --location --request POST 'http://localhost:18080/oauth/revoke' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'token=<access_token>'
```

## Token Structure

OAuth2 tokens in Bondy are JWTs (JSON Web Tokens) that contain:
- **Standard JWT claims**: `iss`, `sub`, `aud`, `exp`, `iat`
- **Bondy-specific claims**: User identity, realm information, and authorization scopes

The tokens are cryptographically signed and can be verified by the HTTP API Gateway.

## Security Considerations

1. **Transport Security**: Always use HTTPS in production to protect tokens in transit
2. **Token Storage**: Store tokens securely on the client side
3. **Token Expiration**: Tokens have a configurable expiration time; implement token refresh logic
4. **Token Revocation**: Implement token revocation for logout and security incidents
5. **Scope Limitation**: Request only the scopes your application needs

## See Also

- [Source](/reference/wamp_api/source) - Configure authentication methods for users
- [User](/reference/wamp_api/user) - Manage user accounts
- [Ticket](/reference/wamp_api/ticket) - Alternative authentication mechanism for WAMP
- [HTTP API Gateway Specification](/reference/api_gateway/specification) - Configure API Gateway authentication
- [Marketplace API Gateway Tutorial](/tutorials/getting_started/marketplace_api_gateway) - Complete example using OAuth2 tokens
