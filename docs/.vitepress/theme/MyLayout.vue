<script setup>
import DefaultTheme from 'vitepress/theme'
import VPHomeHero from 'vitepress/theme'
import VPHomeFeatures from 'vitepress/theme'
import {withBase, useData} from 'vitepress'
const { theme } = useData()
const { Layout } = DefaultTheme
</script>

<template>
  <div class="VPHome">
    <slot name="home-hero-before" />
    <VPHomeHero />
    <slot name="home-hero-after" />

    <slot name="home-features-before" />
    <VPHomeFeatures />
    <slot name="home-features-after" />

    <Content />
  </div>
</template>

<style scoped>
.VPHome {
  padding-bottom: 96px;
}

.VPHome :deep(.VPHomeSponsors) {
  margin-top: 112px;
  margin-bottom: -128px;
}

@media (min-width: 768px) {
  .VPHome {
    padding-bottom: 128px;
  }
}
</style>