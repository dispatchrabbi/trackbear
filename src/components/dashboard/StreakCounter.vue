<script setup lang="ts">
import { computed, defineProps } from 'vue';

import type { Tally } from 'src/lib/api/tally.ts';
import { getStreakInfo } from 'src/lib/streak';

import Card from 'primevue/card';
import { PrimeIcons } from 'primevue/api';

const props = defineProps<{
  tallies: Tally[],
}>();

const streakInfo = computed(() => {
  return getStreakInfo(props.tallies);
});
</script>

<template>
  <div class="flex gap-2">
    <Card>
      <template #title>
        <span :class="PrimeIcons.STAR_FILL" /> Current Streak
      </template>
      <template #content>
        <p class="text-2xl">
          {{ streakInfo.currentStreak.length }} {{ streakInfo.currentStreak.length === 1 ? 'day' : 'days' }}
        </p>
      </template>
    </Card>
    <Card>
      <template #title>
        <span :class="PrimeIcons.FLAG_FILL" /> Longest Streak
      </template>
      <template #content>
        <p class="text-2xl">
          {{ streakInfo.longestStreak.length }} {{ streakInfo.longestStreak.length === 1 ? 'day' : 'days' }}
        </p>
      </template>
    </Card>
  </div>
  <!-- <div>
    <h1>Streaks!</h1>
    <pre>
      {{ JSON.stringify(streakInfo, null, 2) }}
    </pre>
  </div> -->
</template>

<style scoped>
</style>
