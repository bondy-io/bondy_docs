<!-- Diagram: two realms delegating Linda's credentials to an SSO realm.
     Redrawn from the former sso.png in docs/connect/concepts/same_sign_on.md. -->
<script setup lang="ts">
import SsoRealms from '../diagram-kit/SsoRealms.vue'

const realms = [
  {
    name: 'com.example.realm.1', cols: 2,
    clients: [{ label: 'Linda', sub: 'person', session: 1 }, { label: 'Bob', sub: 'person', session: 2 }],
    chips: [{ label: 'Bob' }, { label: 'Linda', ref: true }]
  },
  {
    name: 'com.example.realm.2', cols: 2,
    clients: [{ label: 'Linda', sub: 'person', session: 3 }],
    chips: [{ label: 'Linda', ref: true }]
  }
]
const sso = { name: 'com.example.sso', chips: ['Linda'] }
</script>

<template>
  <SsoRealms
    :realms="realms"
    :sso="sso"
    caption="Linda signs in to both realms with one set of credentials."
    label="Inside Bondy, realms com.example.realm.1 and com.example.realm.2 both delegate credentials to the SSO realm com.example.sso, which stores Linda's credentials. Realm 1 stores Bob locally and holds a link to Linda in the SSO realm; realm 2 holds a link to Linda too. Linda opens session 1 to realm 1 and session 3 to realm 2; Bob opens session 2 to realm 1."
  />
</template>
