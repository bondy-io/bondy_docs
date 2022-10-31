<script setup lang="ts">
import { computed } from 'vue'
import Feature from './Feature.vue'

export interface Feature {
  icon?: string
  link: string
  text: string
  description: string
}

const props = defineProps<{
  features: Feature[]
}>()

const grid = computed(() => {
  const length = props.features.length

  // We hardcode to grid-3
  if (!length) {
    return
  // } else if (length === 2) {
  //   return 'grid-2'
  } else if (length === 3) {
    return 'grid-3'
  } else if (length % 3 === 0) {
    return 'grid-3'
  } else if (length % 2 === 0) {
    return 'grid-3'
  } else {
    return 'grid-3'
  }
})
</script>

<template>
  <div v-if="features" class="Features">
    <div class="container">
      <div class="items">
        <div v-for="feature in features" :key="feature.title" class="item" :class="[grid]">
          <Feature
            :icon="feature.icon"
            :link="feature.link"
            :text="feature.text"
            :description="feature.description"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.Features {
  position: relative;
  padding: 0 0px;
}

@media (min-width: 640px) {
  .Features {
    padding: 0 0px;
  }
}

@media (min-width: 960px) {
  .Features {
    padding: 0 0px;
  }
}

.container {
  margin: 0 auto;
  max-width: 1152px;
}

.items {
  display: flex;
  flex-wrap: wrap;
  margin: -8px;
}

.item {
  padding: 8px;
  width: 100%;
}

@media (min-width: 640px) {
  .item.grid-2,
  .item.grid-4,
  .item.grid-6 {
    width: calc(100% / 2);
  }
}

@media (min-width: 768px) {
  .item.grid-2,
  .item.grid-4 {
    width: calc(100% / 2);
  }

  .item.grid-3,
  .item.grid-6 {
    width: calc(100% / 3);
  }
}

@media (min-width: 960px) {
  .item.grid-4 {
    width: calc(100% / 4);
  }
}
</style>