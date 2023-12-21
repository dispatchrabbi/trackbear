<script setup lang="ts">
import { computed } from 'vue';

import { useUserStore } from '../../stores/user.ts';
const userStore = useUserStore();

import type { Project } from '../../lib/project.ts';
import ProgressChart from './ProgressChart.vue';

defineProps<{ project: Project }>();

const RIBBITS_USERNAME = 'velvet';
const shouldRotate = computed(() => {
  return userStore.user.username === RIBBITS_USERNAME;
});

</script>

<template>
  <VaCard
    :class="shouldRotate ? 'rotated' : ''"
  >
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
.rotated {
  transform: rotate(0.5turn);
}
</style>
