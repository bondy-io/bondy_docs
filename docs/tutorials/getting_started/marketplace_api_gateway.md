---
outline: [2,3]
draft: true
related:
    - text: Marketplace
      type: Tutorial
      link: /tutorials/getting_started/marketplace
      description: A tutorial that demonstrates a simple marketplace with Python microservices and a VueJS Web App.
    - text: HTTP API Gateway
      type: Reference
      link: /reference/api_gateway/specification#api-specification-object
      description: Bondy HTTP API Gateway acts as a reverse proxy by accepting incoming REST API actions and translating them into WAMP actions over a Realm's procedures and topics.
    - text: HTTP API Gateway
      type: HTTP API Reference
      link: /reference/http_api/api_gateway
      description: Load and manage API Gateway specifications.
---

# Marketplace HTTP API Gateway
A tutorial that demonstrates how to add an HTTP/REST API to an existing project using the HTTP API Gateway.

## Goal
In this tutorial we are going to pick up where we left off with the [Marketplace tutorial](/tutorials/getting_started/marketplace).

The idea is to now expose the Marketplace WAMP API to HTTP. The goal is to demonstrate how one can use Bondy's capabilities to integrate HTTP clients into the a Bondy Application Network.

The steps in the following sections will demonstrate how to create an HTTP [API Specification Object](/reference/api_gateway/specification#api-specification-object) from scratch, loading it in Bondy and demonstrating how we can call the resulting HTTP/REST API using an HTTP client.

::: definition API Gateway Specification
An API Gateway Specification is a document, a JSON data structure, that _declaratively_ defines an HTTP/REST API and how Bondy should handle each HTTP Request e.g. by converting it into a WAMP operation or forwarding it to an upstream (external) HTTP/REST API.
:::

## Background

The architecture remains the same as the one discussed in [Marketplace tutorial](/tutorials/getting_started/marketplace#demo-architecture) with the exception that we will now have the HTTP API Gateway and an HTTP client which are shown in the updated view below.

<ZoomImg src="/assets/tutorials/marketplace_api_gateway/marketplace.png"/>

The [Marketplace](/tutorials/getting_started/marketplace) offers the following WAMP API procedures registered on the `com.example.demo` realm:

- `com.market.bidder.add` - Add a user as bidder. Takes a single positional argument, the bidder name
- `com.market.bidder.gone` - Remove a user as bidder. Takes a single positional argument, the bidder name
- `com.market.get` - List all the items for sale
- `com.market.item.bid` - Place a bid on a listed item. Takes three positional arguments:
    - item name
    - item new price
    - bidder name
- `com.market.item.get` - Return an item's details. Takes single positional argument, the item name
- `com.market.item.sell` - List a new item for sale. Takes three positional arguments:
    - item name
    - item price
    - item deadline (in minutes)

:::::: warning Note
Since we wrote the Marketplace tutorial we have updated the [Marketplace Demo repository](https://github.com/bondy-io/bondy-demo-marketplace) so that the `com.example.demo` realm is already configured to support for OAuth2 authentication.

These changes include:

* adding `oauth2` and `password` to the realm's `authmethods`
* adding users, groups and grants to be able to perform the OAuth2 flow, including:
    - `postman`: Postman app user for testing purposes that belongs to the `api_clients` group
    - `victor`: An end user for testing purposes that belongs to the `resource_owners` group

Make sure you update your local copy of the Marketplace repository to the latest.

::: details Check the changes we made to the realm

As you can see in the lines highlighted below we added `oauth2` and `password` authmethods.

```json 5-6
{
    "authmethods": [
        "cryptosign",
        "anonymous",
        "oauth2",
        "password"
    ],
    "description": "The market realm",
    "is_prototype": false,
    "is_sso_realm": false,
    "password_opts": {
        "params": {
            "iterations": 10000,
            "kdf": "pbkdf2"
        },
        "protocol": "cra"
    },
    "public_keys": [
        {
            "crv": "P-256",
            "kid": "11116844",
            "kty": "EC",
            "x": "-wc2zdqixwOixJ45Bi_bmr5WknFyUibrQMWkLXbL3Kg",
            "y": "YBWzCcHCGMDAmUfx84J3O53L7QcZl_Be4zEMsjQmq8g"
        },
        {
            "crv": "P-256",
            "kid": "119815566",
            "kty": "EC",
            "x": "ce3F2nAqePIAgJawlupqUE3gjVmTSYLrAc76wyToBPc",
            "y": "a0WppYd2m_7UpXbb1SfW0O3i7USuxbUokl48Uk6GARQ"
        },
        {
            "crv": "P-256",
            "kid": "129179117",
            "kty": "EC",
            "x": "0XSBmbwcOTKxR14Ic8Nr9LMAjgOz_3FYfg7wJCaEdl4",
            "y": "TU9ji-7AelCmwrOu0fNfVN0G8o6LeNf-rNqjDspq2lM"
        }
    ],
    "security_status": "enabled",
    "uri": "com.market.demo"
}
```
:::

::::::


## 1. Run the Marketplace Demo

If you do not have a local copy of the [Marketplace Demo repository](https://github.com/bondy-io/bondy-demo-marketplace) follow the instructions in the [Marketplace tutorial](/tutorials/getting_started/marketplace#_2-build-and-run-the-demo) to download it.

Otherwise (assuming the repo it is under your home directory) do:

``` bash
cd ~/bondy-demo-marketplace
git pull
```

Make sure Docker is running and run the demo by using `make`.

```bash
make
```



## 2. Defining an API Gateway Spec
In this part we try to show how we can define an API Gateway Specification to be able to expose some HTTP endpoints that will be mapped to registered WAMP procedures:

### 2.1. Define an API Object

As a first step we need to declare and [API Object](/reference/api_gateway/specification#api-object). In this case we are configuring it with the **id** `com.market.demo` on the **realm** `com.market.demo` and with **oauth2** as security enabled and also some other defaults and configuration.

Lets define a skeleton of our API Object

```json
{
    "id":"com.market.demo",
    "realm_uri":"com.market.demo",
    "name":"Marketplace Demo API",
    "host":"_",
    "defaults":{},
    "meta":{},
    "variables":{},
    "status_codes": {},
    "versions": {}
}
```

In lines 2-3 we are declaring that our API has a unique id `com.market.demo` and that it will be attached a realm of the same name.

In line 4 we give it a `name`, this can be anything.

Finally in line 5 we set the `host` property to the wildcard `_`. This means that it will match any incoming HTTP request, regardless of the HTTP `HOST` header value.

::: info Note
In production, you will normally assign the `host` property the name of your domain or a pattern matching expression e.g. `www.example.com` or `.example.com`.

This is key when you have more than one API on different subdomains.
:::

So far this API does nothing as yet we need to define a value for `versions`.


### 2.2. Define the Versions Object

An API Object has one or more versions of an API. Its `versions` property takes a mapping from _version names_ to [Version Object](/reference/api_gateway/specification#version-object) instances.

Lets start defining a value for `versions`.

```json
{
    ...
    "versions": {
        "v1.0":{
            "base_path":"/[v1.0]",
            "variables":{
                "host":"http://localhost:8080"
            },
            "defaults":{},
            "languages":["en"],
            "paths":{}
        }
    }
}
```

Here we have defined a single version called `v1.0`.

As it is the only version we want the API Gateway to default to this version every time it handles a request with a path not containing a specific version.
So what we want is for request `GET /path/to/resource` to be equivalent to `GET /v1.0/path/to/resource`. We achieve that by using the expression `/[v1.0]` where the brackets mean "optional" as you can see in line 5.

Now lets add the actual HTTP/REST API content.


### 2.3 Define a Path Object
We define the actual paths of our HTTP/API using the [Path Object](/reference/api_gateway/specification#path-object) with the proper HTTP method, action type, WAMP procedures, arguments and responses.

The snippet below does implements the HTTP equivalent of the WAMP procedure `com.market.get` using the `/market`. This call doesn't require any args nor kwargs.


```json
{
     ...
     "versions": {
         "1.0.0":{
             ...
             "paths":{
                "/market":{
                    "is_collection":true,
                    "options":{
                        "action":{

                        },
                        "response":{
                            "on_error":{
                                "body":""
                            },
                            "on_result":{
                                "body":""
                            }
                        }
                    },
                    "get":{
                        "action":{
                            "type":"wamp_call",
                            "procedure":"com.market.get",
                            "options":{
                            },
                            "args":[
                            ],
                            "kwargs":{
                            }
                        },
                        "response":{
                            "on_error":{
                                "status_code":"{{status_codes |> get({{action.error.error_uri}}, 500) |> integer}}",
                                "body":"{{action.error.kwargs |> put(code, {{action.error.error_uri}})}}"
                            },
                            "on_result":{
                                "body":"{{action.result.args |> head}}"
                            }
                        }
                    }
                }
             }
         }
     }
}
```

::: info HTTP Resource Collections
In line 8 you will notice the property `is_collection` is given the value `true`. This is required so that the API Gateway can return the correct HTTP codes for the operations. In this case, this is true, as `/market` invokes `com.market.get` which returns a list of items.
:::

## 3. Loading the API Gateway Spec

Load the defined api spec using the [Bondy Administrative API](/reference/http_api/index)

```bash
curl -X "POST" "http://localhost:18081/services/load_api_spec" \
-H 'Content-Type: application/json; charset=utf-8' \
-H 'Accept: application/json; charset=utf-8' \
--data-binary "@api_gateway_config.json"
```

If the loading and applying was OK, th curl hasn’t result; detailed response with code and message in failure cases.

From the Bondy side, you can see in the logs the following lines:

```erlang
2022-12-06 10:48:11 bondy | when=2022-12-06T13:48:11.600576+00:00 level=notice pid=<0.1855.0> at=bondy_http_gateway:rebuild_dispatch_tables/0:223 description="Rebuilding HTTP Gateway dispatch tables" node=bondy@127.0.0.1 router_vsn=1.0.0-beta.68
2022-12-06 10:48:11 bondy | when=2022-12-06T13:48:11.604499+00:00 level=info pid=<0.1855.0> at=bondy_http_gateway:load_dispatch_tables/0:830 description="Loading and parsing API Gateway specification from store" node=bondy@127.0.0.1 router_vsn=1.0.0-beta.68 timestamp=-576460723125 name="Marketplace Demo API" id=com.market.demo
```


### Execution and test

1. Getting an oauth token ([JWT](https://jwt.io/)) using password method
    - Request

        ```bash
        curl --location --request POST 'http://localhost:18080/oauth/token' \
        --header 'Content-Type: application/x-www-form-urlencoded' \
        --header 'Authorization: Basic cG9zdG1hbjpQb3N0bWFuMTIzNDU2IQ==' \
        --data-urlencode 'username=victor' \
        --data-urlencode 'password=Victor123456!' \
        --data-urlencode 'grant_type=password'

        # where 'cG9zdG1hbjpQb3N0bWFuMTIzNDU2IQ==' is the base64 encoding of postman:Postman123456!
        ```

    - Response example

        ```json
        {
            "access_token": "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJjb20ubWFya2V0LmRlbW8iLCJleHAiOjkwMCwiZ3JvdXBzIjpbInJlc291cmNlX293bmVycyJdLCJpYXQiOjE2NzAzMzQ2ODAsImlkIjoxMjEwNjU1ODA2NTU3MzIsImlzcyI6InBvc3RtYW4iLCJraWQiOiI4MzMwOTAxMSIsIm1ldGEiOnsiZGVzY3JpcHRpb24iOiJWaWN0b3IgZW5kIHVzZXIgZm9yIHRlc3RpbmcgcHVycG9zZXMifSwic3ViIjoidmljdG9yIn0.fQ0Ctl9RV4TYzfcusHy1f6aDuqIVuMkffx08vJ9dFq-x8at3fdZR3alCrF1I2lYT5vJFA7YJqjHPb-rbDB2Y1A",
            "expires_in": 900,
            "refresh_token": "tlI4SzKqVsjcUsXYCXXmA2JkjAKZ1T7QSX5GB5Or",
            "scope": "resource_owners",
            "token_type": "bearer"
        }
        ```

2. Invoking an endpoint using Bearer Token method with the retrieved token above
    - Example `/market/item` endpoint trying to sell a new item
        - Request executing a POST method

            ```bash
            curl --location --request POST 'http://localhost:18080/market/item' \
            --header 'Authorization: Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJjb20ubWFya2V0LmRlbW8iLCJleHAiOjkwMCwiZ3JvdXBzIjpbInJlc291cmNlX293bmVycyJdLCJpYXQiOjE2NzAzMzQ2ODAsImlkIjoxMjEwNjU1ODA2NTU3MzIsImlzcyI6InBvc3RtYW4iLCJraWQiOiI4MzMwOTAxMSIsIm1ldGEiOnsiZGVzY3JpcHRpb24iOiJWaWN0b3IgZW5kIHVzZXIgZm9yIHRlc3RpbmcgcHVycG9zZXMifSwic3ViIjoidmljdG9yIn0.fQ0Ctl9RV4TYzfcusHy1f6aDuqIVuMkffx08vJ9dFq-x8at3fdZR3alCrF1I2lYT5vJFA7YJqjHPb-rbDB2Y1A' \
            --header 'Content-Type: application/json' \
            --data-raw '{
                "name": "first item",
                "price": 1,
                "deadline": 1
            }'
            ```

        - Response where the item was published successfully

            ```json
            true
            ```

    - Example of `/market` endpoint trying to retrieve the market items
        - Request executing a GET method

            ```bash
            curl --location --request GET 'http://localhost:18080/market' \
            --header 'Authorization: Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJjb20ubWFya2V0LmRlbW8iLCJleHAiOjkwMCwiZ3JvdXBzIjpbInJlc291cmNlX293bmVycyJdLCJpYXQiOjE2NzAzMzQ2ODAsImlkIjoxMjEwNjU1ODA2NTU3MzIsImlzcyI6InBvc3RtYW4iLCJraWQiOiI4MzMwOTAxMSIsIm1ldGEiOnsiZGVzY3JpcHRpb24iOiJWaWN0b3IgZW5kIHVzZXIgZm9yIHRlc3RpbmcgcHVycG9zZXMifSwic3ViIjoidmljdG9yIn0.fQ0Ctl9RV4TYzfcusHy1f6aDuqIVuMkffx08vJ9dFq-x8at3fdZR3alCrF1I2lYT5vJFA7YJqjHPb-rbDB2Y1A'
            ```

        - Response

            ```json
            [
                {
                    "deadline": "2022-12-06T14:06:10.306988+00:00",
                    "name": "first item",
                    "price": 591,
                    "winner": "Mary"
                }
            ]
            ```

    - Example of `/market/bidder` endpoint trying to add a new bidder
        - Request executing a POST method

            ```bash
            curl --location --request POST 'http://localhost:18080/market/bidder' \
            --header 'Authorization: Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJjb20ubWFya2V0LmRlbW8iLCJleHAiOjkwMCwiZ3JvdXBzIjpbInJlc291cmNlX293bmVycyJdLCJpYXQiOjE2NzAzMzU3OTMsImlkIjo2NDI1NTI3ODE5NTYxMTQsImlzcyI6InBvc3RtYW4iLCJraWQiOiIyMDkxODg3MSIsIm1ldGEiOnsiZGVzY3JpcHRpb24iOiJWaWN0b3IgZW5kIHVzZXIgZm9yIHRlc3RpbmcgcHVycG9zZXMifSwic3ViIjoidmljdG9yIn0.6Cm25Hs9lCMP4OwXPeRei6kYc1E2YuGjj4yaQ1bP9D5_LI0VeUny0c2AMyYOO76MyCvXGFRJjM3uVhREvA1obw' \
            --header 'Content-Type: application/json' \
            --data-raw '{
                "name": "ale"
            }'
            ```

            From the Market side, you can see in the logs the following lines:

            ```python
            2022-12-06 11:14:27 market  | New bidder: ale
            ```

    - Example of `/market/bidder/:name` trying to delete a registered bidder
        - Request executing a DELETE method

            ```bash
            curl --location --request DELETE 'http://localhost:18080/market/bidder/ale' \
            --header 'Authorization: Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJjb20ubWFya2V0LmRlbW8iLCJleHAiOjkwMCwiZ3JvdXBzIjpbInJlc291cmNlX293bmVycyJdLCJpYXQiOjE2NzAzMzU3OTMsImlkIjo2NDI1NTI3ODE5NTYxMTQsImlzcyI6InBvc3RtYW4iLCJraWQiOiIyMDkxODg3MSIsIm1ldGEiOnsiZGVzY3JpcHRpb24iOiJWaWN0b3IgZW5kIHVzZXIgZm9yIHRlc3RpbmcgcHVycG9zZXMifSwic3ViIjoidmljdG9yIn0.6Cm25Hs9lCMP4OwXPeRei6kYc1E2YuGjj4yaQ1bP9D5_LI0VeUny0c2AMyYOO76MyCvXGFRJjM3uVhREvA1obw' \
            --header 'Content-Type: application/json' \
            --data-raw '{
                "name": "ale"
            }'
            ```

            From the Market side, you can see in the logs the following lines:

            ```python
            2022-12-06 11:17:31 market  | ale left, cancel their bids.
            ```

3. Invoking an endpoint with invalid credentials
    1. Using an old token with an inexistent user we have the following response:

        ```json
        {
            "code": "wamp.error.no_such_principal",
            "description": "",
            "message": "The request failed because the authid provided does not exist."
        }
        ```

2. Using an expired token we have the following response:

```json
{
    "code": "invalid_grant",
    "description": "The provided authorization grant (e.g., authorization code, resource owner credentials) or refresh token is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client. The client MAY request a new access token and retry the protected resource request.",
    "message": "The access or refresh token provided is expired, revoked, malformed, or invalid."
}
```


## Conclusion

It is very easy to configure and expose an HTTP/REST API on top of an existing WAMP API. We can do it by using a declarative specification language based on JSON and without any coding.

As a reference, you can see the resulting HTTP API Specification file at [api_gateway_config.json](https://github.com/bondy-io/bondy-demo-marketplace/blob/main/resources/api_gateway_config.json).

Finally, you can check the complete [Marketplace Postman Collection](/assets/tutorials/Bondy_Marketplace_demo.postman_collection.json).

<ZoomImg alt="Postman Collection overview" src="/assets/tutorials/Postman_Collection.png"/>
