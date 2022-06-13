<script setup>
import DefaultTheme from 'vitepress/theme'
import {withBase, useData} from 'vitepress'
const { theme } = useData()
const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #home-hero-before>
      <!-- <img
        :src="withBase(theme.logo)"
        alt="Bondy logo"
        style="width:20%;"
      /> -->
    </template>
  </Layout>
</template>