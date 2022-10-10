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
    <template #doc-before>
    </template>
  </Layout>
</template>