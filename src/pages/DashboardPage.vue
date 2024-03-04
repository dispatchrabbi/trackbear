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
  >
    <div class="text-center">
      Interesting stuff will go here eventually!
    </div>
  </ApplicationLayout>
</template>

<style scoped>
#add-progress-panel {
  max-width: 33%;
}
</style>
