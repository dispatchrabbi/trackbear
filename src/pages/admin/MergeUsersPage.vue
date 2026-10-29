<script setup lang="ts">
import { /* ref, */ computed/* , watch */ } from 'vue';

import { useRoute/* , useRouter */ } from 'vue-router';
const route = useRoute();
// const router = useRouter();

// import { parseISO, format } from 'date-fns';

// import { getUser, getUserAuditEvents, updateUserState, verifyEmailByFiat, sendEmailVerificationEmail, sendResetPasswordEmail, type User, type AuditEvent } from 'src/lib/api/admin/user.ts';
// import { USER_STATE } from 'server/lib/models/user/consts';
// import { USER_STATE_INFO } from 'src/lib/user.ts';

import AdminLayout from 'src/layouts/AdminLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
// import Card from 'primevue/card';
// import Panel, { type PanelToggleEvent } from 'primevue/panel';
import Button from 'primevue/button';
// import Tag from 'primevue/tag';
// import DataTable from 'primevue/datatable';
// import Column from 'primevue/column';
// import Dialog from 'primevue/dialog';
import { PrimeIcons } from 'primevue/api';

const breadcrumbs = computed(() => {
  const crumbs: MenuItem[] = [
    { label: 'Admin', url: '/admin' },
    { label: 'Users', url: '/admin/users' },
    { label: 'Merge Users', url: `/admin/users/merge` },
  ];

  return crumbs;
});

</script>

<template>
  <AdminLayout
    :breadcrumbs="breadcrumbs"
  >
    <div
      class="actions flex justify-end gap-4 mb-4"
    >
      <RouterLink :to="{ name: 'admin-users' }">
        <Button
          :icon="PrimeIcons.ARROW_LEFT"
          severity="secondary"
          text
        />
      </RouterLink>
      <div class="spacer flex-grow" />
      <div class="flex flex-col md:flex-row gap-2" />
    </div>
    <div>
      Merge users! {{ route.query }}
    </div>
  </AdminLayout>
</template>

<style scoped>
</style>
