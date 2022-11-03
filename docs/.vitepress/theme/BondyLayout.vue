<script setup>
import DefaultTheme from 'vitepress/theme'
const { Layout } = DefaultTheme
import { computed } from 'vue'
import { useData } from 'vitepress'
const { theme } = useData()
const image = "/assets/logo.png"
</script>

<template>
  <Layout>
    <template #home-hero-before>
    </template>
    <template #home-hero-after>
    </template>
    <template #doc-before>
      <span v-if="$frontmatter.draft" class="watermark">DRAFT</span>
    </template>
    <template #doc-after>
    </template>
  </Layout>
</template>