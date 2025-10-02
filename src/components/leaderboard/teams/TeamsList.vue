<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useEventBus } from '@vueuse/core';

import { useAsyncSignals, defaultOnError } from 'src/lib/use-async-signals';

import { type LeaderboardSummary, type Leaderboard, type LeaderboardTeam, listTeams, deleteTeam } from 'src/lib/api/leaderboard';
import { cmpTeam } from 'src/lib/board';

import { PrimeIcons } from 'primevue/api';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';

import WarningButton from 'src/components/shared/WarningButton.vue';
import TeamAvatar from 'src/components/avatar/TeamAvatar.vue';
import CreateTeamForm from './CreateTeamForm.vue';
import EditTeamForm from './EditTeamForm.vue';
// import UserAvatar from 'src/components/UserAvatar.vue';

const props = defineProps<{
  leaderboard: LeaderboardSummary;
}>();

const eventBus = useEventBus<{ team: LeaderboardTeam; leaderboard: Leaderboard }>('team:delete');

const teams = ref<LeaderboardTeam[] | null>(null);
const [loadTeams, signals] = useAsyncSignals(async function() {
  const result = await listTeams(props.leaderboard.uuid);
  teams.value = result.sort(cmpTeam);
});

const isCreateFormVisible = ref<boolean>(false);

const currentlyEditing = ref<LeaderboardTeam | null>(null);
const isEditFormVisible = computed({
  get: () => currentlyEditing.value !== null,
  set: () => currentlyEditing.value = null, // nothing sensible to set it to unless it's null
});

const [handleDeleteTeam, deleteTeamSignals] = useAsyncSignals(
  async function(team: LeaderboardTeam) {
    return await deleteTeam(props.leaderboard.uuid, team.id);
  },
  defaultOnError,
  async deletedTeam => {
    eventBus.emit({ team: deletedTeam, leaderboard: props.leaderboard });
    await loadTeams();
    return null;
  },
);

const isActionLoading = computed(() => {
  return deleteTeamSignals.isLoading;
});

onMounted(async () => {
  await loadTeams();
});

</script>

<template>
  <div v-if="signals.isLoading">
    Loading teams...
  </div>
  <div v-else-if="signals.errorMessage">
    Could not load teams: {{ signals.errorMessage }}
  </div>
  <DataTable
    v-else
    :value="teams ?? []"
    data-key="id"
    :pt="{ column: { headercontent: ({context}) => ({ class: context.index === 1 ? 'flex items-center justify-end' : 'flex items-center justify-start' })}}"
    :pt-options="{ mergeSections: true, mergeProps: false }"
  >
    <template #empty>
      This leaderboard doesn't have any teams yet. Click <b>New</b> to create a new team.
    </template>
    <Column
      field="name"
      header="Team"
    >
      <template #body="{ data: team }">
        <div class="flex items-center gap-2">
          <TeamAvatar
            :name="team.name"
            :color="team.color"
          />
          <div>{{ team.name }}</div>
        </div>
      </template>
    </Column>
    <Column
      header=""
      class="w-0 text-center"
    >
      <template #header>
        <Button
          label="New"
          size="small"
          :icon="PrimeIcons.PLUS"
          @click="isCreateFormVisible = true"
        />
      </template>
      <template #body="{ data: team }">
        <div class="flex gap-2">
          <Button
            :disabled="isActionLoading"
            :icon="PrimeIcons.PENCIL"
            outlined
            label="Edit"
            @click="currentlyEditing = team"
          />
          <WarningButton
            label="Delete"
            outlined
            :icon="PrimeIcons.TRASH"
            :disabled="isActionLoading"
            :action-description="`delete ${team.name}`"
            action-command="Delete"
            action-in-progress-message="Deleting"
            action-success-message="Deleted"
            :action-fn="async () => { await handleDeleteTeam(team); }"
          />
        </div>
      </template>
    </Column>
  </DataTable>
  <Dialog
    v-model:visible="isCreateFormVisible"
    modal
  >
    <template #header>
      <h2 class="font-heading font-semibold uppercase">
        <span :class="PrimeIcons.PLUS" />
        Create Team
      </h2>
    </template>
    <CreateTeamForm
      :leaderboard="props.leaderboard"
      @team:create="loadTeams()"
      @form-success="isCreateFormVisible = false"
    />
  </Dialog>
  <Dialog
    v-model:visible="isEditFormVisible"
    modal
  >
    <template #header>
      <h2 class="font-heading font-semibold uppercase">
        <span :class="PrimeIcons.PENCIL" />
        Edit Team
      </h2>
    </template>
    <EditTeamForm
      :leaderboard="props.leaderboard"
      :team="currentlyEditing!"
      @team:update="loadTeams()"
      @form-success="isEditFormVisible = false"
    />
  </Dialog>
</template>
