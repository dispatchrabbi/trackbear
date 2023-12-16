<script setup lang="ts">
import type { Project } from '../../lib/project.ts';
import ProgressChart from './ProgressChart.vue';

defineProps<{ project: Project }>();

</script>

<template>
  <VaCard>
    <VaCardTitle>
      <h2 class="text-lg">
        {{ project.title }}
      </h2>
    </VaCardTitle>
    <VaCardContent>
      <ProgressChart
        :id="`project-tile-chart-${project.id}`"
        class="min-h-[12rem]"
        :project="project"
        :updates="project.updates"
        :show-par="false"
        :show-tooltips="false"
      />
    </VaCardContent>
  </VaCard>
</template>

<style scoped>

</style>
