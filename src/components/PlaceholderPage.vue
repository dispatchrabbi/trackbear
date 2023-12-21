<script setup lang="ts">

import AppPage from './layout/AppPage.vue';

defineProps<{ title: string }>();

</script>

<template>
  <AppPage>
    <h2 class="va-h2 mb-3">
      {{ title || 'Placeholder' }}
    </h2>
  </AppPage>
</template>

<style scoped>
</style>
