
# Session

Blabblabla

<DataTreeView :data="session" :maxDepth="10" />


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
                },
                "phones": {
                    "description": "Tags for the product",
                    "type": "array",
                    "required": false,
                    "mutable": true,
                    "items": {
                        "type": "object",
                        "properties": {
                            "kind" : {
                                "description": "The phone type",
                                "type": "string",
                                "required": true,
                                "mutable": true
                            },
                            "value" : {
                                "description": "The phone number",
                                "type": "string",
                                "required": true,
                                "mutable": true
                            }
                        }
                    }
                },
                "thing" : {
                    "description": "foo",
                    "type": "object",
                    "required": true,
                    "mutable": true,
                    "properties" : {
                        "a" : {
                            "description": "Any string",
                            "type": "string",
                            "required": true,
                            "mutable": true
                        },
                        "b" : {
                            "description": "Any integer",
                            "type": "integer",
                            "required": true,
                            "mutable": true
                        },
                        "c" : {
                            "description": "Field c",
                            "type": "boolean",
                            "required": true,
                            "mutable": true
                        }
                    }
                }
            }`
        }
    }
}
</script>