# Reference

Material to consult while working, not to read start to end. Pick the section that matches what you're looking up:

- **[Configuration Reference](/router/reference/configuration/index)** — every `bondy.conf` key, grouped by subsystem (storage, clustering, security, listeners, WAMP features, overload protection, and more).
- **[WAMP API Reference](/router/reference/wamp_api/index)** — the administrative WAMP procedures and topics for managing realms, users, groups, sources, grants, sessions, tickets, and the API Gateway.
- **[HTTP API Reference](/router/reference/http_api/index)** — the HTTP/REST equivalents of the administrative API, plus OIDC endpoints.
- **[HTTP API Gateway Specification](/router/reference/api_gateway/index)** — the JSON specification format for exposing WAMP procedures as HTTP/REST endpoints, and the expression language it uses for data transformation.
- **[Serialization](/router/reference/serialization)** — how Bondy chooses between text and byte strings on MessagePack and CBOR, MessagePack's `nil` and extension types, and Payload Passthru Mode against Bondy's own procedures.
- **[Error Reference](/router/reference/errors)** — the payload Bondy returns when a request fails, and every error URI it can carry.
- **[Prometheus Metrics Reference](/router/reference/metrics)** — every metric family exposed on the Admin API `/metrics` endpoint.
- **[Logging Configuration Reference](/router/reference/logging)** — Bondy's log levels and how to change them.
- **[Glossary](/router/reference/glossary)** — Bondy- and WAMP-specific terms used throughout this site, defined once.

If you're new to Bondy, start with [Concepts](/router/concepts/index) instead — this section assumes you already know what you're looking for.

---

Writing a client rather than operating the router? The protocol, its two communication patterns and the client libraries for each language are a documentation set of their own: [WAMP](/wamp).
