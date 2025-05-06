<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';

import CreateLeaderboardForm from 'src/components/leaderboard/CreateLeaderboardForm.vue';

import Panel from 'primevue/panel';

const breadcrumbs: MenuItem[] = [
  { label: 'Leaderboards', url: '/leaderboards' },
  { label: 'New', url: '/leaderboards/new' },
];
</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <Panel
      header="Create a new Leaderboard"
    >
      <CreateLeaderboardForm
        @form-success="router.push({ name: 'leaderboards' })"
        @form-cancel="router.push({ name: 'leaderboards' })"
      />
    </Panel>
  </ApplicationLayout>
</template>
