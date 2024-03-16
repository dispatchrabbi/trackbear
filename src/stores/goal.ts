import { defineStore } from 'pinia';

import { getGoals, Goal } from 'src/lib/api/goal.ts';

export const useGoalStore = defineStore('goal', {
  state: () : { goals: Goal[] | null; } => {
    return { goals: null };
  },
  actions: {
    async populateGoals(force = false) {
      if(force || this.goals === null) {
        const goals = await getGoals();
        this.goals = goals;
      }
    }
  },
});
