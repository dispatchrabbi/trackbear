import { defineStore } from 'pinia';
import { getTags } from 'src/lib/api/tag.ts';

export const useTagStore = defineStore('tag', {
  state: () => {
    return { tags: null };
  },
  // getters: {

  // },
  actions: {
    async populateWorks() {
      if(this.works === null) {
        const works = await getTags();
        this.works = works;
      }
    }
  },
});
