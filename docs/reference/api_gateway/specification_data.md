
<script>

const schemes = {
    "type": "array",
    "required": false,
    "mutable": false,
    "items": {
        "type": "string"
    },
    "default": '["http"]',
    "description": "An array of strings where values can be: `http` or `https`."
};

const headers = {
    "type": "() => map",
    "required": false,
    "mutable": false,
    "description": "A mapping of HTTP headers to their corresponding values."
};

const accepts = {
    "type": "array",
    "required": false,
    "mutable": false,
    "items": {
        "type": "string"
    },
    "description": "An array of content types. The supported content types are:\n* `application/json`\n* `application/json; charset=utf-8`\n* `application/msgpack` \n* `application/msgpack; charset=utf-8`\n* `application/x-www-form-urlencoded`"
};

const provides = {
    "type": "array",
    "required": false,
    "mutable": false,
    "items": {
        "type": "string"
    },
    "description": "An array of content types. The supported content types are:\n* `application/json`\n* `application/json; charset=utf-8`\n* `application/msgpack` \n* `application/msgpack; charset=utf-8`"
};

const request = {
    "type": "object",
    "required": false,
    "mutable": false,
    "description": "The contents (data and metadata) for each HTTP request.",
    "properties": {
        "id": {
            "type": "string",
            "required": false,
            "mutable": false,
            "description": "A unique tracing identifier for the request"
        },
        "method": {
            "type": "string",
            "required": false,
            "mutable": false,
            "description": "The HTTP method of the request. One of the following values:\n- `delete`\n- `get`\n- `head`\n- `options`\n- `patch`\n- `post`\n- `put`"
        },
        "scheme": schemes,
        "peername": {
            "type": "string",
            "required": false,
            "mutable": false,
            "description": "A string representation of the requester IP address and port number e.g. `127.0.0.1:54678`."
        },
        "path": {
            "type": "string",
            "required": false,
            "mutable": false,
            "description": "The relative path of the request."
        },
        "host": {
            "type": "string",
            "required": false,
            "mutable": false,
            "description": "The hostname of the request."
        },
        "port": {
            "type": "string",
            "required": false,
            "mutable": false,
            "description": "The port number the request."
        },
        "headers": headers,
        "language": {
            "type": "string",
            "required": false,
            "mutable": false,
            "description": "The requested language.",
            "default": '"en"'
        },
        "query_string": {
            "type": "string",
            "required": false,
            "mutable": false,
            "description": "The HTTP query string. See `query_params`."
        },
        "query_params": {
            "type": "map",
            "required": false,
            "mutable": false,
            "description": "A map of query params to values. This is the result of parsing the request's `query_string`.\n\nExamples:\n|Request|Property Value|\n|---|---|\n|`GET /users?region=us&type=individual`|`{\"region\": \"us\", \"type\": \"individual\"}`|\n|`GET /users?x=100&y=200`|`{\"x\": \"100\", \"y\": \"200\"}`|\n"
        },
        "bindings": {
            "type": "map",
            "required": false,
            "mutable": false,
            "description": "A map of path variable bindings. Bindings occur when the [Path Object](3path-object) contains patterns.\n\nExamples: For the path specification `/accounts/:acc_id/users/:user_id`\n|Request|Property Value|\n|---|---|\n|`GET /accounts/001/users/002`|`{\"acc_id\": \"001\", \"user_id\": \"002\"}`|\n"
        },
        "body": {
            "type": "any",
            "required": false,
            "mutable": false,
            "description": "The body of the request. This is the result of decoding the HTTP body using the encoding determined by the [Path Object](#path-object) `accepts` property which defines the content-types allowed for `POST`, `PUT` and `PATCH`."
        },
        "body_length": {
            "type": "integer",
            "required": false,
            "mutable": false,
            "description": "The length of the body in bytes."
        }
    }
};

