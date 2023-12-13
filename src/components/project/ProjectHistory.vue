<script setup lang="ts">
import type { Project } from '../lib/project.ts';

defineProps<{ project: Project }>()

const items = [ 0,  1584,  2129, 5977,  6439,  8207, 11105, 11386, 13195, 15354, 17310, 19516 ].map((el, ix) => ({
  date: `January ${ix + 1}, 2024`,
  words: el,
}));
</script>

<template>
  <VaCard>
    <VaCardTitle>History</VaCardTitle>
    <VaCardContent>
      <VaDataTable :items="items" />
    </VaCardContent>
  </VaCard>
</template>

<style scoped>
</style>
