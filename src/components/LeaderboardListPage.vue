<script setup lang="ts">
import { ref } from 'vue';

import type { CompleteLeaderboard } from '../../server/api/leaderboards.ts';
import { getLeaderboards } from '../lib/api/leaderboard.ts';

import AppPage from './layout/AppPage.vue'
import LeaderboardTile from './leaderboard/LeaderboardTile.vue';
// import NewProjectTile from './project/NewProjectTile.vue';
// import ProjectSkeletonTile from './project/ProjectSkeletonTile.vue';

const leaderboards = ref<CompleteLeaderboard[]>([]);
const isLoading = ref<boolean>(false);
const errorMessage = ref<string>('');

isLoading.value = true;
getLeaderboards()
  .then(lbs => leaderboards.value = lbs)
  // TODO: add error message display
  .catch(err => errorMessage.value = err.message)
  .finally(() => isLoading.value = false);

</script>

<template>
  <AppPage require-login>
    <div class="flex items-center mb-3">
      <div class="grow">
        <h2 class="va-h2">
          Your Leaderboards
        </h2>
      </div>
      <div class="shrink">
        <RouterLink to="/leaderboards/new">
          <VaButton gradient>
            New Leaderboard
          </VaButton>
        </RouterLink>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div v-if="isLoading">
        <!-- <LeaderboardSkeletonTile /> -->
      </div>
      <div v-if="(!isLoading) && leaderboards.length === 0">
        <!-- <RouterLink to="/leaderboards/new">
          <NewLeaderboardTile />
        </RouterLink> -->
      </div>
      <div
        v-for="leaderboard in leaderboards"
        :key="leaderboard.id"
      >
        <RouterLink :to="`/leaderboards/${leaderboard.id}`">
          <LeaderboardTile
            :leaderboard="leaderboard"
          />
        </RouterLink>
      </div>
    </div>
  </AppPage>
</template>

<style scoped>
</style>
