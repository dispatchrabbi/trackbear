<script setup lang="ts">
import type { MenuItem } from 'primevue/menuitem';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';

const breadcrumbs: MenuItem[] = [
  { label: 'Dashboard', url: '/dashboard' },
];
</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  ></ApplicationLayout>
</template>

<style scoped>
</style>
