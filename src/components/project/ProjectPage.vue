<script setup lang="ts">
import type { Project } from '../../lib/project.ts';

import EnterProgress from './EnterProgress.vue';
import ProjectStats from './ProjectStats.vue';
import ProgressGraph from './ProgressGraph.vue';
import ProjectHistory from './ProjectHistory.vue';

defineProps<{ project: Project }>()
</script>

<template>
  <h2 class="va-h2 mb-3">{{ project.title }}</h2>
  <div class="grid grid-cols-6 gap-4">
    <div class="col-span-2 flex flex-col justify-start gap-4">
      <div class="project-enter-progress shrink">
        <EnterProgress :project="project"></EnterProgress>
      </div>
      <div class="project-stats shrink">
        <ProjectStats :project="project"></ProjectStats>
      </div>
    </div>
    <div class="col-span-4 flex flex-col justify-start gap-4">
      <div class="project-graph shrink">
        <ProgressGraph :project="project"></ProgressGraph>
      </div>
      <div class="project-history shrink">
        <ProjectHistory :project="project"></ProjectHistory>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
