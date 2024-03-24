<script setup lang="ts">
import { ref, inject, onMounted } from 'vue';

import { useAdminUserStore } from 'src/stores/admin-user';
const adminUserStore = useAdminUserStore();

import AdminLayout from 'src/layouts/AdminLayout.vue';
import type { MenuItem } from 'primevue/menuitem';

const breadcrumbs: MenuItem[] = [
  { label: 'Admin Home', url: '/admin' },
];

// const tallies = ref<Tally[]>([]);
// const isLoading = ref<boolean>(false);
// const errorMessage = ref<string | null>(null);

// const loadTallies = async function() {
//   isLoading.value = true;
//   errorMessage.value = null;

//   try {
//     tallies.value = await getTallies();
//   } catch(err) {
//     errorMessage.value = err.message;
//   } finally {
//     isLoading.value = false;
//   }
// }

// onMounted(() => {
//   loadTallies();
// });
</script>

<template>
  <AdminLayout
    :breadcrumbs="breadcrumbs"
  >
    <h1>It works!</h1>
    <pre>{{ adminUserStore.perms }}</pre>
  </AdminLayout>
</template>

<style scoped>
</style>
