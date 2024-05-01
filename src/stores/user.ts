import { defineStore } from 'pinia';
import { logIn, logOut, getUser } from 'src/lib/api/auth.ts';

import { useWorkStore } from 'src/stores/work.ts';
import { useTagStore } from 'src/stores/tag.ts';
import { useGoalStore } from 'src/stores/goal.ts';

export const useUserStore = defineStore('user', {
  state: () => {
    return {
      user: null,
    };
  },
  actions: {
    async logIn(username: string, password: string) {
      const user = await logIn(username, password);
      this.user = user;

      const workStore = useWorkStore();
      workStore.$reset();

      const tagStore = useTagStore();
      tagStore.$reset();

      const goalStore = useGoalStore();
      goalStore.$reset();
    },
    async logOut() {
      await logOut();
      this.user = null;

      const workStore = useWorkStore();
      workStore.$reset();

      const tagStore = useTagStore();
      tagStore.$reset();

      const goalStore = useGoalStore();
      goalStore.$reset();
    },
    async populate(force = false) {
      if(force || this.user === null) {
        const user = await getUser();
        this.user = user;
      }
    }
  },
});
