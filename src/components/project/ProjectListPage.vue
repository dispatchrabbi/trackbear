<script setup lang="ts">
import { ref } from 'vue';

import { getProjects } from 'src/lib/api/project.ts';

import AppPage from 'src/components/layout/AppPage.vue';
import ProjectTile from 'src/components/project/widgets/ProjectTile.vue';
import NewProjectTile from 'src/components/project/widgets/NewProjectTile.vue';
import ProjectSkeletonTile from 'src/components/project/widgets/ProjectSkeletonTile.vue';
import type { ProjectWithUpdates } from 'server/api/projects.ts';

const projects = ref<ProjectWithUpdates[]>([]);
const isLoading = ref<boolean>(false);
const errorMessage = ref<string>('');

isLoading.value = true;
getProjects()
  .then(ps => projects.value = ps)
  // TODO: add error message display
  .catch(err => errorMessage.value = err.message)
  .finally(() => isLoading.value = false);

</script>

<template>
  <AppPage require-login>
    <div class="flex items-center mb-3">
      <div class="grow">
        <h2 class="va-h2">
          Projects
        </h2>
      </div>
      <div class="shrink">
        <RouterLink to="/projects/new">
          <VaButton
            icon="add"
            gradient
          >
            New
          </VaButton>
        </RouterLink>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-if="isLoading">
        <ProjectSkeletonTile />
      </div>
      <div v-if="(!isLoading) && projects.length === 0">
        <RouterLink to="/projects/new">
          <NewProjectTile />
        </RouterLink>
      </div>
      <div
        v-for="project in projects"
        :key="project.id"
      >
        <RouterLink :to="`/projects/${project.id}`">
          <ProjectTile
            :project="project"
          />
        </RouterLink>
      </div>
    </div>
  </AppPage>
</template>

<style scoped>
</style>
