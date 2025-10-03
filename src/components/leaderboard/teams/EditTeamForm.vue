<script setup lang="ts">
import { ref } from 'vue';
import { useEventBus } from '@vueuse/core';

import { updateTeam, type Leaderboard, type LeaderboardTeam } from 'src/lib/api/leaderboard';

import TeamForm, { type TeamFormModel } from './TeamForm.vue';
import { defaultOnError, useAsyncSignals } from 'src/lib/use-async-signals';
import { emitSuccess } from 'src/lib/form';

const props = defineProps<{
  leaderboard: Leaderboard;
  team: LeaderboardTeam;
}>();

const model = ref<TeamFormModel>({
  name: props.team.name,
  color: props.team.color,
});

const emit = defineEmits(['team:update', 'formSuccess']);
const eventBus = useEventBus<{ team: LeaderboardTeam; leaderboard: Leaderboard }>('team:update');

const [handleCreateTeam, signals] = useAsyncSignals(
  async () => {
    const team = await updateTeam(props.leaderboard.uuid, props.team.id, model.value);
    emit('team:update', { team, leaderboard: props.leaderboard });
    eventBus.emit({ team, leaderboard: props.leaderboard });
    return team;
  },
  defaultOnError,
  async (team: LeaderboardTeam) => `${team.name} has been saved.`,
  emitSuccess(emit),
);
</script>

<template>
  <TeamForm
    v-model="model"
    :is-loading="signals.isLoading"
    :success-message="signals.successMessage"
    :error-message="signals.errorMessage"
    @submit="handleCreateTeam"
  />
</template>
