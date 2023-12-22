<script setup lang="ts">
import type { Project } from '../../lib/project.ts';

const props = defineProps<{ project: Project }>();
</script>

<template>
  <VaCard>
    <VaCardTitle>Project Stats</VaCardTitle>
    <VaCardContent>
      <p>No stats for {{ props.project.title }} yet. Coming soon! 🔜</p>
    </VaCardContent>
  </VaCard>
</template>

<style scoped>
</style>
