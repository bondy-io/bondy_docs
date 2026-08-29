---
outline: [2,4]
related:
    - text: MCP Gateway
      type: Concept
      link: /router/concepts/mcp_gateway
      description: What the overlay contributes to the manifest — naming, annotations, resource templates.
    - text: Interface Metadata & Reflection API
      type: API Reference
      link: /router/reference/wamp_api/interface
      description: The base layer the overlay joins — same document lifecycle, same authority.
    - text: Exposing an MCP Endpoint
      type: How-to Guide
      link: /router/guides/administration/exposing_an_mcp_endpoint
      description: Loading an overlay in context.
---

# MCP Gateway

Management of **MCP overlay documents** over WAMP — the operator-authored
layer that exposes a realm to agents: it names tools, names topic-backed
resources, declares resource templates, and adds MCP-only annotations.
Under the default `curated` manifest mode this is *the* exposure act —
exactly the entries overlays name exist. This is also the overlay's only
management surface; there is no console or file-based alternative.

An overlay document has the same lifecycle as an
[interface document](/router/reference/wamp_api/interface): it carries an
`id` and `entries`, it is validated **as a whole** (the first invalid
entry rejects the document with nothing written), loading an `id` again
**replaces** the previous version, and a `(realm, name)` claimed by one
document is refused to every other. Documents replicate cluster-wide and
every node's manifests rebuild from a change within the debounce window.

Each entry names one tool, resource or resource template:

| Field | Required | Meaning |
|---|---|---|
| `realm` | yes | The realm the entry belongs to. Must exist at load time. |
| `kind` | yes | `tool`, `resource` or `resource_template`. |
| `name` | yes | The MCP-facing name: 1–256 bytes, printable ASCII, no whitespace. |
| `wamp_procedure` | tools & templates | The exact-match WAMP procedure the entry fronts. |
| `wamp_topic` | resources | The exact-match WAMP topic a `resource` entry fronts; its payload schemas from the interface layer become the resource's output shape. |
| `description`, `annotations`, `wamp_options`, schemas, `version` | no | MCP-facing detail; an absent field falls through to the interface entry of the WAMP binding (the tool's procedure, or the resource's topic). |
| `redaction` | no | `{"fields": [...]}` — fields removed before audit digests are computed. |
| `uri_template`, `uri_vars_schema`, `wamp_args`, `wamp_kwargs`, `update_topic` | resource templates | The RFC 6570 template contract — every template variable must appear in `uri_vars_schema` and vice versa. |

Under the default `curated`
[manifest mode](/router/reference/configuration/mcp#mcp.manifest.mode)
the manifest holds exactly the entries overlays name. Under `derived`,
described procedures and topics also surface URI-named, and an entry that
claims one **replaces** its URI-named form — a rename, not an alias. In
both modes, two entries claiming one name with different WAMP bindings
are both skipped from the manifest and a critical alarm names the
collision.

## Procedures

All four require admin authority, exactly like `bondy.interface.*`: an
overlay document may target any realm, so managing one is an operator act.
Call them from the master realm.

#### bondy.mcp.overlay.load(document) -> [] {.wamp-procedure}

Loads (or replaces) an overlay document. Errors name the first violation —
an invalid name, an unknown realm, a duplicate `(realm, name)` inside the
document, or a name another document owns.

#### bondy.mcp.overlay.get(id) -> [document] {.wamp-procedure}

The source document as originally loaded.

#### bondy.mcp.overlay.list() -> [documents] {.wamp-procedure}

The sources of every loaded overlay document.

#### bondy.mcp.overlay.delete(id) -> [] {.wamp-procedure}

Removes the document. Under the default `curated`
[manifest mode](/router/reference/configuration/mcp#mcp.manifest.mode) the
entries it named disappear from the manifest; under `derived`, a claimed
procedure reverts to its URI-named form.
