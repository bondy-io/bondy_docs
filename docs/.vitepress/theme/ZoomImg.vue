<script setup>
import { withBase } from 'vitepress'
import { onMounted, ref } from 'vue'
import mediumZoom from 'medium-zoom'

defineProps({
    src: String
})

const imgRef = ref(null)

onMounted(() => {
    mediumZoom(imgRef.value, { background: 'var(--vp-c-bg)' });
})
</script>

<template>
    <img class="img" ref="imgRef" :src="src">
</template>

<style>
.img{
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