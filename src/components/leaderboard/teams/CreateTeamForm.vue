<script setup lang="ts">
import { ref } from 'vue';
import { useEventBus } from '@vueuse/core';

import { createTeam, type Leaderboard, type LeaderboardTeam } from 'src/lib/api/leaderboard';

import TeamForm, { type TeamFormModel } from './TeamForm.vue';
import { defaultOnError, useAsyncSignals } from 'src/lib/use-async-signals';
import { emitSuccess } from 'src/lib/form';

const props = defineProps<{
  leaderboard: Leaderboard;
}>();

const model = ref<TeamFormModel>({
  name: '',
  color: '',
});

const emit = defineEmits(['team:create', 'formSuccess']);
const eventBus = useEventBus<{ team: LeaderboardTeam; leaderboard: Leaderboard }>('team:create');

const [handleCreateTeam, signals] = useAsyncSignals(
  async () => {
    const team = await createTeam(props.leaderboard.uuid, model.value);
    emit('team:create', { team, leaderboard: props.leaderboard });
    eventBus.emit({ team, leaderboard: props.leaderboard });
    return team;
  },
  defaultOnError,
  async (team: LeaderboardTeam) => `${team.name} has been created.`,
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
