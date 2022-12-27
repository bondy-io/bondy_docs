---
related:
    - text: HTTP API Gateway Specification Reference
      type: Reference
      link: /reference/api_gateway/specification#api-specification-object
      description: Bondy HTTP API Gateway acts as a reverse proxy by accepting incoming REST API actions and translating them into WAMP actions over a Realm's procedures and topics.
    - text: HTTP API Gateway
      type: HTTP API Reference
      link: /reference/http_api/api_gateway
      description: Load and manage API Gateway specifications.
    - text: Marketplace HTTP API Gateway
      type: Tutorial
      link: /tutorials/getting_started/marketplace_api_gateway
      description: A tutorial that demonstrates a simple marketplace with Python microservices and a VueJS Web App.

---
# Loading an API Gateway Specification
Learn how to load an API Gateway Specification using the HTTP Admin API.

Loading an API you have defined using the [API Gateway Specification](#/reference/api_gateway/specification) is very easy you just need to know the location of your file and use the [HTTP Admin API](/reference/http_api/api_gateway).

## Assumptions

The following instructions assume the following:

* Your API Specification file is called `my_api.json`
* Your API Specification `id` property has the value `com.example.my_api`
* Bondy is running at `localhost` on port `18081`

::: info Host and Port
The above assumption means the `bondy.conf` file which you use to start Bondy contains the following configuration options:

*  `admin_api.http.enabled = on`
*  `admin_api.http.port = 18081`

:::

## Loading the API Specification

The following command will load the API Specification, validate it and if successful it will be compiled and activate it.

::: code-group
```bash [HTTP]
curl -X "POST" "http://localhost:18081/services/load_api_spec" \
-H 'Content-Type: application/json; charset=utf-8' \
-H 'Accept: application/json; charset=utf-8' \
--data-binary "@my_api.json"
```
:::

::: warning Cluster deployments
If this node is part of a Bondy cluster, the API will be automatically replicated and activated in all nodes.
:::

## Verifying the API Specification has been loaded

If the previous command didn't fail the API has been loaded and activated. However, to be entirely sure you can use the following command which should retrieve the API Specification.

::: code-group
```bash [HTTP]
curl -X "GET" "http://localhost:18081/api_specs/com.example.my_api"
```
:::
