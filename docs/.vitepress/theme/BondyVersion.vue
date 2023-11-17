<script setup>
import { inject } from 'vue';

const globalMetadata = inject('globalMetadata');
</script>

<template>
  <code>{{ globalMetadata.bondyVersion }}</code>
</template>
