import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useEventBus } from '@vueuse/core';

import { getWorks, type Work, type SummarizedWork } from 'src/lib/api/work.ts';
import { cmpWorkByTitle, isDormant } from 'src/lib/work';

export const useWorkStore = defineStore('work', () => {
  const works = ref<SummarizedWork[] | null>(null);

  const allWorks = computed(() => works.value ?? []);
  const nonDormantWorks = computed(() => allWorks.value.filter(work => !isDormant(work)));
  const starredWorks = computed(() => allWorks.value.filter(work => work.starred));

  async function populate(force = false) {
    if(force || works.value === null) {
      const fetchedWorks = await getWorks();
      works.value = fetchedWorks.sort(cmpWorkByTitle);
    }
  }

  function get(id: number): SummarizedWork | null {
    return allWorks.value.find(work => work.id === id) as SummarizedWork ?? null;
  }

  function $reset() {
    works.value = null;
  }

  useEventBus<{ work: Work }>('work:create').on(() => populate(true));
  useEventBus<{ work: Work }>('work:edit').on(() => populate(true));
  useEventBus<{ work: Work }>('work:star').on(() => populate(true));
  useEventBus<{ work: Work }>('work:cover').on(() => populate(true));
  useEventBus<{ work: Work }>('work:delete').on(() => populate(true));

  return {
    works,
    allWorks,
    nonDormantWorks,
    starredWorks,
    populate,
    get,
    $reset,
  };
});
