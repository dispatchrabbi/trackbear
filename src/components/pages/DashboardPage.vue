<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useEventBus } from '@vueuse/core';

import { useRouter } from 'vue-router';
const router = useRouter();

import { useUserStore } from 'src/stores/user.ts';
const userStore = useUserStore();

import { useGoalStore } from 'src/stores/goal.ts';
const goalStore = useGoalStore();

import { getTallies, Tally } from 'src/lib/api/tally.ts';
import { getGoal, GoalAndTallies } from 'src/lib/api/goal.ts';
import { GOAL_TYPE } from 'server/lib/models/goal/consts';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
import UnverifiedEmailMessage from 'src/components/account/UnverifiedEmailMessage.vue';
import ActivityHeatmap from 'src/components/dashboard/ActivityHeatmap.vue';
import StreakCounter from 'src/components/dashboard/StreakCounter.vue';
import HabitGoalStatus from '../dashboard/HabitGoalStatus.vue';
import TargetGoalStatus from '../dashboard/TargetGoalStatus.vue';

const breadcrumbs: MenuItem[] = [
  { label: 'Dashboard', url: '/dashboard' },
];

async function loadUser() {
  try {
    await userStore.populate();
  } catch {
    router.push({ name: 'login' });
  }
}

const tallies = ref<Tally[]>([]);
const talliesIsLoading = ref<boolean>(false);
const talliesErrorMessage = ref<string | null>(null);
const loadTallies = async function() {
  talliesIsLoading.value = true;
  talliesErrorMessage.value = null;

  try {
    tallies.value = await getTallies();
  } catch(err) {
    talliesErrorMessage.value = err.message;
  } finally {
    talliesIsLoading.value = false;
  }
}
const goals = ref<GoalAndTallies[]>([]);
const goalsIsLoading = ref<boolean>(false);
const goalsErrorMessage = ref<string | null>(null);
const loadGoals = async function() {
  goalsIsLoading.value = true;
  goalsErrorMessage.value = null;

  try {
    // could we do this one-by-one or with a specific API call? Sure! But this is fine for now
    const goalsAndTallies = await Promise.all(goalStore.starredGoals.map(goal => getGoal(goal.id)));
    // goals.value = goalsAndTallies.toSorted((a, b) => cmpGoalByDate(a.goal, b.goal));
    goals.value = goalsAndTallies;
  } catch(err) {
    goalsErrorMessage.value = err.message;
  } finally {
    goalsIsLoading.value = false;
  }
};

async function reloadData() {
  loadTallies();
  loadGoals();
}

onMounted(async () => {
  try {
    await loadUser();
    await goalStore.populate();

    await reloadData();

    useEventBus<{ tally: Tally }>('tally:create').on(reloadData);
    useEventBus<{ tally: Tally }>('tally:edit').on(reloadData);
    useEventBus<{ tally: Tally }>('tally:delete').on(reloadData);
  } catch {
    // we should only error here when some kind of login error happens
    router.push({ name: 'login' });
  }
});
</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <div class="max-w-screen-lg">
      <div
        v-if="userStore.user && !userStore.user.isEmailVerified"
        class="mb-4"
      >
        <UnverifiedEmailMessage />
      </div>
      <div class="flex gap-4 flex-wrap items-top">
        <div class="flex-grow">
          <SectionTitle title="Activity" />
          <ActivityHeatmap
            :tallies="tallies"
          />
        </div>
        <div>
          <SectionTitle title="Streaks" />
          <StreakCounter
            :tallies="tallies"
          />
        </div>
      </div>
      <div
        v-for="goalInfo of goals"
        :key="goalInfo.goal.id"
        class="mt-4"
      >
        <HabitGoalStatus
          v-if="goalInfo.goal.type === GOAL_TYPE.HABIT"
          :goal="goalInfo.goal"
          :tallies="goalInfo.tallies"
        />
        <TargetGoalStatus
          v-if="goalInfo.goal.type === GOAL_TYPE.TARGET"
          :goal="goalInfo.goal"
          :tallies="goalInfo.tallies"
        />
      </div>
    </div>
  </ApplicationLayout>
</template>

<style scoped>
</style>
