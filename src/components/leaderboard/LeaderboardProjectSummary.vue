<script setup lang="ts">
import { reactive, computed, watch } from 'vue';
import { DataTableColumnSource } from 'vuestic-ui';

import type { CompleteLeaderboard } from '../../../server/api/leaderboards.ts';
import { GOAL_TYPE_INFO } from '../../lib/api/leaderboard.ts';

const props = defineProps<{
  leaderboard: CompleteLeaderboard
}>();

function makeRows(leaderboard: CompleteLeaderboard) {
  const rows = leaderboard.projects
    .sort((a, b) => a.title < b.title ? -1 : a.title > b.title ? 1 : 0)
    .map(project => ({
      title: project.title,
      writer: project.owner.displayName,
      // TODO: make this better (incorporate goal type and leaderboard dates)
      total: project.updates.reduce((total, update) => total + update.value, 0),
      lastUpdate: project.updates.length > 0 ? project.updates.sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0)[0].date : 'never',
    }));

  return rows;
}
const items = computed(() => makeRows(props.leaderboard));

const columns = computed(() => {
  const cols = [
    {
      key: 'lastUpdate',
      label: 'Last Update',
      sortable: true,
    },
    {
      key: 'title',
      label: 'Project Title',
      sortable: true,
    },
    {
      key: 'writer',
      label: 'Writer',
      sortable: true,
    },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      thAlign: 'right',
      tdAlign: 'right',
    },
  ] as DataTableColumnSource[];

  return cols;
});

const sorting = reactive<{
  sortBy: string;
  sortingOrder: 'asc' | 'desc' | null;
}>({
  sortBy: localStorage.getItem('leaderboardProjects:sortBy') || 'lastUpdate',
  sortingOrder: (localStorage.getItem('leaderboardProjects:sortingOrder') as 'asc' | 'desc') || 'desc',
});
watch(() => sorting.sortBy, val => localStorage.setItem('leaderboardProjects:sortBy', val));
watch(() => sorting.sortingOrder, val => localStorage.setItem('leaderboardProjects:sortingOrder', val));

</script>

<template>
  <VaCard>
    <VaCardTitle>History</VaCardTitle>
    <VaCardContent>
      <VaDataTable
        v-if="items.length"
        v-model:sort-by="sorting.sortBy"
        v-model:sorting-order="sorting.sortingOrder"
        :items="items"
        :columns="columns"
      />
      <div
        v-else
        class="text-center"
      >
        Nothing yet. Get writing! 📝
      </div>
    </VaCardContent>
  </VaCard>
</template>

<style scoped>
</style>
