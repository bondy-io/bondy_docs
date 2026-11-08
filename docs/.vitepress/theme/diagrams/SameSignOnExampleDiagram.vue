<!-- Diagram: the end result of the Same Sign-On tutorial. Redrawn from the former
     sso_example.png in docs/connect/tutorials/security/same_sign_on.md.
     Dashed chips are users linked to the SSO realm; solid chips are stored in
     their own realm. -->
<script setup lang="ts">
import SsoRealms from '../diagram-kit/SsoRealms.vue'

const realms = [
  {
    name: 'com.example.realm.1', cols: 2,
    clients: [
      { label: 'Device 1', sub: 'device', session: 1 },
      { label: 'App 1', sub: 'app', session: 2 },
      { label: 'Linda', sub: 'person', session: 3 },
      { label: 'Bob', sub: 'person', session: 4 }
    ],
    chips: [{ label: 'Device 1' }, { label: 'App 1' }, { label: 'Linda', ref: true }, { label: 'Bob', ref: true }]
  },
  {
    name: 'com.example.realm.2', cols: 2,
    clients: [
      { label: 'Linda', sub: 'person', session: 5 },
      { label: 'Device 2', sub: 'device', session: 6 }
    ],
    chips: [{ label: 'Device 2' }, { label: 'App 1' }, { label: 'App 2' }, { label: 'Linda', ref: true }]
  },
  {
    name: 'com.example.realm.3', cols: 2,
    clients: [{ label: 'Linda', sub: 'person', session: 7 }],
    chips: [{ label: 'Device 1' }, { label: 'App 1' }, { label: 'Linda', ref: true }, { label: 'Bob', ref: true }]
  }
]
const sso = { name: 'com.example.sso', chips: ['Linda', 'Bob'] }
</script>

<template>
  <SsoRealms
    :realms="realms"
    :sso="sso"
    caption="Linda's credentials live once, in the SSO realm."
    label="Inside Bondy, three realms delegate credentials to the SSO realm com.example.sso, which stores Linda and Bob. Realm 1 stores Device 1 and App 1 locally and links to Linda and Bob. Realm 2 stores Device 2, App 1 and App 2 locally and links to Linda. Realm 3 stores Device 1 and App 1 locally and links to Linda and Bob. Seven sessions: Device 1, Linda, App 1 and Bob to realm 1 (sessions 1 to 4), Linda and Device 2 to realm 2 (sessions 5 and 6), and Linda to realm 3 (session 7)."
  />
</template>
