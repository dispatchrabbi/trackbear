import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useEventBus } from '@vueuse/core';

import { cmpBoard } from 'src/lib/board.ts';
import { getBoards, ExtendedBoard } from 'src/lib/api/board.ts';
import wait from 'src/lib/wait';

export const useBoardStore = defineStore('board', () => {
  const boards = ref<ExtendedBoard[] | null>(null);

  function $reset() {
    boards.value = null;
  }

  const allBoards = computed(() => boards.value ?? []);
  const starredBoards = computed(() => allBoards.value.filter(board => board.starred));

  async function populate(force = false) {
    if(force || this.boards === null) {
      const fetchedBoards = await getBoards();
      boards.value = fetchedBoards.sort(cmpBoard);
    }
  }

  useEventBus<{ board: ExtendedBoard }>('board:create').on(() => populate(true));
  useEventBus<{ board: ExtendedBoard }>('board:edit').on(() => populate(true));
  useEventBus<{ board: ExtendedBoard }>('board:star').on(() => populate(true));
  useEventBus<{ board: ExtendedBoard }>('board:delete').on(() => populate(true));
  useEventBus<{ board: ExtendedBoard }>('board:edit-participation').on(() => populate(true));
  useEventBus<{ board: ExtendedBoard }>('board:leave').on(() => populate(true));

  return {
    boards,
    allBoards,
    starredBoards,
    populate,
    $reset,
  };
});