<script setup lang="ts">
import PageHeader from './PageHeader.vue';
import PageBody from './PageBody.vue';
import PageFooter from './PageFooter.vue';
</script>

<template>
  <PageHeader />
  <PageBody>
    <slot />
  </PageBody>
  <PageFooter />
</template>
