<!-- Diagram: the Bondy Connect SDK supervision tree. Replaces the ASCII block
     in docs/connect/concepts/bondy_connect_sdk.md. Checked against
     apps/bondy_connect_sdk/src/bondy_connect_sup.erl:9-16,
     bondy_connect_connections_sup.erl:9-10 and bondy_connect_conn_sup.erl:9-17
     (handler_sup is started before connection). -->
<script setup lang="ts">
import Tree from '../diagram-kit/Tree.vue'

const items = [
  { depth: 0, label: 'bondy_connect_sup', sub: 'one_for_one', code: true },
  { depth: 1, label: 'bondy_connect_manager', code: true, note: 'names and lifecycle' },
  { depth: 1, label: 'bondy_connect_connections_sup', sub: 'simple_one_for_one', code: true, note: 'one child per connection' },
  { depth: 2, label: 'bondy_connect_conn_sup', sub: 'one_for_all', code: true, acc: true },
  { depth: 3, label: 'handler_sup', code: true, note: 'your handler workers' },
  { depth: 3, label: 'connection', code: true, note: 'gen_statem: transport, session, correlation' }
]
</script>

<template>
  <Tree
    :items="items"
    :node-w="232"
    :note-x="350"
    caption="One one_for_all supervisor per connection."
    label="Tree: bondy_connect_sup, one_for_one, supervises bondy_connect_manager, which handles names and lifecycle, and bondy_connect_connections_sup, simple_one_for_one, with one child per connection. Each child is a bondy_connect_conn_sup, one_for_all, which supervises handler_sup, your handler workers, and connection, a gen_statem holding the transport, session and correlation."
  />
</template>
