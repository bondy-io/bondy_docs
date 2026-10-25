
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
            "description": "A unique tracing identifier for the request, in W3C trace-id form: 32 hexadecimal characters."
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
            "description": "The body of the request. This is the result of decoding the HTTP body using the encoding determined by the [Path Object](/router/reference/api_gateway/specification#path-object) `accepts` property which defines the content-types allowed for `POST`, `PUT` and `PATCH`."
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
        "description": "An instance of the [Security Object](/router/reference/api_gateway/specification#security-object). Its initial value comes from the [API Object](/router/reference/api_gateway/specification#api-object) `defaults.security` or `variables.security` property. It is then possibly overridden recursively during evaluation by each [Path Object](/router/reference/api_gateway/specification#path-object) definition."
    },
    "action": {
        "type": "object",
        "required": false,
        "mutable": true,
        "properties": {
            "result" : {
                "type": "ResultObject",
                "description": "If the action was successful the value will be the result of evaluating the [Response Object](/router/reference/api_gateway/specification#response-object) `on_result` property associated with the [Operation Object](/router/reference/api_gateway/specification#operation-object) executed for this HTTP Request."
            },
            "error" : {
                "type": "ErrorObject",
                "description": "If the action failed the value will be the result of evaluating the [Response Object](/router/reference/api_gateway/specification#response-object) `on_error` property associated with the [Operation Object](/router/reference/api_gateway/specification#operation-object) executed for this HTTP Request."
            }
        },
        "description": "At runtime, it will contain the result or error of the action performed by the API Gateway during the handling of an HTTP request."
    },
    "variables": {
        "type": "map",
        "required": false,
        "mutable": true,
        "description": "A mapping of arbitrary variable names to values or expressions. Each entry in this map is obtained during the parsing of the [API Object](/router/reference/api_gateway/specification#api-object) tree. At each level of the tree this property will merge in the values of the target object's `variables` property, so children nodes can access the entries defined in the ancestors, override them and/or add new variables to the context."
    },
    "defaults": {
        "type": "map",
        "required": false,
        "mutable": true,
        "description": "A mapping of object properties to their default values. Each entry in this map is obtained during the parsing of the [API Object](/router/reference/api_gateway/specification#api-object) tree. At each level of the tree this property will merge in the values of the target object's `defaults` property, so children nodes can access the entries defined in the ancestors, override them and/or add new defaults to the context. Expressions in the defaults mapping can reference variables in the `variables` property."
    },
    "status_codes": {
        "type": "map",
        "required": false,
        "mutable": true,
        "description": "A mapping of error URIs to HTTP status codes. Bondy initialises it from the default HTTP status of each URI in the [error catalogue](/router/reference/errors). The [API Object](/router/reference/api_gateway/specification#api-object) `status_codes` entries override it, and so do the [Version Object](/router/reference/api_gateway/specification#version-object) entries for that version's paths. Only an expression that reads this map uses it; see [Status Codes](/router/reference/api_gateway/specification#status-codes).",
        "default":"The error catalogue defaults."
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
        "description": "A string used for matching the incoming HTTP request HOST header value. Hosts with and without a trailing dot are equivalent for routing. Similarly, hosts with and without a leading dot are also equivalent e.g. `cowboy.example.org`, `cowboy.example.org.` and `.cowboy.example.org` are equivalent. A pattern using the keyword `:` and wildcard `_` can be used to match multiple domains e.g. `mydomain.:_` will match `mydomain.foo` and `mydomain.bar` but not `mydomain.foo.baz`. Bondy serves the specification's paths only to requests whose host matches. See [Request matching](/router/reference/api_gateway/specification#request-matching)."
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
        "default": "Check the [default values below](/router/reference/api_gateway/specification#status-codes)."
    },
    "versions": {
        "type": "map",
        "required": true,
        "mutable": false,
        "description": "A mapping of version names to [Version Object](/router/reference/api_gateway/specification#version-object) instances."
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
        "type": "map",
        "required": false,
        "mutable": false,
        "description": "Free-form information about this version, such as a `title` and a `description`. The parser checks only that the value is an object, and keeps its keys."
    },
    "variables": {
        "type": "map",
        "required": false,
        "mutable": false,
        "description": "A mapping of arbitrary variable names to values or expressions. This variables can be referenced by expressions in the children objects of this object. These values are merged with and thus override the ones inherited from the [API Object](/router/reference/api_gateway/specification#api-object) `variables` property."
    },
    "defaults": {
        "type": "map",
        "required": false,
        "mutable": false,
        "description": "A mapping of attributes to their default values. This values are inherited by children objects as defaults when their value is unset. These values are merged with and thus override the ones inherited from the [API Object](/router/reference/api_gateway/specification#api-object) `defaults` property."
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
        "description": "A mapping of arbitrary variable names to values or expressions. This variables can be referenced by expressions in the children objects of this object. These values are merged with and thus override the ones inherited from the [API Object](/router/reference/api_gateway/specification#api-object) variables property."
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
    "accepts": {...accepts, "default": "`defaults.accepts`"},
    "provides": {...provides, "default": "`defaults.provides`"},
    "schemes": {...schemes, "default": "`defaults.schemes`"},
    "security" :  {
        "type": "SecurityObject",
        "required": false,
        "mutable": false,
        "default": "`defaults.security`"
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
    },
    "verify_path": {
        "type": "string",
        "required": false,
        "mutable": false,
        "description": "The relative path of the [verify route](/router/reference/api_gateway/specification#verify-route).",
        "default": '`"/oauth/verify"`'
    },
    "description": {
        "type": "string",
        "required": false,
        "mutable": false,
        "description": "A description of the scheme."
    }
};

