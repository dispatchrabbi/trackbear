<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useEventBus } from '@vueuse/core';

import { useRouter } from 'vue-router';
const router = useRouter();

import { useUserStore } from 'src/stores/user.ts';
const userStore = useUserStore();

import { useGoalStore } from 'src/stores/goal.ts';
const goalStore = useGoalStore();

import { getTallies, TallyWithWorkAndTags, type Tally } from 'src/lib/api/tally.ts';
import { GOAL_TYPE } from 'server/lib/models/goal/consts';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
import UnverifiedEmailMessage from 'src/components/account/UnverifiedEmailMessage.vue';
import ActivityHeatmap from 'src/components/dashboard/ActivityHeatmap.vue';
import StreakCounter from 'src/components/dashboard/StreakCounter.vue';
import HabitGoalStatus from '../dashboard/HabitGoalStatus.vue';
import TargetGoalStatus from '../dashboard/TargetGoalStatus.vue';
import { filterTallies } from 'src/lib/tally';
import { HabitGoal, TargetGoal } from 'server/lib/models/goal/types';

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

const allTallies = ref<TallyWithWorkAndTags[]>([]);
const allTalliesIsLoading = ref<boolean>(false);
const allTalliesErrorMessage = ref<string | null>(null);
const loadAllTallies = async function() {
  allTalliesIsLoading.value = true;
  allTalliesErrorMessage.value = null;

  try {
    allTallies.value = await getTallies();
  } catch (err) {
    allTalliesErrorMessage.value = err.message;
  } finally {
    allTalliesIsLoading.value = false;
  }
};

const goalsIsLoading = ref<boolean>(false);
const goalsErrorMessage = ref<string | null>(null);
const loadGoals = async function() {
  goalsIsLoading.value = true;
  goalsErrorMessage.value = null;

  try {
    await goalStore.populate();
  } catch (err) {
    goalsErrorMessage.value = err.message;
  } finally {
    goalsIsLoading.value = false;
  }
};

onMounted(async () => {
  try {
    await loadUser();
    await loadGoals();

    await loadAllTallies();

    useEventBus<{ tally: Tally }>('tally:create').on(loadAllTallies);
    useEventBus<{ tally: Tally }>('tally:edit').on(loadAllTallies);
    useEventBus<{ tally: Tally }>('tally:delete').on(loadAllTallies);
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
      <div
        v-if="!(allTalliesIsLoading || goalsIsLoading)"
        class="flex gap-4 flex-wrap items-top"
      >
        <div class="flex-grow">
          <SectionTitle title="Activity" />
          <ActivityHeatmap
            :tallies="allTallies"
          />
        </div>
        <div v-if="userStore.user.userSettings.displayStreaks">
          <SectionTitle title="Streaks" />
          <StreakCounter
            :tallies="allTallies"
          />
        </div>
      </div>
      <div v-if="allTalliesIsLoading || goalsIsLoading">
        Loading dashboard...
      </div>
      <div
        v-for="goal of goalStore.starredGoals"
        v-else
        :key="goal.id"
        class="mt-4"
      >
        <HabitGoalStatus
          v-if="goal.type === GOAL_TYPE.HABIT"
          :goal="goal as HabitGoal"
          :tallies="filterTallies(allTallies, goal.workIds, goal.tagIds, goal.startDate, goal.endDate)"
        />
        <TargetGoalStatus
          v-if="goal.type === GOAL_TYPE.TARGET"
          :goal="goal as TargetGoal"
          :tallies="filterTallies(allTallies, goal.workIds, goal.tagIds, goal.startDate, goal.endDate)"
        />
      </div>
    </div>
  </ApplicationLayout>
</template>

<style scoped>
</style>
