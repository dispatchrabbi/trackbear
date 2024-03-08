<script setup lang="ts">
import { reactive, computed, watch } from 'vue';
import { DataTableColumnSource } from 'vuestic-ui';

import type { CompleteLeaderboard } from 'server/api/leaderboards.ts';
import { GOAL_TYPE_INFO } from 'src/lib/api/leaderboard.ts';
import { formatDuration } from 'src/lib/date.ts';

const props = defineProps<{
  leaderboard: CompleteLeaderboard
}>();

function makeRows(leaderboard: CompleteLeaderboard) {
  const rows = leaderboard.projects
    .sort((a, b) => a.title < b.title ? -1 : a.title > b.title ? 1 : 0)
    .map(project => {
      let total = project.updates.reduce((total, update) => total + update.value, 0);
      if(leaderboard.type === 'percentage') {
        total = Math.round(total / (project.type === 'time' ? project.goal * 60 : project.goal) * 100);
      }

      const lastUpdate = project.updates.length > 0 ? project.updates.sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0)[0].date : null;

      return {
        title: project.title,
        writer: project.owner.displayName,
        leaderboardType: leaderboard.type,
        total,
        lastUpdate,
      };
    });

  return rows;
}
const items = computed(() => makeRows(props.leaderboard));

function formatLastUpdate(lastUpdateDate) {
  return lastUpdateDate || 'never';
}

function formatTotal(total, leaderboardType) {
  if(leaderboardType === 'percentage') {
    return total + '%';
  } else if(leaderboardType === 'time') {
    return formatDuration(total);
  } else {
    return total + ' ' + GOAL_TYPE_INFO[leaderboardType].counter[total === 1 ? 'singular' : 'plural'];
  }
}

const columns = computed(() => {
  const cols = [
    {
      key: 'lastUpdate',
      label: 'Last Update',
      sortable: true,
      sortingFn: (a, b) => {
        if(a === null && b === null) { return 0; }
        if(a === null || a < b) { return -1; }
        if(b === null || a > b) { return 1; }
        return 0;
      }
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
      sortingFn: (a, b) => a < b ? -1 : a > b ? 1 : 0,
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
      >
        <template #cell(lastUpdate)="{ rowData }">
          {{ formatLastUpdate(rowData.lastUpdate) }}
        </template>
        <template #cell(total)="{ rowData }">
          {{ formatTotal(rowData.total, leaderboard.type) }}
        </template>
      </VaDataTable>
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
