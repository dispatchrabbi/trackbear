import { defineStore } from 'pinia';

import { getWorks, Work } from 'src/lib/api/work.ts';

export const useWorkStore = defineStore('work', {
  state: () : { works: Work[] | null; } => {
    return { works: null };
  },
  // getters: {

  // },
  actions: {
    async populateWorks() {
      if(this.works === null) {
        const works = await getWorks();
        this.works = works;
      }
    }
  },
});
