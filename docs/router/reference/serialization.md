---
outline: [2,3]
related:
    - text: "What is WAMP"
      type: "Concept"
      link: "/wamp/concepts/what_is_wamp"
      description: "The serializations a WAMP session can negotiate."
    - text: "Error Reference"
      type: "Reference"
      link: "/router/reference/errors"
      description: "The payload Bondy returns when a request fails."
---

# Serialization

How Bondy encodes and decodes values on the binary serializations, where a
format distinguishes things that Bondy's internal representation does not.
A client choosing MessagePack or CBOR needs these rules; a JSON client does
not.

## Text and bytes

MessagePack and CBOR each have two string types: a text string (MessagePack
`str`, CBOR major type 3) and a byte string (MessagePack `bin`, CBOR major
type 2). Bondy holds both as the same thing, a sequence of bytes, so when it
encodes one it chooses the type from the content:

| Value | MessagePack | CBOR |
|---|---|---|
| Valid UTF-8 | `str` | text string |
| Not valid UTF-8 | `bin` | byte string |

This applies to every string Bondy writes: URIs, authentication methods,
error messages, map keys, and payload values. The `bondy_connect_sdk` Erlang
client encodes through the same rule.

On decode both types become the same value, so the distinction a client sent
does not survive a round trip through Bondy's decoder. Bondy decodes every
MessagePack message in full, so a MessagePack `bin` whose bytes happen to be
valid UTF-8 reaches the other peer as a `str`. Send binary data that must stay
binary in a form that is not valid UTF-8, or encode it (for example as
Base64) inside a string.

## MessagePack

- **`nil`** is Bondy's absent value, the same one a JSON `null` or a CBOR
  `null` decodes to. Bondy writes an absent value as `nil`.
- **A map that repeats a key** keeps the first value.
- **Extension types** (`fixext`, `ext`, including the timestamp extension)
  have no meaning in WAMP and are rejected. So is the reserved type `0xC1`,
  and so is a truncated message or one with bytes after its end. A message
  Bondy cannot decode closes the session.
- **Integers** use the smallest MessagePack type that holds the value.
  **Floats** are written as 64-bit; a 32-bit float is accepted on decode.

## Payload Passthru Mode

A message carrying `ppt_scheme` has an opaque payload that Bondy routes
without reading. Bondy's own procedures need to read their arguments, so a
`CALL` with `ppt_scheme` to a procedure Bondy implements is refused with
`wamp.error.invalid_argument`.

An `ERROR` that Bondy itself raises in reply to a Payload Passthru request,
such as an authorization refusal, carries no `ppt_*` details: those describe
a payload, and an error Bondy raises has none.
