<script setup lang="ts">

import { useUserStore } from 'src/stores/user.ts';
const userStore = useUserStore();
await userStore.populate();

import type { MenuItem } from 'primevue/menuitem';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
import SettingsForm from 'src/components/settings/SettingsForm.vue';

const breadcrumbs: MenuItem[] = [
  { label: 'Account' },
  { label: 'Settings', url: '/account/settings' },
];

async function reloadUserStore() {
  userStore.populate(true);
}

</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <SectionTitle title="Settings" />
    <div
      v-if="userStore.user"
      class="flex flex-col justify-center max-w-screen-md"
    >
      <SettingsForm
        @settings:edit="reloadUserStore"
      />
    </div>
  </ApplicationLayout>
</template>

<style scoped>
</style>
