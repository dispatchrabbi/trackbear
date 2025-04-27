<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useEventBus, useClipboard } from '@vueuse/core';

import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();

import { useUserStore } from 'src/stores/user.ts';
const userStore = useUserStore();

import { useLeaderboardStore } from 'src/stores/leaderboard';
const leaderboardStore = useLeaderboardStore();

import { LeaderboardSummary, listParticipants, Participant } from 'src/lib/api/leaderboard';
import type { Tally } from 'src/lib/api/tally.ts';
import { TALLY_MEASURE } from 'server/lib/models/tally/consts';
import { TALLY_MEASURE_INFO } from 'src/lib/tally';
import { toTitleCase } from 'src/lib/str';

import { PrimeIcons } from 'primevue/api';
import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import Button from 'primevue/button';
import UserAvatar from 'src/components/UserAvatar.vue';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';

import DetailPageHeader from 'src/components/layout/DetailPageHeader.vue';
import SubsectionTitle from 'src/components/layout/SubsectionTitle.vue';
import IndividualGoalProgressChart from 'src/components/leaderboard/IndividualGoalProgressChart.vue';
import LeaderboardStats from 'src/components/leaderboard/LeaderboardStats.vue';
import ChallengeProgressChart from 'src/components/leaderboard/ChallengeProgressChart.vue';
import FundraiserProgressChart from 'src/components/leaderboard/FundraiserProgressChart.vue';
import FundraiserProgressMeter from 'src/components/leaderboard/FundraiserProgressMeter.vue';
import LeaderboardStandings from 'src/components/leaderboard/LeaderboardStandings.vue';

import { useToast } from 'primevue/usetoast';
const toast = useToast();

const leaderboard = ref<LeaderboardSummary>(null);
const loadLeaderboard = async function() {
  leaderboard.value = leaderboardStore.get(route.params.boardUuid.toString());
}

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

const measuresAvailable = computed(() => {
  if(leaderboard.value === null) { return [ TALLY_MEASURE.WORD ]; }

  const measuresPresent = new Set(participants.value.flatMap(participant => participant.tallies.map(tally => tally.measure)));
  return leaderboard.value.measures.filter(measure => measuresPresent.has(measure));
});

const selectedMeasure = ref(TALLY_MEASURE.WORD);
watch(measuresAvailable, (newMeasuresAvailable) => {
  if(!newMeasuresAvailable.includes(selectedMeasure.value)) {
    selectedMeasure.value = measuresAvailable.value[0];
  }
});

const isUserAMember = computed(() => {
  if(!leaderboard.value) {
    return false;
  }

  return leaderboard.value.members.some(member => member.userUuid === userStore.user.uuid);
});

const { copy } = useClipboard({ legacy: true });
const handleShareClick = function() {
  if(leaderboard.value === null) { return; }

  copy(leaderboard.value.uuid);
  toast.add({
    severity: 'success',
    summary: 'Code copied!',
    detail: 'The join code for this leaderboard has been copied to your clipboard.',
    life: 3 * 1000,
  });
};

const breadcrumbs = computed(() => {
  const crumbs: MenuItem[] = [
    { label: 'Leaderboards', url: '/leaderboards2' },
    { label: leaderboard.value === null ? 'Loading...' : leaderboard.value.title, url: leaderboard.value === null ? '' : `/leaderboards2/${leaderboard.value.uuid}` },
  ];
  return crumbs;
});

onMounted(() => {
  useEventBus<{ tally: Tally }>('tally:create').on(reloadData);
  useEventBus<{ tally: Tally }>('tally:edit').on(reloadData);
  useEventBus<{ tally: Tally }>('tally:delete').on(reloadData);

  reloadData();
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
            @click="console.log('configure!')"
          />
          <Button
            v-if="leaderboard.isJoinable && !isUserAMember"
            label="Join Leaderboard"
            :icon="PrimeIcons.USER_PLUS"
            @click="console.log('join!')"
          />
          <Button
            v-if="leaderboard.isJoinable"
            label="Copy Join Code"
            severity="help"
            :icon="PrimeIcons.COPY"
            @click="handleShareClick"
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
    </div>
    <div v-else>
      Loading leaderboard...
    </div>
  </ApplicationLayout>
</template>