import { defineStore } from 'pinia';

import { cmpGoal } from 'src/lib/goal.ts';
import { getGoals, Goal } from 'src/lib/api/goal.ts';

export const useGoalStore = defineStore('goal', {
  state: () : { goals: Goal[] | null; } => {
    return { goals: null };
  },
  getters: {
    starredGoals: state => {
      if(state.goals === null) {
        return [];
      }

      return state.goals.filter(goal => goal.starred);
    },
  },
  actions: {
    async populate(force = false) {
      if(force || this.goals === null) {
        const goals = await getGoals();
        this.goals = goals.sort(cmpGoal);
      }
    }
  },
});
