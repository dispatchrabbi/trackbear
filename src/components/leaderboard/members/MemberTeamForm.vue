<script setup lang="ts">
import { LeaderboardSummary, Membership } from 'server/api/v1/leaderboard';
import { updateMember } from 'src/lib/api/leaderboard';
import { useAsyncSignals } from 'src/lib/use-async-signals';
import wait from 'src/lib/wait';

import TeamDropdown from '../teams/TeamDropdown.vue';

const model = defineModel<number | null>({ required: true });
const props = defineProps<{
  member: Membership;
  leaderboard: LeaderboardSummary;
}>();

const [updateTeam, updateTeamSignals, resetTeamSignals] = useAsyncSignals(
  async function(member: Membership, newTeamId: number) {
    await updateMember(props.leaderboard.uuid, member.id, { teamId: newTeamId });
  },
  async () => 'Saving failed!',
  async () => 'Saved!',
  async () => {
    await wait(1000);
    resetTeamSignals();
  },
);

function handleUpdateTeam(newTeamId) {
  updateTeam(props.member, newTeamId);
}
</script>

<template>
  <div class="flex justify-start items-center gap-2">
    <TeamDropdown
      v-model="model"
      :id-prefix="`member-${props.member.uuid}`"
      :teams="props.leaderboard.teams"
      @update:model-value="handleUpdateTeam"
    />
    <div
      v-if="updateTeamSignals.isLoading"
    >
      Saving...
    </div>
    <div
      v-if="updateTeamSignals.successMessage"
      class="text-success-500 dark:text-success-400"
    >
      {{ updateTeamSignals.successMessage }}
    </div>
    <div
      v-if="updateTeamSignals.errorMessage"
      class="text-danger-500 dark:text-danger-400"
    >
      {{ updateTeamSignals.errorMessage }}
    </div>
  </div>
</template>
