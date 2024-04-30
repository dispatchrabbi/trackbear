<script setup lang="ts">
import Toast from 'primevue/toast';

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
</template>

<style scoped>

</style>
