<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useEventBus, useClipboard } from '@vueuse/core';

import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();

import { useLeaderboardStore } from 'src/stores/leaderboard';
const leaderboardStore = useLeaderboardStore();

import { LeaderboardSummary, listParticipants, Participant } from 'src/lib/api/leaderboard';
import type { Tally } from 'src/lib/api/tally.ts';

import { PrimeIcons } from 'primevue/api';
import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import Button from 'primevue/button';
import UserAvatar from 'src/components/UserAvatar.vue';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Dialog from 'primevue/dialog';

import DetailPageHeader from 'src/components/layout/DetailPageHeader.vue';
import SubsectionTitle from 'src/components/layout/SubsectionTitle.vue';
import IndividualGoalProgressChart from 'src/components/leaderboard/IndividualGoalProgressChart.vue';
// import BoardStats from 'src/components/board/BoardStats.vue';
// import BoardProgressMeter from 'src/components/board/BoardProgressMeter.vue';
// import BoardProgressChart from 'src/components/board/BoardProgressChart.vue';
// import BoardIndividualProgressChart from 'src/components/board/BoardIndividualProgressChart.vue';
// import BoardStandings from 'src/components/board/BoardStandings.vue';

const leaderboard = ref<LeaderboardSummary>(null);
const loadLeaderboard = async function() {
  leaderboard.value = leaderboardStore.get(route.params.boardUuid.toString());
}
watch(() => route.params.boardUuid, newUuid => {
  if(newUuid !== undefined) {
    console.log('switch!', newUuid);
    reloadData();
  }
});

const participants = ref<Participant[]>([]);
const isParticipantsLoading = ref<boolean>(false);
const participantsErrorMessage = ref<string>(null);
const loadParticipants = async function() {
  participantsErrorMessage.value = null;
  isParticipantsLoading.value = true;

  try {
    participants.value = await listParticipants(leaderboard.value.uuid);
  } catch(err) {
    participantsErrorMessage.value = err.message;
    if(err.code !== 'NOT_LOGGED_IN') {
      // the ApplicationLayout takes care of this. If we don't exclude NOT_LOGGED_IN, this will redirect to /leaderboards
      // before ApplicationLayout can redirect to /login.
      // TODO: figure out a better way to ensure that there's no race condition here
      router.push({ name: 'leaderboards' });
    }
  } finally {
    isParticipantsLoading.value = false;
  }
}

async function reloadData() {
  await leaderboardStore.populate(true);
  await loadLeaderboard();
  await loadParticipants();
}

onMounted(() => {
  useEventBus<{ tally: Tally }>('tally:create').on(reloadData);
  useEventBus<{ tally: Tally }>('tally:edit').on(reloadData);
  useEventBus<{ tally: Tally }>('tally:delete').on(reloadData);

  reloadData();
});

const breadcrumbs = computed(() => {
  const crumbs: MenuItem[] = [
    { label: 'Leaderboards', url: '/leaderboards2' },
    { label: leaderboard.value === null ? 'Loading...' : leaderboard.value.title, url: leaderboard.value === null ? '' : `/leaderboards2/${leaderboard.value.uuid}` },
  ];
  return crumbs;
});
</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <div v-if="leaderboard">
      <DetailPageHeader
        :title="leaderboard.title"
        :subtitle="leaderboard.description"
      >
        <template #actions>
          <!--
            TODO:
            - Join button if not a participant and joinable
            - Configure button if a participant
            - Copy join code if joinable
          -->
          <!-- <Button
            label="Configure Leaderboard"
            severity="info"
            :icon="PrimeIcons.COG"
            @click="router.push({ name: 'edit-leaderboard', params: { boardUuid: leaderboard.uuid } })"
          /> -->
          <Button
            label="Configure Leaderboard"
            severity="info"
            :icon="PrimeIcons.COG"
            @click="console.log('configure!')"
          />
        </template>
      </DetailPageHeader>
      <div
        class="flex flex-row-reverse flex-wrap justify-end gap-8"
      >
        <!-- Members -->
        <div class="max-w-screen-md">
          <SubsectionTitle title="Members" />
          <div class="mb-4 flex flex-wrap gap-2">
            <!-- TODO: add a crown for owners, or something-->
            <UserAvatar
              v-for="member of leaderboard.members"
              :key="member.id"
              :user="member"
            />
          </div>
        </div>
        <!-- Standings -->
        <div class="w-full max-w-screen-md">
          <SubsectionTitle title="Standings" />
          <div v-if="participants.length === 0">
            This leaderboard has no participants, so there's nothing to show.
          </div>
          <div v-else-if="leaderboard.individualGoalMode">
            <div class="w-full">
              <IndividualGoalProgressChart
                :leaderboard="leaderboard"
                :participants="participants"
              />
            </div>
            <div class="w-full mt-4">
              <div>standings here</div>
            </div>
          </div>
          <div v-else>
            Let's show some tabs!
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      Loading leaderboard...
    </div>
  </ApplicationLayout>
</template>