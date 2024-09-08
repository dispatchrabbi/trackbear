<script setup lang="ts">
import { computed, defineEmits, onMounted } from 'vue';

const emit = defineEmits(['menu-navigation'])

import { useWorkStore } from 'src/stores/work.ts';
import { cmpWork } from 'src/lib/work.ts';
const workStore = useWorkStore();

import { useGoalStore } from 'src/stores/goal.ts';
import { cmpGoal } from 'src/lib/goal.ts';
const goalStore = useGoalStore();

import { useBoardStore } from 'src/stores/board.ts';
import { cmpBoard } from 'src/lib/board.ts';
const boardStore = useBoardStore();

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
    ...(workStore.starredWorks ?? []).toSorted(cmpWork).map(work => ({
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
    ...(goalStore.starredGoals ?? []).toSorted(cmpGoal).map(goal => ({
      key: `goal-${goal.id}`,
      label: goal.title,
      to: { name: 'goal', params: { goalId: goal.id } },
    })),
    // boards
    {
      key: 'boards',
      label: 'Leaderboards',
      icon: PrimeIcons.TROPHY,
      to: { name: 'boards' },
      header: true,
    },
    ...(boardStore.starredBoards ?? []).toSorted(cmpBoard).map(board => ({
      key: `board-${board.id}`,
      label: board.title,
      to: { name: 'board', params: { boardUuid: board.uuid } },
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
  boardStore.populate();
});
</script>

<template>
  <MenuBar
    :items="items"
    @menu-navigation="emit('menu-navigation')"
  />
</template>

<style scoped>
</style>
