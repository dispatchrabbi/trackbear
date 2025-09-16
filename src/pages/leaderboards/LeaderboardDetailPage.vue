<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useEventBus } from '@vueuse/core';

import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();

import { useUserStore } from 'src/stores/user.ts';
const userStore = useUserStore();

import { useLeaderboardStore } from 'src/stores/leaderboard';
const leaderboardStore = useLeaderboardStore();

import { useEnvStore } from 'src/stores/env';
const envStore = useEnvStore();

import { LeaderboardSummary, listParticipants, Participant } from 'src/lib/api/leaderboard';
import type { Tally } from 'src/lib/api/tally.ts';
import { TALLY_MEASURE } from 'server/lib/models/tally/consts';
import { TALLY_MEASURE_INFO } from 'src/lib/tally';
import { toTitleCase } from 'src/lib/str';

import { PrimeIcons } from 'primevue/api';
import type { MenuItem } from 'primevue/menuitem';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import DetailPageHeader from 'src/components/layout/DetailPageHeader.vue';
import SubsectionTitle from 'src/components/layout/SubsectionTitle.vue';
import IndividualGoalProgressChart from 'src/components/leaderboard/IndividualGoalProgressChart.vue';
import LeaderboardStats from 'src/components/leaderboard/LeaderboardStats.vue';
import ChallengeProgressChart from 'src/components/leaderboard/ChallengeProgressChart.vue';
import FundraiserProgressChart from 'src/components/leaderboard/FundraiserProgressChart.vue';
import FundraiserProgressMeter from 'src/components/leaderboard/FundraiserProgressMeter.vue';
import LeaderboardStandings from 'src/components/leaderboard/LeaderboardStandings.vue';
import JoinCodeDisplay from 'src/components/leaderboard/JoinCodeDisplay.vue';
import UserAvatar from 'src/components/UserAvatar.vue';

const leaderboard = ref<LeaderboardSummary | null>(null);
const loadLeaderboard = async function() {
  leaderboard.value = leaderboardStore.get(route.params.boardUuid.toString());
  if(leaderboard.value === null) {
    router.push({ name: 'leaderboards' });
  }
};

