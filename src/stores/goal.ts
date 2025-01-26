import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useEventBus } from '@vueuse/core';

import { cmpGoalByCompletion } from 'src/lib/goal.ts';
import { getGoals, Goal, GoalWithAchievement } from 'src/lib/api/goal.ts';

export const useGoalStore = defineStore('goal', () => {
  const goals = ref<GoalWithAchievement[] | null>(null);

  const allGoals = computed(() => goals.value ?? []);
  const starredGoals = computed(() => allGoals.value.filter(goal => goal.starred));

  async function populate(force = false) {
    if(force || goals.value === null) {
      const fetchedWorks = await getGoals();
      goals.value = fetchedWorks.sort(cmpGoalByCompletion);
    }
  }

  function get(id: number): GoalWithAchievement | null {
    return allGoals.value.find(goal => goal.id === id) as GoalWithAchievement ?? null;
  }

  function $reset() {
    goals.value = null;
  }

  useEventBus<{ goal: Goal }>('goal:create').on(() => populate(true));
  useEventBus<{ goal: Goal }>('goal:edit').on(() => populate(true));
  useEventBus<{ goal: Goal }>('goal:star').on(() => populate(true));
  useEventBus<{ goal: Goal }>('goal:delete').on(() => populate(true));

  return {
    goals,
    allGoals,
    starredGoals,
    populate,
    get,
    $reset,
  };
});