const context = {
    "request": {
        "type": "RequestObject",
        "required": false,
        "mutable": true,
        "description": "The contents (data and metadata) of the HTTP request being evaluated. The request data is available at runtime, so any expression defined during design time will result in a `promise` that will be evaluated to a value when handling the HTTP request."
    },
    "security": {
        "type": "SecurityObject",
        "required": false,
        "mutable": true,
        "description": "An instance of the [Security Object](#security-object). Its initial value comes from the [API Object](#api-object) `defaults.security` or `variables.security` property. It is then possibly overridden recursively during evaluation by each [Path Object]#(path-object) definition."
    },
    "action": {
        "type": "object",
        "required": false,
        "mutable": true,
        "properties": {
            "result" : {
                "type": "ResultObject",
                "description": "If the action was successful the value will be the result of evaluating the [Response Object](#response-object) `on_result` property associated with the [Operation Object](#operation-object) executed for this HTTP Request."
            },
            "error" : {
                "type": "ErrorObject",
                "description": "If the action failed the value will be the result of evaluating the [Response Object](#response-object) `on_error` property associated with the [Operation Object](#operation-object) executed for this HTTP Request."
            }
        },
        "description": "At runtime it will contain the result or error of the action performed by the API Gateway during the handling of an HTTP request."
    },
    "variables": {
        "type": "map",
        "required": false,
        "mutable": true,
        "description": "A mapping of arbitrary variable names to values or expressions. Each entry in this map is obtained during the parsing of the [API Object](#api-object) tree. At each level of the tree this property will merge in the values of the target object's `variables` property, so children nodes can access the entries defined in the ancestors, override them and/or add new variables to the context."
    },
    "defaults": {
        "type": "map",
        "required": false,
        "mutable": true,
        "description": "A mapping of object properties to their default values. Each entry in this map is obtained during the parsing of the [API Object](#api-object) tree. At each level of the tree this property will merge in the values of the target object's `defaults` property, so children nodes can access the entries defined in the ancestors, override them and/or add new defaults to the context. Expressions in the defaults mapping can reference variables in the `variables` property."
    },
    "status_codes": {
        "type": "map",
        "required": false,
        "mutable": true,
        "description": "A mapping of WAMP Error URIs to HTTP Status Codes, to be used when the [Operation Object](#operation-object) is a WAMP Action. The entries of this map are [recursively updated](#recursive-evaluation) during evaluation. At each level of the tree this property will merge in the values of the target object's `status_codes` property, so children nodes can access the entries defined in the ancestors, override them and/or add new status codes to the context.",
        "default":"The value of the [API Object](#api-object) `defaults` property."
    }
};


const wampResult = {
    "type": "object",
    "properties": {
        "request_id":{
            "type": "integer",
            "required": false,
            "mutable": false,
            "description": "The WAMP `RESULT.id`."
        },
        "details": {
            "type": "map",
            "required": false,
            "mutable": false,
            "description": "The WAMP `RESULT.details`."
        },
        "args": {
            "type": "array",
            "items": {
                "type": "any"
            },
            "required": false,
            "mutable": false,
            "description": "The WAMP `RESULT.args`."
        },
        "kwargs": {
            "type": "() => map",
            "required": false,
            "mutable": false,
            "description": "The WAMP `RESULT.kwargs`."
        }
    }
};

const error = {

};

const api = {
    "id": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "A global unique identifier for this API."
    },

    "host": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "A string used for matching the incoming HTTP request HOST header value. Hosts with and without a trailing dot are equivalent for routing. Similarly, hosts with and without a leading dot are also equivalent e.g. `cowboy.example.org`, `cowboy.example.org.` and `.cowboy.example.org` are equivalent. A pattern using the keyword `:` and wildcard `_` can be used to match multiple domains e.g. `mydomain.:_` will match `mydomain.foo` and `mydomain.bar` but not `mydomain.foo.baz`."
    },
    "realm_uri": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "The realm this API will target. An API can only target a single realm."
    },
    "name": {
        "type": "string",
        "required": false,
        "mutable": false,
        "description": "A display name for the API."
    },
    "meta": {
        "type": "map",
        "required": false,
        "mutable": false,
        "description": "A mapping of metadata keys to values."
    },
    "variables": {
        "type": "map",
        "required": false,
        "mutable": false,
        "description": "A mapping of arbitrary variable names to values or  expressions. This variables can be referenced by expressions in the children objects of this object."
    },
    "defaults": {
        "type": "map",
        "required": false,
        "mutable": false,
        "description": "A mapping of attributes to their default values. This values are inherited by children objects as defaults when their value is unset."
    },
    "status_codes": {
        "type": "map",
        "required": false,
        "mutable": false,
        "description": "A mapping of WAMP Error URIs to HTTP Status Codes. This values are inherited by children objects as defaults when their value is unset.",
        "default": "Check the [default values below](#status-codes)."
    },
    "versions": {
        "type": "array",
        "required": true,
        "mutable": false,
        "items": {
            "type": "VersionObject"
        },
        "description": "An array of Version Object instances."
    },
};

