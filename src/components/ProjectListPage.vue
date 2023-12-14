<script setup lang="ts">
import { ref } from 'vue';

import { getProjects } from '../lib/api/project.ts';

import LoggedInAppPage from './layout/LoggedInAppPage.vue'
import ProjectTile from './project/ProjectTile.vue';

const projects = ref([]);
const errorMessage = ref('');

getProjects()
  .then(ps => projects.value = ps)
  // TODO: global error messaging
  .catch(msg => errorMessage.value = msg);

</script>

<template>
  <LoggedInAppPage>
    <div class="flex items-center mb-3">
      <div class="grow">
        <h2 class="va-h2">
          Your Projects
        </h2>
      </div>
      <div class="shrink">
        <RouterLink to="/projects/new">
          <VaButton>New Project</VaButton>
        </RouterLink>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-4">
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
  </LoggedInAppPage>
</template>

<style scoped>
</style>
