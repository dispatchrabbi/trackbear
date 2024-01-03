<script setup lang="ts">
import { ref } from 'vue';
import { z } from 'zod';

import { useRoute, useRouter } from 'vue-router';
const router = useRouter();
const route = useRoute();

import { getSharedProject } from 'src/lib/api/share.ts';
import type { SharedProjectWithUpdates } from 'server/api/share.ts';

import AppPage from 'src/components/layout/AppPage.vue';
import ProjectGoal from 'src/components/project/widgets/ProjectGoal.vue';
import ProjectStats from 'src/components/project/widgets/ProjectStats.vue';
import ProjectHistory from 'src/components/project/widgets/ProjectHistory.vue';
import ProjectChart from 'src/components/project/widgets/ProjectChart.vue';

const project = ref<SharedProjectWithUpdates>(null);
const errorMessage = ref<string>('');

function loadProject() {
  const routeUuidParam = route.params.uuid as string;
  if(!z.string().uuid().safeParse(routeUuidParam).success) {
    router.push('/');
    return;
  }

  getSharedProject(routeUuidParam)
    .then(p => project.value = p)
    .catch(err => {
      if(err.code === 'NOT_FOUND') {
        router.push('/404');
      } else {
        errorMessage.value = err.message;
      }
    });
}
loadProject();
</script>

<template>
  <AppPage>
    <div v-if="project">
      <div class="flex gap-4 items-center">
        <h2 class="va-h2 mb-3">
          {{ project.title }}
        </h2>
      </div>
      <div class="grid grid-cols-6 gap-4">
        <div class="col-span-2 flex flex-col justify-start gap-4">
          <div
            v-if="project.goal || project.startDate || project.endDate"
            class="project-goal shrink"
          >
            <ProjectGoal :project="project" />
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
                <ProjectChart
                  :id="`project-chart-${project.uuid}`"
                  :project="project"
                  show-par
                  show-tooltips
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
  </AppPage>
</template>

<style scoped>

</style>
