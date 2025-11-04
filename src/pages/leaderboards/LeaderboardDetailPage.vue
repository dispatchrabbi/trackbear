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

import { type LeaderboardSummary, listParticipants, type Participant } from 'src/lib/api/leaderboard';
import type { Tally } from 'src/lib/api/tally.ts';
import { TALLY_MEASURE, type TallyMeasure } from 'server/lib/models/tally/consts';
import { TALLY_MEASURE_INFO } from 'src/lib/tally';
import { toTitleCase } from 'src/lib/str';

import { useAsyncSignals } from 'src/lib/use-async-signals';
import { useLeaderboardSeries } from 'src/components/leaderboard/use-leaderboard-series';
import { LEADERBOARD_MEASURE } from 'server/lib/models/leaderboard/consts';

import { PrimeIcons } from 'primevue/api';
import type { MenuItem } from 'primevue/menuitem';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import DetailPageHeader from 'src/components/layout/DetailPageHeader.vue';
import SubsectionTitle from 'src/components/layout/SubsectionTitle.vue';
import LeaderboardStats from 'src/components/leaderboard/LeaderboardStats.vue';
import FundraiserChart from 'src/components/chart/FundraiserChart.vue';
import ProgressChart from 'src/components/chart/ProgressChart.vue';
import FundraiserProgressMeter from 'src/components/leaderboard/FundraiserProgressMeter.vue';
import LeaderboardStandings from 'src/components/leaderboard/LeaderboardStandings.vue';
import JoinCodeDisplay from 'src/components/leaderboard/JoinCodeDisplay.vue';
import MembersRoster from 'src/components/leaderboard/members/MembersRoster.vue';
import { FAILURE_CODES } from 'server/lib/api-response-codes.ts';

const leaderboard = ref<LeaderboardSummary | null>(null);
const allParticipants = ref<Participant[]>([]);

const [load, signals] = useAsyncSignals(
  async function() {
    const uuid = route.params.boardUuid.toString();
    await leaderboardStore.refreshByUuid(uuid);

    const loadedLeaderboard = leaderboardStore.get(uuid);
    if(loadedLeaderboard === null) {
      throw new Error(`Could not find a leaderboard with uuid ${route.params.boardUuid.toString()}`);
    }

    const loadedParticipants = await listParticipants(uuid);

    return {
      leaderboard: loadedLeaderboard,
      participants: loadedParticipants,
    };
  },
  async function(err) {
    // @ts-expect-error -- need to type this error so it possibly has an error code
    if(err.code !== FAILURE_CODES.NOT_LOGGED_IN) {
      // the ApplicationLayout takes care of this. If we don't exclude NOT_LOGGED_IN, this will redirect to /leaderboards
      // before ApplicationLayout can redirect to /login.
      // TODO: figure out a better way to ensure that there's no race condition here
      router.push({ name: 'leaderboards' });
    }

    leaderboard.value = null;
    allParticipants.value = [];
    return err.message;
  },
  async function(result) {
    leaderboard.value = result.leaderboard;
    allParticipants.value = result.participants;
    return null;
  },
);

const participants = computed(() => {
  if(!leaderboard.value) {
    return [];
  }
  if(leaderboard.value.individualGoalMode) {
    return allParticipants.value.filter(participant => participant.goal !== null);
  } else {
    return allParticipants.value;
  }
});
const participantsNeedToSetGoals = computed(() => {
  if(!leaderboard.value) {
    return false;
  }

  return leaderboard.value.individualGoalMode && participants.value.length === 0 && allParticipants.value.length > 0;
});

const measuresAvailable = computed(() => {
  if(leaderboard.value === null) {
    return [TALLY_MEASURE.WORD];
  }

  const measuresPresent = new Set(allParticipants.value.flatMap(participant => participant.tallies.map(tally => tally.measure)));
  return leaderboard.value.measures.filter(measure => measuresPresent.has(measure));
});

const selectedMeasure = ref<TallyMeasure>(TALLY_MEASURE.WORD);
watch(measuresAvailable, newMeasuresAvailable => {
  if(!newMeasuresAvailable.includes(selectedMeasure.value)) {
    selectedMeasure.value = measuresAvailable.value[0];
  }
});

const { series, seriesTallies, seriesInfo, eligibleParticipants } = useLeaderboardSeries(leaderboard, participants, selectedMeasure);

const isUserAMember = computed(() => {
  if(!leaderboard.value) {
    return false;
  }

  return leaderboard.value.members.some(member => member.userUuid === userStore.user!.uuid);
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

async function reloadData() {
  await load();
}

onMounted(async () => {
  useEventBus<{ tally: Tally }>('tally:create').on(reloadData);
  useEventBus<{ tally: Tally }>('tally:edit').on(reloadData);
  useEventBus<{ tally: Tally }>('tally:delete').on(reloadData);

  await reloadData();
  await envStore.populate();
});

watch(() => route.params.boardUuid, async newUuid => {
  if(newUuid !== undefined) {
    await reloadData();
  }
});
</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <div v-if="leaderboard && !signals.isLoading">
      <DetailPageHeader
        :title="leaderboard.title"
        :subtitle="leaderboard.description"
      >
        <template #actions>
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
        class="flex flex-col lg:flex-row flex-wrap justify-start gap-8"
      >
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
              <ProgressChart
                :tallies="seriesTallies"
                :measure-hint="LEADERBOARD_MEASURE.PERCENT"
                :series-info="seriesInfo"
                :start-date="leaderboard.startDate"
                :end-date="leaderboard.endDate"
                :goal-count="100"
                :show-legend="true"
                :force-series-name-in-tooltip="true"
                :graph-title="leaderboard.title"
              />
              <LeaderboardStandings
                :leaderboard="leaderboard"
                :participants="eligibleParticipants"
                :measure="LEADERBOARD_MEASURE.PERCENT"
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
                  <FundraiserChart
                    v-if="leaderboard.fundraiserMode"
                    class="w-full"
                    :tallies="seriesTallies"
                    :measure-hint="measure"
                    :series-info="seriesInfo"
                    :start-date="leaderboard.startDate"
                    :end-date="leaderboard.endDate"
                    :goal-count="leaderboard.goal[measure]"
                    :show-legend="true"
                    :force-series-name-in-tooltip="true"
                    :graph-title="leaderboard.title"
                  />
                  <ProgressChart
                    v-if="!leaderboard.fundraiserMode"
                    class="w-full"
                    :tallies="seriesTallies"
                    :measure-hint="measure"
                    :series-info="seriesInfo"
                    :start-date="leaderboard.startDate"
                    :end-date="leaderboard.endDate"
                    :goal-count="leaderboard.goal[measure]"
                    :show-legend="true"
                    :force-series-name-in-tooltip="true"
                    :graph-title="leaderboard.title"
                  />
                  <FundraiserProgressMeter
                    v-if="leaderboard.fundraiserMode"
                    :leaderboard="leaderboard"
                    :series="series"
                    :series-info="seriesInfo"
                    :measure="selectedMeasure"
                  />
                  <LeaderboardStandings
                    :leaderboard="leaderboard"
                    :participants="eligibleParticipants"
                    :measure="selectedMeasure"
                  />
                </div>
              </TabPanel>
            </TabView>
          </div>
        </div>
        <!-- Members -->
        <div class="w-full xl:w-auto xl:grow max-w-screen-md">
          <MembersRoster
            :leaderboard="leaderboard"
          />
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
