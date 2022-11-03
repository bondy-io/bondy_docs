<script setup lang="ts">

defineProps<{
  icon?: string
  type?: string
  text: string
  link: string
  description: string
}>()
</script>

<template>
  <a :href="link" :target='_blank'>
  <article class="Feature">
    <div v-if="icon" class="icon">{{ icon }}</div>
    <span v-if="type" class="type">{{ type }}</span>
    <h3 class="title">{{ text }}</h3>

    <p class="details">{{ description }}</p>
  </article>
  </a>
</template>

<style scoped>

.Feature {
  border: 1px solid var(--vp-c-divider-light);
  border-radius: 12px;
  padding: 0px 24px 24px 24px;
  height: 100%;
  /*background-color: var(--vp-c-bg-soft);*/
}

article:hover {
  border: 1px solid var(--vp-c-brand);
  /*background-color: var(--vp-c-bg-soft);*/
}

.icon {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  border-radius: 6px;
  background-color: var(--vp-c-gray-light-4);
  width: 48px;
  height: 48px;
  font-size: 24px;
}

.dark .icon {
  background-color: var(--vp-c-bg);
}

.type {
  display: block;
  position: absolute;
  top:20px;
  text-transform: uppercase;
  font-size:10px;
}

.title {
  line-height: 24px;
  font-size: 16px;
  font-weight: 600;
}

.details {
  padding-top: 8px;
  line-height: 24px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}
</style>