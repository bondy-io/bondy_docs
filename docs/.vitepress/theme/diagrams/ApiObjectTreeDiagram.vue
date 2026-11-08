<!-- Diagram: the API Gateway specification's object tree. Replaces the ASCII
     block under "Object Tree" in docs/connect/concepts/api_gateway.md. -->
<script setup lang="ts">
import Tree from '../diagram-kit/Tree.vue'

const items = [
  { depth: 0, label: 'API', acc: true },
  { depth: 1, label: 'Version', note: 'one or more' },
  { depth: 2, label: 'Path', note: 'one or more' },
  { depth: 3, label: 'HTTP method', note: 'GET, POST, PUT, …' },
  { depth: 4, label: 'Operation' },
  { depth: 5, label: 'Action', note: 'wamp_call | wamp_publish | forward | static' },
  { depth: 5, label: 'Response' }
]
</script>

<template>
  <Tree
    :items="items"
    :node-w="150"
    :note-x="350"
    caption="Each operation pairs one action with one response."
    label="Tree: an API object holds one or more version objects; each version holds one or more path objects; each path holds HTTP methods such as GET, POST and PUT; each method holds an operation object, which holds an action object (wamp_call, wamp_publish, forward or static) and a response object."
  />
</template>
