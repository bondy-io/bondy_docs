---
outline: [2,3]
related:
    - text: "What is WAMP"
      type: "Concept"
      link: "/router/concepts/wamp/what_is_wamp"
      description: "The serializations a WAMP session can negotiate."
    - text: "Error Reference"
      type: "Reference"
      link: "/router/reference/errors"
      description: "The payload Bondy returns when a request fails."
---

# Serialization

How Bondy encodes and decodes values on the binary serializations, where a
format distinguishes things that Bondy's internal representation does not,
and what Bondy does with a message that does not decode. A client choosing
MessagePack or CBOR needs every rule; a JSON client needs only the
[JSON](#json) and [Payload Passthru Mode](#payload-passthru-mode) sections.

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
  and so is a truncated message or one with bytes after its end. When a
  message does not decode, Bondy aborts the session with
  `wamp.error.protocol_violation`.
- **Integers** use the smallest MessagePack type that holds the value.
  **Floats** are written as 64-bit; a 32-bit float is accepted on decode.

## CBOR

- **`null` and `undefined`** both decode to Bondy's absent value. Bondy
  writes an absent value as `null`.
- **A message that does not decode**, such as a truncated message, one with
  bytes after its end, or an array whose declared length does not match its
  items, aborts the session with `wamp.error.protocol_violation`. Bondy checks
  that the payload of each message decodes when the message arrives, so a
  malformed payload aborts the sender and never reaches a receiver.

## JSON

- **A message that is not one JSON value**, such as truncated text or text
  after the end of the value, aborts the session with
  `wamp.error.protocol_violation`. As for CBOR, Bondy checks that the payload
  of each message decodes when the message arrives.

[WAMP Compliance](/router/reference/protocols/wamp#protocol-errors) lists the
other messages Bondy refuses, whatever the serialization.

## Payload Passthru Mode

A message carrying `ppt_scheme` has an opaque payload that Bondy routes
without reading. Bondy's own procedures need to read their arguments, so a
`CALL` with `ppt_scheme` to a procedure Bondy implements is refused with
`wamp.error.invalid_argument`.

An `ERROR` that Bondy itself raises in reply to a Payload Passthru request,
such as an authorization refusal, carries no `ppt_*` details: those describe
a payload, and an error Bondy raises has none.
