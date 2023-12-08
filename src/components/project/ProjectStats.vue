<script setup lang="ts">
import { ref } from 'vue';
import type { Project } from '../lib/project.ts';

defineProps<{ project: Project }>()

const STATS = [
  { template: "You are %d days into your goal.", data: 12 },
  { template: "You have written %d words so far.", data: 8934 },
  { template: "You are %d% of the way there.", data: 19 },
  { template: "You have %d words left to write.", data: 306924 },
  { template: "You will need to write %d words per day to finish on time.", data: 1667 },
  { template: "You're writing %d words per day on average.", data: 792 },
  { template: "At this pace it'll be %d days before you finish.", data: 72 },
].map(stat => {
  const parts = stat.template.split('%d');
  return { before: parts[0], after: parts[1], data: stat.data };
});

const stats = ref(STATS);
</script>

<template>
  <VaCard class="h-full">
    <VaCardTitle>Project Stats</VaCardTitle>
    <VaCardContent>
      <p
        v-for="(stat, index) in stats"
        :key="index"
        class="my-3"
      >
        {{ stat.before }}<span class="font-bold">{{ stat.data }}</span>{{ stat.after }}
      </p>
    </VaCardContent>
  </VaCard>
</template>

<style scoped>
</style>
