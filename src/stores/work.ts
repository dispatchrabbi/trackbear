import { defineStore } from 'pinia';

import { getWorks, Work } from 'src/lib/api/work.ts';
import { cmpWorkByTitle } from 'src/lib/work';

export const useWorkStore = defineStore('work', {
  state: () : { works: Work[] | null; } => {
    return { works: null };
  },
  getters: {
    starredWorks: state => {
      if(state.works === null) {
        return [];
      }

      return state.works.filter(work => work.starred);
    },
  },
  actions: {
    async populate(force = false) {
      if(force || this.works === null) {
        const works = await getWorks();
        this.works = works.sort(cmpWorkByTitle);
      }
    }
  },
});
