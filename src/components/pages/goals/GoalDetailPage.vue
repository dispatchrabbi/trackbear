<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useEventBus } from '@vueuse/core';

import { useRoute, useRouter, RouterLink } from 'vue-router';
const route = useRoute();
const router = useRouter();

import { useGoalStore } from 'src/stores/goal.ts';
const goalStore = useGoalStore();

import { getGoal, GoalWithWorksAndTags } from 'src/lib/api/goal.ts';
import { Tally, TallyWithWorkAndTags } from 'src/lib/api/tally.ts';

import { PrimeIcons } from 'primevue/api';
import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
import TargetLineChart from 'src/components/goal/TargetLineChart.vue';
import HabitDataTable from 'src/components/goal/HabitDataTable.vue';
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
    router.push('/goals');
  } finally {
    isLoading.value = false;
  }
}

const reloadGoals = async function() {
  goalStore.populateGoals(true);
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
        <div class="actions flex gap-2">
          <SectionTitle
            :title="goal.title"
          />
          <div class="spacer grow" />
          <RouterLink :to="{ name: 'edit-goal', params: { id: goal.id } }">
            <Button
              label="Edit"
              :icon="PrimeIcons.PENCIL"
            />
          </RouterLink>
          <Button
            severity="danger"
            label="Delete"
            :icon="PrimeIcons.TRASH"
            @click="isDeleteFormVisible = true"
          />
        </div>
        <h2 class="description font-heading italic font-light">
          {{ goal.description }}
        </h2>
      </header>
      <div
        v-if="tallies.length > 0"
        class="flex flex-col gap-2 max-w-screen-md"
      >
        <div
          v-if="goal.type === GOAL_TYPE.TARGET"
          class="w-full"
        >
          <TargetLineChart
            :tallies="tallies"
            :goal="goal"
          />
        </div>
        <div
          v-if="goal.type === GOAL_TYPE.HABIT"
          class="w-full"
        >
          <HabitDataTable
            :tallies="tallies"
            :goal="goal"
          />
        </div>
        <!-- <div class="w-full">
          <WorkTallyStreakChart
            :work="goal"
            :tallies="tallies"
          />
        </div>
        <div class="w-full">
          <WorkTallyLineChart
            :work="goal"
            :tallies="tallies"
          />
        </div> -->
        <!-- <div class="w-full">
          <GoalTallyDataTable
            :tallies="tallies"
          />
        </div> -->
      </div>
      <div v-else>
        You haven't logged any progress on this goal. You want the cool graphs? Get writing!
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
          @goal:delete="goalStore.populateGoals(true)"
          @form-success="router.push('/goals')"
        />
      </Dialog>
    </div>
  </ApplicationLayout>
</template>

<style scoped>
</style>