const version = {
    "base_path": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "The base path for this version of the API. This value will be used by the API Gateway to match incoming requests e.g. `/v1.0` will match `/v1.0/foo` but not `/foo`. It is possible to have optional segments, anything between brackets is optional e.g. `/[v1.0]` will match `/v1.0/foo` and also `/foo`."
    },
    "paths": {
        "type": "map",
        "required": true,
        "mutable": false,
        "description": "A mapping of paths to Path Objects. Paths are relative URL paths and can contain patterns and optional segments. The path `/` is invalid while the path `/ws` is reserved (used by Bondy for requesting Websocket connections)."
    },
    "is_active": {
        "type": "boolean",
        "required": false,
        "mutable": false,
        "default": "`true`",
        "description": "Whether the path is active."
    },
    "is_deprecated": {
        "type": "boolean",
        "required": false,
        "mutable": false,
        "default": "`false`",
        "description": "Whether the path is deprecated i.e. the path will be removed in future versions of the API."
    },
    "pool_size": {
        "type": "integer",
        "required": false,
        "mutable": false,
        "default": '`200`',
        "description": ""
    },
    "info": {
        "type": "object",
        "required": false,
        "properties": {
            "title" : {
                "type": "string",
                "required": true,
                "mutable": false,
                "description": "The title of the API."
            },
            "description" : {
                "type": "string",
                "required": true,
                "mutable": false,
                "description": "A description of the API."
            },
        }
    },
    "variables": {
        "type": "map",
        "required": false,
        "mutable": false,
        "description": "A mapping of arbitrary variable names to values or expressions. This variables can be referenced by expressions in the children objects of this object. These values are merged with and thus override the ones inherited from the [API Object](#api-object) `variables` property."
    },
    "defaults": {
        "type": "map",
        "required": false,
        "mutable": false,
        "description": "A mapping of attributes to their default values. This values are inherited by children objects as defaults when their value is unset. These values are merged with and thus override the ones inherited from the [API Object](#api-object) `defaults` property."
    },
    "status_codes": {
        "type": "map",
        "required": false,
        "mutable": false,
        "description": "A mapping of WAMP Error URIs to HTTP Status Codes."
    },
    "languages": {
        "type": "array",
        "required": false,
        "mutable": false,
        "items": {
            "type": "string"
        },
        "default": '["en"]',
        "description": "An array of language code string."
    }
};


