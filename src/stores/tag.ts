import { defineStore } from 'pinia';
import { getTags, Tag } from 'src/lib/api/tag.ts';

export const useTagStore = defineStore('tag', {
  state: () : { tags: Tag[] | null; } => {
    return { tags: null };
  },
  actions: {
    async populate() {
      if(this.tags === null) {
        const tags = await getTags();
        this.tags = tags;
      }
    }
  },
});
