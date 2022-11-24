---
draft: true
---
# General



## URI Format
## Session Meta Events and Procedures


Cases where a Caller sends a CALL message with payload passthru to a Dealer that supports this feature, which then must be routed to a callee which doesn't support payload passthru, MUST be treated as APPLICATION ERRORS and the Dealer MUST respond to the Caller with a **wamp.error.feature_not_supported** error message