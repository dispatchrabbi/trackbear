import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useEventBus } from '@vueuse/core';

import { cmpBoard } from 'src/lib/board.ts';
import {
  listLeaderboardSummaries,
  getLeaderboard,
  type LeaderboardSummary, type Leaderboard,
} from 'src/lib/api/leaderboard.ts';

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

  async function refreshByUuid(uuid: string) {
    if(leaderboards.value === null) {
      return populate();
    }

    const leaderboardIx = allLeaderboards.value.findIndex(leaderboard => leaderboard.uuid === uuid);
    if(leaderboardIx < 0) {
      console.warn(`Attempted to refresh unknown leaderboard with uuid ${uuid}`);
      return;
    }

    const refreshedLeaderboard = await getLeaderboard(uuid);
    leaderboards.value[leaderboardIx] = refreshedLeaderboard;

    leaderboards.value.sort(cmpBoard);
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

  useEventBus<{ leaderboardUuid: string }>('leaderboard:join').on(() => populate(true));
  useEventBus<{ leaderboardUuid: string }>('leaderboard:leave').on(() => populate(true));

  useEventBus<{ leaderboard: Leaderboard }>('team:create').on(({ leaderboard }) => refreshByUuid(leaderboard.uuid));
  useEventBus<{ leaderboard: Leaderboard }>('team:update').on(({ leaderboard }) => refreshByUuid(leaderboard.uuid));
  useEventBus<{ leaderboard: Leaderboard }>('team:delete').on(({ leaderboard }) => refreshByUuid(leaderboard.uuid));

  useEventBus<{ leaderboard: Leaderboard }>('member:update').on(({ leaderboard }) => refreshByUuid(leaderboard.uuid));
  useEventBus<{ leaderboard: Leaderboard }>('member:remove').on(({ leaderboard }) => refreshByUuid(leaderboard.uuid));

  return {
    leaderboards,
    allLeaderboards,
    starredLeaderboards,
    populate,
    refreshByUuid,
    get,
    $reset,
  };
});
