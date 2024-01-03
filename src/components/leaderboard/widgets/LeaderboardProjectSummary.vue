<script setup lang="ts">
import { reactive, computed, watch } from 'vue';
import { DataTableColumnSource } from 'vuestic-ui';

import type { CompleteLeaderboard } from 'server/api/leaderboards.ts';
import { GOAL_TYPE_INFO } from 'src/lib/api/leaderboard.ts';
import { formatTimeProgress } from 'src/lib/date.ts';

const props = defineProps<{
  leaderboard: CompleteLeaderboard
}>();

function makeRows(leaderboard: CompleteLeaderboard) {
  const rows = leaderboard.projects
    .sort((a, b) => a.title < b.title ? -1 : a.title > b.title ? 1 : 0)
    .map(project => {
      let totalSoFar = project.updates.reduce((total, update) => total + update.value, 0);
      let totalStr;
      if(leaderboard.type === 'percentage') {
        totalStr = Math.round(totalSoFar / (project.type === 'time' ? project.goal * 60 : project.goal) * 100) + '%';
      } else if(leaderboard.type === 'time') {
        totalStr = formatTimeProgress(totalSoFar);
      } else {
        totalStr = totalSoFar + ' ' + GOAL_TYPE_INFO[project.type].counter[totalSoFar === 1 ? 'singular' : 'plural'];
      }

      const lastUpdate = project.updates.length > 0 ? project.updates.sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0)[0].date : 'never'

      return {
        title: project.title,
        writer: project.owner.displayName,
        total: totalStr,
        lastUpdate,
      };
    });

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
