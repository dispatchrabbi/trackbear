<script setup lang="ts">
import { ref } from 'vue';

import { useRoute, useRouter } from 'vue-router';
const router = useRouter();
const route = useRoute();

import { getProject } from '../lib/api/project.ts';
import type { Project, Update } from '../lib/project.ts';

import LoggedInAppPage from './layout/LoggedInAppPage.vue';
import EnterProgress from './project/EnterProgress.vue';
import ProjectStats from './project/ProjectStats.vue';
import ProjectHistory from './project/ProjectHistory.vue';
import ProgressChart from './project/ProgressChart.vue';

const project = ref<Project>(null);
const errorMessage = ref<string>('');

function loadProject() {
  const projectIdStr = route.params.id as string;
  if(Number.parseInt(projectIdStr, 10) !== +projectIdStr) {
    router.push('/projects');
    return;
  }

  const projectId = +projectIdStr;
  getProject(projectId)
    .then(p => project.value = p as Project)
    .catch(err => {
      if(err.code === 'NOT_FOUND') {
        errorMessage.value = `Could not find project with ID ${projectId}. How did you get here?`;
      } else {
        errorMessage.value = err.message;
      }
    });
}
loadProject();

function handleNewUpdate(update: Update) {
  project.value.updates.push(update);
}

</script>

<template>
  <LoggedInAppPage>
    <div v-if="project">
      <h2 class="va-h2 mb-3">
        {{ project.title }}
      </h2>
      <div class="grid grid-cols-6 gap-4">
        <div class="col-span-2 flex flex-col justify-start gap-4">
          <div class="project-enter-progress shrink">
            <EnterProgress
              :project="project"
              @new-update="handleNewUpdate"
            />
          </div>
          <div class="project-stats shrink">
            <ProjectStats :project="project" />
          </div>
        </div>
        <div class="col-span-4 flex flex-col justify-start gap-4">
          <div class="project-graph shrink">
            <VaCard class="h-full">
              <VaCardTitle>Progress So Far</VaCardTitle>
              <VaCardContent>
                <ProgressChart
                  :id="`project-chart-${project.id}`"
                  :project="project"
                  :updates="project.updates"
                  :show-par="true"
                  :show-tooltips="true"
                />
              </VaCardContent>
            </VaCard>
          </div>
          <div class="project-history shrink">
            <ProjectHistory :project="project" />
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      {{ errorMessage }}
    </div>
  </LoggedInAppPage>
</template>

<style scoped>

</style>
