<script setup lang="ts">
import { computed, onMounted } from 'vue';

const emit = defineEmits(['menu-navigation']);

import { useProjectStore } from 'src/stores/project';
import { cmpByTitle } from 'src/lib/project';
const projectStore = useProjectStore();

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
      to: { name: 'projects' },
      header: true,
    },
    ...(projectStore.starredProjects ?? []).toSorted(cmpByTitle).map(project => ({
      key: `project-${project.id}`,
      label: project.title,
      to: { name: 'project', params: { projectId: project.id } },
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
  projectStore.populate();
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
