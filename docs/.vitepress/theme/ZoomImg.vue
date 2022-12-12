<script setup lang="ts">
import { withBase } from 'vitepress'
import { computed, onMounted, ref } from 'vue'
import mediumZoom from 'medium-zoom'

const props = defineProps({
    src: String,
    width: String
})

const imgRef = ref(null)

onMounted(() => {
    mediumZoom(imgRef.value, {background: 'var(--vp-c-bg)'})
})
</script>

<template>
    <img
        v-if="width"
        class="img"
        ref="imgRef"
        :src="src"
        :width="width"
    />
    <img
        v-else
        class="img"
        ref="imgRef"
        :src="src"
    />
</template>

<style>
.img{
    height: auto;
    margin-top: 50px;
    margin-bottom: 50px;
}
.medium-zoom-overlay {
    z-index: 20;
}
.medium-zoom-image {
    z-index: 21;
}
</style>