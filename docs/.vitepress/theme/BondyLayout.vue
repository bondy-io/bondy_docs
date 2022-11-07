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
    <!-- When layout is home -->
    <template #home-hero-before>
    </template>

    <template #home-hero-after>
    </template>

    <!-- When layout is doc -->
    <template #doc-before>
      <span v-if="$frontmatter.draft" class="watermark">DRAFT</span>
    </template>

    <template #doc-footer-before>
      <!-- Learn More -->
      <div v-if="$frontmatter.related" class="vp-doc">
        <!-- no id attribute so that is doesn't show up on sidenav -->
        <h2>Related</h2>
        <Features class="VPHomeFeatures" :features="$frontmatter.related"/>
      </div>
    </template>

    <template #doc-after>
    </template>

  </Layout>
</template>

