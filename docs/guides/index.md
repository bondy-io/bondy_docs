---
draft: true
installationOptions:
  - text: Install from Source
    link: '#install-from-source'
    description: Build and install Bondy from source.
  - text: Install using Docker
    link: '#install-using-docker'
    description: Use the official docker image
  - text: Install using Kubernetes
    link: '#install-using-kubernetes'
    description: See a starter manifest recipe and taylor it based on your needs.
---
<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'
import slugify from '@sindresorhus/slugify'
const { theme } = useData()
</script>

# How-to Guides
>Learn how to perform common tasks and operations.{.definition}

<div v-for="section in theme.sidebar['/guides/']">
    <h2 v-bind:id="slugify(section.text)" tab-index="-1" v-if="section.items.filter(function(item){return item.isFeature}).length > 0">
        {{section.text}}
        <a class="header-anchor" v-bind:id="slugify(section.text)" aria-hidden="true">#</a>
    </h2>
    <p>{{section.description}}</p>
    <Features class="VPHomeFeatures" :features="section.items.filter(function(item){return item.isFeature})"/>
</div>