<script setup lang="ts">
import { ref } from 'vue';

import { useRoute, useRouter } from 'vue-router';
const router = useRouter();
const route = useRoute();

import { useToast } from 'vuestic-ui';
const { notify } = useToast();

import type { CompleteLeaderboard } from '../../server/api/leaderboards.ts';
import { getLeaderboard } from '../lib/api/leaderboard.ts';

import AppPage from './layout/AppPage.vue'
import LeaderboardGoal from './leaderboard/LeaderboardGoal.vue';
// import LeaderboardAddProject from './leaderboard/LeaderboardAddProject.vue';
import LeaderboardChart from './leaderboard/LeaderboardChart.vue';
import LeaderboardProjectSummary from './leaderboard/LeaderboardProjectSummary.vue';

const leaderboard = ref<CompleteLeaderboard>(null);
const errorMessage = ref<string>('');

function loadLeaderboard() {
  const leaderboardUuid = route.params.uuid as string;

  getLeaderboard(leaderboardUuid)
    .then(lb => leaderboard.value = lb)
    .catch(err => {
      if(err.code === 'NOT_FOUND') {
        errorMessage.value = `Could not find leaderboard with UUID ${leaderboardUuid}. How did you get here?`;
      } else {
        errorMessage.value = err.message;
      }
    });
}
loadLeaderboard();

function handleProjectChange() {
  loadLeaderboard();
}

// TODO: make this a dropdown with the link in text and a separate copy button
async function handleShareClick() {
  const shareUrl = new URL(`/share/leaderboards/${leaderboard.value.uuid}`, window.location.href)
  try {
    await navigator.clipboard.writeText(shareUrl.toString());
    notify({
      message: 'Link copied!',
      color: 'success',
    });
  } catch(err) {
    notify({
      message: "Couldn't copy the link — are you on a weird browser?",
      color: 'danger',
    });
  }
}
</script>

<template>
  <AppPage require-login>
    <div v-if="leaderboard">
      <div class="flex gap-4 items-center">
        <h2 class="va-h2 mb-3">
          {{ leaderboard.title }}
        </h2>
        <!-- <div
          class="shrink"
        >
          <VaIcon
            name="share"
            size="large"
            title="Get a public link to this project"
            class="cursor-pointer"
            @click="handleShareClick"
          />
        </div> -->
        <!-- <div class="shrink">
          <RouterLink :to="{ name: 'edit-leaderboard', params: { uuid: leaderboard.uuid } }">
            <VaIcon
              name="edit"
              size="large"
              title="Edit leaderboard"
            />
          </RouterLink>
        </div> -->
      </div>
      <div class="grid grid-cols-6 gap-4">
        <div class="col-span-2 flex flex-col justify-start gap-4">
          <div
            class="leaderboard-goal shrink"
          >
            <LeaderboardGoal
              :leaderboard="leaderboard"
            />
          </div>
          <!-- <div
            class="leaderboard-add-project shrink"
          >
            <LeaderboardAddProject
              :leaderboard="leaderboard"
              @add-project="handleProjectChange"
              @remove-project="handleProjectChange"
            />
          </div> -->
          <!-- <div class="leaderboard-stats shrink">
            <LeaderboardStats :leaderboard="leaderboard" />
          </div> -->
        </div>
        <div class="col-span-4 flex flex-col justify-start gap-4">
          <div class="leaderboard-chart shrink">
            <VaCard class="h-full">
              <VaCardTitle>How's everyone doing?</VaCardTitle>
              <VaCardContent>
                <LeaderboardChart
                  :id="`leaderboard-chart-${leaderboard.id}`"
                  :leaderboard="leaderboard"
                  show-par
                  show-tooltips
                  show-legend
                />
              </VaCardContent>
            </VaCard>
          </div>
          <div class="leaderboard-project-summary shrink">
            <LeaderboardProjectSummary
              :leaderboard="leaderboard"
            />
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      {{ errorMessage }}
    </div>
  </AppPage>
</template>

<style scoped>

</style>
