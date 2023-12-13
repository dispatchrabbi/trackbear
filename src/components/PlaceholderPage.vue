<script setup lang="ts">

import Page from './page/AppPage.vue';

defineProps<{ title: string }>();

</script>

<template>
  <Page>
    <h2 class="va-h2 mb-3">
      {{ title || 'Placeholder' }}
    </h2>
  </Page>
</template>

<style scoped>
</style>
