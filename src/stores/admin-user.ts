import { defineStore } from 'pinia';

import { getMyAdminPerms, AdminPerms } from 'src/lib/api/admin/me.ts';

export const useAdminUserStore = defineStore('admin-user', {
  state: (): { perms: AdminPerms | null } => {
    return { perms: null };
  },
  actions: {
    async populate(force = false) {
      if(force || this.perms === null) {
        const perms = await getMyAdminPerms();
        this.perms = perms;
      }
    },
  },
});
