<script setup lang="ts">
import { ref } from 'vue';

import { useRouter } from 'vue-router';
const router = useRouter();

import { useUserStore } from 'src/stores/user.ts';
const userStore = useUserStore();
await userStore.populate();

import { updateSettings } from 'src/lib/api/me.ts';

import { PrimeIcons } from 'primevue/api';
import Panel from 'primevue/panel';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import type { MenuItem } from 'primevue/menuitem';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';

const breadcrumbs: MenuItem[] = [
  { label: 'Account' },
  { label: 'Settings', url: '/account/settings' },
];

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
      <Panel
        header="General Settings"
        class="m-2"
      >
        {{ JSON.stringify(userStore.user) }}
        <!-- form goes here (see AccountInfoForm) -->
      </Panel>
    </div>
  </ApplicationLayout>
</template>

<style scoped>
</style>
