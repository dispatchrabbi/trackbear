<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();

import type { Leaderboard } from 'server/api/v1/leaderboard';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import CreateLeaderboardForm from 'src/components/leaderboard/CreateLeaderboardForm.vue';
import type { MenuItem } from 'primevue/menuitem';
import Panel from 'primevue/panel';

const breadcrumbs: MenuItem[] = [
  { label: 'Leaderboards', url: '/leaderboards' },
  { label: 'New', url: '/leaderboards/new' },
];

function handleFormSuccess({ board }: { board: Leaderboard }) {
  router.push({ name: 'leaderboard', params: { boardUuid: board.uuid } });
}

function handleFormFailure() {
  router.push({ name: 'leaderboards' });
}
</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <Panel
      header="Create a new Leaderboard"
    >
      <CreateLeaderboardForm
        @form-success="handleFormSuccess"
        @form-cancel="handleFormFailure"
      />
    </Panel>
  </ApplicationLayout>
</template>