const path = {
    "summary": {
        "type": "string",
        "required": false,
        "mutable": false,
        "description": "A short summary of the API."
    },
    "description": {
        "type": "string",
        "required": false,
        "mutable": false,
        "description": "A description of the API."
    },
    "variables": {
        "type": "map",
        "required": false,
        "mutable": false,
        "description": "A mapping of arbitrary variable names to values or expressions. This variables can be referenced by expressions in the children objects of this object. These values are merged with and thus override the ones inherited from the [API Object](#api-object) variables property."
    },
    "defaults": {
        "type": "map",
        "required": false,
        "mutable": false,
        "description": "A mapping of attributes to their default values or a MOPS expression resolving to such a map. This values are inherited by children objects as defaults when their value is unset. These values are merged with and thus override the ones inherited from the API Object default property."
    },
    "is_collection": {
        "type": "boolean",
        "required": false,
        "mutable": false,
        "default": "`false`",
        "description": "Defines whether the resource managed in this path is a collection or not."
    },
    "headers": headers,
    "accepts": accepts,
    "provides": provides,
    "schemes": schemes,
    "body_max_bytes" : {
        "type": "integer",
        "required": false,
        "mutable": false
    },
    "body_read_bytes" : {
        "type": "integer",
        "required": false,
        "mutable": false
    },
    "body_read_seconds" : {
        "type": "integer",
        "required": false,
        "mutable": false
    },
    "timeout" : {
        "type": "integer",
        "required": false,
        "mutable": false,
        "default": "The value defined for configuration option `wamp.call_timeout` ([See reference](/reference/configuration/wamp.html#call-timeout))."
    },
    "connect_timeout" : {
        "type": "integer",
        "required": false,
        "mutable": false
    },
    "retries" : {
        "type": "integer",
        "required": false,
        "mutable": false
    },
    "retry_timeout" : {
        "type": "integer",
        "required": false,
        "mutable": false
    },
    "security" :  {
        "type": "SecurityObject",
        "required": false,
        "mutable": false
    },
    "delete" :  {
        "type": "OperationObject",
        "required": false,
        "mutable": false,
        "description": "The operation specification to perform in case the API Gateway receives an HTTP `DELETE` Request."
    },
    "get" :  {
        "type": "OperationObject",
        "required": false,
        "mutable": false,
        "description": "The operation specification to perform in case the API Gateway receives an HTTP `GET` Request."
    },
    "head" :  {
        "type": "OperationObject",
        "required": false,
        "mutable": false,
        "description": "The operation specification to perform in case the API Gateway receives an HTTP `HEAD` Request."
    },
    "options" :  {
        "type": "OperationObject",
        "required": false,
        "mutable": false,
        "description": "The operation specification to perform in case the API Gateway receives an HTTP `OPTIONS` Request."
    },
    "patch" :  {
        "type": "OperationObject",
        "required": false,
        "mutable": false,
        "description": "The operation specification to perform in case the API Gateway receives an HTTP `PATCH` Request."
    },
    "post" :  {
        "type": "OperationObject",
        "required": false,
        "mutable": false,
        "description": "The operation specification to perform in case the API Gateway receives an HTTP `POST` Request."
    },
    "put" :  {
        "type": "OperationObject",
        "required": false,
        "mutable": false,
        "description": "The operation specification to perform in case the API Gateway receives an HTTP `PUT` Request."
    }
};

const basicSecurity = {
    "\ttype": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "A value of `basic`."
    },
    "schemes": {...schemes, "default": '`["http"]`'}
};

const apiKeySecurity = {
    "\ttype": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "A value of `api_key`."
    },
    "schemes": {...schemes, "default": '`["http"]`'},
    "header_name": {
        "type": "string",
        "required": true,
        "mutable": false,
        "default": '`"authorization"`'
    }
};

const oauth2 = {
    "\ttype": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "A value of `oauth2`."
    },
    "schemes": {...schemes, "default": '`["http"]`'},
    "flow": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "One of the following values:\n- `implicit`\n- `authorization_code`\n- `client_credentials`\n- `resource_owner_password_credentials`"
    },
    "token_path": {
        "type": "string",
        "required": false,
        "mutable": false,
        "description": "The relative path to use for the obtain/refresh token action.",
        "default": '`"/oauth/token"`'
    },
    "revoke_token_path": {
        "type": "string",
        "required": false,
        "mutable": false,
        "description": "The relative path to use for the revoke token action.",
        "default": '`"/oauth/revoke"`'
    }
};

const operation = {

    "action": {
        "type": "ActionObject",
        "required": true,
        "mutable": false,
        "description": ""
    },
    "response": {
        "type": "ResponseObject",
        "required": true,
        "mutable": false,
        "description": ""
    },
    "info": {
        "type": "string",
        "required": false,
        "mutable": false,
        "description": ""
    },
    "body_max_bytes" : {
        "type": "integer",
        "required": false,
        "mutable": false,
        "description": "",
        "default": "The parent Path Object's `body_max_byte` value."
    },
    "body_read_bytes" : {
        "type": "integer",
        "required": false,
        "mutable": false,
        "description": "",
        "default": "The parent Path Object's `body_read_bytes` value."
    },
    "body_read_seconds" : {
        "type": "integer",
        "required": false,
        "mutable": false,
        "description": "",
        "default": "The parent Path Object's `body_read_seconds` value."
    }
};


