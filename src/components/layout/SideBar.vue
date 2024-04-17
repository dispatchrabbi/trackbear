<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { useWorkStore } from 'src/stores/work.ts';
import { cmpWork } from 'src/lib/work.ts';
const workStore = useWorkStore();

import { useGoalStore } from 'src/stores/goal.ts';
import { cmpGoal } from 'src/lib/goal.ts';
const goalStore = useGoalStore();

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
      to: { name: 'work', params: { id: work.id } },
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
      to: { name: 'goal', params: { id: goal.id } },
    }))
  ];
});

onMounted(() => {
  workStore.populate();
  goalStore.populate();
});
</script>

<template>
  <MenuBar
    :items="items"
  />
</template>

<style scoped>
</style>
