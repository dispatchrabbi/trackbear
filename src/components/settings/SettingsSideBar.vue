<script setup lang="ts">
import { computed, defineEmits } from 'vue';

const emit = defineEmits(['menu-navigation']);

import MenuBar from 'src/components/layout/MenuBar.vue';
import { PrimeIcons } from 'primevue/api';

const items = computed(() => {
  return [
    {
      key: 'app',
      label: 'Back to App',
      icon: PrimeIcons.ARROW_CIRCLE_LEFT,
      to: { name: 'dashboard' },
      header: true,
    },
    {
      key: 'account',
      label: 'Account',
      icon: PrimeIcons.USER,
      to: { name: 'account' },
      header: true,
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: PrimeIcons.SLIDERS_V,
      to: { name: 'settings' },
      header: true,
    },
    {
      key: 'tags',
      label: 'Tags',
      icon: PrimeIcons.TAGS,
      to: { name: 'tags' },
      header: true,
    },
    {
      key: 'api-keys',
      label: 'API Keys',
      icon: PrimeIcons.QRCODE,
      to: { name: 'api-keys' },
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
