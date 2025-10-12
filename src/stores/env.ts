import { defineStore } from 'pinia';

import { getEnv, type EnvInfo } from 'src/lib/api/info.ts';

export const useEnvStore = defineStore('env', {
  state: (): { env: EnvInfo | null } => {
    return { env: null };
  },
  actions: {
    async populate(force = false) {
      if(force || this.env === null) {
        const env = await getEnv();
        this.env = env;
      }
    },
  },
});