const oidcSecurity = {
    "\ttype": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "A value of `oidc`."
    },
    "provider": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "The name of the OIDC provider the login flow uses."
    },
    "verify_path": {
        "type": "string",
        "required": false,
        "mutable": false,
        "description": "The relative path of the [verify route](/router/reference/api_gateway/specification#verify-route).",
        "default": '`"/oidc/verify"`'
    },
    "description": {
        "type": "string",
        "required": false,
        "mutable": false,
        "description": "A description of the scheme."
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
        "type": "map",
        "required": false,
        "mutable": false,
        "description": "Free-form information about this operation. The parser checks only that the value is an object, and keeps its keys."
    },
    "body_max_bytes" : {
        "type": "integer",
        "required": false,
        "mutable": false,
        "description": "",
        "default": "`defaults.body_max_bytes`"
    },
    "body_read_bytes" : {
        "type": "integer",
        "required": false,
        "mutable": false,
        "description": "",
        "default": "`defaults.body_read_bytes`"
    },
    "body_read_seconds" : {
        "type": "integer",
        "required": false,
        "mutable": false,
        "description": "",
        "default": "`defaults.body_read_seconds`"
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
        "required": false,
        "mutable": false,
        "default": "The method of the incoming request.",
        "description": "The HTTP method to be used when forwarding the request to the upstream endpoint. It must be one of the HTTP methods below, written as a literal value, not as an expression:\n- `delete`\n- `get`\n- `head`\n- `options`\n- `patch`\n- `post`\n- `put`"
    },
    "host" : {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "The upstream origin, such as `https://upstream.example.com` or `upstream.example.com:8080`. Without a scheme, the gateway uses `http`. The gateway appends `path` and `query_string` to it."
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
        "description": "The time in milliseconds to wait for the upstream response.",
        "default": "`defaults.timeout`"
    },
    "connect_timeout": {
        "type": "() => integer",
        "required": false,
        "mutable": false,
        "description": "The time in milliseconds to wait for the connection to the upstream.",
        "default": "`defaults.connect_timeout`"
    },
    "retries": {
        "type": "() => integer",
        "required": false,
        "mutable": false,
        "description": "The number of times the gateway sends a request again when the upstream sends no response. Only a request with an idempotent method is sent again. See [Retries](/router/reference/api_gateway/specification#retries).",
        "default": "`defaults.retries`"
    },
    "retry_timeout": {
        "type": "() => integer",
        "required": false,
        "mutable": false,
        "description": "The time in milliseconds to wait before each retry. It must be a non-negative integer.",
        "default": "`defaults.retry_timeout`"
    }
};

const wampAction = {
    "\ttype": {
        "type": "string",
        "required": true,
        "mutable": false,
        "description": "The value `wamp_call`. For `wamp_publish`, see [WAMP Publish Action](/router/reference/api_gateway/specification#wamp-publish-action)."
    },
    "procedure": {
        "type": "() => string",
        "required": true,
        "mutable": false,
        "description": "The URI of the procedure to call."
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
        "description": "The CALL option `timeout`, in milliseconds, unless `options` sets a non-zero `timeout`.",
        "default": "`defaults.timeout`"
    },
    "retries": {
        "type": "() => integer",
        "required": false,
        "mutable": false,
        "description": "The CALL option `_retries`, unless `options` sets a non-zero `_retries`.",
        "default": "`defaults.retries`"
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
                "description": "The HTTP status code for the response. This can be an `integer` or an expression that evaluates to an integer. For example, the following expression uses the [API Context](/router/reference/api_gateway/specification#api-context) `status_codes` property to extract a code and uses `500` as fallback value: \n\n```javascript\n{{status_codes |> get({{action.error.error_uri}}, 500) |> integer}}\n```"
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
        "description": "The default `timeout` of a `forward`, `wamp_call` or `wamp_publish` action, in milliseconds.",
        "default": "`60000`"
    },
    "connect_timeout": {
        "type": "() => integer",
        "required": false,
        "mutable": false,
        "description": "The default `connect_timeout` of a `forward` action, in milliseconds.",
        "default": "`8000`"
    },
    "retries": {
        "type": "() => integer",
        "required": false,
        "mutable": false,
        "description": "The default `retries` of a `forward` or `wamp_call` action.",
        "default": "`0`"
    },
    "retry_timeout": {
        "type": "() => integer",
        "required": false,
        "mutable": false,
        "description": "The default `retry_timeout` of a `forward` action, in milliseconds.",
        "default": "`5000`"
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
            oidcSecurity: JSON.stringify(oidcSecurity),
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
