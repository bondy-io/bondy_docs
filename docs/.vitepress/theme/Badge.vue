<script setup lang="ts">
    defineProps<{
      color?: string
      text: string
    }>()
</script>

<template>
  <span class="badge">{{text}}</span>
</template>

<style scoped>
    .badge {
        float:right;
        background-color: rgba(255, 100, 66, 0.8);
        color: white;
        height: 30px;
        font-size: 13px;
        padding: 8px 8px 8px 8px;
        text-align: center;
        line-height:15px;
        border-radius: 5px;
    }
</style>