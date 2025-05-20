<script setup lang="ts">

import { useUserStore } from 'src/stores/user.ts';
const userStore = useUserStore();
await userStore.populate();

import type { MenuItem } from 'primevue/menuitem';

import SettingsLayout from 'src/layouts/SettingsLayout.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
import SettingsForm from 'src/components/settings/SettingsForm.vue';
import ThemeSwitcher from 'src/components/settings/ThemeSwitcher.vue';

import Panel from 'primevue/panel';

const breadcrumbs: MenuItem[] = [
  { label: 'Account' },
  { label: 'Settings', url: '/account/settings' },
];

async function reloadUserStore() {
  userStore.populate(true);
}

</script>

<template>
  <SettingsLayout
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
        <SettingsForm
          @settings:edit="reloadUserStore"
        />
      </Panel>
      <Panel
        header="Theme"
        class="m-2"
      >
        <ThemeSwitcher />
      </Panel>
    </div>
  </SettingsLayout>
</template>

<style scoped>
</style>
