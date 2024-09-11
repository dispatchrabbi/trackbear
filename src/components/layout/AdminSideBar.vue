<script setup lang="ts">
import { computed, defineEmits } from 'vue';

const emit = defineEmits(['menu-navigation'])

import MenuBar from 'src/components/layout/MenuBar.vue';
import { PrimeIcons } from 'primevue/api';

const items = computed(() => {
  return [
    {
      key: 'app',
      label: 'Back to App',
      icon: PrimeIcons.UNDO,
      to: { name: 'dashboard' },
      header: true,
    },
    {
      key: 'stats',
      label: 'Stats',
      icon: PrimeIcons.CHART_SCATTER,
      to: { name: 'admin-stats' },
      header: true,
    },
    {
      key: 'banners',
      label: 'Banners',
      icon: PrimeIcons.MEGAPHONE,
      to: { name: 'admin-banners' },
      header: true,
    },
    {
      key: 'users',
      label: 'Users',
      icon: PrimeIcons.USERS,
      to: { name: 'admin-users' },
      header: true,
    },
  ];
});
</script>

<template>
  <MenuBar
    :items="items"
    @menu-navigation="emit('menu-navigation')"
  />
</template>

<style scoped>
</style>
