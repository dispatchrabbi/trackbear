import { defineStore } from 'pinia';

import { getBoards, Board } from 'src/lib/api/board.ts';

export const useBoardStore = defineStore('board', {
  state: () : { boards: Board[] | null; } => {
    return { boards: null };
  },
  getters: {
    starredBoards: state => {
      if(state.boards === null) {
        return [];
      }

      return state.boards.filter(board => board.starred);
    },
  },
  actions: {
    async populate(force = false) {
      if(force || this.boards === null) {
        const boards = await getBoards();
        this.boards = boards;
      }
    }
  },
});