const staticAction = {
    "\ttype": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "The value `static`."
    },
    "headers": headers,
    "body": {
        "type": "() => any",
        "required": false,
        "mutable": false,
        "description": "The body to be returned with the response."
    }
};

const fwdAction = {
    "\ttype": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "The value `forward`."
    },
    "http_method" : {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "The HTTP method to be used when forwarding the request to the upstream endpoint. It must be on of the HTTP methods:\n- `delete`\n- `get`\n- `head`\n- `options`\n- `patch`\n- `post`\n- `put`"
    },
    "host" : {
        "type": "() => string",
        "required": true,
        "mutable": false,
        "description": "The upstream host."
    },
    "path" : {
        "type": "() => string",
        "required": true,
        "mutable": false,
        "description": "The upstream path."
    },
    "query_string" : {
        "type": "() => string",
        "required": false,
        "mutable": false,
        "description": "The upstream query string."
    },
    "headers": headers,
    "body": {
        "type": "() => any",
        "required": false,
        "mutable": false,
        "description": "The body to be forwarded to the upstream endpoint."
    },
    "timeout": {
        "type": "() => integer",
        "required": false,
        "mutable": false,
        "default": "The parent [Path Object](#path-object) `timeout` value."
    },
    "connect_timeout": {
        "type": "() => integer",
        "required": false,
        "mutable": false
    },
    "retries": {
        "type": "() => integer",
        "required": false,
        "mutable": false
    },
    "retry_timeout": {
        "type": "() => integer",
        "required": false,
        "mutable": false
    }
};

const wampAction = {
    "\ttype": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "One of the following values:\n- `wamp_call`\n- `wamp_publish`"
    },
    "options": {
        "type": "map",
        "required": false,
        "mutable": false,
        "description": "The WAMP message `options`.",
        "default": "`{}`"
    },
    "args": {
        "type": "array",
        "items": {
            "type": "() => any"
        },
        "required": false,
        "mutable": false,
        "description": "The WAMP message `args`.",
        "default": "`[]`"
    },
    "kwargs": {
        "type": "() => map",
        "required": false,
        "mutable": false,
        "description": "The WAMP message `kwargs`.",
        "default": "`{}`"
    },
    "timeout": {
        "type": "() => integer",
        "required": false,
        "mutable": false,
        "default": "`\"{{defaults.timeout}}\"` i.e. the parent [Path Object](#path-object) `timeout` value"
    },
    "connect_timeout": {
        "type": "() => integer",
        "required": false,
        "mutable": false,
        "default": "`\"{{defaults.connected_timeout}}\"` i.e. the parent [Path Object](#path-object) `connected_timeout` value"
    },
    "retries": {
        "type": "() => integer",
        "required": false,
        "mutable": false,
        "default": "`\"{{defaults.retries}}\"` i.e. the parent [Path Object](#path-object) `retries` value"
    },
    "retry_timeout": {
        "type": "() => integer",
        "required": false,
        "mutable": false,
        "default": "`\"{{defaults.retry_timeout}}\"` i.e. the parent [Path Object](#path-object) `retry_timeout` value"
    }
};



