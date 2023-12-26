<script setup lang="ts">
import { ref, computed } from 'vue';

import type { Project } from '../../lib/project.ts';
import type { CompleteLeaderboard } from '../../../server/api/leaderboards.ts';
import { getEligibleProjects, addProjectToLeaderboard, removeProjectFromLeaderboard } from '../../lib/api/leaderboard.ts';

const props = defineProps<{
  leaderboard: CompleteLeaderboard;
}>();

const emit = defineEmits([
  'addProject',
  'removeProject',
]);

const eligibleProjects = ref<Project[]>([]);
const includedProjects = computed(() => {
  const leaderboardProjectUuids = props.leaderboard.projects.map(project => project.uuid);
  return eligibleProjects.value.filter(project => leaderboardProjectUuids.includes(project.uuid));
});
const excludedProjects = computed(() => {
  const leaderboardProjectUuids = props.leaderboard.projects.map(project => project.uuid);
  return eligibleProjects.value.filter(project => !leaderboardProjectUuids.includes(project.uuid));
});

function fetchEligibleProjects() {
  getEligibleProjects(props.leaderboard.uuid)
    .then(projects => eligibleProjects.value = projects);
    // TODO: add error message handling
    // .catch(err => errorMessage.value = err.message);
}
fetchEligibleProjects();

const isAddingProject = ref<boolean>(false);
const isLoadingAdd = ref<boolean>(null);
const projectToAdd = ref<number>(null);

async function handleAddProjectAddClick(projectId) {
  if(projectId === null) { return; }

  isLoadingAdd.value = true;
  try {
    await addProjectToLeaderboard(props.leaderboard.uuid, projectId);
    emit('addProject', projectId);

    projectToAdd.value = null;
    isAddingProject.value = false;
  } catch(err) {
    // TODO: add error message
    return;
  } finally {
    isLoadingAdd.value = false;
  }
}
function handleAddProjectCancelClick() {
  isAddingProject.value = false;
  projectToAdd.value = null;
}

const projectCurrentlyBeingRemoved = ref<number>(null);
async function handleRemoveProjectClick(projectId) {
  projectCurrentlyBeingRemoved.value = projectId;

  try {
    await removeProjectFromLeaderboard(props.leaderboard.uuid, projectId);
    emit('removeProject', projectId);
  } catch(err) {
    // TODO: add error message
    return;
  } finally {
    projectCurrentlyBeingRemoved.value = null;
  }
}

</script>

<template>
  <VaCard>
    <VaCardTitle>
      Your projects on this leaderboard
    </VaCardTitle>
    <VaCardContent>
      <VaList>
        <VaListItem
          v-for="project in includedProjects"
          :key="project.uuid"
        >
          <VaListItemSection>
            <VaListItemLabel>
              <div
                :title="project.title"
              >
                {{ project.title }}
              </div>
            </VaListItemLabel>
          </VaListItemSection>
          <VaListItemSection icon>
            <VaButton
              size="small"
              preset="secondary"
              icon="close"
              color="danger"
              round
              :loading="projectCurrentlyBeingRemoved === project.id"
              @click="handleRemoveProjectClick(project.id)"
            />
          </VaListItemSection>
        </VaListItem>
      </VaList>
      <VaButton
        preset="primary"
        size="small"
        icon="add"
        @click="isAddingProject = true"
      >
        Add a project
      </VaButton>
    </VaCardContent>
  </VaCard>
  <VaModal
    :model-value="!!isAddingProject"
    hide-default-actions
  >
    <h4
      class="va-h4 mb-4"
    >
      Add a project to {{ leaderboard.title }}
    </h4>
    <div>
      <VaSelect
        v-model="projectToAdd"
        label="Which project do you want to add?"
        placeholder="Select a project"
        :options="excludedProjects"
        text-by="title"
        value-by="id"
        style="width: 100%"
      />
    </div>
    <template #footer>
      <VaButton
        class="mr-3"
        preset="secondary"
        @click="handleAddProjectCancelClick"
      >
        Cancel
      </VaButton>
      <VaButton
        color="primary"
        :loading="isLoadingAdd"
        :disabled="projectToAdd === null"
        @click="handleAddProjectAddClick(projectToAdd)"
      >
        Add Project
      </VaButton>
    </template>
  </VaModal>
</template>

<style scoped>
.va-list-item-label {
  --va-list-item-label-color: var(--text-primary);
}
</style>
