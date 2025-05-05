<script setup lang="ts">
import { computed, defineEmits, onMounted } from 'vue';

const emit = defineEmits(['menu-navigation']);

import { useWorkStore } from 'src/stores/work.ts';
import { cmpWorkByTitle } from 'src/lib/work.ts';
const workStore = useWorkStore();

import { useGoalStore } from 'src/stores/goal.ts';
import { cmpGoalByCompletion } from 'src/lib/goal.ts';
const goalStore = useGoalStore();

import { useLeaderboardStore } from 'src/stores/leaderboard';
import { cmpBoard } from 'src/lib/board.ts';
const leaderboardStore = useLeaderboardStore();

import SidebarLogProgressButton from 'src/components/tally/SidebarLogProgressButton.vue';

import MenuBar from 'src/components/layout/MenuBar.vue';
import { PrimeIcons } from 'primevue/api';

const items = computed(() => {
  return [
    // dashboard
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: PrimeIcons.HOME,
      to: { name: 'dashboard' },
      header: true,
    },
    // propjects
    {
      key: 'projects',
      label: 'Projects',
      icon: PrimeIcons.FILE_EDIT,
      to: { name: 'works' },
      header: true,
    },
    ...(workStore.starredWorks ?? []).toSorted(cmpWorkByTitle).map(work => ({
      key: `work-${work.id}`,
      label: work.title,
      to: { name: 'work', params: { workId: work.id } },
    })),
    // goals
    {
      key: 'goals',
      label: 'Goals',
      icon: PrimeIcons.FLAG,
      to: { name: 'goals' },
      header: true,
    },
    ...(goalStore.starredGoals ?? []).toSorted(cmpGoalByCompletion).map(goal => ({
      key: `goal-${goal.id}`,
      label: goal.title,
      to: { name: 'goal', params: { goalId: goal.id } },
    })),
    // leaderboards
    {
      key: 'leaderboards',
      label: 'Leaderboards',
      icon: PrimeIcons.TROPHY,
      to: { name: 'leaderboards' },
      header: true,
    },
    ...(leaderboardStore.starredLeaderboards ?? []).toSorted(cmpBoard).map(leaderboard => ({
      key: `leaderboard-${leaderboard.id}`,
      label: leaderboard.title,
      to: { name: 'leaderboard', params: { boardUuid: leaderboard.uuid } },
    })),
    {
      key: 'stats',
      label: 'Stats',
      icon: PrimeIcons.CHART_BAR,
      to: { name: 'lifetime-stats' },
      header: true,
    },
  ];
});

onMounted(() => {
  workStore.populate();
  goalStore.populate();
  leaderboardStore.populate();
});
</script>

<template>
  <div class="flex justify-center p-2 px-4 mb-1">
    <SidebarLogProgressButton />
  </div>
  <MenuBar
    :items="items"
    @menu-navigation="emit('menu-navigation')"
  />
</template>

<style scoped>
</style>
