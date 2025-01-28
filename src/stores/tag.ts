import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useEventBus } from '@vueuse/core';

import { cmpTag } from 'src/lib/tag';
import { getTags, Tag } from 'src/lib/api/tag.ts';

export const useTagStore = defineStore('tag', () => {
  const tags = ref<Tag[] | null>(null);

  const allTags = computed(() => tags.value ?? []);

  async function populate(force = false) {
    if(force || tags.value === null) {
      const fetchedTags = await getTags();
      tags.value = fetchedTags.sort(cmpTag);
    }
  }

  function $reset() {
    tags.value = null;
  }

  useEventBus<{ tag: Tag }>('tag:create').on(() => populate(true));
  useEventBus<{ tag: Tag }>('tag:edit').on(() => populate(true));
  useEventBus<{ tag: Tag }>('tag:delete').on(() => populate(true));

  return {
    tags,
    allTags,
    populate,
    $reset,
  };
});
