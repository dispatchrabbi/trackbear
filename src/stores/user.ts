import { defineStore } from 'pinia';
import { logIn, logOut, getUser } from '../lib/api/auth';

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
      if(!this.user) {
        const user = await getUser();
        this.user = user;
      }
    }
  },
});
