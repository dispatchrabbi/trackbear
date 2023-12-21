<script setup lang="ts">
import { ref } from 'vue';

import { getProjects } from '../lib/api/project.ts';

import AppPage from './layout/AppPage.vue'
import ProjectTile from './project/ProjectTile.vue';
import NewProjectTile from './project/NewProjectTile.vue';
import ProjectSkeletonTile from './project/ProjectSkeletonTile.vue';
import { Project } from '../lib/project.ts';

const projects = ref<Project[]>([]);
const isLoading = ref<boolean>(false);
const errorMessage = ref<string>('');

isLoading.value = true;
getProjects()
  .then(ps => projects.value = ps as Project[])
  // TODO: add error message display
  .catch(err => errorMessage.value = err.message)
  .finally(() => isLoading.value = false);

</script>

<template>
  <AppPage require-login>
    <div class="flex items-center mb-3">
      <div class="grow">
        <h2 class="va-h2">
          Your Projects
        </h2>
      </div>
      <div class="shrink">
        <RouterLink to="/projects/new">
          <VaButton gradient>
            New Project
          </VaButton>
        </RouterLink>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-4">
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
