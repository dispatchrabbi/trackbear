import { defineStore } from 'pinia';
import { logIn, logOut, getUser } from 'src/lib/api/auth.ts';

export const useUserStore = defineStore('user', {
  state: () => {
    return {
      user: null,
    };
  },
  // getters: {

  // },
  actions: {
    async logIn(username: string, password: string) {
      const user = await logIn(username, password);
      this.user = user;
    },
    async logOut() {
      await logOut();
      this.user = null;
    },
    async populateUser() {
      if(this.user === null) {
        const user = await getUser();
        this.user = user;
      }
    }
  },
});
