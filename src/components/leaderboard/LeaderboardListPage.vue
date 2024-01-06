<script setup lang="ts">
import { ref } from 'vue';

import type { CompleteLeaderboard } from 'server/api/leaderboards.ts';
import { getLeaderboards } from 'src/lib/api/leaderboard.ts';

import AppPage from 'src/components/layout/AppPage.vue'
import ContentHeader from 'src/components/layout/ContentHeader.vue';
import LeaderboardTile from './widgets/LeaderboardTile.vue';
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
    <ContentHeader title="Leaderboards">
      <template #actions>
        <div>
          <RouterLink to="/leaderboards/new">
            <VaButton
              icon="add"
              gradient
            >
              New
            </VaButton>
          </RouterLink>
        </div>
      </template>
    </ContentHeader>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <RouterLink :to="`/leaderboards/${leaderboard.uuid}`">
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
