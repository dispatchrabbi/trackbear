<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useEventBus } from '@vueuse/core';

import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();

import { useGoalStore } from 'src/stores/goal.ts';
const goalStore = useGoalStore();

import { getGoal, GoalWithWorksAndTags } from 'src/lib/api/goal.ts';
import { Tally, TallyWithWorkAndTags } from 'src/lib/api/tally.ts';
import { describeGoal } from 'src/lib/goal.ts';

import { PrimeIcons } from 'primevue/api';
import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
import TargetStats from 'src/components/goal/TargetStats.vue';
import TargetLineChart from 'src/components/goal/TargetLineChart.vue';
import HabitStats from 'src/components/goal/HabitStats.vue';
import HabitHistory from 'src/components/goal/HabitHistory.vue';
import DeleteGoalForm from 'src/components/goal/DeleteGoalForm.vue';
import { GOAL_TYPE } from 'server/lib/models/goal.ts';

const goalId = ref<number>(+route.params.id);
watch(() => route.params.id, newId => {
  goalId.value = +newId;
  reloadGoals(); // this isn't a great pattern - it should get changed
});

const goal = ref<GoalWithWorksAndTags | null>(null);
const tallies = ref<TallyWithWorkAndTags[] | null>(null);

const breadcrumbs = computed(() => {
  const crumbs: MenuItem[] = [
    { label: 'Goals', url: '/goals' },
    { label: goal.value === null ? 'Loading...' : goal.value.title, url: `/goals/${goalId.value}` },
  ];
  return crumbs;
});

const isDeleteFormVisible = ref<boolean>(false);

const isLoading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);
const loadGoal = async function() {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    const result = await getGoal(+goalId.value);
    goal.value = result.goal;
    tallies.value = result.tallies;
  } catch(err) {
    errorMessage.value = err.message;
    // the ApplicationLayout takes care of this. Otherwise, this will redirect to /works before ApplicationLayout
    // can redirect to /login.
    // TODO: figure out a better way to ensure that there's no race condition here
    if(err.code !== 'NOT_LOGGED_IN') {
      router.push({ name: 'goals' });
    }
  } finally {
    isLoading.value = false;
  }
}

const reloadGoals = async function() {
  goalStore.populate(true);
  loadGoal();
}

onMounted(() => {
  useEventBus<{ tally: Tally }>('tally:create').on(reloadGoals);
  useEventBus<{ tally: Tally }>('tally:edit').on(reloadGoals);
  useEventBus<{ tally: Tally }>('tally:delete').on(reloadGoals);

  loadGoal();
});

</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <div v-if="goal">
      <header class="mb-4">
        <div class="actions flex gap-2 items-start">
          <SectionTitle
            :title="goal.title"
            :subtitle="goal.description || describeGoal(goal)"
          />
          <div class="spacer grow" />
          <div class="flex flex-col md:flex-row gap-2">
            <Button
              label="Edit"
              :icon="PrimeIcons.PENCIL"
              @click="router.push({ name: 'edit-goal', params: { id: goal.id } })"
            />
            <Button
              severity="danger"
              label="Delete"
              :icon="PrimeIcons.TRASH"
              @click="isDeleteFormVisible = true"
            />
          </div>
        </div>
      </header>
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
              :goal="goal"
            />
          </div>
          <TargetLineChart
            v-if="tallies.length > 0"
            :tallies="tallies"
            :goal="goal"
          />
          <div v-else>
            You haven't logged any progress on this goal. You want the cool graphs? Get writing!
          </div>
        </div>
        <div v-if="goal.type === GOAL_TYPE.HABIT">
          <div class="mb-8">
            <HabitStats
              :goal="goal"
              :tallies="tallies"
            />
          </div>
          <HabitHistory
            :goal="goal"
            :tallies="tallies"
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
          :goal="goal"
          @goal:delete="goalStore.populate(true)"
          @form-success="router.push('/goals')"
        />
      </Dialog>
    </div>
  </ApplicationLayout>
</template>

<style scoped>
</style>
