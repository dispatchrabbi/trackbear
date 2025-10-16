<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';

import { useGoalStore } from 'src/stores/goal.ts';
const goalStore = useGoalStore();

import { type GoalWithAchievement } from 'server/api/v1/goal';
import { cmpGoalByCompletion } from 'src/lib/goal.ts';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';

import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

import GoalTile from 'src/components/goal/GoalTile.vue';
import { PrimeIcons } from 'primevue/api';
import { formatDate } from 'src/lib/date';
import SubsectionTitle from 'src/components/layout/SubsectionTitle.vue';

const breadcrumbs: MenuItem[] = [
  { label: 'Goals', url: '/goals' },
];

const isLoading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);

const loadGoals = async function() {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    await goalStore.populate();
  } catch (err) {
    errorMessage.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

const filter = ref<string>('');
const filteredGoals = computed(() => {
  const sortedGoals = goalStore.allGoals.toSorted(cmpGoalByCompletion);
  const searchTerm = filter.value.toLowerCase();
  return sortedGoals.filter(goal => goal.title.toLowerCase().includes(searchTerm) || goal.description.toLowerCase().includes(searchTerm));
});

const today = formatDate(new Date());
const activeUnstarredGoals = computed(() => {
  const sortedGoals = goalStore.allGoals;
  return sortedGoals.filter(goal => (
    goal.starred === false &&
    (goal.endDate === null || goal.endDate >= today)
  ));
});
const inactiveUnstarredGoals = computed(() => {
  const sortedGoals = goalStore.allGoals;
  return sortedGoals.filter(goal => (
    goal.starred === false &&
    (goal.endDate !== null && goal.endDate < today)
  ));
});

onMounted(async () => {
  await loadGoals();
});

</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <div class="actions flex justify-end gap-2 mb-4">
      <div class="">
        <IconField>
          <InputIcon>
            <span :class="PrimeIcons.SEARCH" />
          </InputIcon>
          <InputText
            v-model="filter"
            class="w-full"
            placeholder="Type to filter..."
          />
        </IconField>
      </div>
      <div>
        <RouterLink to="/goals/new">
          <Button
            label="New"
            :icon="PrimeIcons.PLUS"
          />
        </RouterLink>
      </div>
    </div>
    <div v-if="isLoading">
      Loading goals...
    </div>
    <div v-else-if="goalStore.allGoals.length === 0">
      You haven't made any goals yet. Click the <span class="font-bold">New</span> button to get started!
    </div>
    <template v-else-if="filter.length > 0">
      <SubsectionTitle title="Search results" />
      <div v-if="filteredGoals.length === 0">
        No matching goals found.
      </div>
      <div
        v-for="goal in filteredGoals"
        v-else
        :key="goal.id"
        class="mb-2"
      >
        <RouterLink :to="{ name: 'goal', params: { goalId: goal.id } }">
          <GoalTile :goal="goal as GoalWithAchievement" />
        </RouterLink>
      </div>
    </template>
    <template v-else>
      <SubsectionTitle title="Starred goals" />
      <div
        v-for="goal in goalStore.starredGoals"
        :key="goal.id"
        class="mb-2"
      >
        <RouterLink :to="{ name: 'goal', params: { goalId: goal.id } }">
          <GoalTile :goal="goal" />
        </RouterLink>
      </div>
      <SubsectionTitle
        class="mt-8"
        title="Ongoing goals"
      />
      <div
        v-for="goal in activeUnstarredGoals"
        :key="goal.id"
        class="mb-2"
      >
        <RouterLink :to="{ name: 'goal', params: { goalId: goal.id } }">
          <GoalTile :goal="goal" />
        </RouterLink>
      </div>
      <SubsectionTitle
        class="mt-8"
        title="Finished goals"
      />
      <div
        v-for="goal in inactiveUnstarredGoals"
        :key="goal.id"
        class="mb-2"
      >
        <RouterLink :to="{ name: 'goal', params: { goalId: goal.id } }">
          <GoalTile :goal="goal as GoalWithAchievement" />
        </RouterLink>
      </div>
    </template>
  </ApplicationLayout>
</template>

<style scoped>
</style>
