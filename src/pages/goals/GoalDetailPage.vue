<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useEventBus } from '@vueuse/core';

import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();

import { useUserStore } from 'src/stores/user.ts';
const userStore = useUserStore();

import { useGoalStore } from 'src/stores/goal.ts';
const goalStore = useGoalStore();

import type { Goal } from 'src/lib/api/goal.ts';
import type { TargetGoalParameters, HabitGoalParameters, TargetGoal, HabitGoal } from 'server/lib/models/goal/types';
import { getTallies, Tally, TallyWithWorkAndTags } from 'src/lib/api/tally.ts';
import { describeGoal } from 'src/lib/goal.ts';

import { PrimeIcons } from 'primevue/api';
import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import DetailPageHeader from 'src/components/layout/DetailPageHeader.vue';
import TargetStats from 'src/components/goal/TargetStats.vue';
import TargetLineChart from 'src/components/goal/TargetLineChart.vue';
import HabitStats from 'src/components/goal/HabitStats.vue';
import HabitHistory from 'src/components/goal/HabitHistory.vue';
import DeleteGoalForm from 'src/components/goal/DeleteGoalForm.vue';
import { GOAL_TYPE } from 'server/lib/models/goal/consts';

const goalId = ref<number>(+route.params.goalId);
watch(() => route.params.goalId, newId => {
  if(newId !== undefined) {
    goalId.value = +newId;
    reloadData(); // this isn't a great pattern - it should get changed
  }
});

const isDeleteFormVisible = ref<boolean>(false);

const goal = ref<Goal | null>(null);
const isGoalLoading = ref<boolean>(false);
const goalErrorMessage = ref<string | null>(null);
const loadGoal = async function() {
  isGoalLoading.value = true;
  goalErrorMessage.value = null;

  try {
    await goalStore.populate();
    goal.value = goalStore.get(+goalId.value);
  } catch (err) {
    goalErrorMessage.value = err.message;
    // the ApplicationLayout takes care of this. Otherwise, this will redirect to /goals before ApplicationLayout
    // can redirect to /login.
    // TODO: figure out a better way to ensure that there's no race condition here
    if(err.code !== 'NOT_LOGGED_IN') {
      router.push({ name: 'goals' });
    }
  } finally {
    isGoalLoading.value = false;
  }
};

const tallies = ref<TallyWithWorkAndTags[]>([]);
const isTalliesLoading = ref<boolean>(false);
const talliesErrorMessage = ref<string | null>(null);
const loadTallies = async function() {
  if(goal.value === null) {
    tallies.value = [];
    isTalliesLoading.value = false;
    talliesErrorMessage.value = null;
    return;
  }

  isTalliesLoading.value = true;
  talliesErrorMessage.value = null;

  try {
    const measure = goal.value.type === GOAL_TYPE.TARGET ?
        (goal.value.parameters as TargetGoalParameters).threshold.measure : // targets always have an associated measure
        (goal.value.parameters as HabitGoalParameters).threshold?.measure; // habits sometimes have an associated measure

    const talliesForGoal = await getTallies({
      works: goal.value.workIds,
      tags: goal.value.tagIds,
      measure: measure,
      startDate: goal.value.startDate,
      endDate: goal.value.endDate,
    });

    tallies.value = talliesForGoal;
  } catch (err) {
    talliesErrorMessage.value = err.message;
  } finally {
    isTalliesLoading.value = false;
  }
};

async function reloadData() {
  await loadGoal();
  await loadTallies();
}

const breadcrumbs = computed(() => {
  const crumbs: MenuItem[] = [
    { label: 'Goals', url: '/goals' },
    { label: goal.value === null ? 'Loading...' : goal.value.title, url: `/goals/${goalId.value}` },
  ];
  return crumbs;
});

onMounted(async () => {
  useEventBus<{ tally: Tally }>('tally:create').on(loadTallies);
  useEventBus<{ tally: Tally }>('tally:edit').on(loadTallies);
  useEventBus<{ tally: Tally }>('tally:delete').on(loadTallies);

  await reloadData();
});

</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <div
      v-if="goal && !isTalliesLoading"
      class="max-w-screen-md"
    >
      <DetailPageHeader
        :title="goal.title"
        :subtitle="goal.description || describeGoal(goal as Goal)"
      >
        <template #actions>
          <Button
            label="Configure Goal"
            severity="info"
            :icon="PrimeIcons.COG"
            @click="router.push({ name: 'edit-goal', params: { goalId: goal.id } })"
          />
          <Button
            severity="danger"
            label="Delete Goal"
            :icon="PrimeIcons.TRASH"
            @click="isDeleteFormVisible = true"
          />
        </template>
      </DetailPageHeader>
      <div
        v-if="tallies.length > 0 || tallies.length === 0"
        :class="[
          'flex flex-col gap-2',
          {
            'max-w-screen-md': goal.type === GOAL_TYPE.TARGET,
            'max-w-4xl': goal.type === GOAL_TYPE.HABIT, // to fit 7 gauges across
          }
        ]"
      >
        <div v-if="goal.type === GOAL_TYPE.TARGET">
          <div class="mb-8">
            <TargetStats
              :tallies="tallies"
              :goal="goal as TargetGoal"
            />
          </div>
          <TargetLineChart
            v-if="tallies.length > 0"
            :tallies="tallies"
            :goal="goal as TargetGoal"
          />
          <div v-else>
            You haven't logged any progress on this goal. You want the cool graphs? Get writing!
          </div>
        </div>
        <div v-if="goal.type === GOAL_TYPE.HABIT">
          <div class="mb-8">
            <HabitStats
              :goal="goal as HabitGoal"
              :tallies="tallies"
              :week-starts-on="userStore.user!.userSettings.weekStartDay"
            />
          </div>
          <HabitHistory
            :goal="goal as HabitGoal"
            :tallies="tallies"
            :week-starts-on="userStore.user!.userSettings.weekStartDay"
          />
        </div>
      </div>
      <Dialog
        v-model:visible="isDeleteFormVisible"
        modal
      >
        <template #header>
          <h2 class="font-heading font-semibold uppercase">
            <span :class="PrimeIcons.TRASH" />
            Delete Goal
          </h2>
        </template>
        <DeleteGoalForm
          :goal="goal as Goal"
          @form-success="router.push('/goals')"
        />
      </Dialog>
    </div>
  </ApplicationLayout>
</template>

<style scoped>
</style>
