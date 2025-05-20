<script setup lang="ts">
import AdminLayout from 'src/layouts/AdminLayout.vue';
import type { MenuItem } from 'primevue/menuitem';

const breadcrumbs: MenuItem[] = [
  { label: 'Admin', url: '/admin' },
];
</script>

<template>
  <AdminLayout
    :breadcrumbs="breadcrumbs"
  >
    <h1>Here be dragons!</h1>
  </AdminLayout>
</template>

<style scoped>
</style>
