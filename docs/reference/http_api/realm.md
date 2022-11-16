---
draft: true
related:
    - type: concepts
      text: Realms
      link: /concepts/realms
      description: Realms are routing and administrative domains that act as namespaces. All resources in Bondy belong to a Realm.
    - type: tutorial
      text: How to use Same-sign on
      link: /tutorials/security/same_sign_on
      description: Learn how to use create and use a Same Sign-on Realm.
---
# Realm
Creating, retrieving and managing realms and also enabling, disabling and checking per realm security status.

[Realms](/concepts/realms) are routing and administrative domains that act as namespaces. All resources in Bondy belong to a Realm. Messages are routed separately for each individual realm so sessions attached to a realm won’t see message routed on another realm.

<!--@include: ../parts/realm_data.md-->

## API