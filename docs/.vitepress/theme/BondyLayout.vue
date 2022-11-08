<script setup>
import DefaultTheme from 'vitepress/theme'
import { computed } from 'vue'
import { useData } from 'vitepress'
import { useRouter } from 'vitepress';
import slugify from '@sindresorhus/slugify'
import { watch } from "vue"

const { Layout } = DefaultTheme

const { theme } = useData()
const image = "/assets/logo.png"

// For analytics
const router = useRouter()

// Only run this on the client. Not during build.
// if (typeof window !== 'undefined') {
//   watch(() => router.route.data.relativePath, (path) => {
//     window.mixpanel.track('pageview', {'path': path});
//   }, { immediate: true });
// }

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

<style>
/* First paragraph after H1 */

main > div > div > p:first-of-type {
  line-height: 1.651rem;
  font-size:1.23529rem !important;
}
</style>

