<script setup lang="ts">

import type { CompleteLeaderboard } from 'server/api/leaderboards.ts';
import LeaderboardChart from './LeaderboardChart.vue';

defineProps<{ leaderboard: CompleteLeaderboard }>();

</script>

<template>
  <VaCard>
    <VaCardTitle>
      <h2 class="text-lg">
        {{ leaderboard.title }}
      </h2>
    </VaCardTitle>
    <VaCardContent>
      <LeaderboardChart
        :id="`leaderboard-tile-chart-${leaderboard.id}`"
        class="min-h-[12rem]"
        :leaderboard="leaderboard"
        :show-par="true"
        :show-tooltips="true"
        :show-legend="false"
      />
    </VaCardContent>
  </VaCard>
</template>

<style scoped>
</style>