const response = {
    "on_result": {
        "type": "object",
        "required": true,
        "mutable": true,
        "description": "A declaration of the desired HTTP response in case the action (as defined in the sibling `action` object) was successful.",
        "properties": {
            "headers": headers,
            "body": {
                "type": "() => any",
                "required": true,
                "mutable": true,
                "description": "The value to be returned with the HTTP response. Either a static value or an expression (`string`). For a no-return using the empty string."
            },
            "uri": {
                "type": "() => string",
                "required": false,
                "mutable": true,
                "description": "In the case of an HTTP `POST` this value tells the API Gateway that a new resource has been created and as a consequence the HTTP response will have the uri as the value for the HTTP `Location` header and status code set to HTTP `201 created`. In case of the HTTP request not being a `POST` or if undefined, the status code will be set to HTTP `200 OK` or the value defined by `status_code`."
            },
            "status_code": {
                "type": "() => integer",
                "required": false,
                "mutable": true,
                "description": "The HTTP status code for the response. This can be an `integer` or an expression that evaluates to an integer."
            }
        }
    },
    "on_error": {
        "type": "object",
        "required": true,
        "mutable": true,
                "description": "A declaration of the desired HTTP response in case the action (as defined in the sibling `action` object) failed.",
        "properties": {
            "headers": headers,
            "body": {
                "type": "() => any",
                "required": true,
                "mutable": true,
                "description": "The value to be returned with the HTTP response. Either a static value or an expression (`string`). For a no-return using the empty string."
            },
            "status_code": {
                "type": "() => integer",
                "required": false,
                "mutable": true,
                "description": "The HTTP status code for the response. This can be an `integer` or an expression that evaluates to an integer. For example, the following expression uses the [API Context](#api-context) `status_codes` property to extract a code and uses `500` as fallback value: \n\n```javascript\n{{status_codes |> get({{action.error.error_uri}}, 500) |> integer}}\n```"
            }
        }
    }
};



const defaults = {
    "schemes": schemes,
    "accepts": {
        ...accepts,
        "default": '`["application/json", "application/msgpack"]`'
    },
    "provides": {
        ...provides,
        "default": '`["application/json", "application/msgpack"]`'
    },
    "headers": {
        ...headers,
        "default": "`{}`"
    },
    "security": {
        "type": "SecurityObject",
        "required": false,
        "mutable": true,
        "default": "`{}`"
    },
    "body_max_bytes" : {
        "type": "integer",
        "required": false,
        "mutable": false,
        "description": "",
        "default": 25_000_000
    },
    "body_read_bytes" : {
        "type": "integer",
        "required": false,
        "mutable": false,
        "description": "",
        "default": 8_000_000
    },
    "body_read_seconds" : {
        "type": "integer",
        "required": false,
        "mutable": false,
        "description": "",
        "default": 15_000
    },
    "timeout": {
        "type": "() => integer",
        "required": false,
        "mutable": false,
        "default": "`\"{{defaults.timeout}}\"` i.e. the parent [Path Object](#path-object) `timeout` value"
    },
    "connect_timeout": {
        "type": "() => integer",
        "required": false,
        "mutable": false,
        "default": "`\"{{defaults.connected_timeout}}\"` i.e. the parent [Path Object](#path-object) `connected_timeout` value"
    },
    "retries": {
        "type": "() => integer",
        "required": false,
        "mutable": false,
        "default": "`\"{{defaults.retries}}\"` i.e. the parent [Path Object](#path-object) `retries` value"
    },
    "retry_timeout": {
        "type": "() => integer",
        "required": false,
        "mutable": false,
        "default": "`\"{{defaults.retry_timeout}}\"` i.e. the parent [Path Object](#path-object) `retry_timeout` value"
    }
};

export default {
    data() {
        return {
            request: JSON.stringify(request),
            context: JSON.stringify(context),
            api: JSON.stringify(api),
            version: JSON.stringify(version),
            path: JSON.stringify(path),
            operation: JSON.stringify(operation),
            staticAction: JSON.stringify(staticAction),
            fwdAction: JSON.stringify(fwdAction),
            wampAction: JSON.stringify(wampAction),
            response: JSON.stringify(response),
            basicSecurity: JSON.stringify(basicSecurity),
            apiKeySecurity: JSON.stringify(apiKeySecurity),
            oauth2: JSON.stringify(oauth2),
            defaults: JSON.stringify(defaults),
            wampResult: JSON.stringify(wampResult),
            // used by other pages

            apiArgOrRes: JSON.stringify({
                0: {
                    "type": "object",
                    "description": "The api spec data",
                    "properties": api
                }
            }),
            apiListRes: JSON.stringify({
                0: {
                    "type": "array",
                    "description": "The list of all loaded api specs.",
                    "items": {
                        "type": "object",
                        "description": "The api spec data",
                        "properties": api
                    }
                }
            })
        }
    }
};
</script>
