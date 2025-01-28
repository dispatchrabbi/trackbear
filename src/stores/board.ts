import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useEventBus } from '@vueuse/core';

import { cmpBoard } from 'src/lib/board.ts';
import { getBoards, type BoardWithParticipantBios, type Board } from 'src/lib/api/board.ts';

export const useBoardStore = defineStore('board', () => {
  const boards = ref<BoardWithParticipantBios[] | null>(null);

  const allBoards = computed(() => boards.value ?? []);
  const starredBoards = computed(() => allBoards.value.filter(board => board.starred));

  async function populate(force = false) {
    if(force || this.boards === null) {
      const fetchedBoards = await getBoards();
      boards.value = fetchedBoards.sort(cmpBoard);
    }
  }

  function get(id: number): BoardWithParticipantBios | null {
    return allBoards.value.find(board => board.id === id) as BoardWithParticipantBios ?? null;
  }

  function $reset() {
    boards.value = null;
  }

  useEventBus<{ board: Board }>('board:create').on(() => populate(true));
  useEventBus<{ board: Board }>('board:edit').on(() => populate(true));
  useEventBus<{ board: Board }>('board:star').on(() => populate(true));
  useEventBus<{ board: Board }>('board:delete').on(() => populate(true));
  useEventBus<{ board: Board }>('board:edit-participation').on(() => populate(true));
  useEventBus<{ board: Board }>('board:leave').on(() => populate(true));

  return {
    boards,
    allBoards,
    starredBoards,
    populate,
    get,
    $reset,
  };
});