const participants = ref<Participant[]>([]);
const participantsNeedToSetGoals = ref<boolean>(false);
const isParticipantsLoading = ref<boolean>(false);
const participantsErrorMessage = ref<string | null>(null);
const loadParticipants = async function() {
  if(leaderboard.value === null) {
    participantsNeedToSetGoals.value = false;
    isParticipantsLoading.value = false;
    participantsErrorMessage.value = null;
    return;
  }

  participantsNeedToSetGoals.value = false;
  participantsErrorMessage.value = null;
  isParticipantsLoading.value = true;

  try {
    const allParticipants = await listParticipants(leaderboard.value.uuid);
    participants.value = leaderboard.value.individualGoalMode ? allParticipants.filter(participant => participant.goal !== null) : allParticipants;

    // set a flag if there are participants but all of them need to set goals
    if(leaderboard.value.individualGoalMode && participants.value.length === 0 && allParticipants.length > 0) {
      participantsNeedToSetGoals.value = true;
    }
  } catch (err) {
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
};

async function reloadData() {
  await leaderboardStore.populate(true);
  await loadLeaderboard();
  await loadParticipants();
}

const measuresAvailable = computed(() => {
  if(leaderboard.value === null) {
    return [TALLY_MEASURE.WORD];
  }

  const measuresPresent = new Set(participants.value.flatMap(participant => participant.tallies.map(tally => tally.measure)));
  return leaderboard.value.measures.filter(measure => measuresPresent.has(measure));
});

const selectedMeasure = ref(TALLY_MEASURE.WORD);
watch(measuresAvailable, newMeasuresAvailable => {
  if(!newMeasuresAvailable.includes(selectedMeasure.value)) {
    selectedMeasure.value = measuresAvailable.value[0];
  }
});

const isUserAMember = computed(() => {
  if(!leaderboard.value) {
    return false;
  }

  return leaderboard.value.members.some(member => member.userUuid === userStore.user!.uuid);
});

const participantMembers = computed(() => {
  return (leaderboard.value?.members ?? []).filter(member => member.isParticipant);
});

const spectatorMembers = computed(() => {
  return (leaderboard.value?.members ?? []).filter(member => !member.isParticipant);
});

const handleConfigureClick = function() {
  router.push({ name: 'edit-leaderboard' });
};

const isJoinCodeDialogVisible = ref<boolean>(false);
const handleJoinCodeClick = function() {
  isJoinCodeDialogVisible.value = true;
};

const breadcrumbs = computed(() => {
  const crumbs: MenuItem[] = [
    { label: 'Leaderboards', url: '/leaderboards' },
    { label: leaderboard.value === null ? 'Loading...' : leaderboard.value.title, url: leaderboard.value === null ? '' : `/leaderboards/${leaderboard.value.uuid}` },
  ];
  return crumbs;
});

onMounted(async () => {
  useEventBus<{ tally: Tally }>('tally:create').on(reloadData);
  useEventBus<{ tally: Tally }>('tally:edit').on(reloadData);
  useEventBus<{ tally: Tally }>('tally:delete').on(reloadData);

  await reloadData();
  await envStore.populate();
});

watch(() => route.params.boardUuid, newUuid => {
  if(newUuid !== undefined) {
    reloadData();
  }
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
            v-if="isUserAMember"
            label="Configure Leaderboard"
            severity="info"
            :icon="PrimeIcons.COG"
            @click="handleConfigureClick"
          />
          <Button
            v-if="leaderboard.isJoinable"
            label="View Join Code"
            severity="help"
            :icon="PrimeIcons.USER_PLUS"
            @click="handleJoinCodeClick"
          />
        </template>
      </DetailPageHeader>
      <div
        class="flex flex-col lg:flex-row-reverse flex-wrap justify-end gap-8"
      >
        <!-- Members -->
        <div class="max-w-screen-md">
          <div v-if="participantMembers.length > 0">
            <SubsectionTitle title="Participants" />
            <div class="mb-4 flex flex-wrap gap-2">
              <!-- TODO: add a crown for owners, or something-->
              <UserAvatar
                v-for="participant of participantMembers"
                :key="participant.id"
                :user="participant"
                :display-name="participant.displayName"
              />
            </div>
          </div>
          <div v-if="spectatorMembers.length > 0">
            <SubsectionTitle title="Spectators" />
            <div class="mb-4 flex flex-wrap gap-2">
              <!-- TODO: add a crown for owners, or something-->
              <UserAvatar
                v-for="spectator of spectatorMembers"
                :key="spectator.id"
                :user="spectator"
              />
            </div>
          </div>
        </div>
        <!-- Standings -->
        <div class="w-full max-w-screen-md">
          <SubsectionTitle title="Standings" />
          <div v-if="participantsNeedToSetGoals">
            This leaderboard is using Individual Goal Mode but no participants have yet set their own goals, so there's nothing to show.
          </div>
          <div v-else-if="participants.length === 0">
            This leaderboard has no participants, so there's nothing to show.
          </div>
          <div v-else-if="leaderboard.individualGoalMode">
            <div class="w-full flex flex-col gap-4">
              <IndividualGoalProgressChart
                class="w-full"
                :leaderboard="leaderboard"
                :participants="participants"
              />
              <LeaderboardStandings
                :leaderboard="leaderboard"
                :participants="participants"
                measure="percent"
              />
            </div>
          </div>
          <div v-else>
            <TabView
              :pt="{ tabpanel: { content: { class: [ 'px-0' ] } } }"
              :pt-options="{ mergeSections: true, mergeProps: true }"
              @update:active-index="index => selectedMeasure = measuresAvailable[index]"
            >
              <TabPanel
                v-for="measure of measuresAvailable"
                :key="measure"
                :header="toTitleCase(TALLY_MEASURE_INFO[measure].label.plural)"
              >
                <div
                  class="w-full flex flex-col gap-4"
                >
                  <LeaderboardStats
                    v-if="leaderboard.fundraiserMode"
                    :participants="participants"
                    :measure="selectedMeasure"
                  />
                  <FundraiserProgressChart
                    v-if="leaderboard.fundraiserMode"
                    class="w-full"
                    :leaderboard="leaderboard"
                    :participants="participants"
                    :measure="selectedMeasure"
                  />
                  <ChallengeProgressChart
                    v-if="!leaderboard.fundraiserMode"
                    class="w-full"
                    :leaderboard="leaderboard"
                    :participants="participants"
                    :measure="selectedMeasure"
                  />
                  <FundraiserProgressMeter
                    v-if="leaderboard.fundraiserMode"
                    :leaderboard="leaderboard"
                    :participants="participants"
                    :measure="selectedMeasure"
                  />
                  <LeaderboardStandings
                    :leaderboard="leaderboard"
                    :participants="participants"
                    :measure="selectedMeasure"
                  />
                </div>
              </TabPanel>
            </TabView>
          </div>
        </div>
      </div>
      <Dialog
        v-model:visible="isJoinCodeDialogVisible"
        modal
      >
        <template #header>
          <h2 class="font-heading font-semibold uppercase">
            <span :class="PrimeIcons.USER_PLUS" />
            View Join Code
          </h2>
        </template>
        <JoinCodeDisplay :leaderboard="leaderboard" />
      </Dialog>
    </div>
    <div v-else>
      Loading leaderboard...
    </div>
  </ApplicationLayout>
</template>
