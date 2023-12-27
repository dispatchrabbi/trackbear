<script setup lang="ts">
import type { Project } from '@prisma/client';
import { SharedProjectWithUpdates } from 'server/api/share.ts';

const props = defineProps<{ project: Project | SharedProjectWithUpdates }>();
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
