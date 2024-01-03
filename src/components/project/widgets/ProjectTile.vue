<script setup lang="ts">
import type { ProjectWithUpdates } from 'server/api/projects.ts';
import ProjectChart from './ProjectChart.vue';

defineProps<{ project: ProjectWithUpdates }>();

</script>

<template>
  <VaCard>
    <VaCardTitle>
      <h2 class="text-lg">
        {{ project.title }}
      </h2>
    </VaCardTitle>
    <VaCardContent>
      <ProjectChart
        :id="`project-tile-chart-${project.id}`"
        class="min-h-[12rem]"
        :project="project"
        show-par
      />
    </VaCardContent>
  </VaCard>
</template>

<style scoped>
</style>
