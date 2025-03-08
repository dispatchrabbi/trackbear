import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useEventBus } from '@vueuse/core';

import { cmpBoard } from 'src/lib/board.ts';
import { listLeaderboardSummaries, type LeaderboardSummary, type Leaderboard } from 'src/lib/api/leaderboard.ts';

export const useLeaderboardStore = defineStore('leaderboard', () => {
  const leaderboards = ref<LeaderboardSummary[] | null>(null);

  const allLeaderboards = computed<LeaderboardSummary[]>(() => leaderboards.value ?? []);
  const starredLeaderboards = computed<LeaderboardSummary[]>(() => allLeaderboards.value.filter(leaderboard => leaderboard.starred));

  async function populate(force = false) {
    if(force || leaderboards.value === null) {
      const fetchedLeaderboards = await listLeaderboardSummaries();
      leaderboards.value = fetchedLeaderboards.sort(cmpBoard);
    }
  }

  function get(uuid: string): LeaderboardSummary | null {
    return allLeaderboards.value.find(leaderboard => leaderboard.uuid === uuid) ?? null;
  }

  function $reset() {
    leaderboards.value = null;
  }

  useEventBus<{ leaderboard: Leaderboard }>('leaderboard:create').on(() => populate(true));
  useEventBus<{ leaderboard: Leaderboard }>('leaderboard:edit').on(() => populate(true));
  useEventBus<{ leaderboard: Leaderboard }>('leaderboard:star').on(() => populate(true));
  useEventBus<{ leaderboard: Leaderboard }>('leaderboard:delete').on(() => populate(true));

  return {
    leaderboards,
    allLeaderboards,
    starredLeaderboards,
    populate,
    get,
    $reset,
  };
});
