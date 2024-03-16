<script setup lang="ts">
import { ref, computed } from 'vue';
import { RouterLink } from 'vue-router';

import { getGoals, Goal } from 'src/lib/api/goal.ts';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';

import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

import GoalTile from 'src/components/goal/GoalTile.vue';
import { PrimeIcons } from 'primevue/api';

const breadcrumbs: MenuItem[] = [
  { label: 'Goals', url: '/goals' },
];

const goals = ref<Goal[]>([]);
const isLoading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);

const loadGoals = async function() {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    goals.value = await getGoals();
  } catch(err) {
    errorMessage.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

const goalsFilter = ref<string>('');
const filteredGoals = computed(() => {
  const sortedGoals = goals.value.toSorted((a, b) => a.title < b.title ? -1 : a.title > b.title ? 1 : 0);
  const searchTerm = goalsFilter.value.toLowerCase();
  return sortedGoals.filter(goal => goal.title.toLowerCase().includes(searchTerm) || goal.description.toLowerCase().includes(searchTerm));
});

// TODO: we can probably get away with just using the store?
// but if we want to pull in any other info, we'll need to not do that
// right now, I'm just building the page out so I'm gonna leave as-is and optimize later
loadGoals();

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
            v-model="goalsFilter"
            class="w-full"
            placeholder="Type to filter..."
          />
        </IconField>
      </div>
      <div>
        <RouterLink to="/goals/new">
          <Button
            label="New Goal"
            :icon="PrimeIcons.PLUS"
          />
        </RouterLink>
      </div>
    </div>
    <div
      v-for="goal in filteredGoals"
      :key="goal.id"
      class="mb-2"
    >
      <RouterLink :to="`/goals/${goal.id}`">
        <GoalTile :goal="goal" />
      </RouterLink>
    </div>
    <div v-if="filteredGoals.length === 0 && goals.length > 0">
      No projects found.
    </div>
    <div v-if="goals.length === 0">
      You haven't made any goals yet. Click the <span class="font-bold">New Goal</span> button to get started!
    </div>
  </ApplicationLayout>
</template>

<style scoped>
#add-progress-panel {
  max-width: 33%;
}
</style>
