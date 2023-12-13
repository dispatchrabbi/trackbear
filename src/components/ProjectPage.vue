<script setup lang="ts">
import SAMPLE_PROJECT from '../fixtures/project.js';

import Page from './page/AppPage.vue';
import EnterProgress from './project/EnterProgress.vue';
import ProjectStats from './project/ProjectStats.vue';
import ProgressGraph from './project/ProgressGraph.vue';
import ProjectHistory from './project/ProjectHistory.vue';

const project = SAMPLE_PROJECT;
</script>

<template>
  <Page>
    <h2 class="va-h2 mb-3">
      {{ project.title }}
    </h2>
    <div class="grid grid-cols-6 gap-4">
      <div class="col-span-2 flex flex-col justify-start gap-4">
        <div class="project-enter-progress shrink">
          <EnterProgress :project="project" />
        </div>
        <div class="project-stats shrink">
          <ProjectStats :project="project" />
        </div>
      </div>
      <div class="col-span-4 flex flex-col justify-start gap-4">
        <div class="project-graph shrink">
          <ProgressGraph :project="project" />
        </div>
        <div class="project-history shrink">
          <ProjectHistory :project="project" />
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>

</style>
