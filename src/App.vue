<script setup lang="ts">
import Toast from 'primevue/toast';
import ConfirmPopup from 'primevue/confirmpopup';

import { useTheme } from './lib/theme.ts';
useTheme();
</script>

<template>
  <RouterView v-slot="{ Component }">
    <!-- template + v-if is required because Suspense requires EXACTLY one child (not zero) -->
    <template v-if="Component">
      <Suspense>
        <component :is="Component" />
      </Suspense>
    </template>
  </RouterView>
  <Toast />
  <ConfirmPopup />
</template>

<style scoped>

</style>
